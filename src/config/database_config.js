const mongoose = require('mongoose');
const { initClients } = require("../services/whats_app_service/whatsapp_clients_manager");
const { initClients: telegramInitClients } = require("../services/telegram/telegram_clients_manager");

const dbConnection = () => {
    const databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chatforge';

    console.log("DB URI: ", databaseUri)
    mongoose
        .connect(databaseUri)
        .then((conn) => {
            console.log(`Database Connected: ${conn.connection.host}`);
            initClients().then(r => console.log(""))
            telegramInitClients().then(r => console.log(""))
        })
        .catch((err) => {
            console.error(`Database Error: ${err.message}`);
        });
};

module.exports = dbConnection;
