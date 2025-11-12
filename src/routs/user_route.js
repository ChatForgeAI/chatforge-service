const express = require("express");
const router = express.Router();

const {
    getAllUsers,getWhatsAppSessions, deleteUser
} = require("../controller/user_controller");
const {protect} = require('../controller/auth_controller')
const validateApiSecret = require("../middlewere/validate_api_secret");

router.use(validateApiSecret);
router.use(protect);

// User routes
router.route("/all").get(getAllUsers)
router.route("/whatsapp-sessions").get(getWhatsAppSessions)
router.route("/delete").post(deleteUser)

module.exports = router;