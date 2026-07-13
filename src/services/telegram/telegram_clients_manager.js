const { createTelegramClient } = require('./telegram_client.js');
const ChannelSession = require('../../models/channel_session_model.js');
const { logIInfo } = require('../../middlewere/logger.js');


async function initClients() {
    logIInfo('🔃🔃 Start setup Telegram clients\n\n');

    const sessions = await ChannelSession.find({ telegramBotToken: { $ne: null } });
    console.log(`Found ${sessions.length} Telegram sessions`);

    const initializationPromises = sessions.map(async (session) => {
        if (session.telegramBotStatus === "ready") {
            await createTelegramClient(session);
        }
    });

    await Promise.all(initializationPromises);
}

module.exports = { initClients };
