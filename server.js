const express = require('express');
const bodyParser = require('body-parser');
const { json, urlencoded } = require('body-parser');
const routs = require('./src/routs/index');
const { handleWebhook } = require('./src/controller/telegram_sessions_controller.js');
const { webhookLimiter } = require('./src/middlewere/rate_limiter');
const env = require('dotenv');
env.config();
const dbConnection = require('./src/config/database_config');
const AppDataSource = require('./src/config/data-source');
const cors = require('cors');
const app = express();

const port = 8000;

app.use(cors());
app.use(json());
app.use(urlencoded({ extended: false }));

dbConnection();

app.get('/health', async (req, res) => {
  const isConnected = AppDataSource.isInitialized;
  const dbStatus = isConnected ? 'connected' : 'disconnected';

  res.status(200).json({
    status: true,
    message: 'Service is healthy',
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      db: dbStatus,
      memory: process.memoryUsage(),
    },
  });
});

app.get('/', (req, res) => {
  console.log('Root route hit');
  return res.send('Server run successfully');
});

app.post('/telegram/webhook/:botToken', webhookLimiter, handleWebhook);

routs(app);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.use((req, res) => {
  res.status(404).send('Route not found');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
