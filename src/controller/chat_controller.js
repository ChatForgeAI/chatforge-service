const errorResponse = require("../utils/response_handel/error_handeler");
const successResponse = require("../utils/response_handel/success_handeler");
const {MessageMedia, Location} = require("whatsapp-web.js");
const Message = require("../models/message_model.js")
const TemplateMessage = require("../models/template_message_model.js")
const fs = require('fs');
const path = require('path');
const {clientsList} = require("../services/whats_app_service/whatsapp_client.js");

// @desc get all chat for user by phone number
// @route get /chat/get-all-chats
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
exports.getAllChat = async (req, res) => {
    try {
        const chats = await req.body.whatsAppSession.client.getChats();

        const chatList = [];
        for (let i = 0; i < chats.length; i++) {
            const chat = chats[i];
            const lastMessage = await chat.fetchMessages({
                limit: 1,
            });
            chat.last_message = lastMessage[0] ? {
                body: lastMessage[0].body ?? '', timestamp: lastMessage[0].timestamp,
            } : null;
            chat.profile_picture = null;
            chatList.push(chat);
        }
        res.send(chatList);

    } catch (e) {
        return errorResponse(res, e.message, 500, "Chats not found")
    }
}

// @desc get all chat for user by phone number
// @route get /chat/get-all-chats-by-phone
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
exports.getChatByPhone = async (req, res) => {
    try {

        const chats = await req.body.whatsAppSession.client.getChats();
        const chatList = [];
        for (let i = 0; i < chats.length; i++) {
            const chat = chats[i];
            const lastMessage = await chat.fetchMessages({
                limit: 1,
            });
            chat.last_message = lastMessage[0] ? {
                body: lastMessage[0].body ?? '', timestamp: lastMessage[0].timestamp,
            } : null;
            chat.profile_picture = null;
            chatList.push(chat);
        }

        res.send(chatList);
        // return successResponse(res, JSON.stringify(chatList), 200, "Chats found successfully")

    } catch (e) {
        return errorResponse(res, e.message, 500, "Chats not found")
    }
}

// @desc get all messages for user by phone number
// @route get /chat/get-all-message-by-phone
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
// @body {"phone_number" : "972598045064"}
exports.getMessagesByPhone = async (req, res) => {
    try {
        const chat = await req.body.whatsAppSession.client.getChatById(req.body["phone_number"] + '@c.us');
        const messages = await chat.fetchMessages({limit: 1000});
        for (let i = 0; i < messages.length; i++) {
            let attachmentData = null;
            const msg = messages[i];
            if (msg.hasMedia) {
                attachmentData = await msg.downloadMedia();
            }
            messages[i].attachmentData = attachmentData;
        }
        return successResponse(res, {message: messages}, 200, "Messages found successfully")

    } catch (e) {
        return errorResponse(res, e.message, 500, "Messages not found")
    }
}

// @desc Send a message (with or without a template)
// @route POST /chat/send-message
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
// @body {"phone_number": "972598045064", "caption": "Hello!", "template_id": "65f7a8d5b1234567890abcd", "variables": {"name": "John", "order_id": "12345"}}
exports.sendMessage = async (req, res) => {
    try {
        const {phone_number, caption, template_id, variables} = req.body;
        const userId = req.headers["x-user-id"];

        let finalMessage = caption;

        // If template_id is provided, fetch the template and replace variables
        if (template_id) {
            const template = await TemplateMessage.findOne({_id: template_id, userId});

            if (!template) {
                return errorResponse(res, "Template not found", 404, "Invalid template ID");
            }

            // Ensure all required variables are provided
            const missingVariables = template.variables.filter(v => !(variables && variables[v]));
            if (missingVariables.length > 0) {
                return errorResponse(res, `Missing variables: ${missingVariables.join(", ")}`, 400, "Variables not provided");
            }

            // Replace placeholders (e.g., {{name}}) with actual values
            finalMessage = template.content.replace(/{{\s*(\w+)\s*}}/g, (_, varName) => variables[varName] || '');
        }

        // Send message using WhatsApp session
        const chat = await req.body.whatsAppSession.client.getChatById(`${phone_number}@c.us`);
        const response = await chat.sendMessage(finalMessage);

        return successResponse(res, {
            status: "success",
            message: `Message successfully sent to ${phone_number}`,
            id: response.id._serialized
        }, 200, "Message sent successfully");

    } catch (e) {
        return errorResponse(res, e.message, 500, "Message not sent");
    }
};

