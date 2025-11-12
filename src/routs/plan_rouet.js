const express = require("express");
const router = express.Router();

const {
    addPlan, deletePlan, getAllPlans, getPlanById
} = require("../controller/plan_controller");

const {
    protect
} = require("../controller/auth_controller");

const {addPlanValidator, deletePlanValidator} = require("../utils/validators/planValidator");

// Plan routs
router.route("/add-plan").post((req, res, next) => protect(req, res, next, ['manager', 'admin']), addPlanValidator, addPlan)
router.route("/delete-plan").delete((req, res, next) => protect(req, res, next, ['manager']), deletePlanValidator, deletePlan)
router.route("/get-all").get(getAllPlans)
router.route("/get-plan").get(getPlanById)


module.exports = router;