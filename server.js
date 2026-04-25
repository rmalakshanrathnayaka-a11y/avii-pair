
import express from 'express';
import cors from 'cors';
import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import qrcode from 'qrcode';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
if (!fs.existsSync('./sessions')) fs.mkdirSync('./sessions', { recursive: true });

let qrData = null;
let sock = null;

async function connectWA() {
  const { state, saveCreds } = await useMultiFileAuthState('./sessions/main');
  
  sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    browser: ['AVII-BOT', 'Chrome', '110.0.0'],
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      qrData = await qrcode.toDataURL(qr);
    }
    
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) setTimeout(connectWA, 5000);
    }
    
    if (connection === 'open') {
      qrData = null;
    }
  });

  sock.ev.on('creds.update', saveCreds);
}

connectWA();

app.get('/api/qr', (req, res) => {
  if (qrData) res.json({ qr: qrData, status: 'scan' });
  else if (sock?.user) res.json({ status: 'connected', user: sock.user.id });
  else res.json({ status: 'loading' });
});

app.get('/', (req,res)=> res.sendFile(path.join(__dirname,'public/index.html')));
app.listen(PORT, ()=> console.log('QR Ready'));
