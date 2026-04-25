const express = require('express');
const pino = require('pino');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  Browsers,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
if (!fs.existsSync('./sessions')) fs.mkdirSync('./sessions');

// ඔයාගේ working logic එකෙන් ගත්ත connection function එක
async function createPairCode(number) {
  const cleanNum = number.replace(/[^0-9]/g, '');
  const sessionPath = `./sessions/${cleanNum}`;
  
  if (fs.existsSync(sessionPath)) {
    fs.rmSync(sessionPath, { recursive: true, force: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();
  
  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    browser: Browsers.macOS('Safari'), // ඔයාගේ code එකේ තියෙන රහස
    syncFullHistory: false,
    markOnlineOnConnect: false
  });

  sock.ev.on('creds.update', saveCreds);

  // Connection open වෙනකන් ඉන්නවා - ඔයාගේ logic එක
  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      sock.end();
      reject(new Error('Connection timeout'));
    }, 20000);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update;
      
      if (connection === 'open') {
        clearTimeout(timeout);
        try {
          await new Promise(r => setTimeout(r, 2000)); // delay එක
          const code = await sock.requestPairingCode(cleanNum);
          setTimeout(() => sock.end(), 5000);
          resolve(code);
        } catch (e) {
          reject(e);
        }
      }
      
      if (connection === 'close') {
        clearTimeout(timeout);
        const code = (lastDisconnect?.error instanceof Boom)?.output?.statusCode;
        if (code !== DisconnectReason.restartRequired) {
          reject(lastDisconnect?.error || new Error('Connection closed'));
        }
      }
    });
  });
}

app.post('/api/pair', async (req, res) => {
  const { number } = req.body;
  if (!number || number.length < 10) {
    return res.status(400).json({ error: 'Valid number required' });
  }

  try {
    console.log(`Pair request for: ${number}`);
    const code = await createPairCode(number);
    const formatted = code?.match(/.{1,4}/g)?.join('-') || code;
    res.json({ code: formatted });
  } catch (err) {
    console.error('Pair Error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to get code' });
  }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => console.log(`AVII Pair Server Running on ${PORT}`));