// @desc Send an image (with or without a template)
// @route POST /chat/send-image-url
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
// @body {"phone_number": "972598045064", "caption": "Hello!", "template_id": "65f7a8d5b1234567890abcd", "variables": {"name": "John", "order_id": "12345"}, "image": "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png"}
exports.sendImage = async (req, res) => {
    try {
        const {phone_number, caption, template_id, variables, image} = req.body;
        const userId = req.headers["x-user-id"];

        // Validate input
        if (!userId) {
            return errorResponse(res, "User ID is required in headers", 400, "Missing user ID");
        }
        if (!phone_number) {
            return errorResponse(res, "Phone number is required", 400, "Missing phone number");
        }
        if (!image) {
            return errorResponse(res, "Image URL is required", 400, "Missing image URL");
        }

        let finalCaption = caption;

        // If template_id is provided, fetch the template and replace variables
        if (template_id) {
            const template = await TemplateMessage.findOne({_id: template_id, userId});

            if (!template) {
                return errorResponse(res, "Template not found", 404, "Invalid template ID");
            }

            // Ensure all required variables are provided
            const missingVariables = template.variables.filter(v => !(variables && variables[v]));
            if (missingVariables.length > 0) {
                return errorResponse(res, `Missing variables: ${missingVariables.join(", ")}`, 400, "Variables not provided");
            }

            // Replace placeholders (e.g., {{name}}) with actual values
            finalCaption = template.content.replace(/{{\s*(\w+)\s*}}/g, (_, varName) => variables[varName] || '');
        }

        // Send image using WhatsApp session
        const chat = await req.body.whatsAppSession.client.getChatById(`${phone_number}@c.us`);
        const media = await MessageMedia.fromUrl(image);

        const response = await chat.sendMessage(media, {caption: finalCaption});

        return successResponse(res, {
            status: "success",
            message: `Image successfully sent to ${phone_number}`,
            id: response.id._serialized
        }, 200, "Image sent successfully");

    } catch (e) {
        return errorResponse(res, e.message, 500, "Image not sent");
    }
};

// @desc Remove message
// @route POST /chat/remove-message
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
// @body {"phone_number" : "972598045064", "message_id" : ""}
exports.revokeMessage = async (req, res) => {
    try {
        const {phone_number, message_id, whatsAppSession} = req.body;

        const chat = await whatsAppSession.client.getChatById(`${phone_number}@c.us`);

        // Fetch messages sent by the user
        const messages = await chat.fetchMessages({fromMe: true});

        const message = messages.find(m => m.id._serialized === message_id);

        if (!message) {
            return errorResponse(res, "Message not found", 404, "Invalid message ID");
        }

        // Delete the message
        await message.delete(true); // 'true' ensures it tries to delete for everyone

        return successResponse(res, null, 200, "Message deleted successfully");

    } catch (e) {
        return errorResponse(res, e.message, 500, "Message not deleted");
    }
};

// @desc send file to user
// @route post /chat/send-file
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
// @formdata {"phone_number" : "972598045064","caption" : "This is caption","file" : "","option" : {"files_key" : ["file"]}}
exports.sendFile = async (req, res) => {
    try {

        // Ensure a file is uploaded
        if (!req.file) {
            return errorResponse(res, "No file uploaded", 400, "File not sent");
        }

        // Get the correct file path
        const filePath = path.join(__dirname, '..', 'storage', 'upload', req.file.filename).replace("\\src", "");
        const session_id = req.headers["session_id"];
        const session_secret = req.headers["session-secret"];

        req.body.whatsAppSession = clientsList.find(
            (client) => client.session_id == session_id && client.session_secret == session_secret);

        // Load the chat
        const chat = await req.body.whatsAppSession.client.getChatById(req.body["phone_number"] + '@c.us');

        // Create media from saved file
        const media = MessageMedia.fromFilePath(filePath);

        // Send media message with caption
        const response = await chat.sendMessage(media, {caption: req.body.caption});

        // Delete the file after sending
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error("Error deleting file:", err);
            } else {
                console.log("File deleted successfully:", filePath);
            }
        });

        return successResponse(res, {
            status: 'success',
            message: `MediaMessage successfully sent to ${req.body["phone_number"]}`,
            id: response.id._serialized
        }, 200, "File sent successfully");

    } catch (e) {
        console.error("File sending error:", e);
        return errorResponse(res, e.message, 500, "File not sent");
    }
};

// @desc send location to user
// @route post /chat/send-location
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
// @body {"phone_number" : "972598045064","caption" : "This is caption","lat" : "0", "long" : "0"}
exports.sendLocation = async (req, res) => {
    try {
        const chat = await req.body.whatsAppSession.client.getChatById(req.body["phone_number"] + '@c.us');

        // Create a location object
        const latitude = Number(req.body['lat']);
        const longitude = Number(req.body['long']);


        const location = new Location(latitude, longitude, req.body.caption);

        // Send the location to the chat
        await chat.sendMessage(location);

        return successResponse(res, null, 200, `Location sent successfully to ${req.params["phone"]}`)

    } catch (e) {
        return errorResponse(res, e.message, 500, "Location not sent")
    }
}
