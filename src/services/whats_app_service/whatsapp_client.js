const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const WhatsAppSession = require("../../models/whatsaapp_session_model.js");
const AutoReply = require("../../models/auto-reply_model.js");
const { MessageMedia } = require("whatsapp-web.js");
const { logIInfo, logError } = require('../../middlewere/logger.js');

let clientsList = [];

async function createSession(session) {
    let qrCode = null;

    // Optimized Puppeteer configuration for Render
    const puppeteerOptions = {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', // Important for memory-constrained environments
            '--disable-gpu',
            '--disable-extensions',
            '--disable-background-networking',
            '--disable-default-apps',
            '--disable-translate',
            '--disable-notifications',
            '--disable-sync'
        ],
        ignoreHTTPSErrors: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined // Allows override in production
    };

    // Initialize the WhatsApp client
    const client = new Client({
        authStrategy: new LocalAuth({
            clientId: session.name,
            dataPath: `./storage/session/${session.name}`
        }),
        qrMaxRetries: process.env.MAX_QR_RETRIES ?? 30,
        puppeteer: puppeteerOptions,
    });

    client.on('loading_screen', async (percent, message) => {
        console.log(`Loading: ${percent}% - ${message}`);
        await WhatsAppSession.findByIdAndUpdate(session._id, { sessionStatus: 'loading_screen' });
    });

    // Handle QR code generation and login
    client.on('qr', async (qr) => {
        qrCode = qr;

        qrcode.generate(qr, { small: true });
        logIInfo(`QR code generated for ${session.name}`);
        await WhatsAppSession.findByIdAndUpdate(session._id, { qrCode: qr, sessionStatus: 'qr' });
    });

    client.on('authenticated', async () => {
        logIInfo(`Client authenticated for ${session.name}`);
        await WhatsAppSession.findByIdAndUpdate(session._id, { sessionStatus: 'authenticated' });
    });

    client.on('auth_failure', async () => {
        logError(`Authentication failed for ${session.name}`);
        await WhatsAppSession.findByIdAndUpdate(session._id, { sessionStatus: 'auth_failure' });
    });

    client.on('ready', async () => {
        logIInfo(`Client is ready for ${session.name}`);
        await WhatsAppSession.findByIdAndUpdate(session._id, { sessionStatus: 'ready' });

        // Save the client to the clientsList
        const userIndex = clientsList.findIndex((user) => user.instance_id === session._id);
        if (userIndex === -1) {
            clientsList.push({ "session_id": session._id, "session_secret": session.sessionSecret, client });
        } else {
            clientsList[userIndex].client = client;
        }

    });


    client.on('disconnected', async (reason) => {
        logError('Client was logged out', reason);
        await WhatsAppSession.findByIdAndUpdate(session._id, { sessionStatus: 'disconnected' });
    });

    client.on('auth_failure', async msg => {
        // Fired if session restore was unsuccessful
        logError('AUTHENTICATION FAILURE', msg);
        await WhatsAppSession.findByIdAndUpdate(session._id, { sessionStatus: 'auth_failure' });
    });


    // Handle incoming messages and apply Auto-Reply
    client.on('message', async (msg) => {
        const { from, body } = msg;
        console.log(`Incoming message from ${from}: ${body}`);

        try {
            // Convert both incoming message and triggers to lowercase for comparison
            const normalizedBody = body.toLowerCase().trim();

            // Find an active auto-reply (case-insensitive match)
            const autoReply = await AutoReply.findOne({
                userId: session.userId,
                triggers: {
                    $elemMatch: {
                        $regex: new RegExp(`^${normalizedBody}$`, 'i')
                    }
                }
            });

            if (!autoReply) return; // No auto-reply found

            console.log(`Auto-reply found: Sending response to ${from}`);

            // Rest of your existing code...
            if (autoReply.delay > 0) {
                await new Promise(resolve => setTimeout(resolve, autoReply.delay * 1000));
            }

            if (autoReply.responseType === "text") {
                await client.sendMessage(from, autoReply.responseContent);
            } else if (["image"].includes(autoReply.responseType)) {
                const media = await MessageMedia.fromUrl(autoReply.responseContent);
                await client.sendMessage(from, media, { caption: "Here is your requested file." });
            }

        } catch (error) {
            logError(`Error processing auto-reply for ${from}:`, error.message);
        }
    });

    try {
        // Start the WhatsApp client
        await client.initialize();
        return { client, qrCode };
    } catch (e) {
        logError(e);
        return { client: null, qrCode: null };
    }
}

module.exports = { createSession, clientsList };