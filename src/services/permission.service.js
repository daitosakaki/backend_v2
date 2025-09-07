// src/services/permission.service.js
const User = require('../models/user.model');
const Follow = require('../models/follow.model');
const ApiError = require('../utils/ApiError');

/**
 * Bir kullanıcının (currentUser), başka bir kullanıcının (targetUser) özel içeriğini
 * görüp göremeyeceğini kontrol eder.
 * @param {string | null} currentUserId - İçeriği görmek isteyen, o an giriş yapmış kullanıcı ID'si. (Giriş yapmamış olabilir)
 * @param {string} targetUserId - Profili veya içeriği görüntülenen kullanıcı ID'si.
 * @returns {Promise<boolean>} - Görme yetkisi varsa true, yoksa false döner.
 */
exports.canViewUserContent = async (currentUserId, targetUserId) => {
    // 1. Hedef kullanıcıyı bul.
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
        throw new ApiError(404, 'Kullanıcı bulunamadı.');
    }

    // 2. Eğer hedef kullanıcının profili GİZLİ DEĞİLSE, herkes görebilir.
    if (!targetUser.isPrivate) {
        return true;
    }
    
    // 3. Profil GİZLİ ise:
    // a. Giriş yapmış bir kullanıcı yoksa, göremez.
    if (!currentUserId) {
        return false;
    }
    
    // b. Kullanıcı kendi profilini her zaman görebilir.
    if (currentUserId.toString() === targetUser._id.toString()) {
        return true;
    }
    
    // c. Giriş yapmış kullanıcı, hedef kullanıcıyı takip ediyor mu diye kontrol et.
    const isFollowing = await Follow.findOne({
        follower: currentUserId,
        following: targetUserId,
        status: 'accepted'
    });
    
    return !!isFollowing; // Eğer takip ilişkisi varsa true, yoksa false döner.
};