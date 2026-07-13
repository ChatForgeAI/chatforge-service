const AppDataSource = require('./data-source');
const { initClients } = require('../services/whats_app_service/whatsapp_clients_manager');
const { initClients: telegramInitClients } = require('../services/telegram/telegram_clients_manager');

const dbConnection = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Database Connected: PostgreSQL');

    try {
      await initClients();
      console.log('WhatsApp clients initialized');
    } catch (e) {
      console.error('WhatsApp clients init error:', e.message);
    }

    try {
      await telegramInitClients();
      console.log('Telegram clients initialized');
    } catch (e) {
      console.error('Telegram clients init error:', e.message);
    }
  } catch (err) {
    console.error(`Database Error: ${err.message}`);
  }
};

module.exports = dbConnection;
