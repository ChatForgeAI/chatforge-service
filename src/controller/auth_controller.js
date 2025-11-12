const {createSession} = require("../services/whats_app_service/whatsapp_client.js");
const User = require('../models/user_model.js');
const Plan = require('../models/plan_model.js');
const WhatsAppSession = require('../models/whatsaapp_session_model.js');
const errorResponse = require("../utils/response_handel/error_handeler.js");
const successResponse = require("../utils/response_handel/success_handeler.js");
const fs = require("fs").promises;
const bcrypt = require('bcryptjs');

// @desc register user
// @route post /auth/register
// @body {"name" : "Abd", "email" : "abd@gmail.com", "password": "12346789","passwordConfirm" : "123456789"}
exports.registerUser = async (req, res) => {
    try {
        const instanceSecret = "wpp." + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const user = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            instanceSecret: instanceSecret
        });
        return successResponse(res, {user}, 200, "Register user successfully");
    } catch (e) {
        return errorResponse(res, e.message, 500, "User not added");
    }
};

// @desc login user
// @route post /auth/login
// @body {"email" : "abd@gmail.com", "password": "12346789"}
exports.loginUser = async (req, res) => {
    try {
        const user = await User.findOne({email: req.body.email}).populate('subscriptionPlan').populate('whatsAppSessions');

        if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
            return errorResponse(res, "Incorrect email or password", 401, "Incorrect email or password");
        }

        return successResponse(res, {user}, 200, "User login successfully");
    } catch (e) {
        return errorResponse(res, e.message, 500, "User not found");
    }
};


// Middleware to ensure user is logged in
exports.protect = async (req, res, next) => {
    try {
        const userId = req.headers['x-user-id'];
        const currentUser = await User.findById(userId);
        console.log("currentUser", currentUser);
        console.log("User id", userId);

        if (!currentUser) {
            return errorResponse(res, 'User not found', 404, 'User not found');
        }

        req.user = currentUser;
        next();
    } catch (e) {
        return errorResponse(res, e.message, 500, "Failed to authenticate user");
    }
};
