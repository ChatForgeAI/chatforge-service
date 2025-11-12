const express = require("express");
const router = express.Router();

const {
    getContacts, getContact, validateNumber, getContactProfilePic, saveNewContact, savePreviousContact
} = require("../controller/contact_controller");
const validateClient = require("../middlewere/validate_whats_app_clinet");
const validateApiSecret = require("../middlewere/validate_api_secret");
const {contactValidator} = require("../utils/validators/contactValidator");

router.use(validateApiSecret);
// router.use(validateClient);

// Contact routs
router.route("/get-contacts").get(getContacts)
router.route("/get-contact-by-phone").get(contactValidator, getContact)
router.route("/getContactProfilePic").get(contactValidator, getContactProfilePic)
router.route("/validate-number-user-whats-app").get(contactValidator, validateNumber)
router.route("/save-new-contact").post(saveNewContact)
router.route("/save-previous-contact").post(savePreviousContact)

module.exports = router;