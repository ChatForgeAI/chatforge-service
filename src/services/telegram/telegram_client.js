const TelegramBot = require('node-telegram-bot-api').default;
const AppDataSource = require('../../config/data-source');
const ChannelSession = require('../../entities/channel_session.entity');
const Message = require('../../entities/message.entity');
const { logIInfo, logError } = require('../../middlewere/logger.js');

const sessionRepo = () => AppDataSource.getRepository(ChannelSession);
const messageRepo = () => AppDataSource.getRepository(Message);

let clientsList = [];

async function updateBotStatus(sessionId, status) {
  try {
    await sessionRepo().update(sessionId, { telegramBotStatus: status });
    return true;
  } catch (e) {
    logError(`Error updating telegram bot status ${sessionId}: ${e.message}`);
    return false;
  }
}

async function saveMessage(sessionId, platform, chatId, senderId, senderName, message, direction, messageType = 'text', fileId = null) {
  try {
    const entity = messageRepo().create({
      sessionId,
      platform,
      chatId,
      senderId,
      senderName,
      message,
      direction,
      messageType,
      fileId,
    });
    await messageRepo().save(entity);
  } catch (e) {
    logError(`Error saving message: ${e.message}`);
  }
}

function getMessageType(msg) {
  if (msg.photo) return 'photo';
  if (msg.document) return 'document';
  if (msg.voice) return 'voice';
  if (msg.video) return 'video';
  if (msg.sticker) return 'sticker';
  return 'text';
}

async function createTelegramClient(session, mode = 'polling') {
  try {
    const token = session.telegramBotToken;
    if (!token) {
      logError(`No bot token provided for session ${session.name}`);
      return { bot: null };
    }

    logIInfo(`Initializing Telegram bot for ${session.name} (mode: ${mode})`);

    let bot;

    if (mode === 'webhook') {
      bot = new TelegramBot(token, { polling: false });
    } else {
      bot = new TelegramBot(token, { polling: true });
    }

    await updateBotStatus(session.id, 'initialize');

    const existingIndex = clientsList.findIndex(
      (c) => c.session_id.toString() === session.id.toString()
    );

    if (existingIndex !== -1) {
      try {
        if (clientsList[existingIndex].bot && clientsList[existingIndex].bot.isPolling()) {
          await clientsList[existingIndex].bot.stopPolling();
        }
      } catch (stopErr) {
        logError(`Error stopping old bot for ${session.name}: ${stopErr.message}`);
      }
      clientsList[existingIndex].bot = bot;
    } else {
      clientsList.push({
        session_id: session.id,
        session_secret: session.sessionSecret,
        bot,
      });
    }

    if (mode === 'polling') {
      bot.setMyCommands([
        { command: 'start', description: 'Start the bot' },
        { command: 'help', description: 'Show available commands' },
      ]);
    }

    bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const from = msg.from;

      await saveMessage(session.id, 'telegram', chatId.toString(), from.id.toString(), from.username || from.first_name, '/start', 'incoming', 'text');

      const welcomeMessage = `Welcome ${from.first_name}! I am your AI assistant. Send me a message and I will reply to you.`;
      await bot.sendMessage(chatId, welcomeMessage);

      await saveMessage(session.id, 'telegram', chatId.toString(), session.userId.toString(), 'bot', welcomeMessage, 'outgoing', 'text');
    });

    bot.onText(/\/help/, async (msg) => {
      const chatId = msg.chat.id;
      const from = msg.from;

      await saveMessage(session.id, 'telegram', chatId.toString(), from.id.toString(), from.username || from.first_name, '/help', 'incoming', 'text');

      const helpMessage = `Available commands:\n/start - Start the bot\n/help - Show this help message\n\nYou can also send me text messages, photos, documents, or voice messages and I will respond using AI.`;
      await bot.sendMessage(chatId, helpMessage);

      await saveMessage(session.id, 'telegram', chatId.toString(), session.userId.toString(), 'bot', helpMessage, 'outgoing', 'text');
    });

    bot.on('message', async (msg) => {
      if (!msg.text && !msg.photo && !msg.document && !msg.voice && !msg.video) return;
      if (msg.text && msg.text.startsWith('/')) return;

      const chatId = msg.chat.id;
      const from = msg.from;
      const messageType = getMessageType(msg);

      let messageText = msg.text || '';
      let fileId = null;

      if (msg.photo) {
        const photo = msg.photo[msg.photo.length - 1];
        fileId = photo.file_id;
        messageText = msg.caption || '[Photo]';
      } else if (msg.document) {
        fileId = msg.document.file_id;
        messageText = msg.caption || `[Document: ${msg.document.file_name}]`;
      } else if (msg.voice) {
        fileId = msg.voice.file_id;
        messageText = '[Voice Message]';
      } else if (msg.video) {
        fileId = msg.video.file_id;
        messageText = msg.caption || '[Video]';
      } else if (msg.sticker) {
        fileId = msg.sticker.file_id;
        messageText = `[Sticker: ${msg.sticker.emoji || ''}]`;
      }

      logIInfo(`Telegram ${messageType} from ${from.username || from.id} in session ${session.name}: ${messageText}`);

      await saveMessage(session.id, 'telegram', chatId.toString(), from.id.toString(), from.username || from.first_name, messageText, 'incoming', messageType, fileId);

      try {
        const apiUrl = process.env.MESSAGES_API_URL || 'http://localhost:3000/v1/messages';
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sender_phone: from.id.toString(),
            receiver_id: session.userId.toString(),
            message: messageText,
          }),
        });

        logIInfo(`Response from API: ${response.statusText}`);

        if (response.ok) {
          const data = await response.json();
          const aiRes = data.data?.ai_response;
          if (aiRes) {
            await bot.sendMessage(chatId, aiRes);
            await saveMessage(session.id, 'telegram', chatId.toString(), session.userId.toString(), 'bot', aiRes, 'outgoing', 'text');
          }
        } else {
          logError(`API request failed: ${response.statusText}`);
        }
      } catch (error) {
        logError(`Error sending message to API: ${error.message}`);
        const errorMsg = 'Sorry, something went wrong. Please try again later.';
        await bot.sendMessage(chatId, errorMsg).catch(() => {});
        await saveMessage(session.id, 'telegram', chatId.toString(), session.userId.toString(), 'bot', errorMsg, 'outgoing', 'text');
      }
    });

    bot.on('polling_error', async (error) => {
      logError(`Telegram polling error for ${session.name}: ${error.message}`);
      await updateBotStatus(session.id, 'error');
    });

    const me = await bot.getMe();
    logIInfo(`Telegram bot started: @${me.username} (${me.first_name}) for session ${session.name}`);

    await updateBotStatus(session.id, 'ready');

    return { bot };
  } catch (e) {
    logError(`Error creating Telegram bot for ${session.name}: ${e.message}`);
    await updateBotStatus(session.id, 'error');
    return { bot: null };
  }
}

