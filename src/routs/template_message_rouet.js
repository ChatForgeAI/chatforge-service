const express = require("express");
const router = express.Router();
const validateClient = require("../middlewere/validate_whats_app_clinet");
const validateApiSecret = require("../middlewere/validate_api_secret");

const {
    deleteTemplateMessageById,
    getAllTemplateMessages,
    getTemplateMessageById,
    saveNewTemplateMessage,
    updateTemplateMessageById
} = require("../controller/message_template_controller");

router.use(validateApiSecret);
// router.use(validateClient);

// template message routes
router.route("/delete").delete(deleteTemplateMessageById);
router.route("/get-all").get(getAllTemplateMessages);
router.route("/get-template-message").get(getTemplateMessageById);
router.route("/save-new-template-message").post(saveNewTemplateMessage);
router.route("/update-template-message").post(updateTemplateMessageById);

module.exports = router;