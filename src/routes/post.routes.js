// src/routes/post.routes.js

const express = require('express');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const checkLimit = require('./middleware/');
const postValidation = require('../validations/post.validation');
const postController = require('../controllers/post.controller');

const router = express.Router();

// --- TEMEL GÖNDERİ İŞLEMLERİ (CRUD) ---

router.get('/public-feed', postController.getPublicPosts);

router.route('/')
    // Yeni bir gönderi oluştur
    .post(
        auth,                               // 1. Kullanıcı giriş yapmış mı?
        checkLimit('postCreate'),           // 2. Gönderi oluşturma limiti var mı? (YENİ)
        upload.array('media', 10),          // 3. Dosyaları yükle
        validate(postValidation.createPost),// 4. Gelen veriyi doğrula
        postController.createPost           // 5. Kontrolcüyü çalıştır
    )
    // Ana sayfa veya keşfet akışı için gönderileri listele
    .get(
        auth,
        postController.getFeedPosts
    );


router.route('/:postId')
    // Tek bir gönderiyi ID ile getir
    .get(
        auth,
        validate(postValidation.getPost),
        postController.getPostById
    )
    // Bir gönderiyi güncelle (sadece gönderi sahibi yapabilir)
    .patch(
        auth,
        validate(postValidation.updatePost),
        postController.updatePost
    )
    // Bir gönderiyi sil (sadece gönderi sahibi veya admin yapabilir)
    .delete(
        auth,
        validate(postValidation.getPost), // Sadece postId'yi doğrulamak yeterli
        postController.deletePost
    );

// --- İLGİLİ VERİ ROTALARI (Yorumlar, Beğenenler vb.) ---

// Bir gönderiye ait yorumları listele
router.get(
    '/:postId/comments',
    auth,
    validate(postValidation.getPost),
    postController.getCommentsForPost
);

// Bir gönderiye yeni bir yorum ekle
router.post(
    '/:postId/comments',
    auth,
    checkLimit('commentCreate'),
    validate(postValidation.createComment),
    postController.createComment
);

// Bir gönderiyi beğenen kullanıcıları listele
router.get(
    '/:postId/likers',
    auth,
    validate(postValidation.getPost),
    postController.getLikingUsers
);


// --- ETKİLEŞİM ROTALARI ---

// Bir gönderiyi beğen / beğenmekten vazgeç
router.post(
    '/:postId/like',
    auth,
    checkLimit('reactionAdd'),
    validate(postValidation.getPost),
    postController.likePost
);
router.delete(
    '/:postId/unlike', // veya /like olarak da kullanılabilir
    auth,
    checkLimit('reactionAdd'),
    validate(postValidation.getPost),
    postController.unlikePost
);

// Bir gönderiyi yer imlerine ekle / çıkar
router.post(
    '/:postId/bookmark',
    auth,
    validate(postValidation.getPost),
    postController.bookmarkPost
);
router.delete(
    '/:postId/unbookmark',
    auth,
    validate(postValidation.getPost),
    postController.unbookmarkPost
);

// Bir gönderiyi şikayet et
router.post(
    '/:postId/report',
    auth,
    validate(postValidation.getPost), // Şikayet için özel validation da eklenebilir
    postController.reportPost
);

module.exports = router;