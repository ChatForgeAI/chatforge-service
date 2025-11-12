const errorResponse = require("../utils/response_handel/error_handeler");
const successResponse = require("../utils/response_handel/success_handeler");
const {MessageMedia, Location} = require("whatsapp-web.js");

// @desc get all groups for user
// @route get /group/get-groups
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
exports.getAllGroups = async (req, res) => {
    try {

        const allChats = await req.body.whatsAppSession.client.getChats();
        const groups = allChats.filter((chat) => chat.isGroup);

        return successResponse(res, groups, 200, "Groups found successfully");
    } catch (e) {
        return errorResponse(res, e.message, 500, "Groups not found");
    }
};

// @desc get group by id
// @route get /group/get-group
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
// @boy {"id" : "0"}
exports.getGroupById = async (req, res) => {
    try {

        const allChats = await req.body.whatsAppSession.client.getChats();
        const group = allChats
            .filter((c) => c.isGroup)
            .find((g) => g.id._serialized === req.body.id + "@" + g.id.server);

        return successResponse(res, {data: group}, 200, "Group found successfully");
    } catch (e) {
        return errorResponse(res, e.message, 500, "Group not found");
    }
};

// @desc get group messages
// @route get /group/get-group-messages
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
// @boy {"id" : "0"}
exports.getGroupMessages = async (req, res) => {
    try {

        const allChats = await req.body.whatsAppSession.client.getChats();
        const group = allChats
            .filter((c) => c.isGroup)
            .find((g) => g.id._serialized === req.body.id + "@" + g.id.server);

        const messages = await group.fetchMessages();

        return successResponse(res, messages, 200, "Messages found successfully");
    } catch (e) {
        return errorResponse(res, e.message, 500, "Messages not found");
    }
};

// @desc send message to group
// @route post /group/send-message-group
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
// @boy {"message_id" : "0", "id" : "0", "message" : "Test message"}
exports.sendMessageToGroup = async (req, res) => {
    try {

        const options = {
            quotedMessageId: req.body['message_id'] || null, mentions: [],
        };

        const {mentioned} = req.body;

        const allChats = await req.body.whatsAppSession.client.getChats();
        const group = allChats
            .filter((c) => c.isGroup)
            .find((g) => g.id._serialized === req.body.id + "@" + g.id.server);

        if (mentioned && mentioned.length > 0) {
            for (let index = 0; index < mentioned.length; index++) {
                const contact = await req.body.whatsAppSession.client.getContactById(`${mentioned[index]}@c.us`);
                if (contact) {
                    options.mentions.push(contact);
                }
            }
        }

        await group.sendMessage(req.body.message, options);

        return successResponse(res, null, 200, "Message sent successfully");
    } catch (e) {
        return errorResponse(res, e.message, 500, "Message not sent");
    }
};

// @desc send image to group from URL
// @route get /group/send-image-group-url
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
// @body {"id" : "","caption" : "This is image from URL", "image" : "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png"}
exports.sendImageToGroup = async (req, res) => {
    try {

        const allChats = await req.body.whatsAppSession.client.getChats();
        const group = allChats
            .filter((c) => c.isGroup)
            .find((g) => g.id._serialized === req.body.id + "@" + g.id.server);

        const media = await MessageMedia.fromUrl(req.body.image);
        await group.sendMessage(media, {caption: req.body.caption});

        return successResponse(res, null, 200, "Image sent successfully");
    } catch (e) {
        return errorResponse(res, e.message, 500, "Image not sent");
    }
};

// @desc send location to group
// @route post /group/send-location-group
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
// @boy {"latitude" : "0", "longitude" : "0", "caption" : "Title", "id" : "0"}
exports.sendLocationToGroup = async (req, res) => {
    try {

        const allChats = await req.body.whatsAppSession.client.getChats();
        const group = allChats
            .filter((c) => c.isGroup)
            .find((g) => g.id._serialized === req.body.id + "@" + g.id.server);

        const location = new Location(req.body.latitude, req.body.longitude, req.body.caption);
        await group.sendMessage(location);

        return successResponse(res, null, 200, "Location sent successfully");
    } catch (e) {
        return errorResponse(res, e.message, 500, "Location not sent");
    }
};


