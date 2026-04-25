
import express from 'express';
import cors from 'cors';
import { makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore, DisconnectReason } from '@whiskeysockets/baileys';
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
const OWNER_NUMBER = process.env.OWNER_NUMBER || '';

if (!fs.existsSync('./sessions')) fs.mkdirSync('./sessions', { recursive: true });

const delay = ms => new Promise(res => setTimeout(res, ms));

async function getPairingCode(number) {
  const clean = number.replace(/[^0-9]/g, '');
  const sessionFolder = `./sessions/${clean}`;

  const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);

  const sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    },
    browser: ['AVII-PAIR', 'Chrome', '20.0.0'],
    syncFullHistory: false,
    markOnlineOnConnect: false,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 0,
    keepAliveIntervalMs: 10000,
    generateHighQualityLinkPreview: false
  });

  sock.ev.on('creds.update', saveCreds);

  return new Promise(async (resolve, reject) => {
    let resolved = false;

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === 'open') {
        // already paired
        if (!resolved) {
          resolved = true;
          await sock.end();
          resolve('ALREADY_PAIRED');
        }
      }

      if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode;
        if (!resolved && reason !== DisconnectReason.loggedOut) {
          // try again once
        }
      }
    });

    try {
      // Wait a bit for socket to initialize
      await delay(2000);

      if (!state.creds.registered) {
        const code = await sock.requestPairingCode(clean);
        if (!resolved) {
          resolved = true;
          // keep socket alive for 2 minutes for user to enter code
          setTimeout(async () => {
            try { await sock.end(); } catch {}
          }, 120000);
          resolve(code);
        }
      } else {
        if (!resolved) {
          resolved = true;
          await sock.end();
          resolve('ALREADY_PAIRED');
        }
      }
    } catch (err) {
      console.error('Pairing error:', err);
      if (!resolved) {
        resolved = true;
        try { await sock.end(); } catch {}
        reject(new Error(err.message || 'Failed to get pairing code. Try again in 30 seconds.'));
      }
    }
  });
}

app.get('/api/pair', async (req, res) => {
  try {
    const { number } = req.query;
    if (!number || number.replace(/[^0-9]/g, '').length < 10) {
      return res.status(400).json({ error: 'Invalid number. Use format 9477xxxxxxx' });
    }
    const code = await getPairingCode(number);
    res.json({ code, number });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/status', (req, res) => {
  res.json({ status: 'online', owner: OWNER_NUMBER, time: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`AVII Pair running on ${PORT}`);
});
