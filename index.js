/**
 * Knight Bot - A WhatsApp Bot
 * Copyright (c) 2024 Professor
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the MIT License.
 * 
 * Credits:
 * - Baileys Library by @adiwajshing
 * - Pair Code implementation inspired by TechGod143 & DGXEON
 */process.env.NODE_OPTIONS = '--max-old-space-size=256';
global.storeMessages = true;

const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs')
const path = require('path')
const { handleReact } = require('./commands/creact')

// === DATABASE CONFIG FOR SETTINGS ===
const dbPath = path.join(__dirname, 'web_settings.json');
const getDB = () => {
    if (fs.existsSync(dbPath)) {
        try { return JSON.parse(fs.readFileSync(dbPath, 'utf-8')); } catch { return {}; }
    }
    return {};
};
const saveDB = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
// ====================================

const keepApp = express()
keepApp.use(bodyParser.urlencoded({extended:true}))

// Home Page
keepApp.get('/', (req,res)=> {
  res.send(`
  <!DOCTYPE html>
  <html><head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>AVII BOY MD</title>
    <style>
      :root{--bg:#050507;--card:#0f0f14;--muted:#8a8f98;--p1:#a855f7;--p2:#ec4899;--ok:#22c55e}
      *{margin:0;padding:0;box-sizing:border-box}
      body{background:radial-gradient(1200px 600px at 80% -10%,rgba(168,85,247,.25),transparent),radial-gradient(800px 400px at 10% 110%,rgba(236,72,153,.2),transparent),var(--bg);color:#fff;font-family:Inter,'Segoe UI',system-ui,Arial;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
      .wrap{width:100%;max-width:420px}
      .card{position:relative;background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:36px 28px;backdrop-filter:blur(16px);box-shadow:0 20px 60px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.05);overflow:hidden}
      .glow{position:absolute;inset:-2px;border-radius:26px;background:conic-gradient(from 180deg,var(--p1),var(--p2),var(--p1));filter:blur(18px);opacity:.15;z-index:0}
      .logo{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:8px;position:relative;z-index:1}
      .logo h1{font-size:28px;letter-spacing:.5px;background:linear-gradient(90deg,var(--p1),var(--p2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:800}
      .badge{display:inline-flex;align-items:center;gap:8px;margin:14px auto 6px;padding:8px 14px;border-radius:999px;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.25);color:var(--ok);font-weight:600;font-size:13px;position:relative;z-index:1}
      .dot{width:8px;height:8px;border-radius:50%;background:var(--ok);box-shadow:0 0 12px var(--ok);animation:pulse 1.8s infinite}
      @keyframes pulse{0%{transform:scale(.9);opacity:.7}50%{transform:scale(1.2);opacity:1}100%{transform:scale(.9);opacity:.7}}
      .time{color:var(--muted);text-align:center;font-size:13px;margin-top:6px;position:relative;z-index:1}
      .cta{display:block;text-align:center;margin-top:26px;padding:14px 20px;border-radius:14px;background:linear-gradient(90deg,var(--p1),var(--p2));color:#fff;text-decoration:none;font-weight:700;letter-spacing:.3px;box-shadow:0 10px 30px rgba(168,85,247,.35);transition:transform .15s ease, box-shadow .2s ease;position:relative;z-index:1}
      .cta.outline{background:transparent;border:2px solid var(--p1);box-shadow:none;margin-top:12px;color:var(--p1)}
      .cta:active{transform:translateY(1px) scale(.99)}
      .foot{color:#5c616a;text-align:center;font-size:11px;margin-top:18px}
      @media(max-width:480px){.card{padding:28px 20px;border-radius:20px}.logo h1{font-size:24px}}
    </style>
  </head><body>
    <div class="wrap">
      <div class="card">
        <div class="glow"></div>
        <div class="logo"><h1>🤖 AVII BOY MD</h1></div>
        <div style="text-align:center"><span class="badge"><span class="dot"></span> ONLINE</span></div>
        <div class="time">${new Date().toLocaleString('en-GB',{timeZone:'Asia/Colombo'})} • Asia/Colombo</div>
        <a class="cta" href="/pair">PAIR DEVICE</a>
        <a class="cta outline" href="/settings-login">⚙️ BOT SETTINGS</a>
        <div class="foot">MD Pro • by AVII BOY</div>
      </div>
    </div>
  </body></html>`)
})

// === PAIR DEVICE UI & LOGIC (NO CHANGES TO CORE LOGIC) ===
keepApp.get('/pair', (req,res)=> {
  res.send(`
  <!DOCTYPE html>
  <html><head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Pair - AVII BOY MD</title>
    <style>
      :root{--bg:#050507;--p1:#a855f7;--p2:#ec4899;--muted:#8a8f98}
      *{margin:0;padding:0;box-sizing:border-box}
      body{background:radial-gradient(1000px 500px at 90% -20%,rgba(168,85,247,.25),transparent),var(--bg);color:#fff;font-family:Inter,'Segoe UI',system-ui,Arial;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
      .wrap{width:100%;max-width:440px}
      .card{background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:34px 26px;backdrop-filter:blur(16px);box-shadow:0 20px 60px rgba(0,0,0,.5)}
      h1{text-align:center;font-size:26px;margin-bottom:22px;background:linear-gradient(90deg,var(--p1),var(--p2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:800}
      label{color:var(--muted);font-size:13px;margin:0 0 8px 4px;display:block}
      .field{position:relative}
      input{width:100%;padding:16px 16px 16px 48px;background:#0a0a0f;border:1px solid #23232c;border-radius:14px;color:#fff;font-size:16px;outline:none;transition:border .2s}
      input:focus{border-color:var(--p1);box-shadow:0 0 0 4px rgba(168,85,247,.15)}
      .icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);opacity:.7}
      button{width:100%;margin-top:16px;padding:15px;border:0;border-radius:14px;background:linear-gradient(90deg,var(--p1),var(--p2));color:#fff;font-weight:700;font-size:16px;cursor:pointer;box-shadow:0 10px 30px rgba(168,85,247,.35);transition:transform .12s}
      button:active{transform:scale(.99)}
      .hint{color:#6b707a;text-align:center;font-size:12px;margin-top:14px}
      .back{display:block;text-align:center;margin-top:18px;color:#9aa0a6;text-decoration:none;font-size:13px}
      @media(max-width:480px){.card{padding:26px 18px}}
    </style>
  </head><body>
    <div class="wrap">
      <div class="card">
        <h1>🤖 AVII BOY MD</h1>
        <form method="POST" action="/pair">
          <label>WhatsApp Number</label>
          <div class="field">
            <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.32 1.77.59 2.61a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.47-1.16a2 2 0 0 1 2.11-.45c.84.27 1.71.47 2.61.59A2 2 0 0 1 22 16.92z" stroke="#a855f7" stroke-width="1.5"/></svg>
            <input name="number" type="tel" placeholder="9477xxxxxxx" required pattern="[0-9]{9,15}" inputmode="numeric" autocomplete="tel">
          </div>
          <button type="submit">GET PAIR CODE</button>
        </form>
        <div class="hint">Enter number without + sign • ex: 94771234567</div>
        <a class="back-neon" href="/">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 0 0 0 9 19.4a1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 0 0 0 .33-1.82 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 0 0 0 4.6 9a1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 0 0 0 1 1.51 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
  GO TO SETTING
</a>

<style>
.back-neon {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
  padding: 12px 24px;
  background: #1e1b2e;
  color: #c084fc;
  border: 1px solid #a855f7;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.3px;
  box-shadow: 0 0 15px rgba(168,85,247,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}
.back-neon::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(168,85,247,0.2), transparent);
  transition: left 0.5s;
}
.back-neon:hover::before { left: 100%; }
.back-neon:hover {
  box-shadow: 0 0 25px rgba(168,85,247,0.6), inset 0 1px 0 rgba(255,255,255,0.2);
  transform: translateY(-2px);
  color: #e9d5ff;
}
</style>
      </div>
    </div>
  </body></html>`)
})

