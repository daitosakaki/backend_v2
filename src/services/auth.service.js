// src/services/auth.service.js

const jwt = require('jsonwebtoken');
const firebaseAdmin = require('../config/firebase');
const User = require('../models/user.model');
const Subscription = require('../models/subscription.model');
const ApiError = require('../utils/ApiError');
const config = require('../config');

// === YARDIMCI FONKSİYONLAR ===
const generateAuthTokens = (userId) => {
    const payload = { sub: userId };
    return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
};
const generateShortLivedToken = (payload, expiresIn = '10m') => {
    return jwt.sign(payload, config.jwt.secret, { expiresIn });
};

// === KAYIT AKIŞI SERVİSLERİ ===
exports.verifyPhoneAndInitiateRegistration = async (firebaseIdToken) => {
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(firebaseIdToken);
    const phoneNumber = decodedToken.phone_number;

    if (!phoneNumber) throw new ApiError(400, 'Firebase token\'ı telefon numarası içermiyor.');

    const user = await User.findOne({ phoneNumber });
    if (user) {
        // Kullanıcı zaten var. Frontend bu duruma göre kullanıcıyı giriş ekranına yönlendirmeli.
        throw new ApiError(409, 'Bu telefon numarası zaten kayıtlı. Lütfen giriş yapın.');
    }

    // Kaydı tamamlamak için 10 dakikalık bir token üret.
    const registrationToken = generateShortLivedToken({ phoneNumber, purpose: 'register' });
    return { message: 'Telefon numarası doğrulandı. Kayda devam edebilirsiniz.', token: registrationToken };
};

exports.completeRegistration = async (registrationToken, userData) => {
    let decoded;
    try {
        decoded = jwt.verify(registrationToken, config.jwt.secret);
        if (decoded.purpose !== 'register') throw new Error();
    } catch (e) {
        throw new ApiError(401, 'Geçersiz veya süresi dolmuş kayıt anahtarı.');
    }

    const { phoneNumber } = decoded;
    const { username, firstName, password } = userData;

    if (await User.findOne({ username })) {
        throw new ApiError(400, 'Bu kullanıcı adı zaten alınmış.');
    }

    // Varsayılan 'Free' aboneliğini bul
    const freeSubscription = await Subscription.findOne({ name: 'Free' });
    if (!freeSubscription) throw new ApiError(500, 'Varsayılan abonelik planı bulunamadı.');

    const user = await User.create({
        phoneNumber,
        username,
        firstName,
        password,
        subscription: freeSubscription._id,
    });

    const token = generateAuthTokens(user._id);
    return { user: user.toJSON(), token };
};


// === GİRİŞ AKIŞI SERVİSLERİ ===
exports.loginWithPassword = async (phoneNumber, password) => {
    const user = await User.findOne({ phoneNumber });
    if (!user || !(await user.isPasswordMatch(password))) {
        throw new ApiError(401, 'Telefon numarası veya şifre hatalı.');
    }
    // Bu aşama başarılı, şimdi frontend OTP istemeli.
    return true;
};

exports.loginWithOtp = async (firebaseIdToken) => {
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(firebaseIdToken);
    const phoneNumber = decodedToken.phone_number;

    const user = await User.findOne({ phoneNumber });
    if (!user) {
        throw new ApiError(401, 'Bu telefon numarasına ait bir kullanıcı bulunamadı.');
    }

    const token = generateAuthTokens(user._id);
    return { user: user.toJSON(), token };
};


// === ŞİFRE SIFIRLAMA SERVİSLERİ ===
exports.initiatePasswordReset = async (firebaseIdToken) => {
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(firebaseIdToken);
    const phoneNumber = decodedToken.phone_number;

    const user = await User.findOne({ phoneNumber });
    if (!user) {
        throw new ApiError(404, 'Bu telefon numarasına ait bir kullanıcı bulunamadı.');
    }

    const resetToken = generateShortLivedToken({ sub: user._id, purpose: 'reset-password' });
    return { message: 'Telefon numarası doğrulandı. Şifrenizi şimdi sıfırlayabilirsiniz.', token: resetToken };
};

