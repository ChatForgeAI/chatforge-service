const {check} = require('express-validator');
const validatorMiddleware = require('../../middlewere/validator');

exports.contactValidator = [check('phone_number')
    .notEmpty()
    .withMessage('phone_number required'),

    validatorMiddleware,];
