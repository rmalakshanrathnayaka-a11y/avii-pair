const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const http = require('http');
const fs = require('fs');
const QRCode = require('qrcode');
const pino = require('pino');
const axios = require('axios');
const moment = require('moment-timezone');
const url = require('url');

const PORT = process.env.PORT || 20169;
const logger = pino({ level: 'silent' });

const bots = new Map();
const qrStore = new Map();
const DATA_DIR = './data';
const SESS_DIR = './sessions';

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(SESS_DIR)) fs.mkdirSync(SESS_DIR);

function getSettings(number) {
  const path = `${DATA_DIR}/${number}.json`;
  if (fs.existsSync(path)) return JSON.parse(fs.readFileSync(path));
  return {
    autoStatusSeen: true,
    autoStatusReact: true,
    antiLink: true,
    antiBadword: false,
    publicMode: true,
    autoReplies: []
  };
}

function saveSettings(number, data) {
  fs.writeFileSync(`${DATA_DIR}/${number}.json`, JSON.stringify(data, null, 2));
}

async function startBot(number) {
  if (bots.has(number)) return;
  
  const dir = `${SESS_DIR}/${number}`;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  const { state, saveCreds } = await useMultiFileAuthState(dir);
  const { version } = await fetchLatestBaileysVersion();
  
  const sock = makeWASocket({
    version, logger,
    printQRInTerminal: false,
    browser: ['AVII-BOT', 'Chrome', '1.0'],
    auth: state,
    keepAliveIntervalMs: 30000
  });
  
  bots.set(number, sock);
  sock.ev.on('creds.update', saveCreds);
  
  sock.ev.on('connection.update', async (u) => {
    const { connection, lastDisconnect, qr } = u;
    if (qr) {
      qrStore.set(number, await QRCode.toDataURL(qr));
    }
    if (connection === 'open') {
      console.log(`✅ CONNECTED: ${number}`);
      qrStore.delete(number);
      // ensure settings file
      if (!fs.existsSync(`${DATA_DIR}/${number}.json`)) saveSettings(number, getSettings(number));
    }
    if (connection === 'close') {
      bots.delete(number);
      qrStore.delete(number);
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) setTimeout(() => startBot(number), 5000);
    }
  });
  
  sock.ev.on('messages.upsert', async ({ messages }) => {
    try {
      const m = messages[0];
      if (!m.message) return;
      
      const from = m.key.remoteJid;
      const isGroup = from.endsWith('@g.us');
      const isStatus = from === 'status@broadcast';
      const settings = getSettings(number);
      const sender = m.key.participant || from;
      
      // AUTO STATUS
      if (isStatus && settings.autoStatusSeen) {
        await sock.readMessages([m.key]);
        if (settings.autoStatusReact && !m.key.fromMe) {
          const emojis = ['❤️','🔥','😍','💯','👍','✨','🥰','😎'];
          await sock.sendMessage(from, { react: { text: emojis[Math.floor(Math.random()*8)], key: m.key } });
        }
        return;
      }
      
      if (m.key.fromMe) return;
      
      const body = m.message.conversation || m.message.extendedTextMessage?.text || '';
      
      // ANTI-LINK
      if (isGroup && settings.antiLink && /chat\.whatsapp\.com/i.test(body)) {
        try {
          const meta = await sock.groupMetadata(from);
          const isAdmin = meta.participants.find(p => p.id === sender)?.admin;
          if (!isAdmin) {
            await sock.sendMessage(from, { delete: m.key });
            await sock.sendMessage(from, { text: `⚠️ Link not allowed!`, mentions: [sender] });
          }
        } catch {}
        return;
      }
      
      // AUTO REPLIES
      for (const rep of settings.autoReplies) {
        if (body.toLowerCase().includes(rep.trigger.toLowerCase())) {
          await sock.sendMessage(from, { text: rep.response }, { quoted: m });
          return;
        }
      }
      
      if (!body.startsWith('.')) return;
      if (!settings.publicMode && !sender.includes(number)) return;
      
      const cmd = body.slice(1).split(' ')[0].toLowerCase();
      const args = body.slice(body.indexOf(' ')+1);
      
      if (cmd === 'ping') {
        await sock.sendMessage(from, { text: `🏓 Pong! ${Date.now()%1000}ms` }, { quoted: m });
      }
      else if (cmd === 'alive') {
        await sock.sendMessage(from, { text: `✅ AVII BOY MD\n🟢 Online\n📱 ${number}\n⏰ ${moment().tz('Asia/Colombo').format('HH:mm')}` }, { quoted: m });
      }
      else if (cmd === 'menu') {
        await sock.sendMessage(from, { text: `*AVII MENU*\n.ping\n.alive\n.menu` }, { quoted: m });
      }
    } catch(e) {}
  });
  
  return sock;
}

