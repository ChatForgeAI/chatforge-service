const createTelegramClient = require('./telegram_client.js');
const ChannelSession = require('../../models/channel_session_model.js');
const { logIInfo } = require('../../middlewere/logger.js');


async function initClients() {
    logIInfo('🔃🔃 Start setup clients\n\n');

    // get all sessions
    const sessions = await ChannelSession.find();
    console.log(sessions);


    const initializationPromises = sessions.map(async (session) => {
        if (session.telegramBotToken && session.telegramBotToken.length > 0) {
            await createTelegramClient(session);
        }
    });

    await Promise.all(initializationPromises);
}

module.exports = { initClients };
