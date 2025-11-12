const express = require("express");
const router = express.Router();
const multer = require('multer');

const {
    getChatByPhone, getAllChat, getMessagesByPhone, sendMessage, sendImage, revokeMessage, sendLocation, sendFile
} = require("../controller/chat_controller");
const validateClient = require("../middlewere/validate_whats_app_clinet");
const validateApiSecret = require("../middlewere/validate_api_secret");
const {
    getMessagesByPhoneValidator, revokeMessageValidator, sendImageValidator, sendLocationValidator, sendMessageValidator
} = require("../utils/validators/chatValidator");


router.use(validateApiSecret);
router.use(validateClient);

// Configure Multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'storage/upload'); // Ensure this directory exists
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });


// Chat routs
router.route("/get-all-chats").get(getAllChat)
router.route("/get-all-chats-by-phone").get(getMessagesByPhoneValidator, getChatByPhone)
router.route("/get-all-message-by-phone").get(getMessagesByPhone)
router.route("/send-message").post(sendMessageValidator, sendMessage)
router.route("/send-image-url").post(sendImageValidator, sendImage)
router.route("/remove-message").post(revokeMessageValidator, revokeMessage)
router.route("/send-location").post(sendLocationValidator, sendLocation)

// create new rout for send file
router.route("/send-file").post(upload.single('file'), sendFile);

module.exports = router;