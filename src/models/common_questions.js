const mongoose = require('mongoose');

const CommonQuestion = new mongoose.Schema({
    title: { type: String, required: false },
    description: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("CommonQuestion", CommonQuestion);