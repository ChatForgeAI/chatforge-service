const { createSession, clientsList } = require('./whatsapp_client.js');
const AppDataSource = require('../../config/data-source');
const ChannelSession = require('../../entities/channel_session.entity');
const { logIInfo } = require('../../middlewere/logger.js');

const sessionRepo = () => AppDataSource.getRepository(ChannelSession);

async function initClients() {
  logIInfo('Start setup clients\n\n');

  const sessions = await sessionRepo().find();
  console.log(sessions);

  const initializationPromises = sessions.map(async (session) => {
    if (session.whatsappSessionStatus === 'ready' || session.whatsappSessionStatus === 'authenticated') {
      await createSession(session);
    }
  });

  await Promise.all(initializationPromises);
}

module.exports = { initClients, clientsList };
