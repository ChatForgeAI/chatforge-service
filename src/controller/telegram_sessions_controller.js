const { createTelegramClient, clientsList, stopBot, sendMessage, getClientBySessionId, processWebhookUpdate } = require('../services/telegram/telegram_client.js');
const AppDataSource = require('../config/data-source');
const ChannelSession = require('../entities/channel_session.entity');
const Message = require('../entities/message.entity');
const errorResponse = require('../utils/response_handel/error_handeler.js');
const successResponse = require('../utils/response_handel/success_handeler.js');

const sessionRepo = () => AppDataSource.getRepository(ChannelSession);
const messageRepo = () => AppDataSource.getRepository(Message);

exports.starttelegramSession = async (req, res) => {
  const userId = req.headers['x-user-id'];
  const botToken = req.body.bot_token;

  try {
    const checkUsedBotToken = await sessionRepo().findOne({ where: { telegramBotToken: botToken } });
    if (checkUsedBotToken) {
      return errorResponse(res, 'Bot token already used', 400, 'Bot token already used');
    }

    const sessionSecret = 'telegram.session.' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const sessionData = {
      name: 'telegram_session_' + Math.random().toString(36).substring(2, 15),
      userId: userId,
      sessionSecret,
      telegramBotToken: botToken,
      telegramBotStatus: 'initialize',
    };

    const entity = sessionRepo().create(sessionData);
    const telegramSession = await sessionRepo().save(entity);
    sessionData.id = telegramSession.id;

    createTelegramClient({ ...telegramSession, ...sessionData })
      .then(() => {
        console.log('Telegram session created successfully');
      })
      .catch((err) => {
        console.error('Error creating Telegram session:', err);
      });

    return successResponse(res, telegramSession, 200, 'Start telegram session successfully');
  } catch (e) {
    return errorResponse(res, e.message, 500, 'Failed to start telegram session');
  }
};

exports.terminatetelegramSession = async (req, res) => {
  try {
    const { session_id } = req.body;

    const session = await sessionRepo().findOne({ where: { id: session_id } });
    if (!session) {
      return errorResponse(res, 'Session not found', 404, 'Session not found');
    }

    await stopBot(session.id);

    await sessionRepo().delete(session_id);

    return successResponse(res, null, 200, 'Session terminated successfully');
  } catch (e) {
    console.error(`Failed to terminate session: ${e.message}`);
    return errorResponse(res, e.message, 500, 'Failed to terminate session');
  }
};

exports.getTelegramBotStatus = async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return errorResponse(res, 'session_id is required', 400, 'session_id is required');
    }

    const session = await sessionRepo().findOne({ where: { id: session_id } });
    if (!session) {
      return errorResponse(res, 'Session not found', 404, 'Session not found');
    }

    const clientData = clientsList.find(
      (c) => c.session_id.toString() === session_id
    );

    return successResponse(res, {
      session_id: session.id,
      name: session.name,
      status: session.telegramBotStatus,
      is_active: !!clientData,
    }, 200, 'Bot status retrieved successfully');
  } catch (e) {
    return errorResponse(res, e.message, 500, 'Failed to get bot status');
  }
};

exports.updateSessionName = async (req, res) => {
  try {
    if (!/^[a-zA-Z\s]+$/.test(req.body.name)) {
      return errorResponse(res, 'Session name must be alphabet only', 400, 'Session name must be alphabet only');
    }

    const checkUsedSessionName = await sessionRepo().findOne({ where: { name: req.body.name } });
    if (checkUsedSessionName) {
      return errorResponse(res, 'Session name already used', 400, 'Session name already used');
    }

    const session = await sessionRepo().findOne({ where: { id: req.body.session_id } });
    if (!session) {
      return errorResponse(res, 'Session not found', 404, 'Session not found');
    }

    session.name = req.body.name.replaceAll(' ', '_');
    await sessionRepo().save(session);

    return successResponse(res, session, 200, 'Session name updated successfully');
  } catch (e) {
    return errorResponse(res, e.message, 500, 'Failed to update session name');
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { session_id, chat_id, message } = req.body;

    const session = await sessionRepo().findOne({ where: { id: session_id } });
    if (!session) {
      return errorResponse(res, 'Session not found', 404, 'Session not found');
    }

    const clientData = getClientBySessionId(session_id);
    if (!clientData) {
      return errorResponse(res, 'Bot is not active', 400, 'Bot is not active');
    }

    const sent = await sendMessage(session_id, chat_id, message);
    if (!sent) {
      return errorResponse(res, 'Failed to send message', 500, 'Failed to send message');
    }

    return successResponse(res, null, 200, 'Message sent successfully');
  } catch (e) {
    return errorResponse(res, e.message, 500, 'Failed to send message');
  }
};

exports.getChatHistory = async (req, res) => {
  try {
    const { session_id, chat_id, limit = 50, offset = 0 } = req.query;

    const session = await sessionRepo().findOne({ where: { id: session_id } });
    if (!session) {
      return errorResponse(res, 'Session not found', 404, 'Session not found');
    }

    const messages = await messageRepo().find({
      where: { sessionId: session_id, chatId: chat_id },
      order: { createdAt: 'DESC' },
      skip: parseInt(offset),
      take: parseInt(limit),
    });

    const total = await messageRepo().count({
      where: { sessionId: session_id, chatId: chat_id },
    });

    return successResponse(res, {
      messages: messages.reverse(),
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    }, 200, 'Chat history retrieved successfully');
  } catch (e) {
    return errorResponse(res, e.message, 500, 'Failed to get chat history');
  }
};

exports.setWebhook = async (req, res) => {
  try {
    const { session_id, webhook_url } = req.body;

    const session = await sessionRepo().findOne({ where: { id: session_id } });
    if (!session) {
      return errorResponse(res, 'Session not found', 404, 'Session not found');
    }

    if (!session.telegramBotToken) {
      return errorResponse(res, 'Bot token not found', 400, 'Bot token not found');
    }

    const botToken = session.telegramBotToken;
    const setWebhookUrl = `https://api.telegram.org/bot${botToken}/setWebhook`;

    const response = await fetch(setWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhook_url,
        allowed_updates: ['message', 'edited_message', 'callback_query'],
      }),
    });

    const result = await response.json();

    if (!result.ok) {
      return errorResponse(res, result.description || 'Failed to set webhook', 400, 'Failed to set webhook');
    }

    session.telegramBotMode = 'webhook';
    await sessionRepo().save(session);

    const clientData = getClientBySessionId(session_id);
    if (clientData && clientData.bot && clientData.bot.isPolling()) {
      await clientData.bot.stopPolling();
    }

    await createTelegramClient(session, 'webhook');

    return successResponse(res, { webhook_url, mode: 'webhook' }, 200, 'Webhook set successfully');
  } catch (e) {
    return errorResponse(res, e.message, 500, 'Failed to set webhook');
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    const { botToken } = req.params;
    const update = req.body;

    const session = await sessionRepo().findOne({ where: { telegramBotToken: botToken } });
    if (!session) {
      return res.status(200).json({ ok: true });
    }

    await processWebhookUpdate(botToken, update);

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(`Webhook error: ${e.message}`);
    return res.status(200).json({ ok: true });
  }
};
