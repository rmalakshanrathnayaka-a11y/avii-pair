const botData = require('../lib/botData');

// Bot එකට අදාල antibadword config ගන්න
function getAntiBadword(sock, chatId) {
    const allData = botData.read(sock, 'antibadword', {});
    return allData[chatId] || null;
}

// Config save කරනවා
function setAntiBadword(sock, chatId, action) {
    const allData = botData.read(sock, 'antibadword', {});
    allData[chatId] = { enabled: true, action: action };
    botData.write(sock, 'antibadword', allData);
}

// Config delete කරනවා
function removeAntiBadword(sock, chatId) {
    const allData = botData.read(sock, 'antibadword', {});
    delete allData[chatId];
    botData.write(sock, 'antibadword', allData);
}

// Warning count
function incrementWarningCount(sock, chatId, senderId) {
    const warnings = botData.read(sock, 'warnings', {});
    if (!warnings[chatId]) warnings[chatId] = {};
    if (!warnings[chatId][senderId]) warnings[chatId][senderId] = 0;
    warnings[chatId][senderId] += 1;
    botData.write(sock, 'warnings', warnings);
    return warnings[chatId][senderId];
}

function resetWarningCount(sock, chatId, senderId) {
    const warnings = botData.read(sock, 'warnings', {});
    if (warnings[chatId]) delete warnings[chatId][senderId];
    botData.write(sock, 'warnings', warnings);
}

async function handleAntiBadwordCommand(sock, chatId, message, match) {
    if (!match) {
        return sock.sendMessage(chatId, {
            text: `*ANTIBADWORD SETUP*\n\n*.antibadword on*\nTurn on antibadword\n\n*.antibadword set <action>*\nSet action: delete/kick/warn\n\n*.antibadword off*\nDisables antibadword in this group`
        }, { quoted: message });
    }

    if (match === 'on') {
        const existingConfig = getAntiBadword(sock, chatId);
        if (existingConfig?.enabled) {
            return sock.sendMessage(chatId, { text: '*AntiBadword is already enabled for this group*' });
        }
        setAntiBadword(sock, chatId, 'delete');
        return sock.sendMessage(chatId, { text: '*AntiBadword has been enabled. Use.antibadword set <action> to customize action*' }, { quoted: message });
    }

    if (match === 'off') {
        const config = getAntiBadword(sock, chatId);
        if (!config?.enabled) {
            return sock.sendMessage(chatId, { text: '*AntiBadword is already disabled for this group*' }, { quoted: message });
        }
        removeAntiBadword(sock, chatId);
        return sock.sendMessage(chatId, { text: '*AntiBadword has been disabled for this group*' }, { quoted: message });
    }

    if (match.startsWith('set')) {
        const action = match.split(' ')[1];
        if (!action ||!['delete', 'kick', 'warn'].includes(action)) {
            return sock.sendMessage(chatId, { text: '*Invalid action. Choose: delete, kick, or warn*' }, { quoted: message });
        }
        setAntiBadword(sock, chatId, action);
        return sock.sendMessage(chatId, { text: `*AntiBadword action set to: ${action}*` }, { quoted: message });
    }

    return sock.sendMessage(chatId, { text: '*Invalid command. Use.antibadword to see usage*' }, { quoted: message });
}

