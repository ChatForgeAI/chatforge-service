let {clientsList} = require("../services/whats_app_service/whatsapp_client.js");
const errorResponse = require("../utils/response_handel/error_handeler");


// validate client
const validateWhatsAppSession = async (req, res, next) => {
    try {
        const session_id = req.headers["session_id"];
        const session_secret = req.headers["session-secret"];

        if (!session_id || !session_secret) {
            return errorResponse(res, "Client not found", 404, "Client not found")
        }

        const session = clientsList.find(
            (client) => client.session_id == session_id && client.session_secret == session_secret);

        if (!session) {
            return errorResponse(res, "Client not found", 404, "Client not found")
        }
        req.body.whatsAppSession = session;
        return next()
            
    } catch (e) {
        return errorResponse(res, e.message, 500, "Client not found")
    }
}

module.exports = validateWhatsAppSession