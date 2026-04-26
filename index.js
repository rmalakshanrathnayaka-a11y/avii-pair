/**
 * KATABUMP HYBRID BOT - Web QR + Pairing Code
 * Original Files Merged with Web System
 */
process.env.PUPPETEER_SKIP_DOWNLOAD = 'true';

const pino = require('pino');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const express = require('express');

// Original Files Load කරනවා
let config = {}, database = {}, handler = null;
try { config = require('./config'); } catch (e) { console.log('config.js not found'); }
try { database = require('./database'); } catch (e) { console.log('database.js not found'); }
try { handler = require('./handler'); } catch (e) { console.log('handler.js not found'); }

const app = express();
app.use(express.json());
app.use(express.static('public'));
const PORT = process.env.SERVER_PORT || process.env.PORT || 5000;
const activeBots = new Map();
const qrSessions = new Map();

const logger = pino({ level: 'silent' });

async function startBot(sessionId, usePairingCode = false, phoneNumber = null) {
  if (activeBots.has(sessionId)) return activeBots.get(sessionId);
  
  const sessionDir = `./sessions/${sessionId}`;
  if (!fs.existsSync('./sessions')) fs.mkdirSync('./sessions');

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: logger,
    browser: Browsers.macOS('Safari'), // 515 Fix
    syncFullHistory: false,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    keepAliveIntervalMs: 10000,
    markOnlineOnConnect: false
  });

  activeBots.set(sessionId, sock);
  sock.ev.on('creds.update', saveCreds);

  // PAIRING CODE SYSTEM - Original එකෙන් ගත්ත
  if (usePairingCode && phoneNumber && !state.creds.registered) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(phoneNumber);
        console.log(`\n========================================`);
        console.log(` PAIRING CODE FOR ${phoneNumber}`);
        console.log(` CODE: ${code}`);
        console.log(` WhatsApp → Linked Devices → Link with phone number`);
        console.log(`========================================\n`);
      } catch (err) {
        console.log(`[PAIR-${sessionId}] Pairing Code Error:`, err.message);
      }
    }, 3000);
  }

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    console.log(`[BOT-${sessionId}] Connection: ${connection}`);

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      activeBots.delete(sessionId);
      if (statusCode !== DisconnectReason.loggedOut) {
        console.log(`[BOT-${sessionId}] Reconnecting...`);
        setTimeout(() => startBot(sessionId), 10000);
      } else {
        if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });
      }
    }
    if (connection === 'open') {
      console.log(`[BOT-${sessionId}] ✅ KATABUMP ONLINE: ${sock.user.id}`);
      qrSessions.delete(sessionId);
    }
  });

  // Original Handler එක Connect කරනවා
  if (handler && typeof handler === 'function') {
    try { handler(sock, { config, database }); } catch (e) { console.log('Handler error:', e.message); }
  }

  return sock;
}

// WEB QR ENDPOINT
app.post('/getqr', async (req, res) => {
  const { number } = req.body;
  if (!number) return res.status(400).json({ error: 'Phone number required' });

  const cleanNumber = number.replace(/[^0-9]/g, '');
  if (!cleanNumber.startsWith('94') || cleanNumber.length < 11) {
    return res.status(400).json({ error: 'Use format: 947XXXXXXXX' });
  }

  if (qrSessions.has(cleanNumber) || activeBots.has(cleanNumber)) {
    return res.status(400).json({ error: 'Already active' });
  }

  const sessionDir = `./sessions/${cleanNumber}`;
  if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });

  console.log(`[WEB-QR] Starting for ${cleanNumber}`);

  try {
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version, auth: state, printQRInTerminal: false, logger,
      browser: Browsers.macOS('Safari'),
      syncFullHistory: false, connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000, keepAliveIntervalMs: 10000
    });

    qrSessions.set(cleanNumber, { sock, res });
    sock.ev.on('creds.update', saveCreds);

    let responded = false;
    const timeout = setTimeout(() => {
      if (!responded) {
        qrSessions.delete(cleanNumber);
        sock.end();
        if (!res.headersSent) res.status(408).json({ error: 'Timeout' });
      }
    }, 120000);

    sock.ev.on('connection.update', async (update) => {
      const { connection, qr } = update;
      
      if (qr && !responded) {
        const qrImage = await qrcode.toDataURL(qr);
        console.log(`[WEB-QR SUCCESS] ${cleanNumber}`);
        if (!responded && !res.headersSent) {
          responded = true;
          res.json({ qr: qrImage });
        }
      }

      if (connection === 'open') {
        clearTimeout(timeout);
        qrSessions.delete(cleanNumber);
        await sock.end();
        setTimeout(() => startBot(cleanNumber), 2000);
      }

      if (connection === 'close') {
        qrSessions.delete(cleanNumber);
        if (!responded && !res.headersSent) {
          responded = true;
          clearTimeout(timeout);
          res.status(500).json({ error: 'Connection closed' });
        }
      }
    });

  } catch (error) {
    qrSessions.delete(cleanNumber);
    if (!res.headersSent) res.status(500).json({ error: error.message });
  }
});

// PAIRING CODE ENDPOINT - අලුත්
app.post('/getpair', async (req, res) => {
  const { number } = req.body;
  if (!number) return res.status(400).json({ error: 'Phone number required' });

  const cleanNumber = number.replace(/[^0-9]/g, '');
  if (!cleanNumber.startsWith('94')) {
    return res.status(400).json({ error: 'Use format: 947XXXXXXXX' });
  }

  if (activeBots.has(cleanNumber)) {
    return res.status(400).json({ error: 'Bot already online' });
  }

  const sessionDir = `./sessions/${cleanNumber}`;
  if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });

  console.log(`[PAIR-CODE] Starting for ${cleanNumber}`);
  
  try {
    await startBot(cleanNumber, true, cleanNumber);
    res.json({ 
      success: true, 
      message: `Pairing code will appear in console for ${cleanNumber}`,
      note: 'Check console for 8-digit code'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Auto-load existing sessions
if (fs.existsSync('./sessions')) {
  fs.readdirSync('./sessions').forEach(dir => {
    if (fs.statSync(`./sessions/${dir}`).isDirectory()) {
      setTimeout(() => startBot(dir), 3000);
    }
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n========================================`);
  console.log(` KATABUMP HYBRID - Web QR + Pair Code`);
  console.log(` Port: ${PORT}`);
  console.log(` Web: http://localhost:${PORT}`);
  console.log(`========================================\n`);
});
