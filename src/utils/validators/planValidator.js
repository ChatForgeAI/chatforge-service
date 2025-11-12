const {check} = require('express-validator');
const validatorMiddleware = require('../../middlewere/validator');

exports.addPlanValidator = [
    check('title')
        .notEmpty()
        .withMessage('Title required')
        .isLength({min: 3})
        .withMessage('Too short title'),

    check('description')
        .notEmpty()
        .withMessage('Description required')
        .isLength({min: 7})
        .withMessage('Too short description'),

    check('features')
        .isArray({min: 1})
        .withMessage('Features required')
        .isArray()
        .withMessage('Features should be an array'),

    check('price')
        .notEmpty()
        .withMessage('Price required')
        .isNumeric()
        .withMessage('Invalid price'),

    check('duration')
        .notEmpty()
        .withMessage('Duration required')
        .isNumeric()
        .withMessage('Invalid duration'),

    validatorMiddleware,
]

exports.deletePlanValidator = [
    check('id')
        .notEmpty()
        .withMessage('ID required')
        .isMongoId()
        .withMessage('Invalid ID'),

    validatorMiddleware,
]