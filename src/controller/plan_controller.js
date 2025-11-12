const Plan = require('../models/plan_model.js');
const errorResponse = require("../utils/response_handel/error_handeler");
const successResponse = require("../utils/response_handel/success_handeler");

// @desc get all plans
// @route get /plan/get-all
exports.getAllPlans = async (req, res) => {
    try {

        const plans = await Plan.find()

        return successResponse(res, plans, 200, "Plans found successfully");
    } catch (e) {
        return errorResponse(res, e.message, 500, "Plans not found");
    }
}

// @desc get plan by id
// @route get /plan/get-plan
// @boy {"id" : "0"}
exports.getPlanById = async (req, res) => {
    try {

        const plan = await Plan
            .findById(req.body.id);

        if (!plan) {
            return errorResponse(res, "Plan not found", 404, "Plan not found");
        }

        return successResponse(res, {data: plan}, 200, "Plan found successfully");

    } catch (e) {
        return errorResponse(res, e.message, 500, "Plan not found");
    }
}

// @desc add plan
// @route post /plan/add-plan
// @body {"title" : "plan name", "description" : "This is description", "features": ["Feature 1", "Feature 2"], "price": 100, "duration" : 30}
exports.addPlan = async (req, res) => {
    try {

        const plan = await Plan.create(req.body);

        return successResponse(res, {
            plan
        }, 200, "Plan added successfully");

    } catch (e) {
        return errorResponse(res, e.message, 500, "Plan not added");
    }
}

// @desc delete plan
// @route delete /plan/delete-plan
// @body {"id" : "0"}
exports.deletePlan = async (req, res) => {
    try {

        const plan = await Plan.findByIdAndDelete(req.body.id);

        if (!plan) {
            return errorResponse(res, "Plan not found", 404, "Plan not found");
        }

        return successResponse(res, null, 200, "Plan deleted successfully");
    } catch (e) {
        return errorResponse(res, e.message, 500, "Plan not deleted");
    }
}


// @desc subscribe user to plan
// @route post /plan/subscribe-plan
// @header {"x-user-id" : "{{user_id}}", "x-instance-secret" : "{{user_secret}}", "api-secret" : "{{api_secret}}"}
// @body {"plan_id" : "0", "user_id" : "0"}
exports.subscribePlanUser = async (req, res) => {
    try {
        const plan = await Plan.findById(req.body.plan_id);
        if (!plan) {
            return errorResponse(res, "Plan not found", 404, "Plan not found");
        }

        const user = await User.findById(req.body["user_id"]);
        if (!user) {
            return errorResponse(res, "User not found", 404, "User not found");
        }

        user.subscriptionPlan = plan._id;

        const date = new Date();
        date.setDate(date.getDate() + plan.duration);
        user.endSubscription = date;

        const userUpdate = await user.save();
        return successResponse(res, { user: userUpdate, plan }, 200, "User subscribed successfully");
    } catch (e) {
        return errorResponse(res, e.message, 500, "Failed to subscribe user");
    }
};