async function handleBadwordDetection(sock, chatId, message, userMessage, senderId) {
    const config = getAntiBadword(sock, chatId);
    if (!config?.enabled) return;

    // Skip if not group
    if (!chatId.endsWith('@g.us')) return;

    // Skip if message is from bot
    if (message.key.fromMe) return;

    // Convert message to lowercase and clean it
    const cleanMessage = userMessage.toLowerCase()
       .replace(/[^\w\s]/g, ' ')
       .replace(/\s+/g, ' ')
       .trim();

    // List of bad words (උඹේ list එක එහෙමම තියෙනවා)
    const badWords = [
        'gandu', 'madarchod', 'bhosdike', 'bsdk', 'fucker', 'bhosda',
        'lauda', 'laude', 'betichod', 'chutiya', 'maa ki chut', 'behenchod',
        'behen ki chut', 'tatto ke saudagar', 'machar ki jhant', 'jhant ka baal',
        'randi', 'chuchi', 'boobs', 'boobies', 'tits', 'idiot', 'nigga', 'fuck',
        'dick', 'bitch', 'bastard', 'asshole', 'asu', 'awyu', 'teri ma ki chut',
        'teri maa ki', 'lund', 'lund ke baal', 'mc', 'lodu', 'benchod',
        'shit', 'damn', 'hell', 'piss', 'crap', 'slut', 'whore', 'prick',
        'motherfucker', 'cock', 'cunt', 'pussy', 'twat', 'wanker', 'douchebag', 'jackass',
        'moron', 'retard', 'scumbag', 'skank', 'slutty', 'arse', 'bugger', 'sod off',
        'chut', 'laude ka baal', 'madar', 'behen ke lode', 'chodne', 'sala kutta',
        'harami', 'randi ki aulad', 'gaand mara', 'chodu', 'lund le', 'gandu saala',
        'kameena', 'haramzada', 'chamiya', 'chodne wala', 'chudai', 'chutiye ke baap',
        'fck', 'fckr', 'fcker', 'fuk', 'fukk', 'fcuk', 'btch', 'bch', 'f*ck','assclown',
        'a**hole', 'f@ck', 'b!tch', 'd!ck', 'n!gga', 'f***er', 's***head', 'a$$', 'l0du', 'lund69',
        'spic', 'chink', 'cracker', 'towelhead', 'gook', 'kike', 'paki', 'honky',
        'wetback', 'raghead', 'jungle bunny', 'sand nigger', 'beaner',
        'blowjob', 'handjob', 'cum', 'cumshot', 'jizz', 'deepthroat', 'fap',
        'hentai', 'MILF', 'anal', 'orgasm', 'dildo', 'vibrator', 'gangbang',
        'threesome', 'porn', 'sex', 'xxx',
        'fag', 'faggot', 'dyke', 'tranny', 'homo', 'sissy', 'fairy', 'lesbo',
        'weed', 'pot', 'coke', 'heroin', 'meth', 'crack', 'dope', 'bong', 'kush',
        'hash', 'trip', 'rolling'
    ];

    const messageWords = cleanMessage.split(' ');
    let containsBadWord = false;

    for (const word of messageWords) {
        if (word.length < 2) continue;
        if (badWords.includes(word)) {
            containsBadWord = true;
            break;
        }
        for (const badWord of badWords) {
            if (badWord.includes(' ')) {
                if (cleanMessage.includes(badWord)) {
                    containsBadWord = true;
                    break;
                }
            }
        }
        if (containsBadWord) break;
    }

    if (!containsBadWord) return;

    // Check if bot is admin
    const groupMetadata = await sock.groupMetadata(chatId);
    const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    const bot = groupMetadata.participants.find(p => p.id === botId);
    if (!bot?.admin) return;

    // Check if sender is admin
    const participant = groupMetadata.participants.find(p => p.id === senderId);
    if (participant?.admin) return;

    // Delete message
    try {
        await sock.sendMessage(chatId, { delete: message.key });
    } catch (err) {
        console.error('Error deleting message:', err);
        return;
    }

    // Take action based on config
    switch (config.action) {
        case 'delete':
            await sock.sendMessage(chatId, {
                text: `*@${senderId.split('@')[0]} bad words are not allowed here*`,
                mentions: [senderId]
            });
            break;

        case 'kick':
            try {
                await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                await sock.sendMessage(chatId, {
                    text: `*@${senderId.split('@')[0]} has been kicked for using bad words*`,
                    mentions: [senderId]
                });
            } catch (error) {
                console.error('Error kicking user:', error);
            }
            break;

        case 'warn':
            const warningCount = incrementWarningCount(sock, chatId, senderId);
            if (warningCount >= 3) {
                try {
                    await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                    resetWarningCount(sock, chatId, senderId);
                    await sock.sendMessage(chatId, {
                        text: `*@${senderId.split('@')[0]} has been kicked after 3 warnings*`,
                        mentions: [senderId]
                    });
                } catch (error) {
                    console.error('Error kicking user after warnings:', error);
                }
            } else {
                await sock.sendMessage(chatId, {
                    text: `*@${senderId.split('@')[0]} warning ${warningCount}/3 for using bad words*`,
                    mentions: [senderId]
                });
            }
            break;
    }
}

module.exports = {
    handleAntiBadwordCommand,
    handleBadwordDetection
};