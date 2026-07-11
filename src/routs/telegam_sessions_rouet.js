const express = require("express");
const router = express.Router();
exports.router = router;
const validateClient = require("../middlewere/validate_whats_app_clinet");
const validateApiSecret = require("../middlewere/validate_api_secret");

const {
    starttelegramSession, terminatetelegramSession, updateSessionName
} = require("../controller/telegram_sessions_controller");

router.use(validateApiSecret);

// session routs
router.route("/start-telegram-session").post(starttelegramSession);
router.route("/terminate-telegram-session").post(terminatetelegramSession);
router.route("/update-session-name").post(updateSessionName);


module.exports = router;