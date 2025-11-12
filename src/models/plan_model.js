const mongoose = require("mongoose");

const PlanSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    features: [{ type: String }],
    price: { type: Number, required: true },
    deviceAvailable: { type: Number, required: true },
    duration: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Plan", PlanSchema);
