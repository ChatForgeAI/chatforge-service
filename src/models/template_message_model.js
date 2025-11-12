const mongoose = require('mongoose')

const TemplateMessageSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    content: { type: String, required: true },
    variables: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Template-Message", TemplateMessageSchema);
