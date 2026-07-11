const TelegramBot = require('node-telegram-bot-api').default;

const createTelegramClient = (token) => {
    const bot = new TelegramBot(token, {
        polling: true
    });

    bot.on('message', (msg) => {
        console.log("New message:");
        console.log("From:", msg.from.username);
        console.log("Text:", msg.text);
    });

    return bot;
}

module.exports = createTelegramClient;
