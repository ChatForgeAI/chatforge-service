const express = require("express");
const router = express.Router();
const validateClient = require("../middlewere/validate_whats_app_clinet");

const {setDisplayName, setStatus, getAccountInfo} = require("../controller/account_controller");
const validateApiSecret = require("../middlewere/validate_api_secret");
const {setDisplayNameValidator, statusValidator} = require("../utils/validators/accountValidator");
router.use(validateApiSecret);
router.use(validateClient);

// Account routs
router.route("/set-display-name").post(setDisplayNameValidator, setDisplayName)
router.route("/set-status").post(statusValidator, setStatus)
router.route("/info").get(getAccountInfo)

module.exports = router;