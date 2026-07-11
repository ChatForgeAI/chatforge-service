const createTelegramClient = require("../services/telegram/telegram_client.js");
const channelSession = require('../models/channel_session_model.js');
const errorResponse = require("../utils/response_handel/error_handeler.js");
const successResponse = require("../utils/response_handel/success_handeler.js");
const fs = require("fs").promises;
const path = require('path');


// @desc start telegram session
// @route post /session/start-telegram-session
// @header {"x-user-id" : "{{user_id}}", "api-secret" : "{{api_secret}}"}
// @body {"bot_token" : "*************************"}
exports.starttelegramSession = async (req, res) => {
    const userId = req.headers['x-user-id'];
    const botToken = req.body.bot_token;

    try {
        // if (!/^[a-zA-Z\s]+$/.test(sessionName)) {
        //     return errorResponse(res, "Session name must be alphabet only", 400, "Session name must be alphabet only");
        // }

        const checkUsedBotToken = await channelSession.findOne({ telegramBotToken: botToken });
        if (checkUsedBotToken) {
            return errorResponse(res, "Bot token already used", 400, "Bot token already used");
        }

        const sessionSecret = "telegram.session." + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const session = {
            name: "telegram_session_" + Math.random().toString(36).substring(2, 15),
            userId: userId,
            sessionSecret,
            telegramBotToken: botToken,
        };

        const telegramSession = await channelSession.create(session);
        session['_id'] = telegramSession._id;

        await createTelegramClient(botToken).then(() => {
            console.log('Telegram session created successfully');
            return successResponse(res, telegramSession, 200, 'Start telegram session successfully');
        }).catch((err) => {
            console.error('Error creating Telegram session:', err);
            return errorResponse(res, err.message, 500, "Failed to start telegram session");
        });


    } catch (e) {
        return errorResponse(res, e.message, 500, "Failed to start telegram session");
    }
};

// @desc terminate telegram session
// @route POST /session/terminate-telegram-session
// @header { "x-user-id": "{{user_id}}", "x-instance-secret": "{{user_secret}}", "api-secret": "{{api_secret}}" }
exports.terminatetelegramSession = async (req, res) => {
    try {
        const { session_id } = req.body;

        const session = await channelSession.findById(session_id);
        if (!session) {
            return errorResponse(res, "Session not found", 404, "Session not found");
        }

        // Find and destroy the telegram client
        const clientObjIndex = clientsList.findIndex(user => user.session_id.toString() === session._id.toString());
        if (clientObjIndex !== -1 && clientsList[clientObjIndex].client) {
            try {
                await clientsList[clientObjIndex].client.destroy();
                console.log(`Client destroyed for session: ${session.name}`);
            } catch (destroyErr) {
                console.warn(`Client destroy failed for session ${session.name}: ${destroyErr.message}`);
            }
        }

        // Small delay to allow file handles to be released
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Attempt to delete the session directory
        const sessionPath = path.join(__dirname, '..', 'storage', 'session', session.name);

        try {
            await fs.rm(sessionPath, { recursive: true, force: true });
            console.log(`Session folder deleted: ${sessionPath}`);
        } catch (err) {
            if (err.code === 'EBUSY') {
                console.warn(`Could not delete session folder due to lock: ${err.message}`);
            } else {
                throw err;
            }
        }

        // Remove client from in-memory list
        if (clientObjIndex !== -1) {
            clientsList.splice(clientObjIndex, 1);
        }

        // Remove session from DB
        await channelSession.findByIdAndDelete(session_id);

        return successResponse(res, null, 200, "Session terminated successfully");
    } catch (e) {
        console.error(`Failed to terminate session: ${e.message}`);
        return errorResponse(res, e.message, 500, "Failed to terminate session");
    }
};

// @desc update session name
// @route post /session/update-session-name
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
// @body {"session_id" : "0", "name" : "TestSession"}
exports.updateSessionName = async (req, res) => {
    try {
        if (!/^[a-zA-Z\s]+$/.test(req.body.name)) {
            return errorResponse(res, "Session name must be alphabet only", 400, "Session name must be alphabet only");
        }

        const checkUsedSessionName = await channelSession.findOne({ name: req.body.name });
        if (checkUsedSessionName) {
            return errorResponse(res, "Session name already used", 400, "Session name already used");
        }

        const session = await telegramSession.findById(req.body.session_id);
        if (!session) {
            return errorResponse(res, "Session not found", 404, "Session not found");
        }

        session.name = req.body.name.replaceAll(" ", "_");
        await session.save();

        return successResponse(res, session, 200, "Session name updated successfully");
    } catch (e) {
        return errorResponse(res, e.message, 500, "Failed to update session name");
    }
};
