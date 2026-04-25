
import express from 'express';
import cors from 'cors';
import { makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys';
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

  // Always start fresh for pairing - delete old session
  if (fs.existsSync(folder)) {
    fs.rmSync(folder, { recursive: true, force: true });
  }
  fs.mkdirSync(folder, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(folder);
  const sock = makeWASocket({
    logger: pino({ level: 'fatal' }),
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }))
    },
    browser: ['Chrome (Linux)', '', ''],
    syncFullHistory: false,
    markOnlineOnConnect: true,
    connectTimeoutMs: 90000,
    defaultQueryTimeoutMs: undefined,
    keepAliveIntervalMs: 30000,
    retryRequestDelayMs: 5000,
    maxMsgRetryCount: 5
  });

  sock.ev.on('creds.update', saveCreds);

  try {
    // Wait for connection to be ready
    await delay(3000);

    if (state.creds.registered) {
      await sock.logout();
      await sock.end();
      throw new Error('Already registered, retrying fresh...');
    }

    console.log(`Requesting pairing code for ${clean}...`);
    const code = await sock.requestPairingCode(clean);
    console.log(`PAIR CODE for ${clean}: ${code}`);

    // Keep connection alive for 3 minutes
    setTimeout(async () => {
      try {
        await sock.end();
        console.log(`Closed socket for ${clean}`);
      } catch {}
    }, 180000);

    return code;
  } catch (err) {
    try { await sock.end(); } catch {}
    console.error('Pair error:', err.message);
    throw new Error(`Failed: ${err.message}. Make sure number is correct and WhatsApp is updated.`);
  }
}

app.get('/api/pair', async (req, res) => {
  const { number } = req.query;
  if (!number) return res.status(400).json({ error: 'Number required' });

  try {
    const code = await getPairingCode(number);
    res.json({ success: true, code, number, expiresIn: '3 minutes' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => console.log('AVII-PAIR v3 running on ' + PORT));
