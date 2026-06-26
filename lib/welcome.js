const { delay } = require('@whiskeysockets/baileys');
const botData = require('../lib/botData');

// Welcome functions
function isWelcomeOn(sock, chatId) {
    const data = botData.read(sock, 'welcome', {});
    return!!data[chatId]?.enabled;
}

function addWelcome(sock, chatId, enabled, message) {
    const data = botData.read(sock, 'welcome', {});
    data[chatId] = { enabled, message };
    botData.write(sock, 'welcome', data);
}

function delWelcome(sock, chatId) {
    const data = botData.read(sock, 'welcome', {});
    delete data[chatId];
    botData.write(sock, 'welcome', data);
}

function getWelcome(sock, chatId) {
    const data = botData.read(sock, 'welcome', {});
    return data[chatId] || null;
}

// Goodbye functions
function isGoodByeOn(sock, chatId) {
    const data = botData.read(sock, 'goodbye', {});
    return!!data[chatId]?.enabled;
}

function addGoodbye(sock, chatId, enabled, message) {
    const data = botData.read(sock, 'goodbye', {});
    data[chatId] = { enabled, message };
    botData.write(sock, 'goodbye', data);
}

function delGoodBye(sock, chatId) {
    const data = botData.read(sock, 'goodbye', {});
    delete data[chatId];
    botData.write(sock, 'goodbye', data);
}

function getGoodbye(sock, chatId) {
    const data = botData.read(sock, 'goodbye', {});
    return data[chatId] || null;
}

async function handleWelcome(sock, chatId, message, match) {
    if (!match) {
        return sock.sendMessage(chatId, {
            text: `📥 *Welcome Message Setup*\n\n✅ *.welcome on* — Enable welcome messages\n🛠 *.welcome set Your custom message* — Set a custom welcome message\n🚫 *.welcome off* — Disable welcome messages\n\n*Available Variables:*\n• {user} - Mentions the new member\n• {group} - Shows group name\n• {description} - Shows group description`,
            quoted: message
        });
    }

    const [command,...args] = match.split(' ');
    const lowerCommand = command.toLowerCase();
    const customMessage = args.join(' ');

    if (lowerCommand === 'on') {
        if (isWelcomeOn(sock, chatId)) {
            return sock.sendMessage(chatId, { text: '⚠ Welcome messages are *already enabled*.', quoted: message });
        }
        addWelcome(sock, chatId, true, 'Welcome {user} to {group}! 🎉');
        return sock.sendMessage(chatId, { text: '✅ Welcome messages *enabled* with simple message. Use *.welcome set [your message]* to customize.', quoted: message });
    }

    if (lowerCommand === 'off') {
        if (!isWelcomeOn(sock, chatId)) {
            return sock.sendMessage(chatId, { text: '⚠ Welcome messages are *already disabled*.', quoted: message });
        }
        delWelcome(sock, chatId);
        return sock.sendMessage(chatId, { text: '✅ Welcome messages *disabled* for this group.', quoted: message });
    }

    if (lowerCommand === 'set') {
        if (!customMessage) {
            return sock.sendMessage(chatId, { text: '⚠ Please provide a custom welcome message. Example: *.welcome set Welcome to the group!*', quoted: message });
        }
        addWelcome(sock, chatId, true, customMessage);
        return sock.sendMessage(chatId, { text: '✅ Custom welcome message *set successfully*.', quoted: message });
    }

    return sock.sendMessage(chatId, {
        text: `❌ Invalid command. Use:\n*.welcome on* - Enable\n*.welcome set [message]* - Set custom message\n*.welcome off* - Disable`,
        quoted: message
    });
}

async function handleGoodbye(sock, chatId, message, match) {
    const lower = match?.toLowerCase();

    if (!match) {
        return sock.sendMessage(chatId, {
            text: `📤 *Goodbye Message Setup*\n\n✅ *.goodbye on* — Enable goodbye messages\n🛠 *.goodbye set Your custom message* — Set a custom goodbye message\n🚫 *.goodbye off* — Disable goodbye messages\n\n*Available Variables:*\n• {user} - Mentions the leaving member\n• {group} - Shows group name`,
            quoted: message
        });
    }

    if (lower === 'on') {
        if (isGoodByeOn(sock, chatId)) {
            return sock.sendMessage(chatId, { text: '⚠ Goodbye messages are *already enabled*.', quoted: message });
        }
        addGoodbye(sock, chatId, true, 'Goodbye {user} 👋');
        return sock.sendMessage(chatId, { text: '✅ Goodbye messages *enabled* with simple message. Use *.goodbye set [your message]* to customize.', quoted: message });
    }

    if (lower === 'off') {
        if (!isGoodByeOn(sock, chatId)) {
            return sock.sendMessage(chatId, { text: '⚠ Goodbye messages are *already disabled*.', quoted: message });
        }
        delGoodBye(sock, chatId);
        return sock.sendMessage(chatId, { text: '✅ Goodbye messages *disabled* for this group.', quoted: message });
    }

    if (lower.startsWith('set ')) {
        const customMessage = match.substring(4);
        if (!customMessage) {
            return sock.sendMessage(chatId, { text: '⚠ Please provide a custom goodbye message. Example: *.goodbye set Goodbye!*', quoted: message });
        }
        addGoodbye(sock, chatId, true, customMessage);
        return sock.sendMessage(chatId, { text: '✅ Custom goodbye message *set successfully*.', quoted: message });
    }

    return sock.sendMessage(chatId, {
        text: `❌ Invalid command. Use:\n*.goodbye on* - Enable\n*.goodbye set [message]* - Set custom message\n*.goodbye off* - Disable`,
        quoted: message
    });
}

module.exports = { handleWelcome, handleGoodbye, getWelcome, getGoodbye };