// @desc create group
// @route post /group/create-group
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
// @boy {"name" : "group name", "participants" : ["970598045064"]}
exports.createGroup = async (req, res) => {
    try {

        const participants = req.body.participants.map((participant) => participant + '@c.us');
        const group = await req.body.whatsAppSession.client.createGroup(req.body.name, participants);

        return successResponse(res, group, 200, "Group created successfully");
    } catch (e) {
        return errorResponse(res, e.message, 500, "Group not created");
    }
};

// @desc edit group info
// @route post /group/edit-group-info
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
// @boy {"name" : "group name", "description" : "group description", "messagesAdminsOnly" : true}
exports.editGroupInfo = async (req, res) => {
    try {
        const allChats = await req.body.whatsAppSession.client.getChats();

        const group = allChats
            .filter((c) => c.isGroup)
            .find((g) => g.id._serialized === req.body.id + "@" + g.id.server);

        await group.setSubject(req.body.name);
        await group.setDescription(req.body.description);
        // change message for admin only
        await group.setMessagesAdminsOnly(req.body['messagesAdminsOnly'] || false);

        return successResponse(res, group, 200, "Group info edited successfully");
    } catch (e) {
        return errorResponse(res, e.message, 500, "Group info not edited");
    }
};

// @desc remove participant from group
// @route post /group/remove-participants
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
// @boy {"participants" : ["970598045064"], "id" : "0"}
exports.removeParticipants = async (req, res) => {
    try {

        const participants = req.body.participants;

        const allChats = await req.body.whatsAppSession.client.getChats();
        const group = allChats
            .filter((c) => c.isGroup)
            .find((g) => g.id._serialized === req.body.id + "@" + g.id.server);

        await group.removeParticipants(participants.map((p) => `${p}@c.us`))

        return successResponse(res, null, 200, "Participants removed successfully");
    } catch (e) {
        return errorResponse(res, e.message, 500, "Participants not removed");
    }
};


// @desc add participant to group
// @route post /group/add-participants
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
// @boy {"participants" : ["970598045064"], "id" : "0"}
exports.addParticipants = async (req, res) => {
    try {
        const participants = req.body.participants;

        const allChats = await req.body.whatsAppSession.client.getChats();
        const group = allChats
            .filter((c) => c.isGroup)
            .find((g) => g.id._serialized === req.body.id + "@" + g.id.server);

        const x = await group.addParticipants(participants.map((p) => `${p}@c.us`))

        return successResponse(res, null, 200, "Participants added successfully");
    } catch (e) {
        return errorResponse(res, e.message, 500, "Participants not added");
    }
}

// @desc leave group
// @route post /group/leave-group
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
// @boy {"id" : "0"}
exports.leaveGroup = async (req, res) => {
    try {

        const allChats = await req.body.whatsAppSession.client.getChats();
        const group = allChats
            .filter((c) => c.isGroup)
            .find((g) => g.id._serialized === req.bdoy.id + "@" + g.id.server);

        await group.leave();

        return successResponse(res, null, 200, "Group left successfully");
    } catch (e) {
        return errorResponse(res, e.message, 500, "Group not left");
    }
}

// @desc delete group
// @route post /group/delete-group
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
// @boy {"id" : "0"}
exports.deleteGroup = async (req, res) => {
    try {

        const allChats = await req.body.whatsAppSession.client.getChats();
        const group = allChats
            .filter((c) => c.isGroup)
            .find((g) => g.id._serialized === req.body.id + "@" + g.id.server);

        await group.delete();

        return successResponse(res, null, 200, "Group deleted successfully");
    } catch (e) {
        return errorResponse(res, e.message, 500, "Group not deleted");
    }
}