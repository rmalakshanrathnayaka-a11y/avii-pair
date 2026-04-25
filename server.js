import express from 'express';
import cors from 'cors';
import { makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
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

app.post('/api/pair', async (req, res) => {
  const { number } = req.body;
  if (!number) return res.status(400).json({ error: 'Number required' });

  const cleanNum = number.replace(/[^0-9]/g, '');
  const sessionPath = `./sessions/${cleanNum}`;
  
  try {
    if (fs.existsSync(sessionPath)) fs.rmSync(sessionPath, { recursive: true, force: true });
    
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();
    
    const sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      auth: state,
      browser: Browsers.macOS('Safari'), // මේක WhatsApp එකෙන් accept වෙනවා
      syncFullHistory: false,
      markOnlineOnConnect: false,
      mobile: false
    });

    sock.ev.on('creds.update', saveCreds);

    // Connection එක open වෙනකන් ඉන්න
    await new Promise((resolve, reject) => {
      sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') resolve();
        if (connection === 'close') {
          const code = (lastDisconnect?.error instanceof Boom)?.output?.statusCode;
          if (code !== DisconnectReason.restartRequired) reject(lastDisconnect?.error);
        }
      });
      setTimeout(() => reject(new Error('Connection timeout')), 15000);
    });

    // Pair code request කරන්න
    await new Promise(r => setTimeout(r, 3000)); // තත්පර 3ක් ඉන්න
    const code = await sock.requestPairingCode(cleanNum);
    
    // තත්පර 5කින් socket එක close කරනවා
    setTimeout(() => sock.end(), 5000);
    
    res.json({ code: code?.replace(/(\d{4})/g, '$1-').slice(0, -1) || code });
    
  } catch (err) {
    console.error('Pair Error:', err);
    res.status(500).json({ error: err.message || 'Failed to get code. Try again.' });
  }
});

app.get('/', (req,res)=> res.sendFile(path.join(__dirname,'public/index.html')));
app.listen(PORT, ()=> console.log('Pair Server Running'));
