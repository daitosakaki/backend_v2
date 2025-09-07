// src/routes/auth.routes.js

const express = require('express');
const validate = require('../middleware/validate');
const authValidation = require('../validations/auth.validation');
const authController = require('../controllers/auth.controller');
const auth = require('../middleware/auth');

const router = express.Router();

// --- KAYIT AKIŞI (REGISTER) ---
// Adım 1: Kullanıcı OTP'yi girdikten sonra Firebase'den aldığı token'ı doğrular.
// Bu endpoint, kullanıcı mevcutsa hata döner, değilse kayıt için kısa ömürlü bir token üretir.
router.post('/register/verify-phone', validate(authValidation.verifyPhone), authController.verifyPhoneForRegister);

// Adım 2: Kullanıcı şifre ve diğer bilgilerini girerek kaydı tamamlar.
router.post('/register/complete', validate(authValidation.register), authController.register);


// --- GİRİŞ AKIŞI (LOGIN) ---
// Adım 1: Telefon no ve şifre ile giriş denemesi. Başarılı olursa, 2FA için OTP istenir.
router.post('/login', validate(authValidation.login), authController.login);

// Adım 2: Kullanıcı OTP'yi girdikten sonra Firebase'den aldığı token ile girişi tamamlar.
router.post('/login/verify-otp', validate(authValidation.verifyPhone), authController.verifyOtpForLogin);


// --- ŞİFRE SIFIRLAMA AKIŞI (FORGOT PASSWORD) ---
// Adım 1: Kullanıcı telefonunu OTP ile doğrular ve şifre sıfırlama token'ı alır.
router.post('/forgot-password', validate(authValidation.forgotPassword), authController.forgotPassword);

// Adım 2: Aldığı token ve yeni şifre ile işlemi tamamlar.
router.post('/reset-password', validate(authValidation.resetPassword), authController.resetPassword);


// --- ŞİFRE DEĞİŞTİRME AKIŞI (CHANGE PASSWORD) ---
// Adım 1: Mevcut şifrenin doğruluğunu kontrol et
router.post('/password/verify-current', auth, validate(authValidation.verifyCurrentPassword), authController.verifyCurrentPassword);

// Adım 2: Yeni şifreyi gönder, OTP doğrulaması için geçici bir token al
router.post('/password/initiate-change', auth, validate(authValidation.initiateChangePassword), authController.initiateChangePassword);

// Adım 3: OTP (Firebase ID Token) ve geçici token ile şifre değişimini tamamla
router.post('/password/finalize-change', auth, validate(authValidation.finalizeChangePassword), authController.finalizeChangePassword);


// Oturumun geçerli olup olmadığını kontrol etmek için korumalı bir rota
router.get('/me', auth, authController.getMe);

module.exports = router;