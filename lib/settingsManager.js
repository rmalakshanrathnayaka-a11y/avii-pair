const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../web_settings.json');

const getDB = () => {
    if (!fs.existsSync(dbPath)) return {};
    try { return JSON.parse(fs.readFileSync(dbPath, 'utf-8')); }
    catch { return {}; }
};

const saveDB = (data) => {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

// Bot number එකෙන් settings ගන්න
function getSettings(sock) {
    const number = sock.user?.id?.split(':')[0];
    const db = getDB();
    if (!db[number]) db[number] = { settings: {} };
    return db[number].settings;
}

// Bot number එකට settings save කරන්න
function updateSettings(sock, newData) {
    const number = sock.user?.id?.split(':')[0];
    const db = getDB();
    if (!db[number]) db[number] = { settings: {} };
    db[number].settings = {...db[number].settings,...newData };
    saveDB(db);
    return db[number].settings;
}

module.exports = { getSettings, updateSettings };