// src/routes/user.routes.js

const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const userValidation = require('../validations/user.validation');
const userController = require('../controllers/user.controller');

const router = express.Router();

// ======================================================= //
// GİRİŞ YAPMIŞ KULLANICIYA ÖZEL ROTALAR (`/me`)
// ======================================================= //

// Bu rotaların hepsi kimlik doğrulama gerektirir.
router.use(auth);

// Giriş yapmış kullanıcının kendi profil bilgilerini getir
router.get('/me', userController.getMe);

// Giriş yapmış kullanıcının profilini güncelle
router.patch('/me', validate(userValidation.updateMe), userController.updateMe);

// Giriş yapmış kullanıcının gelen takip isteklerini listele
router.get('/me/follow-requests', userController.getFollowRequests);

// Gelen bir takip isteğini kabul et
router.post('/me/follow-requests/:requestId/accept', validate(userValidation.handleFollowRequest), userController.acceptFollowRequest);

// Gelen bir takip isteğini reddet
router.delete('/me/follow-requests/:requestId/reject', validate(userValidation.handleFollowRequest), userController.rejectFollowRequest);

// Giriş yapmış kullanıcının engellediği kişileri listele
router.get('/me/blocks', userController.getBlockedUsers);


// ======================================================= //
// GENEL KULLANICI ROTALARI
// ======================================================= //

// Kullanıcıları kullanıcı adına göre ara
router.get('/', validate(userValidation.searchUsers), userController.searchUsers);


// DİNAMİK ROTALAR EN SONDA OLMALIDIR
// Bu sayede '/me' gibi sabit yollar, bir kullanıcı adı olarak algılanmaz.

// Belirli bir kullanıcının profilini kullanıcı adına göre getir
router.get('/:username', validate(userValidation.getUserByUsername), userController.getUserProfile);

// Belirli bir kullanıcının gönderilerini listele (gizlilik kontrolü serviste yapılır)
router.get('/:username/posts', validate(userValidation.getUserByUsername), userController.getUserPosts);

// Belirli bir kullanıcının takipçilerini listele
router.get('/:username/followers', validate(userValidation.getUserByUsername), userController.getFollowers);

// Belirli bir kullanıcının takip ettiklerini listele
router.get('/:username/following', validate(userValidation.getUserByUsername), userController.getFollowing);


// ======================================================= //
// KULLANICILAR ARASI ETKİLEŞİM ROTALARI
// ======================================================= //

// Bir kullanıcıyı takip et / takip isteği gönder
router.post('/:username/follow', validate(userValidation.getUserByUsername), userController.followUser);

// Bir kullanıcıyı takipten çıkar / isteği geri çek
router.delete('/:username/follow', validate(userValidation.getUserByUsername), userController.unfollowUser);

// Bir kullanıcıyı engelle
router.post('/:username/block', validate(userValidation.getUserByUsername), userController.blockUser);

// Bir kullanıcının engelini kaldır
router.delete('/:username/block', validate(userValidation.getUserByUsername), userController.unblockUser);


module.exports = router;