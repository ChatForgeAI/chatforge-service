const errorResponse = require("../utils/response_handel/error_handeler");
const successResponse = require("../utils/response_handel/success_handeler");
const MessageTemplate = require("../models/template_message_model")

// @desc get all template messages for user
// @route get /chat/get-all
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
exports.getAllTemplateMessages = async (req, res) => {
    try {
        const templateMessages = await MessageTemplate.find({userId: req.headers['x-user-id']});

        return successResponse(res, templateMessages, 200, "Template messages found successfully")
    } catch (e) {
        return errorResponse(res, e.message, 500, "Template messages not found")
    }
}

// @desc get template message by id
// @route get /chat/get-template-message
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
// @body {"template_message_id": "{{template_message_id}}"}
exports.getTemplateMessageById = async (req, res) => {
    try {
        const templateMessage = await MessageTemplate.findOne({
            userId: req.headers['x-user-id'], _id: req.body.template_message_id
        });
        if (!templateMessage) {
            return errorResponse(res, null, 404, "Template message not found")
        }

        return successResponse(res, templateMessage, 200, "Template message found successfully")

    } catch (e) {
        return errorResponse(res, e.message, 500, "Template message not found")
    }
}

// @desc save new template message
// @route post /chat/save-new-template-message
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
// @body {"name": "Order Confirmation", "content": "Hello {{name}}, your order #{{order_id}} is confirmed!", "variables": ["name", "order_id"]}
exports.saveNewTemplateMessage = async (req, res) => {
    try {
        const {name, content, variables} = req.body;
        const userId = req.headers["x-user-id"];

        // Validate that all variables exist in the content
        const missingVariables = variables.filter((variable) => !new RegExp(`{{\\s*${variable}\\s*}}`).test(content));

        if (missingVariables.length > 0) {
            return errorResponse(res, `Missing variables in content: ${missingVariables.join(", ")}`, 400, "Variables not found in content");
        }

        // Create new template
        const newTemplate = new MessageTemplate({
            userId, name, content, variables: variables || []
        });

        // Save to database
        const savedTemplate = await newTemplate.save();

        if (!savedTemplate) {
            return errorResponse(res, null, 500, "Template message not saved");
        }

        return successResponse(res, savedTemplate, 201, "Template message saved successfully");

    } catch (e) {
        return errorResponse(res, e.message, 500, "Template message not saved");
    }

}

// @desc update template message by id
// @route post /chat/update-template-message
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
// @body {"template_message_id": "{{template_message_id}}", "name": "Order Confirmation", "content": "Hello {{name}}, your order #{{order_id}} is confirmed!", "variables": ["name", "order_id"]}
exports.updateTemplateMessageById = async (req, res) => {
    try {
        const {name, content, variables} = req.body;
        const userId = req.headers["x-user-id"];
        const templateMessageId = req.body.template_message_id;

        // Validate that all variables exist in the content
        const missingVariables = variables.filter((variable) => !new RegExp(`{{\\s*${variable}\\s*}}`).test(content));

        if (missingVariables.length > 0) {
            return errorResponse(res, `Missing variables in content: ${missingVariables.join(", ")}`, 400, "Variables not found in content");
        }

        const template = await MessageTemplate.findOne({
            userId, _id: templateMessageId
        });

        if (!template) {
            return errorResponse(res, null, 404, "Template message not found");
        }

        if (template.userId != userId) {
            return errorResponse(res, null, 403, "You are not allowed to update this template message");
        }

        // Update template
        const updatedTemplate = await MessageTemplate.findOneAndUpdate({userId, _id: templateMessageId}, {
            name, content, variables: variables || []
        }, {new: true});

        if (!updatedTemplate) {
            return errorResponse(res, null, 404, "Template message not found");
        }

        return successResponse(res, updatedTemplate, 200, "Template message updated successfully");

    } catch (e) {
        return errorResponse(res, e.message, 500, "Template message not updated");
    }

}

// @desc delete template message by id
// @route post /chat/delete
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
// @body {"template_message_id": "{{template_message_id}}"}
exports.deleteTemplateMessageById = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        const templateMessageId = req.body.template_message_id;

        const template = await MessageTemplate.findOne({
            userId, _id: templateMessageId
        });

        if (!template) {
            return errorResponse(res, null, 404, "Template message not found");
        }

        // check if tepmlete owner by user
        if (template.userId != userId) {
            return errorResponse(res, null, 403, "You are not allowed to delete this template message");
        }

        // Delete template
        const messageTemplate = await MessageTemplate.findOneAndDelete({userId, _id: templateMessageId});

        if (!messageTemplate) {
            return errorResponse(res, null, 404, "Template message not found");
        }

        return successResponse(res, null, 200, "Template message deleted successfully");

    } catch (e) {
        return errorResponse(res, e.message, 500, "Template message not deleted");
    }

}