// src/controllers/post.controller.js
const postService = require('../services/post.service');
const catchAsync = require('../utils/catchAsync');

/**
 * Yeni bir gönderi oluşturur.
 * Gerekli verileri ve dosyaları post servisine yönlendirir.
 */
exports.createPost = catchAsync(async (req, res) => {
    const newPost = await postService.createPost(req.user.id, req.body, req.files);
    res.status(201).json({ status: 'success', data: newPost });
});

/**
 * Kullanıcının ana sayfa akışı için kişiselleştirilmiş gönderileri alır.
 * Sayfalama (pagination) destekler.
 */
exports.getFeedPosts = catchAsync(async (req, res) => {
    // Sayfalama için query parametreleri (örn: /api/posts?page=1&limit=10)
    const options = {
        page: parseInt(req.query.page, 10) || 1,
        limit: parseInt(req.query.limit, 10) || 10,
    };
    const feed = await postService.getFeedForUser(req.user.id, options);
    res.status(200).json({ status: 'success', data: feed });
});

/**
 * ID'ye göre tek bir gönderiyi ve detaylarını getirir.
 */
exports.getPostById = catchAsync(async (req, res) => {
    const post = await postService.getPostById(req.params.postId);
    res.status(200).json({ status: 'success', data: post });
});

/**
 * Bir gönderiyi günceller.
 * Servis katmanı, işlemi sadece gönderi sahibinin yapabildiğini kontrol eder.
 */
exports.updatePost = catchAsync(async (req, res) => {
    const updatedPost = await postService.updatePost(req.user.id, req.params.postId, req.body);
    res.status(200).json({ status: 'success', data: updatedPost });
});

/**
 * Bir gönderiyi siler.
 * Servis katmanı, işlemi sadece gönderi sahibinin veya bir adminin yapabildiğini kontrol eder.
 */
exports.deletePost = catchAsync(async (req, res) => {
    await postService.deletePost(req.user.id, req.params.postId);
    res.status(204).send(); // 204 No Content, başarılı silme işlemi için standarttır.
});

// --- YORUM İŞLEMLERİ ---

/**
 * Bir gönderiye ait yorumları listeler.
 */
exports.getCommentsForPost = catchAsync(async (req, res) => {
    const comments = await postService.getCommentsForPost(req.params.postId);
    res.status(200).json({ status: 'success', data: comments });
});

/**
 * Bir gönderiye yeni bir yorum ekler.
 */
exports.createComment = catchAsync(async (req, res) => {
    const newComment = await postService.createComment(req.user.id, req.params.postId, req.body);
    res.status(201).json({ status: 'success', data: newComment });
});

// --- ETKİLEŞİM İŞLEMLERİ ---

/**
 * Bir gönderiyi beğenir veya beğeniyi geri alır.
 */
exports.likePost = catchAsync(async (req, res) => {
    const result = await postService.likeContent(req.user.id, req.params.postId, 'Post');
    res.status(200).json({ status: 'success', data: result });
});

/**
 * Bir gönderiyi beğenmez veya beğenmemeyi geri alır.
 */
exports.dislikePost = catchAsync(async (req, res) => {
    const result = await postService.dislikeContent(req.user.id, req.params.postId, 'Post');
    res.status(200).json({ status: 'success', data: result });
});

/**
 * Bir gönderiyi yer imlerine ekler veya kaldırır.
 */
exports.bookmarkPost = catchAsync(async (req, res) => {
    const result = await postService.bookmarkContent(req.user.id, req.params.postId, 'Post');
    res.status(200).json({ status: 'success', data: result });
});

/**
 * Bir gönderiyi yeniden yayınlar (repost).
 */
exports.repostPost = catchAsync(async (req, res) => {
    await postService.repostPost(req.user.id, req.params.postId);
    res.status(201).json({ status: 'success', message: 'Gönderi başarıyla yeniden yayınlandı.' });
});

/**
 * Bir yeniden yayınlamayı (repost) geri alır.
 */
exports.undoRepost = catchAsync(async (req, res) => {
    await postService.undoRepost(req.user.id, req.params.postId);
    res.status(200).json({ status: 'success', message: 'Yeniden yayınlama geri alındı.' });
});

/**
 * Bir gönderiyi şikayet eder.
 */
exports.reportPost = catchAsync(async (req, res) => {
    const result = await postService.reportContent(req.user.id, req.params.postId, 'Post', req.body);
    res.status(201).json({ status: 'success', message: result.message });
});