exports.resetPassword = async (resetToken, newPassword) => {
    let decoded;
    try {
        decoded = jwt.verify(resetToken, config.jwt.secret);
        if (decoded.purpose !== 'reset-password') throw new Error();
    } catch (e) {
        throw new ApiError(401, 'Geçersiz veya süresi dolmuş şifre sıfırlama anahtarı.');
    }

    const user = await User.findById(decoded.sub);
    if (!user) throw new ApiError(404, 'Kullanıcı bulunamadı.');

    user.password = newPassword;
    await user.save();

    // Şifre sıfırlandıktan sonra otomatik olarak giriş yapmasını sağla.
    const token = generateAuthTokens(user._id);
    return { user: user.toJSON(), token };
};

// === ŞİFRE DEĞİŞTİRME SERVİSLERİ ===

/**
 * Giriş yapmış kullanıcının gönderdiği mevcut şifrenin doğruluğunu kontrol eder.
 */
exports.verifyCurrentPassword = async (userId, currentPassword) => {
    const user = await User.findById(userId);
    if (!user || !(await user.isPasswordMatch(currentPassword))) {
        throw new ApiError(401, 'Mevcut şifre hatalı.');
    }
    return true;
};

/**
 * Yeni şifreyi alır, hash'ler ve OTP doğrulaması için kısa ömürlü bir JWT üretir.
 * Bu, işlemin ikinci adımına güvenli bir şekilde geçmeyi sağlar.
 */
exports.initiateChangePassword = async (userId, newPassword) => {
    // Güvenlik için, token içine asla hash'lenmemiş şifre koymayız.
    const hashedNewPassword = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);

    // Kısa ömürlü (5 dk) token'ın payload'ına kullanıcının ID'sini ve YENİ HASH'LENMİŞ şifreyi ekle.
    const changePasswordToken = generateShortLivedToken(
        { sub: userId, newPassHash: hashedNewPassword, purpose: 'change-password-otp' },
        '5m'
    );

    // Frontend şimdi bu token'ı saklamalı ve OTP istemelidir.
    return {
        message: 'Yeni şifre alındı. Lütfen telefonunuza gelen OTP kodunu girerek işlemi onaylayın.',
        changePasswordToken: changePasswordToken
    };
};

/**
 * OTP'yi ve geçici token'ı doğrulayarak şifre değiştirme işlemini tamamlar.
 */
exports.finalizeChangePassword = async (userId, firebaseIdToken, changePasswordToken) => {
    // 1. Adım: Kısa ömürlü token'ı doğrula ve içindeki verileri al.
    let decodedChangeToken;
    try {
        decodedChangeToken = jwt.verify(changePasswordToken, config.jwt.secret);
        if (decodedChangeToken.purpose !== 'change-password-otp' || decodedChangeToken.sub !== userId) {
            // Token başka bir amaçla veya başka bir kullanıcı için üretilmişse reddet.
            throw new Error();
        }
    } catch (e) {
        throw new ApiError(401, 'Geçersiz veya süresi dolmuş şifre değiştirme anahtarı.');
    }

    // 2. Adım: Firebase'den gelen OTP'yi (ID Token olarak) doğrula.
    const decodedFirebaseToken = await firebaseAdmin.auth().verifyIdToken(firebaseIdToken);
    const phoneNumberFromOtp = decodedFirebaseToken.phone_number;

    // 3. Adım: Tüm bilgileri çapraz kontrol et.
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, 'Kullanıcı bulunamadı.');
    }
    if (user.phoneNumber !== phoneNumberFromOtp) {
        // OTP ile doğrulanan telefon, şifresini değiştirmeye çalışan kullanıcının telefonu değilse reddet.
        throw new ApiError(403, 'Yetkisiz işlem: Telefon numarası uyuşmuyor.');
    }

    // 4. Adım: Tüm doğrulamalar başarılıysa, şifreyi güncelle.
    // 'pre('save')' hook'unun tekrar hash'lemesini önlemek için doğrudan atama yapıyoruz.
    user.password = decodedChangeToken.newPassHash;
    await user.save();

    return true;
};