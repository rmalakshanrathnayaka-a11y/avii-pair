const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, Browsers, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 5000;
const sessions = new Map();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/pair', async (req, res) => {
    const { number } = req.body;
    if (!number) return res.status(400).json({ error: 'Phone number required' });

    const cleanNumber = number.replace(/[^0-9]/g, '');
    if (sessions.has(cleanNumber)) return res.status(400).json({ error: 'Session already exists' });

    try {
        const sessionDir = `./sessions/${cleanNumber}`;
        if (!fs.existsSync('./sessions')) fs.mkdirSync('./sessions');

        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        console.log(`[${cleanNumber}] Creating socket...`);

        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: 'silent' }),
            browser: Browsers.ubuntu('Chrome'),
            version: [2, 3000, 1015901307]
        });

        sessions.set(cleanNumber, sock);
        sock.ev.on('creds.update', saveCreds);

        let responded = false;

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            console.log(`[${cleanNumber}] Connection: ${connection}`);

            if (connection === 'open' &&!responded) {
                responded = true;
                console.log(`[${cleanNumber}] Connected! Requesting pair code...`);
                try {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    const code = await sock.requestPairingCode(cleanNumber);
                    console.log(`[${cleanNumber}] SUCCESS: ${code}`);
                    res.json({ code: code });
                } catch (err) {
                    console.error(`[${cleanNumber}] Pair code error:`, err.message);
                    if (!res.headersSent) res.status(500).json({ error: err.message });
                }
            }

            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut;
                console.log(`[${cleanNumber}] Connection closed. Reconnect: ${shouldReconnect}`);
                sessions.delete(cleanNumber);
                if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });
                if (!responded &&!res.headersSent) {
                    res.status(500).json({ error: 'Connection closed before pair code' });
                }
            }
        });

    } catch (error) {
        console.error('Error:', error);
        if (!res.headersSent) res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
