const qrcode = require('qrcode-terminal');
const { DateTime } = require('luxon');
const path = require('node:path');
const { rm } = require('node:fs');
const pino = require('pino');
const AppDataSource = require('../../config/data-source');
const ChannelSession = require('../../entities/channel_session.entity');
const { logIInfo, logError } = require('../../middlewere/logger.js');

const sessionRepo = () => AppDataSource.getRepository(ChannelSession);

let clientsList = [];

const qrGenerationCounters = new Map();
const MAX_QR_GENERATIONS = 30;

const manualClosures = new Set();

async function updateSessionStatus(sessionId, status, qr = null) {
  try {
    const updateData = { whatsappSessionStatus: status };
    if (qr) {
      updateData.whatsappQrCode = qr;
    }
    await sessionRepo().update(sessionId, updateData);
    return true;
  } catch (e) {
    logError(`Error updating session ${sessionId}: ${e.message}`);
    return false;
  }
}

async function createSession(session) {
  try {
    let qrCode = null;
    let client = null;
    const sessionPath = path.join('./storage/session', session.name);

    if (!qrGenerationCounters.has(session.name)) {
      qrGenerationCounters.set(session.name, 0);
    }

    const currentQrCount = qrGenerationCounters.get(session.name);

    if (currentQrCount >= MAX_QR_GENERATIONS) {
      logError(`Maximum QR generations (${MAX_QR_GENERATIONS}) reached for ${session.name}. Stopping session creation.`);
      await updateSessionStatus(session.id, 'max_qr_reached');
      return { client: null, qrCode: null };
    }

    logIInfo(`Initializing session for ${session.name} (QR attempt ${currentQrCount + 1}/${MAX_QR_GENERATIONS})`);

    const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = await import('@whiskeysockets/baileys');

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const { version } = await fetchLatestBaileysVersion();

    client = makeWASocket({
      version,
      auth: state,
      browser: ['Ubuntu', 'Chrome', '120.0.0.0'],
      syncFullHistory: false,
      markOnlineOnConnect: true,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 30000,
      generateHighQualityLinkPreview: true,
      retryRequestDelayMs: 2000,
      maxRetries: 10,
      emitOwnEvents: true,
      fireInitQueries: true,
      shouldIgnoreJid: jid => jid?.endsWith('@g.us') || jid?.endsWith('@broadcast'),
      logger: pino({ level: 'error' }),
      qrTimeout: 120000,
      getMessage: async (key) => {
        return {};
      },
    });

    let isConnected = false;
    let qrGenerated = false;
    let qrTimeoutId = null;

    client.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      logIInfo(`Connection update for ${session.name}: ${connection}, qr: ${!!qr}`);

      if (qr) {
        if (qrTimeoutId) {
          clearTimeout(qrTimeoutId);
          qrTimeoutId = null;
        }

        const newQrCount = qrGenerationCounters.get(session.name) + 1;
        qrGenerationCounters.set(session.name, newQrCount);
        qrGenerated = true;
        qrCode = qr;

        logIInfo(`QR Code received for ${session.name} (Generation ${newQrCount}/${MAX_QR_GENERATIONS})`);

        console.log(`\nQR Code for ${session.name} (${newQrCount}/${MAX_QR_GENERATIONS}):`);
        qrcode.generate(qr, { small: true }, (qrcodeText) => {
          console.log(qrcodeText);
        });

        try {
          await updateSessionStatus(session.id, 'qr', qr);
          logIInfo(`QR Code saved for ${session.name}`);
        } catch (err) {
          logError(`Error saving QR code for ${session.name}: ${err.message}`);
        }

        qrTimeoutId = setTimeout(async () => {
          if (!isConnected && client) {
            logError(`QR code expired for ${session.name}. Regenerating...`);

            if (newQrCount < MAX_QR_GENERATIONS) {
              try {
                client.end();
                setTimeout(() => {
                  createSession(session)
                    .catch(err => {
                      logError(`Failed to regenerate QR for ${session.name}: ${err.message}`);
                    });
                }, 3000);
              } catch (err) {
                logError(`Error during QR regeneration for ${session.name}: ${err.message}`);
              }
            } else {
              logError(`Maximum QR generations reached for ${session.name}. Stopping.`);
              await updateSessionStatus(session.id, 'max_qr_reached');

              if (client) {
                client.end();
              }
            }
          }
        }, 120000);
      }

      if (connection === 'connecting') {
        logIInfo(`Client ${session.name} is connecting...`);
        await updateSessionStatus(session.id, 'loading_screen');
      }

      if (connection === 'open') {
        if (qrTimeoutId) {
          clearTimeout(qrTimeoutId);
          qrTimeoutId = null;
        }

        qrGenerationCounters.delete(session.name);

        isConnected = true;
        logIInfo(`Client authenticated for ${session.name}`);
        await updateSessionStatus(session.id, 'authenticated');

        const userIndex = clientsList.findIndex((user) => user.session_id === session.id);
        if (userIndex === -1) {
          clientsList.push({
            session_id: session.id,
            session_secret: session.sessionSecret,
            client,
          });
        } else {
          clientsList[userIndex].client = client;
        }

        await updateSessionStatus(session.id, 'ready');
        logIInfo(`Client ${session.name} is now READY!`);
      }

      if (connection === 'close') {
        if (qrTimeoutId) {
          clearTimeout(qrTimeoutId);
          qrTimeoutId = null;
        }

        isConnected = false;
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const error = lastDisconnect?.error;

        logError(`Connection closed for ${session.name}: ${statusCode || 'Unknown'}, ${error?.message || 'No error message'}`);

        if (manualClosures.has(session.name)) {
          logIInfo(`Manual closure detected for ${session.name}, skipping auto-reconnect`);
          manualClosures.delete(session.name);
          return;
        }

        if (statusCode === DisconnectReason.loggedOut || statusCode === DisconnectReason.multideviceMismatch) {
          logIInfo(`Client logged out for ${session.name}: ${statusCode}`);

          qrGenerationCounters.delete(session.name);

          await updateSessionStatus(session.id, 'disconnected');

          try {
            await rm(sessionPath, { recursive: true, force: true });
            logIInfo(`Session folder cleaned for ${session.name}`);
          } catch (err) {
            logError(`Error deleting session folder for ${session.name}: ${err.message}`);
          }

          if (client) {
            client.end();
          }
        } else {
          logIInfo(`Attempting to reconnect ${session.name}...`);
          setTimeout(() => {
            createSession(session)
              .catch(err => {
                logError(`Failed to reconnect ${session.name}: ${err.message}`);
              });
          }, 5000);
        }
      }
    });

    client.ev.on('creds.update', saveCreds);

    client.ev.on('error', (err) => {
      logError(`Client:${session.name} ERROR event => ${err.message}`);
    });

    client.ev.on('messages.upsert', async (data) => {
      const messages = data.messages;

      for (const msg of messages) {
        if (msg.key.fromMe || !msg.message) continue;

        const from = msg.key.remoteJid;
        const body = msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          msg.message.imageMessage?.caption ||
          '';

        try {
          const apiUrl = process.env.MESSAGES_API_URL || 'http://localhost:3000/v1/messages';
          console.log(`Sending to API: ${apiUrl} | message: ${body}`);
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sender_phone: from.split('@')[0],
              receiver_id: session.userId,
              message: body,
            }),
          });

          logIInfo(`Response from API: ${response.statusText}`);

          if (response.status === 200 || response.status === 201) {
            const data = await response.json();
            const aiRes = data.data.ai_response;
            await client.sendMessage(from, { text: aiRes });
          }

          if (!response.ok) {
            logError(`API request failed: ${response.statusText}`);
          }
        } catch (error) {
          logError(`Error sending message to API: ${error.message}`);
        }
      }
    });

    client.ev.on('connection.failure', (err) => {
      logError(`Client:${session.name} Connection failure => ${err.message}`);
      updateSessionStatus(session.id, 'auth_failure');
    });

    logIInfo(`Session initialization completed for ${session.name}`);
    return { client, qrCode };
  } catch (e) {
    logError(`Initialization error for ${session.name}: ${e.message}`);
    logError(`Stack trace: ${e.stack}`);

    const currentCount = qrGenerationCounters.get(session.name) || 0;
    if (currentCount < MAX_QR_GENERATIONS) {
      setTimeout(() => {
        logIInfo(`Retrying initialization for ${session.name}...`);
        createSession(session);
      }, 10000);
    } else {
      logError(`Max QR generations reached for ${session.name}. Not retrying.`);
    }

    return { client: null, qrCode: null };
  }
}

