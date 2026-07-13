const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "channel-schema",
        required: true
    },
    platform: {
        type: String,
        enum: ["whatsapp", "telegram"],
        required: true
    },
    chatId: {
        type: String,
        required: true
    },
    senderId: {
        type: String,
        required: true
    },
    senderName: {
        type: String,
        default: ""
    },
    message: {
        type: String,
        default: ""
    },
    messageType: {
        type: String,
        enum: ["text", "photo", "document", "voice", "video", "sticker", "other"],
        default: "text"
    },
    direction: {
        type: String,
        enum: ["incoming", "outgoing"],
        required: true
    },
    fileId: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

messageSchema.index({ sessionId: 1, chatId: 1, createdAt: -1 });

module.exports = mongoose.model("messages", messageSchema);
