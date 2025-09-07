// src/controllers/user.controller.js

const userService = require('../services/user.service');
const postService = require('../services/post.service');
const followService = require('../services/follow.service');
const blockService = require('../services/block.service'); // Engelleme mantığı için
const catchAsync = require('../utils/catchAsync');

// ======================================================= //
// GİRİŞ YAPMIŞ KULLANICIYA ÖZEL İŞLEMLER (`/me`)
// ======================================================= //

/**
 * Giriş yapmış kullanıcının kendi profil bilgilerini getirir.
 * Bu bilgi 'auth' middleware'i tarafından zaten 'req.user' içine konulmuştur.
 */
const getMe = catchAsync(async (req, res) => {
    // Servise gitmeye gerek yok, çünkü auth middleware zaten kullanıcıyı getirdi.
    res.status(200).json({ status: 'success', data: req.user });
});

/**
 * Giriş yapmış kullanıcının profil bilgilerini günceller.
 */
const updateMe = catchAsync(async (req, res) => {
    const updatedUser = await userService.updateUserProfile(req.user.id, req.body);
    res.status(200).json({ status: 'success', data: updatedUser });
});

/**
 * Giriş yapmış kullanıcının bekleyen takip isteklerini listeler.
 */
const getFollowRequests = catchAsync(async (req, res) => {
    const requests = await followService.getPendingRequests(req.user.id);
    res.status(200).json({ status: 'success', data: requests });
});

/**
 * Bir takip isteğini kabul eder.
 */
const acceptFollowRequest = catchAsync(async (req, res) => {
    await followService.acceptRequest(req.user.id, req.params.requestId);
    res.status(200).json({ status: 'success', message: 'Takip isteği kabul edildi.' });
});

/**
 * Bir takip isteğini reddeder.
 */
const rejectFollowRequest = catchAsync(async (req, res) => {
    await followService.rejectRequest(req.user.id, req.params.requestId);
    res.status(204).send(); // Başarılı, içerik dönmüyor
});

/**
 * Giriş yapmış kullanıcının engellediği kullanıcıları listeler.
 */
const getBlockedUsers = catchAsync(async (req, res) => {
    const blockedList = await blockService.getBlockedUsers(req.user.id);
    res.status(200).json({ status: 'success', data: blockedList });
});


// ======================================================= //
// GENEL KULLANICI İŞLEMLERİ
// ======================================================= //

/**
 * Verilen bir arama terimine göre kullanıcıları arar.
 */
const searchUsers = catchAsync(async (req, res) => {
    const { q, page, limit } = req.query;
    const result = await userService.searchUsers(q, { page, limit }, req.user.id);
    res.status(200).json({ status: 'success', data: result });
});

/**
 * Kullanıcı adına göre bir kullanıcının profilini getirir.
 * Gizlilik kontrolü servis katmanında yapılır.
 */
const getUserProfile = catchAsync(async (req, res) => {
    const profile = await userService.getUserProfileByUsername(req.params.username, req.user.id);
    res.status(200).json({ status: 'success', data: profile });
});

/**
 * Bir kullanıcının gönderilerini, gizlilik kontrolü yaparak getirir.
 */
const getUserPosts = catchAsync(async (req, res) => {
    const posts = await postService.getPostsForUser(req.user.id, req.params.username);
    res.status(200).json({ status: 'success', data: posts });
});

/**
 * Bir kullanıcının takipçilerini listeler.
 */
const getFollowers = catchAsync(async (req, res) => {
    const followers = await followService.getFollowers(req.params.username);
    res.status(200).json({ status: 'success', data: followers });
});

/**
 * Bir kullanıcının takip ettiklerini listeler.
 */
const getFollowing = catchAsync(async (req, res) => {
    const following = await followService.getFollowing(req.params.username);
    res.status(200).json({ status: 'success', data: following });
});


// ======================================================= //
// KULLANICILAR ARASI ETKİLEŞİM İŞLEMLERİ
// ======================================================= //

/**
 * Bir kullanıcıyı takip eder veya takip isteği gönderir.
 */
const followUser = catchAsync(async (req, res) => {
    const result = await followService.followUser(req.user.id, req.params.username);
    res.status(200).json({ status: 'success', data: result });
});

/**
 * Bir kullanıcıyı takipten çıkarır veya isteği geri çeker.
 */
const unfollowUser = catchAsync(async (req, res) => {
    await followService.unfollowUser(req.user.id, req.params.username);
    res.status(204).send();
});

/**
 * Bir kullanıcıyı engeller.
 */
const blockUser = catchAsync(async (req, res) => {
    await blockService.blockUser(req.user.id, req.params.username);
    res.status(200).json({ status: 'success', message: 'Kullanıcı engellendi.' });
});

/**
 * Bir kullanıcının engelini kaldırır.
 */
const unblockUser = catchAsync(async (req, res) => {
    await blockService.unblockUser(req.user.id, req.params.username);
    res.status(204).send();
});


module.exports = {
    getMe,
    updateMe,
    getFollowRequests,
    acceptFollowRequest,
    rejectFollowRequest,
    getBlockedUsers,
    searchUsers,
    getUserProfile,
    getUserPosts,
    getFollowers,
    getFollowing,
    followUser,
    unfollowUser,
    blockUser,
    unblockUser,
};