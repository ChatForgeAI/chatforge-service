function sendErrorResponse(res, data, statusCode = 500, message = "fail") {
	return res.status(statusCode).json({status: false, message, data});
}

module.exports = sendErrorResponse;