const errorResponse = require("../utils/response_handel/error_handeler");
const successResponse = require("../utils/response_handel/success_handeler");

// @desc get account info
// @route get /account/info
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
exports.getAccountInfo = async (req, res) => {
    try {
        const accountInfo = await req.body.whatsAppSession.client.info;

        return successResponse(res, accountInfo, 200, "Account info found successfully")

    } catch (e) {
        return errorResponse(res, e.message, 500, "Account info not found")
    }
}

// @desc set display name for user
// @route post /account/set-display-name
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
// @body {"display_name" : "Abd Alftah"}
exports.setDisplayName = async (req, res) => {
    try {
        await req.body.whatsAppSession.client.setDisplayName(req.body["display_name"]);
        return successResponse(res, null, 200, "Display name set successfully")

    } catch (e) {
        return errorResponse(res, e.message, 500, "Display name not set")
    }
}

// @desc set status for user
// @route post /account/set-status
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
// @body {"status" : "new status"}
exports.setStatus = async (req, res) => {
    try {
        await req.body.whatsAppSession.client.setStatus(req.body["status"]);

        return successResponse(res, null, 200, "Status set successfully")

    } catch (e) {
        return errorResponse(res, e.message, 500, "Status not set")
    }
}