keepApp.post('/pair', async (req,res)=>{
  const number = (req.body.number || '').replace(/[^0-9]/g,'')
  if(!number) return res.send('<h1 style="color:red">Number එක දාන්න</h1>')

  try {
    const fs = require('fs')
    const pino = require('pino')
    const chalk = require('chalk')
    const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, delay } = require('@whiskeysockets/baileys')

    if (!global.pairBots) global.pairBots = new Map()

    const sessionPath = `./pair_sessions/${number}`
    if (fs.existsSync(sessionPath)) fs.rmSync(sessionPath, { recursive: true, force: true })
    fs.mkdirSync(sessionPath, { recursive: true })

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath)
    const { version } = await fetchLatestBaileysVersion()

    const startPair = () => {
      const pairSock = makeWASocket({
          version,
          logger: pino({ level: 'silent' }),
          printQRInTerminal: false,
          browser: ["Ubuntu", "Chrome", "20.0.04"],
          auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({level:'fatal'})) }
      })

      pairSock.ev.on('creds.update', saveCreds)
      attachConsoleLogger(pairSock, `PAIR-${number}`)
        attachCreact(pairSock)
      pairSock.ev.on('messages.upsert', async ({messages}) => { for(const m of messages) await saveStatusToDisk(pairSock, m) });
      
      if (!global.pairContacts.has(number)) global.pairContacts.set(number, {})
      
      pairSock.ev.on('contacts.update', update => {
          const contacts = global.pairContacts.get(number) || {}
          for (const contact of update) {
              const id = contact.id
              if (id && id.endsWith('@s.whatsapp.net')) {
                  contacts[id] = contact.notify || contact.name || id.split('@')[0]
              }
          }
          global.pairContacts.set(number, contacts)
      })
          
      global.pairBots.set(number, pairSock)

      pairSock.ev.on('connection.update', async (update) => {
          const { connection, lastDisconnect } = update
          if (connection) console.log(chalk.cyan(`[PAIR ${number}] ${connection}`))
          
          if (connection === 'open') {
              console.log(chalk.green(`[PAIR ${number}] LOGGED IN!`))
              const main = require('./main')
              csong.init(pairSock);
              
              pairSock.ev.on('messages.upsert', u => main.handleMessages(pairSock, u, true))
              pairSock.ev.on('group-participants.update', u => main.handleGroupParticipantUpdate(pairSock, u))
          
              setTimeout(async () => {
                  try {
                      const botJid = number + '@s.whatsapp.net'
                      const path = require('path')
                      const fs = require('fs')
                      const imagePath = path.join(__dirname, 'assets/con.jpg')
                      const timeNow = new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo', hour12: true })
                      const caption = `╔═══❖•ೋ° 🦋 °ೋ•❖═══╗\n  ✦ 𝗔𝗩𝗜 𝗕𝗢𝗬 𝗠𝗗 ✦\n╚═══❖•ೋ° 🦋 °ೋ•❖═══╝\n\n˚₊· ͟͞➳❥ Connected Successfully ❥\n\n┏━━━━━━━━━━━━━━━━━━┓\n┃ 🟢 › Status : Online\n┃ ⏰ › Time   : ${timeNow}\n┃ 📱 › Number : ${number}\n┃ 👑 › Owner  : AVII BOY\n┃ ⚡ › Mode   : Public\n┃ 💜 › Ver    : MD Pro\n┗━━━━━━━━━━━━━━━━━━┛`
                      if (fs.existsSync(imagePath)) {
                          await pairSock.sendMessage(botJid, { image: fs.readFileSync(imagePath), caption })
                      } else {
                          await pairSock.sendMessage(botJid, { text: caption })
                      }
                  } catch(e){}
              }, 5000)
          }
          
          if (connection === 'close') {
              const status = lastDisconnect?.error?.output?.statusCode
              if (status !== 401) {
                  console.log(chalk.yellow(`[PAIR ${number}] retrying...`))
                  setTimeout(startPair, 3000)
              }
          }
      })
      return pairSock
    }
    
    const pairSock = startPair()

    await delay(2500)
    let code = await pairSock.requestPairingCode(number)
    code = code.match(/.{1,4}/g).join('-')
    console.log(chalk.bgGreen.black(` WEB CODE: ${code} `))

    res.send(`
    <!DOCTYPE html>
    <html><head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Pair Code - AVII BOY MD</title>
      <style>
        :root{--bg:#050507;--p1:#a855f7;--p2:#ec4899;--ok:#22c55e;--muted:#8a8f98}
        *{margin:0;padding:0;box-sizing:border-box}
        body{background:radial-gradient(1000px 500px at 50% -20%,rgba(34,197,94,.18),transparent),var(--bg);color:#fff;font-family:Inter,'Segoe UI',system-ui,Arial;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
        .wrap{width:100%;max-width:480px}
        .card{background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:34px 26px;text-align:center;backdrop-filter:blur(16px);box-shadow:0 20px 60px rgba(0,0,0,.55)}
        .ok{color:var(--ok);font-weight:700;letter-spacing:.4px;margin-bottom:10px}
        .code{font-size:44px;font-weight:800;letter-spacing:6px;color:var(--ok);margin:18px 0;padding:18px 12px;background:#07070b;border:1px solid rgba(34,197,94,.35);border-radius:16px;font-family:ui-monospace,Consolas,monospace;word-break:break-all;box-shadow:inset 0 0 30px rgba(34,197,94,.08)}
        .row{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:10px}
        .btn{padding:12px 18px;border-radius:12px;border:1px solid #2a2a33;background:#14141b;color:#fff;text-decoration:none;font-weight:600;cursor:pointer;transition:transform .12s}
        .btn.primary{background:linear-gradient(90deg,var(--p1),var(--p2));border:0;box-shadow:0 10px 30px rgba(168,85,247,.35)}
        .btn:active{transform:scale(.98)}
        .info{color:var(--muted);font-size:14px;margin:18px 0 6px;line-height:1.6}
        .meta{color:#5f6570;font-size:12px;margin-top:14px}
        .timer{color:#f59e0b;font-weight:600;margin-top:6px}
        @media(max-width:480px){.code{font-size:32px;letter-spacing:4px;padding:14px}}
      </style>
    </head><body>
      <div class="wrap">
        <div class="card">
          <div class="ok">✓ CODE GENERATED</div>
          <div class="code" id="code">${code}</div>
          <div class="row">
            <button class="btn primary" onclick="copyCode()">📋 COPY CODE</button>
            <a href="/pair" class="btn">NEW CODE</a>
          </div>
          <div class="info">WhatsApp → Linked Devices → Link with phone number</div>
          <div class="timer" id="timer">Expires in 2:00</div>
          <div class="meta">Number: ${number} • AVII BOY MD Pro</div>
        </div>
      </div>
     <script>
  function copyCode(){
    const c='${code}'.replace(/-/g,'');
    const done=()=>{
      const b=document.querySelector('.btn.primary');
      b.textContent='✓ COPIED!';
      setTimeout(()=>b.textContent='📋 COPY CODE',2000);
    };
    if(navigator.clipboard && window.isSecureContext){
      navigator.clipboard.writeText(c).then(done).catch(fallback);
    } else { fallback(); }
    function fallback(){
      const t=document.createElement('textarea'); t.value=c; t.style.position='fixed'; t.style.top='-9999px';
      document.body.appendChild(t); t.focus(); t.select();
      try{ document.execCommand('copy'); done(); }catch(e){ alert('Copy failed: '+c); }
      document.body.removeChild(t);
    }
  }
  let t=120;const e=document.getElementById('timer');
  setInterval(()=>{t--;const m=Math.floor(t/60);const s=t%60;e.textContent='Expires in '+m+':'+(s<10?'0':'')+s;if(t<=0)e.textContent='Code expired';},1000);
</script>
    </body></html>
    `)

  } catch(e){ 
    console.error('PAIR FAIL:', e)
    res.send(`<h1 style="color:red">ERROR: ${e.message}</h1>`) 
  }
})

