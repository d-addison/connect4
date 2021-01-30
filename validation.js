// validation
const Joi = require('@hapi/joi');

// registration validation schema
const registrationValidation = (data) => {
    const Schema = Joi.object({
        name: Joi.string().min(6).required(),
        email: Joi.string().min(6).required().email(),
        password: Joi.string().min(4).required()
    });
    return Schema.validate(data);
};

// login validation schema
const loginValidation = (data) => {
    const Schema = Joi.object({
        name: Joi.string().min(6).required(),
        password: Joi.string().min(4).required()
    });
    return Schema.validate(data);
};

module.exports.registrationValidation = registrationValidation;
module.exports.loginValidation = loginValidation;