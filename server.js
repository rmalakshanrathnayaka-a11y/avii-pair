
import express from 'express';
import cors from 'cors';
import { makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const OWNER_NUMBER = process.env.OWNER_NUMBER || '';

// make sessions folder
if (!fs.existsSync('./sessions')) fs.mkdirSync('./sessions');

const sessions = new Map();

async function getPairingCode(number) {
  const clean = number.replace(/[^0-9]/g, '');
  const { state, saveCreds } = await useMultiFileAuthState(`./sessions/${clean}`);

  const sock = makeWASocket({
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, undefined)
    },
    printQRInTerminal: false,
    browser: ['AVII-PAIR', 'Chrome', '1.0']
  });

  sock.ev.on('creds.update', saveCreds);

  return new Promise(async (resolve, reject) => {
    if (!sock.authState.creds.registered) {
      try {
        const code = await sock.requestPairingCode(clean);
        sessions.set(clean, { sock, code });
        setTimeout(() => { try { sock.end(); } catch {} }, 120000);
        resolve(code);
      } catch (e) { reject(e); }
    } else {
      resolve('ALREADY_PAIRED');
    }
  });
}

app.get('/api/pair', async (req, res) => {
  try {
    const { number } = req.query;
    if (!number || number.length < 10) return res.status(400).json({ error: 'Invalid number' });
    const code = await getPairingCode(number);
    res.json({ code, number });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`AVII Pair running on ${PORT}`));