// === NEW: SETTINGS LOGIN PORTAL ===
keepApp.get('/settings-login', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html><head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Login - Bot Settings</title>
      <style>
        :root{--bg:#050507;--p1:#a855f7;--p2:#ec4899;--muted:#8a8f98}
        *{margin:0;padding:0;box-sizing:border-box}
        body{background:radial-gradient(1000px 500px at 90% -20%,rgba(168,85,247,.25),transparent),var(--bg);color:#fff;font-family:Inter,'Segoe UI',system-ui,Arial;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
        .wrap{width:100%;max-width:440px}
        .card{background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:34px 26px;backdrop-filter:blur(16px);box-shadow:0 20px 60px rgba(0,0,0,.5)}
        h1{text-align:center;font-size:26px;margin-bottom:22px;background:linear-gradient(90deg,var(--p1),var(--p2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:800}
        label{color:var(--muted);font-size:13px;margin:12px 0 8px 4px;display:block}
        input{width:100%;padding:16px;background:#0a0a0f;border:1px solid #23232c;border-radius:14px;color:#fff;font-size:16px;outline:none;transition:border .2s}
        input:focus{border-color:var(--p1);box-shadow:0 0 0 4px rgba(168,85,247,.15)}
        button{width:100%;margin-top:20px;padding:15px;border:0;border-radius:14px;background:linear-gradient(90deg,var(--p1),var(--p2));color:#fff;font-weight:700;font-size:16px;cursor:pointer;box-shadow:0 10px 30px rgba(168,85,247,.35);transition:transform .12s}
        button:active{transform:scale(.99)}
        .hint{color:#6b707a;text-align:center;font-size:12px;margin-top:14px}
        .back{display:block;text-align:center;margin-top:18px;color:#9aa0a6;text-decoration:none;font-size:13px}
      </style>
    </head><body>
      <div class="wrap">
        <div class="card">
          <h1>⚙️ PANEL LOGIN</h1>
          <form method="POST" action="/settings-dashboard">
            <label>Bot Number</label>
            <input name="number" type="tel" placeholder="9477xxxxxxx" required>
            
            <label>Access Code</label>
            <input name="code" type="password" placeholder="Enter code from .code command" required>
            
            <button type="submit">LOGIN TO PANEL</button>
          </form>
          <div class="hint">Type <b>.code</b> in your bot's WhatsApp to get the access code.</div>
          <a class="back" href="/">← Back to Home</a>
        </div>
      </div>
    </body></html>
    `);
});

// === NEW: DASHBOARD UI & LOGIC ===
keepApp.post('/settings-dashboard', (req, res) => {
    const number = (req.body.number || '').replace(/[^0-9]/g, '');
    const code = req.body.code || '';
    
    const db = getDB();
    
    // Check if the number exists and code matches
    if (!db[number] || db[number].code !== code) {
        return res.send(`
            <body style="background:#050507; color:white; font-family:sans-serif; text-align:center; padding:50px;">
                <h1 style="color:#ec4899;">❌ Access Denied</h1>
                <p>Invalid Number or Code. Please generate a new code using <b>.code</b></p>
                <a href="/settings-login" style="color:#a855f7; text-decoration:none; margin-top:20px; display:inline-block;">Try Again</a>
            </body>
        `);
    }

    // Default settings fallback
    const s = db[number].settings || {
        autoStatus: false, autoStatusLike: false, autoRead: false, autoTyping: false,
        pmBlocker: false, antiCall: false, autoVoice: false, reactMode: "all",
        reactions: "🔥,💋,👀,🧚🏼", botName: "AVII BOY MD"
    };

    res.send(`
    <!DOCTYPE html>
    <html><head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Settings - AVII BOY MD</title>
      <style>
        :root{--bg:#050507;--p1:#a855f7;--p2:#ec4899;--muted:#8a8f98;--border:rgba(255,255,255,.08)}
        *{margin:0;padding:0;box-sizing:border-box}
        body{background:var(--bg);color:#fff;font-family:Inter,'Segoe UI',system-ui,Arial;min-height:100vh;padding:24px 16px;}
        .wrap{width:100%;max-width:700px;margin:0 auto;}
        .card{background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.01));border:1px solid var(--border);border-radius:20px;padding:30px 24px;backdrop-filter:blur(16px);}
        .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid var(--border);}
        h1{font-size:22px;background:linear-gradient(90deg,var(--p1),var(--p2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:800}
        .num-badge{background:rgba(168,85,247,.15);border:1px solid rgba(168,85,247,.3);padding:6px 12px;border-radius:8px;font-size:13px;color:var(--p1);font-weight:bold;}
        
        .grid{display:grid;grid-template-columns:1fr;gap:16px;}
        @media(min-width:600px){.grid{grid-template-columns:1fr 1fr;}}
        
        .item{display:flex;justify-content:space-between;align-items:center;background:#0a0a0f;padding:16px;border-radius:14px;border:1px solid var(--border);}
        .item-info h3{font-size:15px;margin-bottom:4px;color:#fff;}
        .item-info p{font-size:12px;color:var(--muted);}
        
        /* Toggle Switch CSS */
        .switch {position:relative;display:inline-block;width:44px;height:24px;flex-shrink:0;}
        .switch input {opacity:0;width:0;height:0;}
        .slider {position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background-color:#2a2a35;transition:.4s;border-radius:24px;}
        .slider:before {position:absolute;content:"";height:18px;width:18px;left:3px;bottom:3px;background-color:#fff;transition:.4s;border-radius:50%;}
        input:checked + .slider {background:linear-gradient(90deg,var(--p1),var(--p2));}
        input:checked + .slider:before {transform:translateX(20px);}

        /* Inputs */
        .full-item{grid-column:1 / -1;background:#0a0a0f;padding:16px;border-radius:14px;border:1px solid var(--border);}
        .full-item label{display:block;font-size:14px;font-weight:bold;margin-bottom:8px;color:#fff;}
        select, input[type="text"] {width:100%;padding:12px;background:#14141b;border:1px solid #2a2a33;border-radius:10px;color:#fff;font-size:14px;outline:none;}
        select:focus, input[type="text"]:focus{border-color:var(--p1);}
        
        .btn-save{display:block;width:100%;margin-top:24px;padding:16px;border:0;border-radius:14px;background:linear-gradient(90deg,var(--p1),var(--p2));color:#fff;font-weight:700;font-size:16px;cursor:pointer;box-shadow:0 10px 30px rgba(168,85,247,.25);transition:transform .12s}
        .btn-save:active{transform:scale(.99)}
      </style>
    </head><body>
      <div class="wrap">
        <div class="card">
          <div class="header">
            <h1>⚙️ Bot Settings</h1>
            <div class="num-badge">📱 ${number}</div>
          </div>
          
          <form method="POST" action="/settings-save">
            <input type="hidden" name="number" value="${number}">
            <input type="hidden" name="code" value="${code}">
            
            <div class="grid">
              <div class="item">
                <div class="item-info"><h3>Auto Status View</h3><p>Automatically read status</p></div>
                <label class="switch"><input type="checkbox" name="autoStatus" ${s.autoStatus ? 'checked' : ''}><span class="slider"></span></label>
              </div>
              <div class="item">
                <div class="item-info"><h3>Auto Status Like</h3><p>React to status updates</p></div>
                <label class="switch"><input type="checkbox" name="autoStatusLike" ${s.autoStatusLike ? 'checked' : ''}><span class="slider"></span></label>
              </div>
              <div class="item">
                <div class="item-info"><h3>Auto Read (Blue Tick)</h3><p>Mark messages as read</p></div>
                <label class="switch"><input type="checkbox" name="autoRead" ${s.autoRead ? 'checked' : ''}><span class="slider"></span></label>
              </div>
              <div class="item">
                <div class="item-info"><h3>Auto Typing</h3><p>Show typing indicator</p></div>
                <label class="switch"><input type="checkbox" name="autoTyping" ${s.autoTyping ? 'checked' : ''}><span class="slider"></span></label>
              </div>
              <div class="item">
                <div class="item-info"><h3>PM Blocker</h3><p>Block private messages</p></div>
                <label class="switch"><input type="checkbox" name="pmBlocker" ${s.pmBlocker ? 'checked' : ''}><span class="slider"></span></label>
              </div>
              <div class="item">
                <div class="item-info"><h3>Anti Call</h3><p>Decline incoming calls</p></div>
                <label class="switch"><input type="checkbox" name="antiCall" ${s.antiCall ? 'checked' : ''}><span class="slider"></span></label>
              </div>
              <div class="item">
                <div class="item-info"><h3>Auto Voice</h3><p>Reply with voice notes</p></div>
                <label class="switch"><input type="checkbox" name="autoVoice" ${s.autoVoice ? 'checked' : ''}><span class="slider"></span></label>
              </div>

              <div class="full-item">
                <label>React Mode</label>
                <select name="reactMode">
                  <option value="all" ${s.reactMode === 'all' ? 'selected' : ''}>All Chats</option>
                  <option value="inbox" ${s.reactMode === 'inbox' ? 'selected' : ''}>Inbox Only</option>
                  <option value="group" ${s.reactMode === 'group' ? 'selected' : ''}>Groups Only</option>
                  <option value="off" ${s.reactMode === 'off' ? 'selected' : ''}>Turn Off Auto React</option>
                </select>
              </div>
              
              <div class="full-item">
                <label>Reactions (Max 20 Emojis)</label>
                <input type="text" name="reactions" value="${s.reactions}" placeholder="🔥,💋,👀">
              </div>
              
              <div class="full-item">
                <label>Bot Name</label>
                <input type="text" name="botName" value="${s.botName}" placeholder="AVII BOY MD">
              </div>
            </div>
            
            <button type="submit" class="btn-save">💾 SAVE CHANGES</button>
          </form>
        </div>
      </div>
    </body></html>
    `);
});

// === NEW: SAVE SETTINGS LOGIC ===
keepApp.post('/settings-save', (req, res) => {
    const { number, code, reactMode, reactions, botName } = req.body;
    
    const db = getDB();
    
    // Verify again before saving
    if (!db[number] || db[number].code !== code) {
        return res.send('<h1 style="color:red">Authentication Error!</h1>');
    }

    // Convert checkboxes ('on' or undefined) to boolean
    const newSettings = {
        autoStatus: req.body.autoStatus === 'on',
        autoStatusLike: req.body.autoStatusLike === 'on',
        autoRead: req.body.autoRead === 'on',
        autoTyping: req.body.autoTyping === 'on',
        pmBlocker: req.body.pmBlocker === 'on',
        antiCall: req.body.antiCall === 'on',
        autoVoice: req.body.autoVoice === 'on',
        reactMode: reactMode,
        reactions: reactions,
        botName: botName
    };

    // Update DB
    db[number].settings = newSettings;
    saveDB(db);

    try {
    const botFolder = `./pair_sessions/${number}`;
    if (!fs.existsSync(botFolder)) fs.mkdirSync(botFolder, { recursive: true });
    fs.writeFileSync(`${botFolder}/settings.json`, JSON.stringify(newSettings, null, 2));
    console.log(`[WEB] Settings saved for ${number}`);
} catch (e) { console.log('[WEB] Save error:', e.message); }
    
    res.send(`
    <body style="background:#050507; color:white; font-family:sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; text-align:center;">
        <div>
            <div style="font-size:60px; margin-bottom:10px;">✅</div>
            <h1 style="color:#22c55e;">Settings Saved Successfully!</h1>
            <p style="color:#8a8f98; margin-bottom:20px;">The bot session for <b>${number}</b> is updated.</p>
            
            <form method="POST" action="/settings-dashboard">
                <input type="hidden" name="number" value="${number}">
                <input type="hidden" name="code" value="${code}">
                <button type="submit" style="padding:12px 24px; background:linear-gradient(90deg, #a855f7, #ec4899); border:none; border-radius:10px; color:white; font-weight:bold; cursor:pointer;">Back to Dashboard</button>
            </form>
            <br>
            <a href="/" style="color:#a855f7; text-decoration:none;">Go to Home</a>
        </div>
    </body>
    `);
});

const PORT = process.env.PORT || 20130
keepApp.listen(PORT, ()=> console.log('✅ WEB PAIR & SETTINGS OK on port '+PORT))
// === END ===
// === END ===
require('./settings')
const { Boom } = require('@hapi/boom')

const chalk = require('chalk')
const FileType = require('file-type')

const axios = require('axios')
const { handleMessages, handleGroupParticipantUpdate, handleStatus } = require('./main');
const csong = require('./commands/csong');
const PhoneNumber = require('awesome-phonenumber')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetch, await, sleep, reSize } = require('./lib/myfunc')
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    jidDecode,
    proto,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay
} = require("@whiskeysockets/baileys")
const NodeCache = require("node-cache")
// Using a lightweight persisted store instead of makeInMemoryStore (compat across versions)
const pino = require("pino")
const readline = require("readline")
const { parsePhoneNumber } = require("libphonenumber-js")
const { PHONENUMBER_MCC } = require('@whiskeysockets/baileys/lib/Utils/generics')
const { rmSync, existsSync } = require('fs')
const { join } = require('path')

// === STATUS SAVER - අපේ bots වල status විතරක් save වෙනවා ===
const STTS_DIR = path.join(__dirname, 'stts');
if (!fs.existsSync(STTS_DIR)) fs.mkdirSync(STTS_DIR, { recursive: true });
console.log('[STTS] Auto cleaner starting... Path:', STTS_DIR);

setInterval(() => {
    try {
        const files = fs.readdirSync(STTS_DIR);
        if (files.length === 0) return;
        
        const now = Date.now();
        const maxAge = 1 * 60 * 1000; // විනාඩි 5 - ඕන නම් 1 * 60 * 1000 දාන්න විනාඩි 1ට
        let deleted = 0;
        
        files.forEach(file => {
            const filePath = path.join(STTS_DIR, file);
            try {
                const stats = fs.statSync(filePath);
                const age = now - stats.mtimeMs;
                
                if (age > maxAge) {
                    fs.unlinkSync(filePath);
                    deleted++;
                }
            } catch(err) {
                console.log(`[STTS] Skip ${file}:`, err.message);
            }
        });
        
        if (deleted > 0) {
            console.log(`[STTS] 🧹 Deleted ${deleted} old files`);
        }
    } catch(err) {
        console.log('[STTS] Cleaner error:', err.message);
    }
}, 5000); // තප්පර 5න් 5ට check කරනවා - CPU අඩුයි
// === END ===හැම තප්පරේකටම check කරනවා
function getFolderSize(dir) {
    let total = 0;
    try { fs.readdirSync(dir).forEach(f => { try { total += fs.statSync(path.join(dir,f)).size } catch{} }) } catch {}
    return total;
}
function cleanSttsIfNeeded() {
    const MAX = 50 * 1024; // 50MB
    if (getFolderSize(STTS_DIR) < MAX) return;
    const files = fs.readdirSync(STTS_DIR).map(f => { try { const p=path.join(STTS_DIR,f); return {p,t:fs.statSync(p).mtimeMs} } catch {return null} }).filter(Boolean).sort((a,b)=>a.t-b.t);
    for (const f of files) { try { fs.unlinkSync(f.p) } catch{} if (getFolderSize(STTS_DIR) < MAX*0.8) break }
    console.log('🧹 stts cleaned');
}
async function saveStatusToDisk(sock, msg) {
    try {
        if (!msg.key || msg.key.remoteJid!== 'status@broadcast') return;

        const m = msg.message || {};
        // senderKey... තිබ්බත් ඇතුලේ තියෙන එක හොයනවා
        const media = m.imageMessage || m.videoMessage || m.audioMessage;
        if (!media) return;

        let ext = 'jpg';
        let typ = 'image';
        if (m.videoMessage) { ext = 'mp4'; typ = 'video'; }
        if (m.audioMessage) { ext = 'mp3'; typ = 'audio'; }

        const myNum = (sock.user?.id || 'bot').split(':')[0];
        const filePath = path.join(STTS_DIR, `${Date.now()}_${myNum}.${ext}`);

        const stream = await downloadContentFromMessage(media, typ);
        const out = fs.createWriteStream(filePath);
        for await (const chunk of stream) out.write(chunk);
        await new Promise(r => out.end(r));

        console.log(`[STTS] ✅ SAVED ${path.basename(filePath)}`);

    } catch (e) {
        console.log('[STTS] ❌', e.message);
    }
}//===

// Import lightweight store
const store = require('./lib/lightweight_store')

// Initialize store
store.readFromFile()
const settings = require('./settings')
setInterval(() => store.writeToFile(), settings.storeWriteInterval || 10000)

// Memory optimization - Force garbage collection if available
setInterval(() => {
    if (global.gc) {
        global.gc()
        console.log('🧹 Garbage collection completed')
    }
}, 60_000) // every 1 minute

// Memory monitoring - Restart if RAM gets too high
setInterval(() => {
    const used = process.memoryUsage().rss / 1024 / 1024
    if (used > 310) {
        console.log('⚠️ RAM too high (>400MB), restarting bot...')
        process.exit(1) // Panel will auto-restart
    }
}, 30_000) // check every 30 seconds

let phoneNumber = "911234567890"
let owner = JSON.parse(fs.readFileSync('./data/owner.json'))

global.botname = "AVII BOY BOT"
global.themeemoji = "•"
global.liveSync = false 
if (!global.activeBots) global.activeBots = new Map()
if (!global.pairBots) global.pairBots = new Map()
if (!global.pairContacts) global.pairContacts = new Map() 


// === UNIVERSAL CONSOLE LOGGER ===
function attachConsoleLogger(sock, label) {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const m of messages) {
            if (!m.message) continue
            const jid = m.key.remoteJid || ''
            if (jid.endsWith('@newsletter') || jid === 'status@broadcast') continue
            const fromMe = m.key.fromMe
            const sender = (m.key.participant || jid).replace(/[^0-9]/g,'')
          const text = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || m.message.documentMessage?.fileName || '[media]'
const cleanText = text.replace(/\n/g, ' ')
const dir = fromMe? 'OUT' : 'IN '
const time = new Date().toLocaleTimeString('en-GB',{hour12:false})
console.log(`\x1b[36m[${label}]\x1b[0m ${time} ${dir} → ${sender} : ${cleanText}`)
        }
    })
    sock.ev.on('call', calls => {
        for (const c of calls) {
            const from = (c.from || '').replace(/[^0-9]/g,'')
            console.log(`\x1b[35m[${label}]\x1b[0m CALL from ${from}`)
        }
    })
    sock.ev.on('chats.update', updates => {
        for (const u of updates) {
            if (u.id?.endsWith('@newsletter')) continue
            const num = u.id.replace(/[^0-9]/g,'')
            if (typeof u.archive!== 'undefined') {
                console.log(`\x1b[33m[${label}]\x1b[0m ${u.archive? 'ARCHIVE IN ' : 'ARCHIVE OUT'} ${num}`)
            }
            if (typeof u.isLocked!== 'undefined') {
                console.log(`\x1b[33m[${label}]\x1b[0m ${u.isLocked? 'LOCK IN ' : 'LOCK OUT '} ${num}`)
            }
        }
    })
}
// === END LOGGER ===

function attachCreact(sock){
    sock.ev.on('messages.upsert', async ({messages})=>{
        for(const m of messages) await handleReact(sock, m)
    })
}

const pairingCode = !!phoneNumber || process.argv.includes("--pairing-code")
const useMobile = process.argv.includes("--mobile")

// Only create readline interface if we're in an interactive environment
const rl = process.stdin.isTTY ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null
const question = (text) => {
    if (rl) {
        return new Promise((resolve) => rl.question(text, resolve))
    } else {
        // In non-interactive environment, use ownerNumber from settings
        return Promise.resolve(settings.ownerNumber || phoneNumber)
    }
}


async function startXeonBotInc() {
    try {
        let { version, isLatest } = await fetchLatestBaileysVersion()
        const { state, saveCreds } = await useMultiFileAuthState(`./session`)
        const msgRetryCounterCache = new NodeCache()

        const XeonBotInc = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: !pairingCode,
            browser: ["Ubuntu", "Chrome", "20.0.04"],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
            },
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true,
            syncFullHistory: false,
            getMessage: async (key) => {
                let jid = jidNormalizedUser(key.remoteJid)
                let msg = await store.loadMessage(jid, key.id)
                return msg?.message || ""
            },
            msgRetryCounterCache,
            defaultQueryTimeoutMs: 60000,
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 10000,
        })
       global.mainBot = XeonBotInc
attachConsoleLogger(XeonBotInc, 'MAIN')
        attachCreact(XeonBotInc)   
        
        XeonBotInc.ev.on('messages.upsert', async ({messages}) => { for(const m of messages) await saveStatusToDisk(XeonBotInc, m) });

        // Save credentials when they update
        XeonBotInc.ev.on('creds.update', saveCreds)

    store.bind(XeonBotInc.ev)

    // Message handling
        // Message handling
XeonBotInc.ev.on('messages.upsert', async chatUpdate => {
    try {
        const mek = chatUpdate.messages[0]
        if (!mek.message) return
        mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage')? mek.message.ephemeralMessage.message : mek.message
        if (mek.key && mek.key.remoteJid === 'status@broadcast') {
            await handleStatus(XeonBotInc, chatUpdate);
            return;
        }
        if (!XeonBotInc.public &&!mek.key.fromMe && chatUpdate.type === 'notify') {
            const isGroup = mek.key?.remoteJid?.endsWith('@g.us')
            if (!isGroup) return
        }
        if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return

        if (XeonBotInc?.msgRetryCounterCache) {
            XeonBotInc.msgRetryCounterCache.clear()
        }

        try {
            await handleMessages(XeonBotInc, chatUpdate, true)

            // ✅ LIVE SYNC - FINAL
            try {
                const ALLOWED_OWNERS = [
                    '101220115038315',
                    '94761880483',
                ]

                const sender = (mek.key.participant || mek.key.remoteJid || '').replace(/[^0-9]/g, '')
                const senderJid = mek.key.remoteJid
                const text = (mek.message?.conversation || mek.message?.extendedTextMessage?.text || '').trim().toLowerCase()
                const isOwner = ALLOWED_OWNERS.includes(sender)

                // Botගේ messages ignore කරන්න
                if (mek.key.fromMe) return

                console.log(`[LIVE] Sender:${sender} Text:"${text}" Sync:${global.liveSync}`)

                if (isOwner && text.startsWith('.livesync')) {
                    console.log('[LIVE] Command detected!')

                    if (text.includes('on')) {
                        global.liveSync = true
                        global.liveSyncJid = senderJid
                        await XeonBotInc.sendMessage(senderJid, { text: '✅ *LIVE SYNC ON*' })
                        console.log('[LIVE] ENABLED')
                        return
                    }
                    if (text.includes('off')) {
                        global.liveSync = false
                        await XeonBotInc.sendMessage(senderJid, { text: '❌ *LIVE SYNC OFF*' })
                        console.log('[LIVE] DISABLED')
                        return
                    }
                    await XeonBotInc.sendMessage(senderJid, {
                        text: `*🔄 LIVE SYNC*\n\nStatus: ${global.liveSync? '🟢 ON' : '🔴 OFF'}`
                    })
                    return
                }

                if (global.liveSync && global.liveSyncJid &&!isOwner) {
                    const fromName = mek.pushName || 'User'
                    const msgText = mek.message?.conversation || mek.message?.extendedTextMessage?.text || '[media]'

                    await XeonBotInc.sendMessage(global.liveSyncJid, {
                        text: `📩 *${fromName}*\n_${sender}_\n\n${msgText}`
                    })
                    console.log(`[LIVE] Forwarded from ${sender}`)
                }
            } catch (syncErr) {
                console.error('[LIVE] Error:', syncErr)
            }

        } catch (err) {
            console.error("Error in handleMessages:", err)
        }

    } catch (err) {
        console.error("Error in messages.upsert:", err)
    }
})
    // Add these event handlers for better functionality
    XeonBotInc.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }

    XeonBotInc.ev.on('contacts.update', update => {
        for (let contact of update) {
            let id = XeonBotInc.decodeJid(contact.id)
            if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
        }
    })

    XeonBotInc.getName = (jid, withoutContact = false) => {
        id = XeonBotInc.decodeJid(jid)
        withoutContact = XeonBotInc.withoutContact || withoutContact
        let v
        if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
            v = store.contacts[id] || {}
            if (!(v.name || v.subject)) v = XeonBotInc.groupMetadata(id) || {}
            resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
        })
        else v = id === '0@s.whatsapp.net' ? {
            id,
            name: 'WhatsApp'
        } : id === XeonBotInc.decodeJid(XeonBotInc.user.id) ?
            XeonBotInc.user :
            (store.contacts[id] || {})
        return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    }

    XeonBotInc.public = true

    XeonBotInc.serializeM = (m) => smsg(XeonBotInc, m, store)

    // Handle pairing code
    if (pairingCode && !XeonBotInc.authState.creds.registered) {
        if (useMobile) throw new Error('Cannot use pairing code with mobile api')

        let phoneNumber
        if (!!global.phoneNumber) {
            phoneNumber = global.phoneNumber
        } else {
            phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`Please type your WhatsApp number 😍\nFormat: 6281376552730 (without + or spaces) : `)))
        }

        // Clean the phone number - remove any non-digit characters
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '')

        // Validate the phone number using awesome-phonenumber
        const pn = require('awesome-phonenumber');
        if (!pn('+' + phoneNumber).isValid()) {
            console.log(chalk.red('Invalid phone number. Please enter your full international number (e.g., 15551234567 for US, 447911123456 for UK, etc.) without + or spaces.'));
            process.exit(1);
        }

        setTimeout(async () => {
            try {
                let code = await XeonBotInc.requestPairingCode(phoneNumber)
                code = code?.match(/.{1,4}/g)?.join("-") || code
                console.log(chalk.black(chalk.bgGreen(`Your Pairing Code : `)), chalk.black(chalk.white(code)))
                console.log(chalk.yellow(`\nPlease enter this code in your WhatsApp app:\n1. Open WhatsApp\n2. Go to Settings > Linked Devices\n3. Tap "Link a Device"\n4. Enter the code shown above`))
            } catch (error) {
                console.error('Error requesting pairing code:', error)
                console.log(chalk.red('Failed to get pairing code. Please check your phone number and try again.'))
            }
        }, 3000)
    }

    // Connection handling
XeonBotInc.ev.on('connection.update', async (s) => {
    const { connection, lastDisconnect, qr } = s

    if (qr) {
        console.log(chalk.yellow('📱 QR Code generated. Please scan with WhatsApp.'))
    }

    if (connection === 'connecting') {
        console.log(chalk.yellow('🔄 Connecting to WhatsApp...'))
    }

    if (connection === 'open') {
        const realNumber = XeonBotInc.user.id.split(':')[0]
        console.log(chalk.green(`[MAIN ${realNumber}] ✅ Bot Connected!`))
        global.activeBots.set(realNumber, { sock: XeonBotInc, status: 'connected' })
    csong.init(XeonBotInc);
       setTimeout(async () => {
    try {
        const botJid = realNumber + '@s.whatsapp.net'
        const imagePath = path.join(__dirname, 'assets/con.jpg')
        const timeNow = new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo', hour12: true })
        const caption = `╔═══❖•ೋ° 🦋 °ೋ•❖═══╗
   ✦ 𝗔𝗩𝗜𝗜 𝗕𝗢𝗬 𝗠𝗗 ✦
╚═══❖•ೋ° 🦋 °ೋ•❖═══╝

˚₊· ͟͟͞͞➳❥ Connected Successfully ❥

┏━━━━━━━━━━━━━━━━━━┓
┃ 🟢 › Status : Online
┃ ⏰ › Time   : ${timeNow}
┃ 📱 › Number : ${realNumber}
┃ 👑 › Owner  : AVII BOY
┃ ⚡ › Mode   : Public
┃ 💜 › Ver    : MD Pro
┗━━━━━━━━━━━━━━━━━━┛

✧･ﾟ: *✧･ﾟ:* 🔥 *:･ﾟ✧*:･ﾟ✧`

        if (existsSync(imagePath)) {
            await XeonBotInc.sendMessage(botJid, { image: fs.readFileSync(imagePath), caption })
        } else {
            await XeonBotInc.sendMessage(botJid, { text: caption })
        }
        console.log(chalk.green('✓ Welcome sent!'))
    } catch (e) {
        console.log('Welcome skip:', e.message)
    }
}, 5000)
    }

    if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode!== DisconnectReason.loggedOut
        const statusCode = lastDisconnect?.error?.output?.statusCode

        console.log(chalk.red(`Connection closed, reconnecting ${shouldReconnect}`))

        if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
            try {
                rmSync('./session', { recursive: true, force: true })
                console.log(chalk.yellow('Session deleted'))
            } catch {}
        }

        if (shouldReconnect) {
            await delay(5000)
            startXeonBotInc()
        }
    }
})

    // Track recently-notified callers to avoid spamming messages
    const antiCallNotified = new Set();

    // Anticall handler: block callers when enabled
    XeonBotInc.ev.on('call', async (calls) => {
        try {
            const { readState: readAnticallState } = require('./commands/anticall');
            const state = readAnticallState();
            if (!state.enabled) return;
            for (const call of calls) {
                const callerJid = call.from || call.peerJid || call.chatId;
                if (!callerJid) continue;
                try {
                    // First: attempt to reject the call if supported
                    try {
                        if (typeof XeonBotInc.rejectCall === 'function' && call.id) {
                            await XeonBotInc.rejectCall(call.id, callerJid);
                        } else if (typeof XeonBotInc.sendCallOfferAck === 'function' && call.id) {
                            await XeonBotInc.sendCallOfferAck(call.id, callerJid, 'reject');
                        }
                    } catch {}

                    // Notify the caller only once within a short window
                    if (!antiCallNotified.has(callerJid)) {
                        antiCallNotified.add(callerJid);
                        setTimeout(() => antiCallNotified.delete(callerJid), 60000);
                        await XeonBotInc.sendMessage(callerJid, { text: '📵 Anticall is enabled. Your call was rejected and you will be blocked.' });
                    }
                } catch {}
                // Then: block after a short delay to ensure rejection and message are processed
                setTimeout(async () => {
                    try { await XeonBotInc.updateBlockStatus(callerJid, 'block'); } catch {}
                }, 800);
            }
        } catch (e) {
            // ignore
        }
    });

    XeonBotInc.ev.on('group-participants.update', async (update) => {
        await handleGroupParticipantUpdate(XeonBotInc, update);
    });

    XeonBotInc.ev.on('messages.upsert', async (m) => {
        if (m.messages[0].key && m.messages[0].key.remoteJid === 'status@broadcast') {
            await handleStatus(XeonBotInc, m);
        }
    });

    XeonBotInc.ev.on('status.update', async (status) => {
        await handleStatus(XeonBotInc, status);
    });

    XeonBotInc.ev.on('messages.reaction', async (status) => {
        await handleStatus(XeonBotInc, status);
    });

    return XeonBotInc
    } catch (error) {
        console.error('Error in startXeonBotInc:', error)
        await delay(5000)
        startXeonBotInc()
    }
}


// Start the bot with error handling
// Auto load paired bots
async function loadPairedBots() {
    const pairDir = './pair_sessions'
    if (!fs.existsSync(pairDir)) return
    if (!global.pairBots) global.pairBots = new Map()
    
    const folders = fs.readdirSync(pairDir)
    for (const number of folders) {
        try {
            const { state, saveCreds } = await useMultiFileAuthState(`${pairDir}/${number}`)
            if (!state.creds.registered) continue
            
            const { version } = await fetchLatestBaileysVersion()
            const pairSock = makeWASocket({
                version,
                logger: pino({ level: 'silent' }),
                browser: ["Ubuntu", "Chrome", "20.0.04"],
                auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({level:'fatal'})) }
            })
            
          pairSock.ev.on('creds.update', saveCreds)
attachConsoleLogger(pairSock, `PAIR-${number}`)
            attachCreact(pairSock)   
            pairSock.ev.on('messages.upsert', async ({messages}) => { for(const m of messages) await saveStatusToDisk(pairSock, m) });
            
          if (!global.pairContacts.has(number)) global.pairContacts.set(number, {})
            
            
pairSock.ev.on('contacts.update', update => {
    const contacts = global.pairContacts.get(number) || {}
    for (const contact of update) {
        const id = contact.id
        if (id && id.endsWith('@s.whatsapp.net')) {
            contacts[id] = contact.notify || contact.name || id.split('@')[0]
        }
    }
    global.pairContacts.set(number, contacts)
})
// === END ===
            
           pairSock.ev.on('connection.update', ({connection}) => {
    if (connection === 'open') {
        console.log(chalk.green(`[PAIR ${number}] Auto-connected!`))
        const main = require('./main')
                csong.init(pairSock);
        pairSock.ev.on('messages.upsert', u => main.handleMessages(pairSock, u, true))
        
     
        
        setTimeout(async () => {


                    // Pair bot welcome
                 
    try {
        const botJid = number + '@s.whatsapp.net'
        const imagePath = path.join(__dirname, 'assets/con.jpg')
        const timeNow = new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo', hour12: true })
       const caption = `╔═══❖•ೋ° 🦋 °ೋ•❖═══╗
   ✦ 𝗔𝗩𝗜𝗜 𝗕𝗢𝗬 𝗠𝗗 ✦
╚═══❖•ೋ° 🦋 °ೋ•❖═══╝

˚₊· ͟͟͞͞➳❥ Connected Successfully ❥

┏━━━━━━━━━━━━━━━━━━┓
┃ 🟢 › Status : Online
┃ ⏰ › Time   : ${timeNow}
┃ 📱 › Number : ${number}
┃ 👑 › Owner  : AVII BOY
┃ ⚡ › Mode   : Public
┃ 💜 › Ver    : MD Pro
┗━━━━━━━━━━━━━━━━━━┛

✧･ﾟ: *✧･ﾟ:* 🔥 *:･ﾟ✧*:･ﾟ✧`
        if (existsSync(imagePath)) {
            await pairSock.sendMessage(botJid, {
                image: fs.readFileSync(imagePath),
                caption
            })
        } else {
            await pairSock.sendMessage(botJid, { text: caption })
        }
        console.log(chalk.green('✓ Pair welcome sent!'))
    } catch (e) {
        console.log('Pair welcome skip:', e.message)
    }
}, 5000)
                }
            })
            global.pairBots.set(number, pairSock)
        } catch (e) {}
    }
}


// Start the bot
startXeonBotInc().then(() => {
    setTimeout(loadPairedBots, 5000)
}).catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
})
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err)
})

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err)
})

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Update ${__filename}`))
    delete require.cache[file]
    require(file)
})