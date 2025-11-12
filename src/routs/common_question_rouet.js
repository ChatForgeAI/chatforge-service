const express = require("express");
const router = express.Router();

const {
    addQuestion, deleteQuestion, getAllQuestions, getQuestionById
} = require("../controller/common_questions_controller");

const {
    protect
} = require("../controller/auth_controller");

// Common question routs
router.route("/add-question").post((req, res, next) => protect(req, res, next, ['manager', 'admin']), addQuestion)
router.route("/delete").delete((req, res, next) => protect(req, res, next, ['manager']), deleteQuestion)
router.route("/get-all").get(getAllQuestions)
router.route("/get-one").get(getQuestionById)


module.exports = router;