const express = require("express");
const router = express.Router();
const validateClient = require("../middlewere/validate_whats_app_clinet");
const validateApiSecret = require("../middlewere/validate_api_secret");

const {
    createAutoReply, deleteAutoReply, getAutoReplies, updateAutoReply
} = require("../controller/auto_reply_controller");

router.use(validateApiSecret);
// router.use(validateClient);

// Auto-reply routs
router.route("/create").post(createAutoReply)
router.route("/delete").post(deleteAutoReply)
router.route("/get-all").get(getAutoReplies)
router.route("/update").post(updateAutoReply)


module.exports = router;