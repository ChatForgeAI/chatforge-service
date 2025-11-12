const express = require("express");
const router = express.Router();

const {
    createGroup,
    editGroupInfo,
    getAllGroups,
    getGroupById,
    getGroupMessages,
    sendImageToGroup,
    sendLocationToGroup,
    sendMessageToGroup,
    removeParticipants,
    addParticipants,
    deleteGroup,
    leaveGroup
} = require("../controller/group_controller");

const validateClient = require("../middlewere/validate_whats_app_clinet");
const validateApiSecret = require("../middlewere/validate_api_secret");
const {
    addParticipantValidator,
    createGroupValidator,
    deleteGroupValidator,
    editGroupValidator,
    getGroupInfoAndMessagesByIdValidator,
    leaveGroupValidator,
    removeParticipantsValidator,
    sendImageValidator,
    sendLocationValidator,
    sendMessageToGroupValidator
} = require("../utils/validators/groupValidator")

router.use(validateApiSecret);
router.use(validateClient);

// Group routs
router.route("/get-groups").get(getAllGroups)
router.route("/get-group").get(getGroupInfoAndMessagesByIdValidator, getGroupById)
router.route("/get-group-messages").get(getGroupInfoAndMessagesByIdValidator, getGroupMessages)
router.route("/send-message-group").post(sendMessageToGroupValidator, sendMessageToGroup)
router.route("/send-image-group-url").post(sendImageValidator, sendImageToGroup)
router.route("/send-location-group").post(sendLocationValidator, sendLocationToGroup)
router.route("/create-group").post(createGroupValidator, createGroup)
router.route("/edit-group-info").patch(editGroupValidator, editGroupInfo)
router.route("/remove-participants").patch(removeParticipantsValidator, removeParticipants)
router.route("/add-participants").patch(addParticipantValidator, addParticipants)
router.route("/leave-group").delete(leaveGroupValidator, leaveGroup)
router.route("/delete-group").delete(deleteGroupValidator, deleteGroup)
module.exports = router;