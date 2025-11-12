const {check} = require('express-validator');
const validatorMiddleware = require('../../middlewere/validator');

exports.getMessagesByPhoneValidator = [check('phone_number')
    .notEmpty()
    .withMessage('phone_number required')
    .isNumeric().withMessage('phone_number required'),

    validatorMiddleware,];

exports.sendMessageValidator = [check('caption')
    .notEmpty()
    .withMessage('caption required'),

    check('phone_number')
        .notEmpty()
        .withMessage('phone_number required'),

    validatorMiddleware,]

exports.sendImageValidator = [check('image')
    .notEmpty()
    .withMessage('image required')
    .isURL().withMessage('URL required'),

    check('caption')
        .notEmpty()
        .withMessage('caption required'),

    check('phone_number')
        .notEmpty()
        .withMessage('phone_number required'),

    validatorMiddleware,]

exports.revokeMessageValidator = [check('phone_number')
    .notEmpty()
    .withMessage('phone_number required'),

    check('message_id')
        .notEmpty()
        .withMessage('message_id'),

    validatorMiddleware]

exports.sendLocationValidator = [
    check('phone_number')
        .notEmpty()
        .withMessage('phone_number required'),

    check('lat')
        .notEmpty()
        .withMessage('lat required'),

    check('long')
        .notEmpty()
        .withMessage('long required'),

    validatorMiddleware,
]