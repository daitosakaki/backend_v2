// src/validations/auth.validation.js

const Joi = require('joi');
const { password, phoneNumber } = require('./custom.validation'); // (Opsiyonel) Özel doğrulama yardımcıları

// 1. Adım: Telefonu ve OTP'yi doğrulama
const verifyPhone = {
    body: Joi.object().keys({
        firebaseIdToken: Joi.string().required(), // Frontend'den gelen Firebase ID Token'ı
    }),
};

// 2. Adım: Kaydı tamamlama
const register = {
    body: Joi.object().keys({
        token: Joi.string().required(), // Bizim ürettiğimiz kısa ömürlü token
        username: Joi.string().required().min(3).max(30),
        firstName: Joi.string().required(),
        password: Joi.string().required().custom(password),
    }),
};

// Normal giriş (şifre ile)
const login = {
    body: Joi.object().keys({
        phoneNumber: Joi.string().required().custom(phoneNumber),
        password: Joi.string().required(),
    }),
};

// Şifre sıfırlama talebi
const forgotPassword = {
    body: Joi.object().keys({
        firebaseIdToken: Joi.string().required(),
    }),
};

// Şifreyi sıfırlama
const resetPassword = {
    body: Joi.object().keys({
        token: Joi.string().required(), // Şifre sıfırlama için üretilen kısa ömürlü token
        password: Joi.string().required().custom(password),
    }),
};

// Adım 1: Mevcut şifreyi doğrulama
const verifyCurrentPassword = {
    body: Joi.object().keys({
        password: Joi.string().required(),
    }),
};

// Adım 2: Yeni şifreyi gönderme
const initiateChangePassword = {
    body: Joi.object().keys({
        newPassword: Joi.string().required().custom(password),
    }),
};

// Adım 3: OTP ve geçici token ile işlemi tamamlama
const finalizeChangePassword = {
    body: Joi.object().keys({
        firebaseIdToken: Joi.string().required(),
        changePasswordToken: Joi.string().required(), // Servisin ürettiği kısa ömürlü token
    }),
};

module.exports = {
    verifyPhone,
    register,
    login,
    forgotPassword,
    resetPassword,
    verifyCurrentPassword,
    initiateChangePassword,
    finalizeChangePassword,
};