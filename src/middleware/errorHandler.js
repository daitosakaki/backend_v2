const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const config = require('../config'); // Ortam değişkenlerini (env) kontrol etmek için

/**
 * Mongoose'un CastError'ını (örn: geçersiz ObjectId) daha anlaşılır bir ApiError'a dönüştürür.
 * @param {mongoose.Error.CastError} err
 * @returns {ApiError}
 */
const handleCastErrorDB = (err) => {
    const message = `Geçersiz ${err.path}: ${err.value}.`;
    return new ApiError(400, message);
};

/**
 * Mongoose'un DuplicateFields hatasını (unique alanların tekrarı) daha anlaşılır bir ApiError'a dönüştürür.
 * @param {Error} err
 * @returns {ApiError}
 */
const handleDuplicateFieldsDB = (err) => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `${value} değeri daha önceden alınmış. Lütfen başka bir değer deneyin.`;
    return new ApiError(400, message);
};

/**
 * Mongoose'un ValidationError'ını (şema doğrulama hataları) daha anlaşılır bir ApiError'a dönüştürür.
 * @param {mongoose.Error.ValidationError} err
 * @returns {ApiError}
 */
const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Geçersiz giriş verileri. ${errors.join('. ')}`;
    return new ApiError(400, message);
};

/**
 * Geliştirme ortamı için detaylı hata yanıtı gönderir.
 * @param {Error} err
 * @param {import('express').Response} res
 */
const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
    });
};

/**
 * Üretim ortamı için genel ve güvenli hata yanıtı gönderir.
 * @param {Error} err
 * @param {import('express').Response} res
 */
const sendErrorProd = (err, res) => {
    // A) Operasyonel, güvenilir hata: İstemciye mesaj gönder
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    // B) Programlama veya bilinmeyen hata: Detayları sızdırma
    } else {
        // 1) Hatayı konsola logla
        console.error('HATA 💥', err);
        // 2) Genel bir mesaj gönder
        res.status(500).json({
            status: 'error',
            message: 'Sunucuda beklenmedik bir hata oluştu.',
        });
    }
};

/**
 * Express için genel hata yönetimi middleware'i.
 * Bu middleware, app.js'de en son kaydedilmelidir.
 */
module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (config.env === 'development') {
        sendErrorDev(err, res);
    } else if (config.env === 'production') {
        let error = { ...err, message: err.message };

        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
        // JWT hataları da burada yakalanabilir (JsonWebTokenError, TokenExpiredError)

        sendErrorProd(error, res);
    }
};