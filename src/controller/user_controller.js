const User = require('../models/user_model.js');
const WhatsAppSession = require('../models/whatsaapp_session_model.js');
const errorResponse = require("../utils/response_handel/error_handeler.js");
const successResponse = require("../utils/response_handel/success_handeler.js");
const fs = require("fs").promises;

// @desc get all users
// @route get /user
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').populate('subscriptionPlan').populate('whatsAppSessions');

        return successResponse(res, { users }, 200, "Get all users successfully");
    } catch (e) {
        return errorResponse(res, e.message, 500, "Users not found");
    }
};


// @desc get all WhatsApp sessions if role is admin / get user WhatsApp sessions if role is user
// @route get /user/whatsapp-sessions
exports.getWhatsAppSessions = async (req, res) => {
    const userId = req.headers['x-user-id'];
    const role = req.user.role;

    try {
        let sessions;
        if (role === 'admin') {
            sessions = await WhatsAppSession.find();
        } else {
            sessions = await WhatsAppSession.find({ userId });
        }

        return successResponse(res, { sessions }, 200, "Get WhatsApp sessions successfully");
    } catch (e) {
        return errorResponse(res, e.message, 500, "WhatsApp sessions not found");
    }
}

// @desc delete user
// @route delete /user
// @body {"user_id" : ""}
exports.deleteUser = async (req, res) => {
    const userId = req.bodt.user_id;

    try {

        // 1- delete user
        await User.findByIdAndDelete(userId);

        // 2- delete all user sessions from storage folder
        const sessions = await WhatsAppSession.find({ userId });
        for (let session of sessions) {
            await fs.rmdir(`./storage/session/${session.name}`, { recursive: true });
        }

        // 3- delete all user WhatsApp sessions
        await WhatsAppSession.deleteMany({ userId });

        return successResponse(res, null, 200, "User deleted successfully");
    } catch (e) {
        return errorResponse(res, e.message, 500, "User not deleted");
    }
}