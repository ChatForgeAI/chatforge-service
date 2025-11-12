const mongoose = require('mongoose');

const whatsAppSchema = new mongoose.Schema({
    // name: {type: String, required: true},
    // email: {type: String, required: true, unique: true},
    // password: {type: String, required: true},
    // instanceSecret: {type: String, required: true},
    // qrCode: {type: String, required: false, default: null},
    // role: {
    //     type: String, enum: ["admin", "user", "manager"], default: "user"
    // },
    // instanceStatus: {
    //     type: String,
    //     enum: ["initialize", "qr", "loading_screen", "authenticated", "ready", "disconnected", "auth_failure"],
    //     default: "initialize"
    // },
    // subscriptionPlan: {type: mongoose.Schema.Types.ObjectId, ref: "Plan", default: null},
    // endSubscription: {type: Date, default: null},
    // createdAt: {type: Date, default: Date.now}

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
    qrCode: {
        type: String,
        required: false,
        default: null
    },
    sessionStatus: {
        type: String,
        enum: ["initialize", "qr", "loading_screen", "authenticated", "ready", "disconnected", "auth_failure"],
        default: "initialize"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("WhatsApp-session", whatsAppSchema);