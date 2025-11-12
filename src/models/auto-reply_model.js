const mongoose = require('mongoose');

const AutoReplySchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    triggers: [{type: String, required: true, trim: true}],
    responseType: {
        type: String,
        enum: ["text", "image"],
        default: "text"
    },
    responseContent: {type: String, required: true},
    delay: {type: Number, default: 0},
    isActive: {type: Boolean, default: true},
    createdAt: {type: Date, default: Date.now}
});

module.exports = mongoose.model("Auto-Reply", AutoReplySchema);
