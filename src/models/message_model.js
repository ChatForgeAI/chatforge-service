const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    contactId: {type: mongoose.Schema.Types.ObjectId, ref: "Contact", required: false, default: null},
    templateId: {type: mongoose.Schema.Types.ObjectId, ref: "TemplateMessage", required: false, default: null},
    content: {type: String, required: true},
    status: {type: String, enum: ["pending", "sent", "failed"], default: "pending"},
    failureReason: {type: String, default: null},
    createdAt: {type: Date, default: Date.now},
    message_id: {type: String, required: true}
});

module.exports = mongoose.model("Message", MessageSchema);
