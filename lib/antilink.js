const { isJidGroup } = require('@whiskeysockets/baileys');
const isAdmin = require('./isAdmin');
const { isSudo } = require('./index');
const config = require('../config');
const botData = require('./botData');

const WARN_COUNT = config.WARN_COUNT || 3;

function containsURL(str) {
    const urlRegex = /(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/[^\s]*)?/i;
    return urlRegex.test(str);
}

// Bot එකට අදාල antilink config ගන්න
function getAntilink(sock, jid) {
    const allData = botData.read(sock, 'antilink', {});
    return allData[jid] || null;
}

function incrementWarningCount(sock, jid, sender) {
    const warnings = botData.read(sock, 'antilink_warns', {});
    if (!warnings[jid]) warnings[jid] = {};
    if (!warnings[jid][sender]) warnings[jid][sender] = 0;
    warnings[jid][sender] += 1;
    botData.write(sock, 'antilink_warns', warnings);
    return warnings[jid][sender];
}

function resetWarningCount(sock, jid, sender) {
    const warnings = botData.read(sock, 'antilink_warns', {});
    if (warnings[jid]) delete warnings[jid][sender];
    botData.write(sock, 'antilink_warns', warnings);
}

async function Antilink(msg, sock) {
    const jid = msg.key.remoteJid;
    if (!isJidGroup(jid)) return;

    const SenderMessage = msg.message?.conversation ||
                         msg.message?.extendedTextMessage?.text || '';
    if (!SenderMessage || typeof SenderMessage!== 'string') return;

    const sender = msg.key.participant;
    if (!sender) return;

    // Skip if sender is group admin or sudo
    try {
        const { isSenderAdmin } = await isAdmin(sock, jid, sender);
        if (isSenderAdmin) return;
    } catch (_) {}
    const senderIsSudo = await isSudo(sender);
    if (senderIsSudo) return;

    if (!containsURL(SenderMessage.trim())) return;

    const antilinkConfig = getAntilink(sock, jid);
    if (!antilinkConfig) return;

    const action = antilinkConfig.action;

    try {
        // Delete message first
        await sock.sendMessage(jid, { delete: msg.key });

        switch (action) {
            case 'delete':
                await sock.sendMessage(jid, {
                    text: `\`\`\`@${sender.split('@')[0]} link are not allowed here\`\`\``,
                    mentions: [sender]
                });
                break;

            case 'kick':
                await sock.groupParticipantsUpdate(jid, [sender], 'remove');
                await sock.sendMessage(jid, {
                    text: `\`\`\`@${sender.split('@')[0]} has been kicked for sending links\`\`\``,
                    mentions: [sender]
                });
                break;

            case 'warn':
                const warningCount = incrementWarningCount(sock, jid, sender);
                if (warningCount >= WARN_COUNT) {
                    await sock.groupParticipantsUpdate(jid, [sender], 'remove');
                    resetWarningCount(sock, jid, sender);
                    await sock.sendMessage(jid, {
                        text: `\`\`\`@${sender.split('@')[0]} has been kicked after ${WARN_COUNT} warnings\`\`\``,
                        mentions: [sender]
                    });
                } else {
                    await sock.sendMessage(jid, {
                        text: `\`\`\`@${sender.split('@')[0]} warning ${warningCount}/${WARN_COUNT} for sending links\`\`\``,
                        mentions: [sender]
                    });
                }
                break;
        }
    } catch (error) {
        console.error('Error in Antilink:', error);
    }
}

module.exports = { Antilink };