const botData = require('./botData');

// List of emojis for command reactions
const commandEmojis = ['⏳'];

function getRandomEmoji() {
    return commandEmojis[0];
}

// Function to add reaction to a command message
async function addCommandReaction(sock, message) {
    try {
        // Bot එකට අදාල state එක කියවනවා
        const isAutoReactionEnabled = botData.read(sock, 'autoreact', { enabled: false }).enabled;

        if (!isAutoReactionEnabled ||!message?.key?.id) return;

        const emoji = getRandomEmoji();
        await sock.sendMessage(message.key.remoteJid, {
            react: {
                text: emoji,
                key: message.key
            }
        });
    } catch (error) {
        console.error('Error adding command reaction:', error);
    }
}

// Function to handle areact command
async function handleAreactCommand(sock, chatId, message, isOwner) {
    try {
        if (!isOwner) {
            await sock.sendMessage(chatId, {
                text: '❌ This command is only available for the owner!',
                quoted: message
            });
            return;
        }

        const args = message.message?.conversation?.split(' ') ||
                     message.message?.extendedTextMessage?.text?.split(' ') || [];
        const action = args[1]?.toLowerCase();

        if (action === 'on') {
            botData.write(sock, 'autoreact', { enabled: true });
            await sock.sendMessage(chatId, {
                text: '✅ Auto-reactions have been enabled for this bot',
                quoted: message
            });
        } else if (action === 'off') {
            botData.write(sock, 'autoreact', { enabled: false });
            await sock.sendMessage(chatId, {
                text: '✅ Auto-reactions have been disabled for this bot',
                quoted: message
            });
        } else {
            const currentState = botData.read(sock, 'autoreact', { enabled: false }).enabled? 'enabled' : 'disabled';
            await sock.sendMessage(chatId, {
                text: `Auto-reactions are currently ${currentState} for this bot.\n\nUse:\n.areact on - Enable auto-reactions\n.areact off - Disable auto-reactions`,
                quoted: message
            });
        }
    } catch (error) {
        console.error('Error handling areact command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Error controlling auto-reactions',
            quoted: message
        });
    }
}

module.exports = {
    addCommandReaction,
    handleAreactCommand
};