const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    name: {
        type: String,
        required: true
    },
    sessionSecret: {
        type: String,
        required: true
    },
    whatsappQrCode: {
        type: String,
        required: false,
        default: null
    },
    whatsappSessionStatus: {
        type: String,
        enum: ["initialize", "qr", "loading_screen", "authenticated", "ready", "disconnected", "auth_failure"],
        default: "initialize"
    },
    telegramBotToken: {
        type: String,
        required: false,
        default: null
    },
    telegramBotMode: {
        type: String,
        enum: ["polling", "webhook"],
        default: "polling"
    },
    telegramBotStatus: {
        type: String,
        enum: ["initialize", "ready", "stopped", "error"],
        default: "initialize"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("channel-schema", channelSchema);