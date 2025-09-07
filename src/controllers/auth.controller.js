// src/controllers/auth.controller.js

const authService = require('../services/auth.service');
const catchAsync = require('../utils/catchAsync');

exports.verifyPhoneForRegister = catchAsync(async (req, res) => {
    const result = await authService.verifyPhoneAndInitiateRegistration(req.body.firebaseIdToken);
    res.status(200).json(result);
});

exports.register = catchAsync(async (req, res) => {
    const { user, token } = await authService.completeRegistration(req.body.token, req.body);
    res.status(201).json({ user, token });
});

exports.login = catchAsync(async (req, res) => {
    await authService.loginWithPassword(req.body.phoneNumber, req.body.password);
    // Bu aşamada token dönmüyoruz, sadece başarılı olduğunu söylüyoruz.
    // Frontend şimdi OTP istemeli.
    res.status(200).json({ message: 'Şifre doğrulandı. Lütfen telefonunuza gelen kodu girin.' });
});

exports.verifyOtpForLogin = catchAsync(async (req, res) => {
    const { user, token } = await authService.loginWithOtp(req.body.firebaseIdToken);
    res.status(200).json({ user, token });
});

exports.forgotPassword = catchAsync(async (req, res) => {
    const result = await authService.initiatePasswordReset(req.body.firebaseIdToken);
    res.status(200).json(result);
});

exports.resetPassword = catchAsync(async (req, res) => {
    const { user, token } = await authService.resetPassword(req.body.token, req.body.password);
    res.status(200).json({ user, token });
});

exports.getMe = catchAsync(async (req, res) => {
    // auth middleware'i sayesinde req.user zaten mevcut
    res.status(200).json(req.user);
});

exports.verifyCurrentPassword = catchAsync(async (req, res) => {
    await authService.verifyCurrentPassword(req.user.id, req.body.password);
    res.status(200).json({ message: 'Mevcut şifre doğrulandı.' });
});

exports.initiateChangePassword = catchAsync(async (req, res) => {
    const result = await authService.initiateChangePassword(req.user.id, req.body.newPassword);
    res.status(200).json(result);
});

exports.finalizeChangePassword = catchAsync(async (req, res) => {
    await authService.finalizeChangePassword(req.user.id, req.body.firebaseIdToken, req.body.changePasswordToken);
    res.status(200).json({ message: 'Şifreniz başarıyla güncellendi.' });
});