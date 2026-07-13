const { body, query, validationResult } = require('express-validator');
const errorResponse = require("../utils/response_handel/error_handeler.js");

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return errorResponse(res, errors.array().map(e => e.msg).join(', '), 400, "Validation failed");
    }
    next();
};

const validateStartTelegramSession = [
    body('bot_token')
        .notEmpty().withMessage('bot_token is required')
        .isString().withMessage('bot_token must be a string'),
    handleValidationErrors
];

const validateStartWhatsAppSession = [
    body('name')
        .notEmpty().withMessage('name is required')
        .isString().withMessage('name must be a string'),
    handleValidationErrors
];

const validateTerminateSession = [
    body('session_id')
        .notEmpty().withMessage('session_id is required')
        .isMongoId().withMessage('session_id must be a valid MongoDB ObjectId'),
    handleValidationErrors
];

const validateUpdateSessionName = [
    body('session_id')
        .notEmpty().withMessage('session_id is required')
        .isMongoId().withMessage('session_id must be a valid MongoDB ObjectId'),
    body('name')
        .notEmpty().withMessage('name is required')
        .matches(/^[a-zA-Z\s]+$/).withMessage('Session name must be alphabet only'),
    handleValidationErrors
];

const validateSessionStatus = [
    query('session_id')
        .notEmpty().withMessage('session_id is required')
        .isMongoId().withMessage('session_id must be a valid MongoDB ObjectId'),
    handleValidationErrors
];

const validateSendMessage = [
    body('session_id')
        .notEmpty().withMessage('session_id is required')
        .isMongoId().withMessage('session_id must be a valid MongoDB ObjectId'),
    body('chat_id')
        .notEmpty().withMessage('chat_id is required')
        .isString().withMessage('chat_id must be a string'),
    body('message')
        .notEmpty().withMessage('message is required')
        .isString().withMessage('message must be a string'),
    handleValidationErrors
];

const validateChatHistory = [
    query('session_id')
        .notEmpty().withMessage('session_id is required')
        .isMongoId().withMessage('session_id must be a valid MongoDB ObjectId'),
    query('chat_id')
        .notEmpty().withMessage('chat_id is required')
        .isString().withMessage('chat_id must be a string'),
    handleValidationErrors
];

const validateSetWebhook = [
    body('session_id')
        .notEmpty().withMessage('session_id is required')
        .isMongoId().withMessage('session_id must be a valid MongoDB ObjectId'),
    body('webhook_url')
        .notEmpty().withMessage('webhook_url is required')
        .isURL().withMessage('webhook_url must be a valid URL'),
    handleValidationErrors
];

module.exports = {
    validateStartTelegramSession,
    validateStartWhatsAppSession,
    validateTerminateSession,
    validateUpdateSessionName,
    validateSessionStatus,
    validateSendMessage,
    validateChatHistory,
    validateSetWebhook,
    handleValidationErrors
};
