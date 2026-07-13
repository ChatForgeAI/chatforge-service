const rateLimit = require('express-rate-limit');

// Global rate limiter: 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: false, message: "Too many requests, please try again later", data: null },
    keyGenerator: (req) => {
        return req.headers['x-forwarded-for'] || req.ip;
    }
});

// Strict limiter for session creation: 5 requests per 15 minutes per IP
const sessionCreationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: false, message: "Too many session creation requests, please try again later", data: null },
    keyGenerator: (req) => {
        return req.headers['x-forwarded-for'] || req.ip;
    }
});

// Webhook endpoint: higher limit since Telegram sends many requests
const webhookLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: false, message: "Too many webhook requests", data: null },
    keyGenerator: (req) => {
        return req.params.botToken || req.ip;
    }
});

module.exports = { globalLimiter, sessionCreationLimiter, webhookLimiter };
