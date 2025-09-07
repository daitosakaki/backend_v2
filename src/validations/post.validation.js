// src/validations/post.validation.js

const Joi = require('joi');
const { objectId } = require('./custom.validation'); // (Opsiyonel) ObjectId formatını doğrulayan özel bir helper

const createPost = {
    body: Joi.object().keys({
        text: Joi.string().max(2200),
        visibility: Joi.string().valid('public', 'followers', 'private'),
        replyPolicy: Joi.string().valid('everyone', 'followers', 'mentioned'),
        // Anket verisi JSON string olarak gelebilir
        poll: Joi.string().custom((value, helpers) => {
            try {
                const parsed = JSON.parse(value);
                // Burada daha detaylı anket objesi doğrulaması yapılabilir
                if (!parsed.question || !Array.isArray(parsed.options) || parsed.options.length < 2) {
                    return helpers.message('Anket formatı geçersiz.');
                }
                return parsed; // Parse edilmiş objeyi döndür
            } catch (e) {
                return helpers.message('Anket verisi JSON formatında olmalıdır.');
            }
        }),
        quotedPost: Joi.string().custom(objectId), // Alıntılanan gönderinin ID'si
        // ...diğer form alanları...
    }),
};

const getPost = {
    params: Joi.object().keys({
        postId: Joi.string().custom(objectId).required(),
    }),
};

const updatePost = {
    params: Joi.object().keys({
        postId: Joi.string().custom(objectId).required(),
    }),
    body: Joi.object().keys({
        text: Joi.string().max(2200).required(),
    }).min(1),
};

const createComment = {
    params: Joi.object().keys({
        postId: Joi.string().custom(objectId).required(),
    }),
    body: Joi.object().keys({
        content: Joi.string().required().max(1000),
    }),
};

module.exports = {
    createPost,
    getPost,
    updatePost,
    createComment,
};