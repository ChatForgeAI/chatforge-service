require('dotenv').config()
const errorResponse = require("../utils/response_handel/error_handeler");

const validateApiSecret = (req, res, next) => {
	if(req.headers["api-secret"] !== process.env.API_SECRET) {
		return errorResponse(res, "Not auth", 401, "Not auth")
	}
	next()
}

module.exports = validateApiSecret