async function closeConnection(sessionName) {
  try {
    const clientData = clientsList.find(c => c.client?.user?.name === sessionName);

    if (!clientData || !clientData.client) {
      logError(`No active client found for ${sessionName}`);
      return false;
    }

    logIInfo(`Closing connection for ${sessionName} (without logout)`);

    manualClosures.add(sessionName);

    const session = await sessionRepo().findOne({ where: { name: sessionName } });
    if (session) {
      await updateSessionStatus(session.id, 'connection_closed');
    }

    clientsList = clientsList.filter(c => c.client?.user?.name !== sessionName);

    await clientData.client.ws.close();

    logIInfo(`Connection closed for ${sessionName}`);
    return true;
  } catch (e) {
    logError(`Error closing connection for ${sessionName}: ${e.message}`);
    return false;
  }
}

async function reconnectConnection(session) {
  try {
    logIInfo(`Attempting to reconnect ${session.name}`);

    manualClosures.delete(session.name);

    await closeConnection(session.name);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const result = await createSession(session);

    if (result.client) {
      logIInfo(`Reconnection initiated for ${session.name}`);
      return true;
    } else {
      logError(`Reconnection failed for ${session.name}`);
      return false;
    }
  } catch (e) {
    logError(`Error reconnecting for ${session.name}: ${e.message}`);
    return false;
  }
}

function getClientBySessionId(sessionId) {
  return clientsList.find(c => c.session_id === sessionId);
}

function getActiveSessions() {
  return clientsList.filter(c => c.client?.ws?.readyState === 1);
}

module.exports = {
  createSession,
  clientsList,
  closeConnection,
  reconnectConnection,
  getClientBySessionId,
  getActiveSessions,
};
