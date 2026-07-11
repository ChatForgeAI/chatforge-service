const express = require("express");
const router = express.Router();
exports.router = router;
const validateClient = require("../middlewere/validate_whats_app_clinet");
const validateApiSecret = require("../middlewere/validate_api_secret");

const {
    getLastWhatsAppQrCode,restartWhatsAppSession,startWhatsAppSession,terminateWhatsAppSession,updateSessionName,
} = require("../controller/telegram_sessions_controller");

router.use(validateApiSecret);

// session routs
router.route("/get-last-qr-code").get(validateClient, getLastWhatsAppQrCode);
router.route("/restart-whatsapp-session").post(validateClient, restartWhatsAppSession);
router.route("/start-whatsapp-session").post(startWhatsAppSession);
router.route("/terminate-whatsapp-session").post(terminateWhatsAppSession);
router.route("/update-session-name").post(updateSessionName);
router.route("/qr").get(getLastWhatsAppQrCode);


module.exports = router;