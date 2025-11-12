const multer = require('multer');
const errorResponse = require("../utils/response_handel/error_handeler");


// Configure multer for handling file uploads
const upload = multer({storage: multer.memoryStorage()});


// Define the upload middleware
exports.uploadFile = async (req, res, next, fileName, typeFiled = ["jpg", "png", "jpeg", "png"]) => {
	upload.single(fileName)(req, res, (err) => {
		if(err) {
			return errorResponse(res, err.message, 500)
		}

		const file = req.file;
		if(file == null) {
			return errorResponse(res, "Please upload a file", 400)
		}

		if(!typeFiled.includes(req.file["originalname"].toString().split(".")[1].toLocaleLowerCase())) {
			return errorResponse(res, "Please upload a valid file type", 400)
		}

		// save image in file system ./public/images
		const fs = require('fs');
		const path = require('path');
		const filePath = path.join(__dirname, '../public/images/' + file.originalname);
		fs.writeFile(filePath, file.buffer, (err) => {
			if(err) {
				return errorResponse(res, err.message, 500)
			}
		});

		req.body.fileName = file.originalname;
	});
};