const qrcode = require('qrcode-terminal');
const { DateTime } = require('luxon');
const path = require("node:path");
const { rm } = require("node:fs");
const pino = require("pino");
const WhatsAppSession = require("../../models/whatsaapp_session_model.js");
const { logIInfo, logError } = require('../../middlewere/logger.js');

// Store clients list (similar to your first file structure)
let clientsList = [];

// Store QR generation counters for each session
const qrGenerationCounters = new Map();
const MAX_QR_GENERATIONS = 30; // Match your env variable or default

// Store manual closure flags
const manualClosures = new Set();

async function updateSessionStatus(sessionId, status, qr = null) {
    try {
        const updateData = { sessionStatus: status };
        if (qr) {
            updateData.qrCode = qr;
        }
        await WhatsAppSession.findByIdAndUpdate(sessionId, updateData);
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
        const sessionPath = path.join(`./storage/session`, session.name);

        // Initialize QR counter for this session
        if (!qrGenerationCounters.has(session.name)) {
            qrGenerationCounters.set(session.name, 0);
        }

        const currentQrCount = qrGenerationCounters.get(session.name);

        // Check if maximum QR generations reached
        if (currentQrCount >= MAX_QR_GENERATIONS) {
            logError(`Maximum QR generations (${MAX_QR_GENERATIONS}) reached for ${session.name}. Stopping session creation.`);
            await updateSessionStatus(session._id, 'max_qr_reached');
            return { client: null, qrCode: null };
        }

        logIInfo(`Initializing session for ${session.name} (QR attempt ${currentQrCount + 1}/${MAX_QR_GENERATIONS})`);

        // DYNAMIC IMPORT FOR BAILEYS
        const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = await import('@whiskeysockets/baileys');

        // Initialize Baileys client with multi-file auth state
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

        // Fetch latest version for better compatibility
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
            qrTimeout: 120000, // 2 minutes
            getMessage: async (key) => {
                return {};
            }
        });

        let isConnected = false;
        let qrGenerated = false;
        let qrTimeoutId = null;

        // Handle QR code generation
        client.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            logIInfo(`Connection update for ${session.name}: ${connection}, qr: ${!!qr}`);

            if (qr) {
                // Clear any existing QR timeout
                if (qrTimeoutId) {
                    clearTimeout(qrTimeoutId);
                    qrTimeoutId = null;
                }

                // Increment QR generation counter
                const newQrCount = qrGenerationCounters.get(session.name) + 1;
                qrGenerationCounters.set(session.name, newQrCount);
                qrGenerated = true;
                qrCode = qr;

                logIInfo(`📱 QR Code received for ${session.name} (Generation ${newQrCount}/${MAX_QR_GENERATIONS})`);

                // Print QR code in terminal
                console.log(`\n📱 QR Code for ${session.name} (${newQrCount}/${MAX_QR_GENERATIONS}):`);
                qrcode.generate(qr, { small: true }, (qrcodeText) => {
                    console.log(qrcodeText);
                });

                // Save QR code to database (just the raw QR string)
                try {
                    await updateSessionStatus(session._id, 'qr', qr);
                    logIInfo(`✅ QR Code saved for ${session.name}`);
                } catch (err) {
                    logError(`Error saving QR code for ${session.name}: ${err.message}`);
                }

                // Set timeout to regenerate QR if not scanned
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
                            await updateSessionStatus(session._id, 'max_qr_reached');

                            if (client) {
                                client.end();
                            }
                        }
                    }
                }, 120000); // 2 minutes
            }

            if (connection === 'connecting') {
                logIInfo(`Client ${session.name} is connecting...`);
                await updateSessionStatus(session._id, 'loading_screen');
            }

            if (connection === 'open') {
                // Clear QR timeout if connection is successful
                if (qrTimeoutId) {
                    clearTimeout(qrTimeoutId);
                    qrTimeoutId = null;
                }

                // Reset QR counter on successful connection
                qrGenerationCounters.delete(session.name);

                isConnected = true;
                logIInfo(`✅ Client authenticated for ${session.name}`);
                await updateSessionStatus(session._id, 'authenticated');

                // Update clientsList
                const userIndex = clientsList.findIndex((user) => user.session_id === session._id);
                if (userIndex === -1) {
                    clientsList.push({
                        "session_id": session._id,
                        "session_secret": session.sessionSecret,
                        client
                    });
                } else {
                    clientsList[userIndex].client = client;
                }

                await updateSessionStatus(session._id, 'ready');
                logIInfo(`🎉 Client ${session.name} is now READY!`);
            }

            if (connection === 'close') {
                // Clear QR timeout on connection close
                if (qrTimeoutId) {
                    clearTimeout(qrTimeoutId);
                    qrTimeoutId = null;
                }

                isConnected = false;
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const error = lastDisconnect?.error;

                logError(`Connection closed for ${session.name}: ${statusCode || 'Unknown'}, ${error?.message || 'No error message'}`);

                // CHECK IF THIS WAS A MANUAL CLOSURE - DON'T RECONNECT
                if (manualClosures.has(session.name)) {
                    logIInfo(`Manual closure detected for ${session.name}, skipping auto-reconnect`);
                    manualClosures.delete(session.name);
                    return;
                }

                if (statusCode === DisconnectReason.loggedOut || statusCode === DisconnectReason.multideviceMismatch) {
                    logIInfo(`Client logged out for ${session.name}: ${statusCode}`);

                    // Reset QR counter on logout
                    qrGenerationCounters.delete(session.name);

                    await updateSessionStatus(session._id, 'disconnected');

                    // Clean up session
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
                    // Attempt to reconnect for other disconnect reasons
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

        // Handle credentials update
        client.ev.on('creds.update', saveCreds);

        // Handle errors
        client.ev.on('error', (err) => {
            logError(`Client:${session.name} ERROR event => ${err.message}`);
        });

        // Handle incoming messages for auto-reply
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
                    console.log(`Send to API ${body}`)
                    const response = await fetch("http://localhost:3000/v1/messages", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            "sender_phone": from.split('@')[0],
                            "receiver_id": session.userId,
                            "message": body
                        })
                    });
                    if (response.ok) {
                        const data = await response.json();
                        const aiRes = data.data.ai_response
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

        // Handle connection failures
        client.ev.on('connection.failure', (err) => {
            logError(`Client:${session.name} Connection failure => ${err.message}`);
            updateSessionStatus(session._id, 'auth_failure');
        });

        logIInfo(`Session initialization completed for ${session.name}`);
        return { client, qrCode };

    } catch (e) {
        logError(`Initialization error for ${session.name}: ${e.message}`);
        logError(`Stack trace: ${e.stack}`);

        // Check if we should retry based on QR generation count
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

/**
 * Close connection without logging out
 */
async function closeConnection(sessionName) {
    try {
        const clientData = clientsList.find(c => c.client?.user?.name === sessionName);

        if (!clientData || !clientData.client) {
            logError(`No active client found for ${sessionName}`);
            return false;
        }

        logIInfo(`Closing connection for ${sessionName} (without logout)`);

        // Mark this as a manual closure to prevent auto-reconnect
        manualClosures.add(sessionName);

        // Update session status
        const session = await WhatsAppSession.findOne({ name: sessionName });
        if (session) {
            await updateSessionStatus(session._id, 'connection_closed');
        }

        // Remove from clients list but don't destroy the client completely
        clientsList = clientsList.filter(c => c.client?.user?.name !== sessionName);

        // Gracefully close the connection
        await clientData.client.ws.close();

        logIInfo(`Connection closed for ${sessionName}`);
        return true;

    } catch (e) {
        logError(`Error closing connection for ${sessionName}: ${e.message}`);
        return false;
    }
}

/**
 * Reconnect a previously closed connection
 */
async function reconnectConnection(session) {
    try {
        logIInfo(`Attempting to reconnect ${session.name}`);

        // Clear manual closure flag to allow reconnection
        manualClosures.delete(session.name);

        // First, ensure any existing connection is properly closed
        await closeConnection(session.name);

        // Wait a moment before reconnecting
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Create new session
        const result = await createSession(session);

        if (result.client) {
            logIInfo(`Reconnection initiated for ${session.name}`);
            return true;
        } else {
            logError(`Reconnection failed for ${session.name}`);
            return false;
        }

    } catch (e) {
        logError(`Error reconnecting ${session.name}: ${e.message}`);
        return false;
    }
}

/**
 * Get client by session ID
 */
function getClientBySessionId(sessionId) {
    return clientsList.find(c => c.session_id === sessionId);
}

/**
 * Get all active sessions
 */
function getActiveSessions() {
    return clientsList.filter(c => c.client?.ws?.readyState === 1);
}

module.exports = {
    createSession,
    clientsList,
    closeConnection,
    reconnectConnection,
    getClientBySessionId,
    getActiveSessions
};