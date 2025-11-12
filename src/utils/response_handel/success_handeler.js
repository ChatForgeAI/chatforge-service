function sendSuccessResponse(res, data, statusCode = 200, message = "success") {
	let response = {
		status: true,
		message: message,
	}
	if (data) {
		response.data = data
	}

	return res.status(statusCode).json(response);
}

module.exports = sendSuccessResponse;