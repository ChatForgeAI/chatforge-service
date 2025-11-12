const CommonQuestion = require('../models/common_questions.js');
const errorResponse = require("../utils/response_handel/error_handeler");
const successResponse = require("../utils/response_handel/success_handeler");

// @desc get all questions
// @route get /question/get-all
exports.getAllQuestions = async (req, res) => {
    try {

        const questions = await CommonQuestion.find()

        return successResponse(res, questions, 200, "Common questions found successfully");
    } catch (e) {
        return errorResponse(res, e.message, 500, "Common questions not found");
    }
}

// @desc get question by id
// @route get /question/get-one
exports.getQuestionById = async (req, res) => {
    try {

        const question = await CommonQuestion
            .findById(req.body.id);

        if (!question) {
            return errorResponse(res, "Question not found", 404, "Question not found");
        }

        return successResponse(res, { data: question }, 200, "Question found successfully");

    } catch (e) {
        return errorResponse(res, e.message, 500, "Question not found");
    }
}

// @desc add question
// @route post /question/add-question
exports.addQuestion = async (req, res) => {
    try {

        const questions = await CommonQuestion.create(req.body);

        return successResponse(res, {
            questions
        }, 200, "Question added successfully");

    } catch (e) {
        return errorResponse(res, e.message, 500, "Question not added");
    }
}

// @desc delete question
// @route delete /question/delete
exports.deleteQuestion = async (req, res) => {
    try {

        const question = await CommonQuestion.findByIdAndDelete(req.body.id);

        if (!question) {
            return errorResponse(res, "Question not found", 404, "Question not found");
        }

        return successResponse(res, null, 200, "Question deleted successfully");
    } catch (e) {
        return errorResponse(res, e.message, 500, "Question not deleted");
    }
}
