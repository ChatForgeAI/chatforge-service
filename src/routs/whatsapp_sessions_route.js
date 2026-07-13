const express = require("express");
const router = express.Router();
exports.router = router;
const validateClient = require("../middlewere/validate_whats_app_clinet");
const validateApiSecret = require("../middlewere/validate_api_secret");
const { sessionCreationLimiter } = require("../middlewere/rate_limiter");
const {
    validateStartWhatsAppSession, validateTerminateSession, validateUpdateSessionName
} = require("../middlewere/validate.js");

const {
    getLastWhatsAppQrCode,restartWhatsAppSession,startWhatsAppSession,terminateWhatsAppSession,updateSessionName,
} = require("../controller/whatsapp_sessions_controller.js");

router.use(validateApiSecret);

// session routes
router.route("/get-last-qr-code").get(validateClient, getLastWhatsAppQrCode);
router.route("/restart-whatsapp-session").post(validateClient, restartWhatsAppSession);
router.route("/start-whatsapp-session").post(sessionCreationLimiter, validateStartWhatsAppSession, startWhatsAppSession);
router.route("/terminate-whatsapp-session").post(validateTerminateSession, terminateWhatsAppSession);
router.route("/update-session-name").post(validateUpdateSessionName, updateSessionName);
router.route("/qr").get(getLastWhatsAppQrCode);


module.exports = router;
