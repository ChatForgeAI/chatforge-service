const { createSession, clientsList } = require('./whatsapp_client.js');
const WhatsAppSession = require('../../models/channel_session_model.js');
const { logIInfo } = require('../../middlewere/logger.js');


async function initClients() {
    logIInfo('🔃🔃 Start setup clients\n\n');

    // get all sessions
    const sessions = await WhatsAppSession.find();
    console.log(sessions);


    const initializationPromises = sessions.map(async (session) => {
        if (session.whatsappSessionStatus === "ready" || session.whatsappSessionStatus === "authenticated") {
            // create session
            await createSession(session);
        }
    });

    await Promise.all(initializationPromises);
}

module.exports = { initClients, clientsList };
