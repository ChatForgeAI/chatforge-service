const {logIInfo} = require('./logger');

// Middleware to log all incoming requests
const logRequest = (req, res, next) => {
    const {method, url} = req;
    const timestamp = new Date().toISOString();

    // Log request information
    logIInfo(`${timestamp} | ${method}:${url} | ${req.ip} | ${req.headers['x-user-id']} | ${req.headers['x-instance-secret']}`);

    // Call the next middleware in the chain
    next();
};

module.exports = logRequest;
