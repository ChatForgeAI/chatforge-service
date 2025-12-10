const { createSession } = require("../services/whats_app_service/whatsapp_client.js");
const WhatsAppSession = require('../models/whatsaapp_session_model.js');
const errorResponse = require("../utils/response_handel/error_handeler.js");
const successResponse = require("../utils/response_handel/success_handeler.js");
const fs = require("fs").promises;
const { clientsList } = require("../services/whats_app_service/whatsapp_client.js");
const path = require('path');


// @desc start WhatsApp session
// @route post /session/start-whatsapp-session
// @header {"x-user-id" : "{{user_id}}", "api-secret" : "{{api_secret}}"}
// @body {"name" : "TestSession"}
exports.startWhatsAppSession = async (req, res) => {
    const userId = req.headers['x-user-id'];
    const sessionName = req.body.name.replaceAll(" ", "_");

    try {
        // if (!/^[a-zA-Z\s]+$/.test(sessionName)) {
        //     return errorResponse(res, "Session name must be alphabet only", 400, "Session name must be alphabet only");
        // }

        const checkUsedSessionName = await WhatsAppSession.findOne({ name: sessionName });
        if (checkUsedSessionName) {
            return errorResponse(res, "Session name already used", 400, "Session name already used");
        }

        const sessionSecret = "whatsapp.session." + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const session = {
            name: sessionName,
            userId: userId,
            sessionSecret,
        };

        const whatsAppSession = await WhatsAppSession.create(session);
        session['_id'] = whatsAppSession._id;

        createSession(session).then(() => {
            console.log('Session created successfully');
        });

        return successResponse(res, whatsAppSession, 200, 'Start WhatsApp session successfully');
    } catch (e) {
        return errorResponse(res, e.message, 500, "Failed to start WhatsApp session");
    }
};

// @desc terminate WhatsApp session
// @route POST /session/terminate-whatsapp-session
// @header { "x-user-id": "{{user_id}}", "x-instance-secret": "{{user_secret}}", "api-secret": "{{api_secret}}" }
exports.terminateWhatsAppSession = async (req, res) => {
    try {
        const { session_id } = req.body;

        const session = await WhatsAppSession.findById(session_id);
        if (!session) {
            return errorResponse(res, "Session not found", 404, "Session not found");
        }

        // Find and destroy the WhatsApp client
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
        await WhatsAppSession.findByIdAndDelete(session_id);

        return successResponse(res, null, 200, "Session terminated successfully");
    } catch (e) {
        console.error(`Failed to terminate session: ${e.message}`);
        return errorResponse(res, e.message, 500, "Failed to terminate session");
    }
};

// @desc get last WhatsApp QR code
// @route get /session/qr
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
exports.getLastWhatsAppQrCode = async (req, res) => {
    try {
        // const user = await User.findOne({ instanceSecret: req.headers["x-instance-secret"] });

        // if (!user) {
        //     return errorResponse(res, "User not found", 404, "User not found");
        // }

        return successResponse(res, { 'base64': 'user.qrCode' }, 200, "User found successfully");
    } catch (e) {
        return errorResponse(res, e.message, 500, "Failed to find user");
    }
};

// @desc restart WhatsApp session
// @route post /session/restart-whatsapp-session
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
exports.restartWhatsAppSession = async (req, res) => {
    try {
        await req.body.whatsAppSession.client.destroy();

        await req.body.whatsAppSession.client.initialize().then(() => {
            console.log(`Client ${req.headers["session_id"]} restarted successfully`);
        });

        return successResponse(res, null, 200, "Session restarted successfully");
    } catch (e) {
        return errorResponse(res, e.message, 500, "Failed to restart session");
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

        const checkUsedSessionName = await WhatsAppSession.findOne({ name: req.body.name });
        if (checkUsedSessionName) {
            return errorResponse(res, "Session name already used", 400, "Session name already used");
        }

        const session = await WhatsAppSession.findById(req.body.session_id);
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
