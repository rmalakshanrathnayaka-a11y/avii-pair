/**
 * AVII BOY MD - A WhatsApp Bot
 * Copyright (c) 2024 AVII
 *
 * Bot Data Handler - Per Bot Settings
 */
const botData = require('./botData');

// ✨ AVII BOY MD Stylish Defaults
const DEFAULT_WELCOME = `╔═══✨ AVII BOY MD ✨═══╗
║ 🎉 WELCOME {user}
║ 🏰 Group: {group}
╠═══════════════════╣
║ 📜 {description}
╚═══ Powered by AVII ═══╝`;

const DEFAULT_GOODBYE = `╔═══💔 AVII BOY MD 💔═══╗
║ 👋 GOODBYE {user}
║ 🏰 Group: {group}
╠═══════════════════╣
║ We'll miss you!
╚═══ Powered by AVII ═══╝`;

// ========== ANTILINK ==========
async function setAntilink(sock, groupId, type, action) {
    try {
        const data = botData.read(sock, 'antilink', {});
        data[groupId] = { enabled: type === 'on', action: action || 'delete' };
        botData.write(sock, 'antilink', data);
        return true;
    } catch (error) {
        console.error('Error setting antilink:', error);
        return false;
    }
}

async function getAntilink(sock, groupId, type) {
    try {
        const data = botData.read(sock, 'antilink', {});
        return data[groupId] && type === 'on'? data[groupId] : null;
    } catch (error) {
        return null;
    }
}

async function removeAntilink(sock, groupId) {
    try {
        const data = botData.read(sock, 'antilink', {});
        delete data[groupId];
        botData.write(sock, 'antilink', data);
        return true;
    } catch (error) {
        return false;
    }
}

// ========== ANTITAG ==========
async function setAntitag(sock, groupId, type, action) {
    try {
        const data = botData.read(sock, 'antitag', {});
        data[groupId] = { enabled: type === 'on', action: action || 'delete' };
        botData.write(sock, 'antitag', data);
        return true;
    } catch (error) { return false; }
}

async function getAntitag(sock, groupId, type) {
    try {
        const data = botData.read(sock, 'antitag', {});
        return data[groupId] && type === 'on'? data[groupId] : null;
    } catch (error) { return null; }
}

async function removeAntitag(sock, groupId) {
    try {
        const data = botData.read(sock, 'antitag', {});
        delete data[groupId];
        botData.write(sock, 'antitag', data);
        return true;
    } catch (error) { return false; }
}

// ========== WARNINGS ==========
async function incrementWarningCount(sock, groupId, userId) {
    try {
        const data = botData.read(sock, 'warnings', {});
        if (!data[groupId]) data[groupId] = {};
        if (!data[groupId][userId]) data[groupId][userId] = 0;
        data[groupId][userId]++;
        botData.write(sock, 'warnings', data);
        return data[groupId][userId];
    } catch (error) { return 0; }
}

async function resetWarningCount(sock, groupId, userId) {
    try {
        const data = botData.read(sock, 'warnings', {});
        if (data[groupId]) data[groupId][userId] = 0;
        botData.write(sock, 'warnings', data);
        return true;
    } catch (error) { return false; }
}

// ========== SUDO ==========
async function isSudo(sock, userId) {
    try {
        const data = botData.read(sock, 'sudo', []);
        return data.includes(userId);
    } catch (error) { return false; }
}

async function addSudo(sock, userJid) {
    try {
        const data = botData.read(sock, 'sudo', []);
        if (!data.includes(userJid)) {
            data.push(userJid);
            botData.write(sock, 'sudo', data);
        }
        return true;
    } catch (error) { return false; }
}

async function removeSudo(sock, userJid) {
    try {
        let data = botData.read(sock, 'sudo', []);
        data = data.filter(id => id!== userJid);
        botData.write(sock, 'sudo', data);
        return true;
    } catch (error) { return false; }
}

async function getSudoList(sock) {
    try {
        return botData.read(sock, 'sudo', []);
    } catch (error) { return []; }
}

