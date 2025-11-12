const express = require("express");
const router = express.Router();

const {
    registerUser,
    loginUser,
} = require("../controller/auth_controller");
const validateWhatsAppClient = require("../middlewere/validate_whats_app_clinet");
const validateApiSecret = require("../middlewere/validate_api_secret");
const {loginValidator, registerValidator} = require("../utils/validators/authValidator");
router.use(validateApiSecret);

// Auth routs
router.route("/login").post(loginValidator, loginUser)
router.route("/register").post(registerValidator, registerUser)

// router.route("/start-whatsapp-session").post(startWhatsAppSession)
// router.route("/subscribe-plan").post(subscribePlanUser)
// router.route("/update-session-name").post(updateSessionName)

// router.use(validateWhatsAppClient)
// router.route("/terminate-whatsapp-session").post(terminateWhatsAppSession)
// router.route("/qr").get(getLastWhatsAppQrCode)
// router.route("/restart-whatsapp-session").get(restartWhatsAppSession)
// router.route("/terminate").post(terminateWhatsAppSession)

module.exports = router;