const AutoReply = require("../models/auto-reply_model.js");
const errorResponse = require("../utils/response_handel/error_handeler");
const successResponse = require("../utils/response_handel/success_handeler");

// @desc Create a new auto-reply
// @route POST /chat/auto-reply/create
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
// @body {"triggers": ["hello", "hi"], "responseType": "text", "responseContent": "Hello! How can I assist you?", "delay": 2}
exports.createAutoReply = async (req, res) => {
    try {
        const {triggers, responseType, responseContent, delay} = req.body;
        const userId = req.headers["x-user-id"];

        if (!triggers || triggers.length === 0) return errorResponse(res, "Triggers are required", 400, "Missing triggers");
        if (!responseContent) return errorResponse(res, "Response content is required", 400, "Missing response content");

        const newAutoReply = new AutoReply({userId, triggers, responseType, responseContent, delay});

        const savedAutoReply = await newAutoReply.save();

        return successResponse(res, savedAutoReply, 201, "Auto-reply created successfully");

    } catch (e) {
        return errorResponse(res, e.message, 500, "Auto-reply not created");
    }
};

// @desc Get all auto-replies for a user
// @route GET /chat/auto-reply/get-all
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
exports.getAutoReplies = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];

        const autoReplies = await AutoReply.find({userId});

        return successResponse(res, autoReplies, 200, "Auto-replies retrieved successfully");

    } catch (e) {
        return errorResponse(res, e.message, 500, "Failed to retrieve auto-replies");
    }
};

// @desc Update an auto-reply
// @route POST /chat/auto-reply/update
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
// @body {"id" : "","triggers": ["hello", "hi"], "responseType": "text", "responseContent": "Hello! How can I assist you?", "delay": 2, "isActive": true}
exports.updateAutoReply = async (req, res) => {
    try {
        const {triggers, responseType, responseContent, delay, isActive} = req.body;
        const userId = req.headers["x-user-id"];
        const autoReplyId = req.body.id;

        if (!autoReplyId) return errorResponse(res, "Auto-reply ID is required", 400, "Missing auto-reply ID");

        const autoReplay = await AutoReply.findOne({userId, _id: autoReplyId});

        if (!autoReplay) return errorResponse(res, "Auto-reply not found or unauthorized", 404, "Update failed");

        const updatedAutoReply = await AutoReply.findOneAndUpdate({_id: autoReplyId, userId}, {
            triggers, responseType, responseContent, delay, isActive
        }, {new: true, runValidators: true});

        if (!updatedAutoReply) return errorResponse(res, "Auto-reply not found or unauthorized", 404, "Update failed");

        return successResponse(res, updatedAutoReply, 200, "Auto-reply updated successfully");

    } catch (e) {
        return errorResponse(res, e.message, 500, "Auto-reply not updated");
    }
};

// @desc Delete an auto-reply
// @route POST /chat/auto-reply/delete
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
// @body {"id" : ""}
exports.deleteAutoReply = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        const autoReplyId = req.body.id;

        if (!autoReplyId) return errorResponse(res, "Auto-reply ID is required", 400, "Missing auto-reply ID");

        const autoReplay = await AutoReply.findOne({userId, _id: autoReplyId});

        if (!autoReplay) return errorResponse(res, "Auto-reply not found or unauthorized", 404, "Delete failed");

        const deletedAutoReply = await AutoReply.findOneAndDelete({_id: autoReplyId, userId});

        if (!deletedAutoReply) return errorResponse(res, "Auto-reply not found or unauthorized", 404, "Delete failed");

        return successResponse(res, null, 200, "Auto-reply deleted successfully");

    } catch (e) {
        return errorResponse(res, e.message, 500, "Auto-reply not deleted");
    }
};