async function stopBot(sessionId) {
  const clientIndex = clientsList.findIndex(
    (c) => c.session_id.toString() === sessionId.toString()
  );

  if (clientIndex === -1) {
    logError(`No active bot found for session ${sessionId}`);
    return false;
  }

  const clientData = clientsList[clientIndex];

  try {
    if (clientData.bot && clientData.bot.isPolling()) {
      await clientData.bot.stopPolling();
      logIInfo(`Bot stopped for session ${sessionId}`);
    }
  } catch (e) {
    logError(`Error stopping bot for session ${sessionId}: ${e.message}`);
  }

  clientsList.splice(clientIndex, 1);
  await updateBotStatus(sessionId, 'stopped');

  return true;
}

async function sendMessage(sessionId, chatId, message) {
  const clientData = clientsList.find(
    (c) => c.session_id.toString() === sessionId.toString()
  );

  if (!clientData || !clientData.bot) {
    logError(`No active bot found for session ${sessionId}`);
    return false;
  }

  try {
    await clientData.bot.sendMessage(chatId, message);
    await saveMessage(sessionId, 'telegram', chatId.toString(), 'api', 'api_user', message, 'outgoing', 'text');
    return true;
  } catch (e) {
    logError(`Error sending message for session ${sessionId}: ${e.message}`);
    return false;
  }
}

function getClientBySessionId(sessionId) {
  return clientsList.find(
    (c) => c.session_id.toString() === sessionId.toString()
  );
}

function getActiveSessions() {
  return clientsList;
}

async function processWebhookUpdate(botToken, update) {
  const clientData = clientsList.find(
    (c) => c.bot && c.bot.token === botToken
  );

  if (!clientData) {
    logError(`No active bot found for token: ${botToken.substring(0, 10)}...`);
    return false;
  }

  try {
    clientData.bot.processUpdate(update);
    return true;
  } catch (e) {
    logError(`Error processing webhook update: ${e.message}`);
    return false;
  }
}

module.exports = {
  createTelegramClient,
  clientsList,
  stopBot,
  sendMessage,
  getClientBySessionId,
  getActiveSessions,
  processWebhookUpdate,
};