// ========== WELCOME ==========
async function addWelcome(sock, jid, enabled, message) {
    try {
        const data = botData.read(sock, 'welcome', {});
        data[jid] = {
            enabled,
            message: message || DEFAULT_WELCOME,
            channelId: '120363161685998@newsletter'
        };
        botData.write(sock, 'welcome', data);
        return true;
    } catch (error) { return false; }
}

async function delWelcome(sock, jid) {
    try {
        const data = botData.read(sock, 'welcome', {});
        delete data[jid];
        botData.write(sock, 'welcome', data);
        return true;
    } catch (error) { return false; }
}

async function isWelcomeOn(sock, jid) {
    try {
        const data = botData.read(sock, 'welcome', {});
        return data[jid]?.enabled || false;
    } catch (error) { return false; }
}

async function getWelcome(sock, jid) {
    try {
        const data = botData.read(sock, 'welcome', {});
        return data[jid]?.message || null;
    } catch (error) { return null; }
}

// ========== GOODBYE ==========
async function addGoodbye(sock, jid, enabled, message) {
    try {
        const data = botData.read(sock, 'goodbye', {});
        data[jid] = {
            enabled,
            message: message || DEFAULT_GOODBYE,
            channelId: '120363513685998@newsletter'
        };
        botData.write(sock, 'goodbye', data);
        return true;
    } catch (error) { return false; }
}

async function delGoodBye(sock, jid) {
    try {
        const data = botData.read(sock, 'goodbye', {});
        delete data[jid];
        botData.write(sock, 'goodbye', data);
        return true;
    } catch (error) { return false; }
}

async function isGoodByeOn(sock, jid) {
    try {
        const data = botData.read(sock, 'goodbye', {});
        return data[jid]?.enabled || false;
    } catch (error) { return false; }
}

async function getGoodbye(sock, jid) {
    try {
        const data = botData.read(sock, 'goodbye', {});
        return data[jid]?.message || null;
    } catch (error) { return null; }
}

// ========== ANTIBADWORD ==========
async function setAntiBadword(sock, groupId, type, action) {
    try {
        const data = botData.read(sock, 'antibadword', {});
        data[groupId] = { enabled: type === 'on', action: action || 'delete' };
        botData.write(sock, 'antibadword', data);
        return true;
    } catch (error) { return false; }
}

async function getAntiBadword(sock, groupId, type) {
    try {
        const data = botData.read(sock, 'antibadword', {});
        return data[groupId] && type === 'on'? data[groupId] : null;
    } catch (error) { return null; }
}

async function removeAntiBadword(sock, groupId) {
    try {
        const data = botData.read(sock, 'antibadword', {});
        delete data[groupId];
        botData.write(sock, 'antibadword', data);
        return true;
    } catch (error) { return false; }
}

// ========== CHATBOT ==========
async function setChatbot(sock, groupId, enabled) {
    try {
        const data = botData.read(sock, 'chatbot', {});
        data[groupId] = { enabled };
        botData.write(sock, 'chatbot', data);
        return true;
    } catch (error) { return false; }
}

async function getChatbot(sock, groupId) {
    try {
        const data = botData.read(sock, 'chatbot', {});
        return data[groupId] || null;
    } catch (error) { return null; }
}

async function removeChatbot(sock, groupId) {
    try {
        const data = botData.read(sock, 'chatbot', {});
        delete data[groupId];
        botData.write(sock, 'chatbot', data);
        return true;
    } catch (error) { return false; }
}

module.exports = {
    setAntilink,
    getAntilink,
    removeAntilink,
    setAntitag,
    getAntitag,
    removeAntitag,
    incrementWarningCount,
    resetWarningCount,
    isSudo,
    addSudo,
    removeSudo,
    getSudoList,
    addWelcome,
    delWelcome,
    isWelcomeOn,
    getWelcome,
    addGoodbye,
    delGoodBye,
    isGoodByeOn,
    getGoodbye,
    setAntiBadword,
    getAntiBadword,
    removeAntiBadword,
    setChatbot,
    getChatbot,
    removeChatbot,
};