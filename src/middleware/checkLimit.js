// src/middleware/checkLimit.js

const ApiError = require('../utils/ApiError');
const User = require('../models/user.model');

/**
 * Kullanıcının belirtilen bir eylem için abonelik limitini aşıp aşmadığını kontrol eden bir middleware oluşturur.
 * @param {string} actionType - Kontrol edilecek eylemin adı ('postCreate', 'swipe' vb.). Bu, subscription.limits'teki anahtarla eşleşmelidir.
 * @returns {function} Express middleware fonksiyonu.
 */
const checkLimit = (actionType) => async (req, res, next) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId).populate('subscription');
        if (!user || !user.subscription) {
            return next(new ApiError(403, 'Abonelik bilgileri bulunamadı.'));
        }

        // Eğer subscription.limits altında böyle bir limit tanımlı değilse, geçmesine izin ver.
        if (typeof user.subscription.limits[actionType] === 'undefined') {
            return next();
        }

        const limit = user.subscription.limits[actionType];
        const usageData = user.usage[actionType];
        const todayPeriod = new Date().toISOString().slice(0, 10);

        if (usageData && usageData.period === todayPeriod && usageData.count >= limit) {
            return next(new ApiError(429, `Bu eylem için günlük limitinize ulaştınız.`));
        }

        // Kullanıcı bilgisini (abonelikle birlikte) bir sonraki adıma (servise) paslamak,
        // servisin tekrar veritabanı sorgusu yapmasını engeller. Bu bir optimizasyondur.
        req.userWithSub = user;

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = checkLimit;