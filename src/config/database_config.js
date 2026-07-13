const mongoose = require('mongoose');
const { initClients } = require("../services/whats_app_service/whatsapp_clients_manager");
const { initClients: telegramInitClients } = require("../services/telegram/telegram_clients_manager");

const dbConnection = () => {
    const databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chatforge';

    console.log("DB URI: ", databaseUri)
    mongoose
        .connect(databaseUri)
        .then(async (conn) => {
            console.log(`Database Connected: ${conn.connection.host}`);

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
        })
        .catch((err) => {
            console.error(`Database Error: ${err.message}`);
        });
};

module.exports = dbConnection;
