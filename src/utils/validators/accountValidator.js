const {check} = require('express-validator');
const validatorMiddleware = require('../../middlewere/validator');

exports.setDisplayNameValidator = [check('display_name')
    .notEmpty()
    .withMessage('display name required')
    .isLength({min: 3})
    .withMessage('Too short display name'),

    validatorMiddleware,];

exports.statusValidator = [check('status')
    .notEmpty()
    .withMessage('Status required')
    .isLength({min: 5, max: 20})
    .withMessage('Status should be between 3 - 5 letters'),

    check('password')
        .notEmpty()
        .withMessage('Password required')
        .isLength({min: 6})
        .withMessage('Password must be at least 6 characters'),

    validatorMiddleware,];