// WEB SERVER
const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const path = parsed.pathname;
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
  
  // API
  if (path === '/api/login' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const { number, password } = JSON.parse(body);
      const master = JSON.parse(fs.readFileSync(`${DATA_DIR}/master.json`));
      if (password === master.password) {
        res.writeHead(200, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ ok: true, settings: getSettings(number) }));
      } else {
        res.writeHead(401); res.end('{"ok":false}');
      }
    });
    return;
  }
  
  if (path === '/api/save' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const { number, password, settings } = JSON.parse(body);
      const master = JSON.parse(fs.readFileSync(`${DATA_DIR}/master.json`));
      if (password === master.password) {
        saveSettings(number, settings);
        res.writeHead(200); res.end('{"ok":true}');
      } else {
        res.writeHead(401); res.end();
      }
    });
    return;
  }
  
  if (path === '/start') {
    const n = parsed.query.n;
    if (n) startBot(n);
    res.end('ok'); return;
  }
  
  if (path === '/qr') {
    const n = parsed.query.n;
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end(JSON.stringify({ qr: qrStore.get(n) || null, ok: bots.has(n) && !qrStore.has(n) }));
    return;
  }
  
  // MAIN PAGE
  if (path === '/') {
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.end(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AVII BOY MD - Dashboard</title>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:'Outfit',sans-serif}
body{background:#050507;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;position:relative;overflow-x:hidden}
body::before{content:'';position:fixed;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle at 20% 30%,rgba(255,0,85,0.15),transparent 40%),radial-gradient(circle at 80% 70%,rgba(138,43,226,0.15),transparent 40%);animation:float 20s infinite linear;z-index:0}
@keyframes float{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
.container{position:relative;z-index:1;width:100%;max-width:480px}
.card{background:rgba(15,15,20,0.8);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.1);border-radius:28px;padding:32px;box-shadow:0 20px 60px rgba(0,0,0,0.5)}
.header{text-align:center;margin-bottom:28px}
.logo{font-size:32px;font-weight:700;background:linear-gradient(135deg,#ff0055,#8a2be2,#00d4ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:6px}
.tag{color:#888;font-size:13px}
.tabs{display:flex;gap:8px;background:rgba(0,0,0,0.4);padding:4px;border-radius:14px;margin-bottom:24px}
.tab{flex:1;padding:10px;text-align:center;border-radius:10px;cursor:pointer;font-size:14px;font-weight:500;color:#888;transition:all .3s}
.tab.active{background:linear-gradient(135deg,#ff0055,#8a2be2);color:#fff}
.panel{display:none}
.panel.active{display:block;animation:fade .3s}
@keyframes fade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.input{width:100%;padding:14px 16px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;color:#fff;font-size:15px;margin-bottom:12px;outline:none;transition:.3s}
.input:focus{border-color:#8a2be2;background:rgba(255,255,255,0.08)}
.btn{width:100%;padding:14px;background:linear-gradient(135deg,#ff0055,#8a2be2);border:none;border-radius:12px;color:#fff;font-weight:600;font-size:15px;cursor:pointer;transition:.3s;margin-top:8px}
.btn:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(255,0,85,0.3)}
.btn:disabled{opacity:.5;cursor:not-allowed}
.qrbox{width:240px;height:240px;margin:20px auto;background:#fff;border-radius:20px;padding:12px;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 40px rgba(0,0,0,0.3)}
.qrbox img{width:100%;border-radius:12px}
.status{padding:12px;border-radius:12px;text-align:center;font-size:14px;margin-top:16px}
.status.ok{background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.3);color:#00ff88}
.status.wait{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#aaa}
.setting{ display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.05)}
.setting:last-child{border:none}
.setting span{font-size:14px}
.switch{position:relative;width:48px;height:26px}
.switch input{opacity:0}
.slider{position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(255,255,255,0.1);border-radius:26px;transition:.3s;cursor:pointer}
.slider:before{content:'';position:absolute;height:20px;width:20px;left:3px;bottom:3px;background:#666;border-radius:50%;transition:.3s}
input:checked+.slider{background:linear-gradient(135deg,#ff0055,#8a2be2)}
input:checked+.slider:before{transform:translateX(22px);background:#fff}
.replies{max-height:280px;overflow-y:auto;margin-top:12px}
.reply-item{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:10px;margin-bottom:8px;display:flex;gap:8px}
.reply-item input{flex:1;padding:8px;background:transparent;border:none;color:#fff;font-size:13px;outline:none}
.reply-item button{background:rgba(255,0,85,0.2);border:none;color:#ff5588;width:28px;height:28px;border-radius:6px;cursor:pointer}
.add-btn{width:100%;padding:10px;background:rgba(255,255,255,0.05);border:1px dashed rgba(255,255,255,0.2);border-radius:10px;color:#aaa;font-size:13px;cursor:pointer;margin-top:8px}
.add-btn:hover{background:rgba(255,255,255,0.08)}
.footer{text-align:center;margin-top:20px;color:#555;font-size:12px}
</style>
</head>
<body>
<div class="container">
  <div class="card">
    <div class="header">
      <div class="logo">AVII BOY MD</div>
      <div class="tag">Premium WhatsApp Bot Dashboard</div>
    </div>
    
    <div class="tabs">
      <div class="tab active" onclick="switchTab(0)">Pair Bot</div>
      <div class="tab" onclick="switchTab(1)">Settings</div>
    </div>
    
    <!-- PAIR TAB -->
    <div class="panel active" id="p0">
      <input class="input" id="num1" placeholder="Enter WhatsApp Number (947XXXXXXXX)" maxlength="12">
      <button class="btn" onclick="pair()">Generate QR Code</button>
      <div id="out1"></div>
    </div>
    
    <!-- SETTINGS TAB -->
    <div class="panel" id="p1">
      <input class="input" id="num2" placeholder="Your Bot Number">
      <input class="input" id="pw" type="password" placeholder="Password">
      <button class="btn" onclick="login()">Unlock Settings</button>
      <div id="settings" style="display:none;margin-top:20px">
        <div class="setting"><span>👁️ Auto Status Seen</span><label class="switch"><input type="checkbox" id="s1"><span class="slider"></span></label></div>
        <div class="setting"><span>❤️ Auto Status React</span><label class="switch"><input type="checkbox" id="s2"><span class="slider"></span></label></div>
        <div class="setting"><span>🚫 Anti-Link</span><label class="switch"><input type="checkbox" id="s3"><span class="slider"></span></label></div>
        <div class="setting"><span>🤬 Anti-Badword</span><label class="switch"><input type="checkbox" id="s4"><span class="slider"></span></label></div>
        <div class="setting"><span>🌍 Public Mode</span><label class="switch"><input type="checkbox" id="s5"><span class="slider"></span></label></div>
        
        <div style="margin-top:20px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <span style="font-weight:600;font-size:14px">Auto Replies (Max 10)</span>
          </div>
          <div class="replies" id="replies"></div>
          <button class="add-btn" onclick="addReply()">+ Add Reply</button>
        </div>
        
        <button class="btn" onclick="save()" style="margin-top:20px">💾 Save Settings</button>
        <div id="saveMsg"></div>
      </div>
    </div>
  </div>
  <div class="footer">© 2024 AVII BOY MD • Made with ❤️</div>
</div>

<script>
let tmr, currentNum='', currentPw='';
function switchTab(i){
  document.querySelectorAll('.tab').forEach((t,idx)=>t.classList.toggle('active',idx===i));
  document.querySelectorAll('.panel').forEach((p,idx)=>p.classList.toggle('active',idx===i));
}
async function pair(){
  const n=document.getElementById('num1').value.replace(/\D/g,'');
  if(n.length<10)return alert('Valid number');
  document.getElementById('out1').innerHTML='<div class="status wait">Generating...</div>';
  await fetch('/start?n='+n);
  if(tmr)clearInterval(tmr);
  tmr=setInterval(()=>check(n),2000);
}
async function check(n){
  const r=await fetch('/qr?n='+n); const d=await r.json();
  const o=document.getElementById('out1');
  if(d.qr) o.innerHTML='<div class="qrbox"><img src="'+d.qr+'"></div><div class="status wait">Scan with WhatsApp</div>';
  else if(d.ok){o.innerHTML='<div class="status ok">✅ Bot Connected Successfully!</div>';clearInterval(tmr)}
}
async function login(){
  currentNum=document.getElementById('num2').value.replace(/\D/g,'');
  currentPw=document.getElementById('pw').value;
  const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({number:currentNum,password:currentPw})});
  if(!r.ok)return alert('Wrong password');
  const d=await r.json();
  document.getElementById('settings').style.display='block';
  document.getElementById('s1').checked=d.settings.autoStatusSeen;
  document.getElementById('s2').checked=d.settings.autoStatusReact;
  document.getElementById('s3').checked=d.settings.antiLink;
  document.getElementById('s4').checked=d.settings.antiBadword;
  document.getElementById('s5').checked=d.settings.publicMode;
  loadReplies(d.settings.autoReplies||[]);
}
function loadReplies(list){
  const c=document.getElementById('replies'); c.innerHTML='';
  list.forEach((r,i)=>addReply(r.trigger,r.response));
  if(list.length===0)addReply();
}
function addReply(t='',r=''){
  if(document.querySelectorAll('.reply-item').length>=10)return;
  const d=document.createElement('div'); d.className='reply-item';
  d.innerHTML='<input placeholder="Trigger word" value="'+t+'"><input placeholder="Reply text" value="'+r+'"><button onclick="this.parentElement.remove()">×</button>';
  document.getElementById('replies').appendChild(d);
}
async function save(){
  const replies=[...document.querySelectorAll('.reply-item')].map(e=>({trigger:e.children[0].value,response:e.children[1].value})).filter(x=>x.trigger);
  const settings={
    autoStatusSeen:document.getElementById('s1').checked,
    autoStatusReact:document.getElementById('s2').checked,
    antiLink:document.getElementById('s3').checked,
    antiBadword:document.getElementById('s4').checked,
    publicMode:document.getElementById('s5').checked,
    autoReplies:replies
  };
  const r=await fetch('/api/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({number:currentNum,password:currentPw,settings})});
  document.getElementById('saveMsg').innerHTML=r.ok?'<div class="status ok" style="margin-top:12px">✅ Saved! Restart bot to apply</div>':'<div class="status wait">Error</div>';
}
</script>
</body>
</html>`);
    return;
  }
  
  res.writeHead(404); res.end();
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✨ AVII DASHBOARD v4 - Running on port ${PORT}\n`);
  console.log(`Default Password: avii123\n`);
});
