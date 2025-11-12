const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    name: {type: String, required: false},
    phoneNumber: {type: String, required: true, unique: true},
    createdAt: {type: Date, default: Date.now}
});

module.exports = mongoose.model("Contact", ContactSchema);