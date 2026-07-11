const SessionRoutes = require('./whats_app_sessions_rouet');

const loggerRequest = require('../middlewere/log_request_send');

module.exports = (app) => {
    app.use(loggerRequest);
    app.use('/session', SessionRoutes);
}