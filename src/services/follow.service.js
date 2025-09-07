// src/services/follow.service.js
const mongoose = require('mongoose');
const Follow = require('../models/follow.model');
const User = require('../models/user.model');
const ApiError = require('../utils/ApiError');

/**
 * Bir kullanıcıyı takip eder veya gizli ise takip isteği gönderir.
 * @param {string} followerId - Takip eden kullanıcının ID'si
 * @param {string} followingId - Takip edilen kullanıcının ID'si
 */
exports.followUser = async (followerId, followingId) => {
    if (followerId === followingId) throw new ApiError(400, 'Kullanıcı kendini takip edemez.');

    const followingUser = await User.findById(followingId);
    if (!followingUser) throw new ApiError(404, 'Takip edilecek kullanıcı bulunamadı.');

    const existingFollow = await Follow.findOne({ follower: followerId, following: followingId });
    if (existingFollow) {
        // Zaten bir ilişki var (beklemede veya kabul edilmiş), işlem yapma.
        return { message: 'İstek zaten gönderilmiş veya kullanıcı zaten takip ediliyor.' };
    }

    // Takip edilen kullanıcı gizli mi?
    const status = followingUser.isPrivate ? 'pending' : 'accepted';

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const newFollow = new Follow({ follower: followerId, following: followingId, status });
        await newFollow.save({ session });

        if (status === 'accepted') {
            // Eğer profil gizli değilse, sayaçları hemen güncelle
            await User.updateOne({ _id: followerId }, { $inc: { followingCount: 1 } }, { session });
            await User.updateOne({ _id: followingId }, { $inc: { followerCount: 1 } }, { session });
        }

        await session.commitTransaction();

        // (Opsiyonel) Bildirim gönder
        // notificationService.createNotification(followingId, followerId, status === 'pending' ? 'new_follow_request' : 'new_follower');

        return { status, message: status === 'pending' ? 'Takip isteği gönderildi.' : 'Kullanıcı takip edilmeye başlandı.' };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Bir kullanıcıyı takipten çıkarır veya gönderilmiş bir isteği iptal eder.
 */
exports.unfollowUser = async (followerId, followingId) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const followDoc = await Follow.findOneAndDelete({ follower: followerId, following: followingId }).session(session);

        if (followDoc && followDoc.status === 'accepted') {
            // Eğer ilişki onaylanmış bir takipse, sayaçları azalt
            await User.updateOne({ _id: followerId }, { $inc: { followingCount: -1 } }, { session });
            await User.updateOne({ _id: followingId }, { $inc: { followerCount: -1 } }, { session });
        }
        // Eğer 'pending' ise, sadece istek silinir ve sayaçlar etkilenmez.

        await session.commitTransaction();
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Bir takip isteğini kabul eder.
 * @param {string} currentUserId - İsteği kabul eden (kendi profili gizli olan) kullanıcı
 * @param {string} followId - 'Follow' dokümanının ID'si
 */
exports.acceptRequest = async (currentUserId, followId) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const request = await Follow.findById(followId).session(session);
        // Güvenlik: İsteğin doğru kişiye ait olduğunu ve 'pending' durumunda olduğunu kontrol et
        if (!request || request.following.toString() !== currentUserId || request.status !== 'pending') {
            throw new ApiError(404, 'İstek bulunamadı veya bu işlemi yapmaya yetkiniz yok.');
        }

        request.status = 'accepted';
        await request.save({ session });

        // Sayaçları güncelle
        await User.updateOne({ _id: request.follower }, { $inc: { followingCount: 1 } }, { session });
        await User.updateOne({ _id: request.following }, { $inc: { followerCount: 1 } }, { session });

        await session.commitTransaction();
        // (Opsiyonel) İsteği gönderen kullanıcıya "isteğiniz kabul edildi" bildirimi gönder
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};


/**
 * Bir takip isteğini reddeder (siler).
 */
exports.rejectRequest = async (currentUserId, followId) => {
    const request = await Follow.findById(followId);
    if (!request || request.following.toString() !== currentUserId || request.status !== 'pending') {
        throw new ApiError(404, 'İstek bulunamadı veya bu işlemi yapmaya yetkiniz yok.');
    }
    await request.deleteOne();
    // Sayaçlarda bir değişiklik olmaz.
};

/**
 * Bir kullanıcıya gelen bekleyen takip isteklerini listeler.
 */
exports.getPendingRequests = async (userId) => {
    const requests = await Follow.find({ following: userId, status: 'pending' })
        .populate('follower', 'username displayName profilePhotoUrl'); // İstek gönderenlerin bilgilerini getir
    return requests;
};