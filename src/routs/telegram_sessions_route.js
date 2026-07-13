const express = require("express");
const router = express.Router();
const validateApiSecret = require("../middlewere/validate_api_secret");
const { sessionCreationLimiter } = require("../middlewere/rate_limiter");
const {
    validateStartTelegramSession, validateTerminateSession, validateUpdateSessionName, validateSessionStatus, validateSendMessage, validateChatHistory, validateSetWebhook
} = require("../middlewere/validate.js");

const {
    starttelegramSession, terminatetelegramSession, updateSessionName, getTelegramBotStatus, sendMessage, getChatHistory, setWebhook
} = require("../controller/telegram_sessions_controller.js");

router.use(validateApiSecret);

// session routes
router.route("/start-telegram-session").post(sessionCreationLimiter, validateStartTelegramSession, starttelegramSession);
router.route("/terminate-telegram-session").post(validateTerminateSession, terminatetelegramSession);
router.route("/update-session-name").post(validateUpdateSessionName, updateSessionName);
router.route("/status").get(validateSessionStatus, getTelegramBotStatus);
router.route("/send-message").post(validateSendMessage, sendMessage);
router.route("/chat-history").get(validateChatHistory, getChatHistory);
router.route("/set-webhook").post(validateSetWebhook, setWebhook);


module.exports = router;
