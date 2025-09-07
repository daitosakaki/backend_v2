// src/middleware/validate.js

const Joi = require('joi');
const ApiError = require('../utils/ApiError');

const validate = (schema) => (req, res, next) => {
    const validSchema = Joi.compile(schema);
    const object = {
        params: req.params,
        query: req.query,
        body: req.body,
    };
    
    const { value, error } = validSchema.validate(object, { abortEarly: false });

    if (error) {
        const errorMessage = error.details.map((details) => details.message).join(', ');
        return next(new ApiError(400, errorMessage));
    }
    
    // Doğrulanmış ve temizlenmiş veriyi req objesine ata
    Object.assign(req, value);
    return next();
};

module.exports = validate;