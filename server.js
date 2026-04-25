const express = require('express');
const pino = require('pino');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  Browsers,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 8080;
if (!fs.existsSync('./sessions')) fs.mkdirSync('./sessions');

async function createPairCode(number) {
  const cleanNum = number.replace(/[^0-9]/g, '');
  const sessionPath = `./sessions/${cleanNum}`;
  
  if (fs.existsSync(sessionPath)) {
    fs.rmSync(sessionPath, { recursive: true, force: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();
  
  console.log(`[${cleanNum}] Creating socket... Version: ${version}`);
  
  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    browser: Browsers.ubuntu('Chrome'), // macOS වෙනුවට Ubuntu දාමු - IP block අඩුයි
    syncFullHistory: false,
    markOnlineOnConnect: false,
    connectTimeoutMs: 60000
  });

  sock.ev.on('creds.update', saveCreds);

  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      console.log(`[${cleanNum}] TIMEOUT: Connection not opened in 30s`);
      sock.end();
      reject(new Error('Connection timeout - Railway IP may be blocked by WhatsApp'));
    }, 30000);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update;
      console.log(`[${cleanNum}] Connection: ${connection}`);
      
      if (connection === 'open') {
        clearTimeout(timeout);
        try {
          console.log(`[${cleanNum}] Connected! Requesting pair code...`);
          await new Promise(r => setTimeout(r, 2000));
          const code = await sock.requestPairingCode(cleanNum);
          console.log(`[${cleanNum}] SUCCESS: ${code}`);
          setTimeout(() => sock.end(), 5000);
          resolve(code);
        } catch (e) {
          console.log(`[${cleanNum}] Pair Error: ${e.message}`);
          reject(e);
        }
      }
      
      if (connection === 'close') {
        clearTimeout(timeout);
        const statusCode = (lastDisconnect?.error instanceof Boom)?.output?.statusCode;
        console.log(`[${cleanNum}] Closed. Code: ${statusCode}, Error: ${lastDisconnect?.error?.message}`);
        reject(new Error(`Connection closed: ${lastDisconnect?.error?.message || 'Unknown'}`));
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
    console.error(`Pair Error for ${number}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => console.log(`AVII Pair Server Running on ${PORT}`));
