const { createTelegramClient } = require('./telegram_client.js');
const AppDataSource = require('../../config/data-source');
const ChannelSession = require('../../entities/channel_session.entity');
const { logIInfo } = require('../../middlewere/logger.js');

const sessionRepo = () => AppDataSource.getRepository(ChannelSession);

async function initClients() {
  logIInfo('Start setup Telegram clients\n\n');

  const sessions = await sessionRepo().createQueryBuilder('session')
    .where('session.telegramBotToken IS NOT NULL')
    .getMany();
  console.log(`Found ${sessions.length} Telegram sessions`);

  const initializationPromises = sessions.map(async (session) => {
    if (session.telegramBotStatus === 'ready') {
      await createTelegramClient(session);
    }
  });

  await Promise.all(initializationPromises);
}

module.exports = { initClients };
