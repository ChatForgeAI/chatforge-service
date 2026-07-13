const express = require('express');
const bodyParser = require('body-parser');
const { json, urlencoded } = require("body-parser");
const routs = require("./src/routs/index");
const { handleWebhook } = require("./src/controller/telegram_sessions_controller.js");
const { webhookLimiter } = require("./src/middlewere/rate_limiter");
const env = require("dotenv");
env.config();
const dbConnection = require("./src/config/database_config");
const cors = require("cors");
const app = express();

const port = 8000;

// Middleware setup - remove duplicates
app.use(cors());
app.use(json());
app.use(urlencoded({ extended: false }));

dbConnection();

// Health check route
app.get('/health', async (req, res) => {
    const mongoose = require('mongoose');
    const dbState = mongoose.connection.readyState;
    const dbStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

    res.status(200).json({
        status: true,
        message: 'Service is healthy',
        data: {
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            db: dbStates[dbState] || 'unknown',
            memory: process.memoryUsage()
        }
    });
});

// Define root route BEFORE your main routes
app.get('/', (req, res) => {
    console.log("Root route hit");
    return res.send("Server run successfully");
});

// Telegram webhook receiver (no auth - called by Telegram servers)
app.post('/telegram/webhook/:botToken', webhookLimiter, handleWebhook);

// Load your main routes
routs(app);

// Add error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Handle 404 routes
app.use((req, res) => {
    res.status(404).send('Route not found');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});