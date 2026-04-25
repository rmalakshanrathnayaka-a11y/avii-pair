
import express from 'express';
import cors from 'cors';
import { makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import pino from 'pino';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
if (!fs.existsSync('./sessions')) fs.mkdirSync('./sessions', { recursive: true });

const delay = ms => new Promise(r => setTimeout(r, ms));

async function getPairingCode(number) {
  const clean = number.replace(/[^0-9]/g, '');
  const folder = `./sessions/${clean}`;
  
  if (fs.existsSync(folder)) fs.rmSync(folder, { recursive: true, force: true });
  fs.mkdirSync(folder, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(folder);
  const { version } = await fetchLatestBaileysVersion();
  
  console.log(`Using WA v${version.join('.')}, requesting for ${clean}`);

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    },
    browser: ['Ubuntu', 'Chrome', '110.0.0'],
    syncFullHistory: false,
    markOnlineOnConnect: false,
    connectTimeoutMs: 120000,
    keepAliveIntervalMs: 15000,
    generateHighQualityLinkPreview: false
  });

  sock.ev.on('creds.update', saveCreds);

  return new Promise(async (resolve, reject) => {
    let done = false;
    
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update;
      console.log('Connection:', connection);
      
      if (connection === 'close') {
        if (!done) {
          done = true;
          try { await sock.end(); } catch {}
          reject(new Error('Connection closed by WhatsApp. Try again in 1 minute.'));
        }
      }
    });

    try {
      // CRITICAL: wait for socket to be ready
      await delay(4000);
      
      console.log('Requesting pairing code now...');
      const code = await sock.requestPairingCode(clean);
      console.log(`SUCCESS! Code for ${clean}: ${code}`);
      
      if (!done) {
        done = true;
        // Keep alive 5 minutes
        setTimeout(() => sock.end().catch(()=>{}), 300000);
        resolve(code);
      }
    } catch (err) {
      console.error('Request failed:', err);
      if (!done) {
        done = true;
        await sock.end().catch(()=>{});
        reject(new Error(err.message || 'Failed to generate code'));
      }
    }
  });
}

app.get('/api/pair', async (req, res) => {
  try {
    const code = await getPairingCode(req.query.number || '');
    res.json({ code });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/', (req,res)=> res.sendFile(path.join(__dirname,'public/index.html')));
app.listen(PORT, ()=> console.log('AVII v4 running'));
