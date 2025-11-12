const {check} = require('express-validator');
const validatorMiddleware = require('../../middlewere/validator');

exports.getGroupInfoAndMessagesByIdValidator = [check('id')
    .notEmpty()
    .withMessage('id required'),

    validatorMiddleware,];

exports.sendMessageToGroupValidator = [check('message')
    .notEmpty()
    .withMessage('message required'),

    check('id')
        .notEmpty()
        .withMessage('id required'),

    validatorMiddleware,]

exports.sendImageValidator = [check('image')
    .notEmpty()
    .withMessage('image required')
    .isURL().withMessage('URL required'),

    check('caption')
        .notEmpty()
        .withMessage('caption required'),

    check('id')
        .notEmpty()
        .withMessage('id required'),

    validatorMiddleware,]

exports.sendLocationValidator = [check('id')
    .notEmpty()
    .withMessage('id required'),

    check('latitude')
        .notEmpty()
        .withMessage('latitude required'),

    check('longitude')
        .notEmpty()
        .withMessage('longitude required'),

    validatorMiddleware,]

exports.createGroupValidator = [check('name')
    .notEmpty()
    .withMessage('name required'),

    check('participants')
        .isArray({min: 1}).withMessage('participants required'),

    validatorMiddleware,]

exports.editGroupValidator = [check('name')
    .notEmpty()
    .withMessage('name required'),

    check('description')
        .notEmpty()
        .withMessage('description required'),

    validatorMiddleware,]


exports.removeParticipantsValidator = [check('participants')
    .isArray({min: 1})
    .withMessage('participants required'),

    check('id')
        .notEmpty()
        .withMessage('id required'),

    validatorMiddleware,

]

exports.addParticipantValidator = [check('participants')
    .isArray({min: 1})
    .withMessage('participants required'),

    check('id')
        .notEmpty()
        .withMessage('id required'),

    validatorMiddleware,]

exports.leaveGroupValidator = [check('id')
    .notEmpty()
    .withMessage('id required'),

    validatorMiddleware]

exports.deleteGroupValidator = [check('id')
    .notEmpty()
    .withMessage('id required'),

    validatorMiddleware]