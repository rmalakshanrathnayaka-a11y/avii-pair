
import express from 'express';
import cors from 'cors';
import { makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys';
import { MongoClient } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || '';
const OWNER_NUMBER = process.env.OWNER_NUMBER || '';

let mongo;
if (MONGODB_URI) {
  mongo = new MongoClient(MONGODB_URI);
  await mongo.connect();
  console.log('MongoDB connected');
}

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

  if (!sock.authState.creds.registered) {
    const code = await sock.requestPairingCode(clean);
    sessions.set(clean, { sock, code, created: Date.now() });
    setTimeout(() => {
      try { sock.end(); } catch {}
      sessions.delete(clean);
    }, 120000);
    return code;
  } else {
    return 'ALREADY_PAIRED';
  }
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

app.get('/api/status', (req, res) => {
  res.json({ ok: true, owner: OWNER_NUMBER, active: sessions.size });
});

app.listen(PORT, () => console.log(`AVII Pair running on ${PORT}`));
