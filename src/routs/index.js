const SessionRoutes = require('./whatsapp_sessions_route');
const TelegramRoutes = require('./telegram_sessions_route');

const loggerRequest = require('../middlewere/log_request_send');
const { globalLimiter } = require('../middlewere/rate_limiter');

module.exports = (app) => {
    app.use(loggerRequest);
    app.use(globalLimiter);
    app.use('/session', SessionRoutes);
    app.use('/telegram-session', TelegramRoutes);
}