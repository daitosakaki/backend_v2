// src/validations/user.validation.js
const Joi = require('joi');
const { objectId } = require('./custom.validation');

// Bir kullanıcıyı kullanıcı adına göre getirme
const getUserByUsername = {
    params: Joi.object().keys({
        username: Joi.string().required(),
    }),
};

// Giriş yapmış kullanıcının kendi profilini güncellemesi
const updateMe = {
    body: Joi.object()
        .keys({
            firstName: Joi.string(),
            lastName: Joi.string(),
            displayName: Joi.string(),
            bio: Joi.string().max(160).allow(''), // Boş string'e izin ver
            isPrivate: Joi.boolean(),
        })
        .min(1), // En az bir alan güncellenmeli
};

// Kullanıcı arama
const searchUsers = {
    query: Joi.object().keys({
        q: Joi.string().required(), // Arama terimi
        page: Joi.number().integer().min(1),
        limit: Joi.number().integer().min(1),
    }),
};

// Takip isteğini yönetme
const handleFollowRequest = {
    params: Joi.object().keys({
        // Takip isteğinin (Follow dokümanı) ID'si
        requestId: Joi.string().custom(objectId).required(),
    }),
};

module.exports = {
    getUserByUsername,
    updateMe,
    searchUsers,
    handleFollowRequest,
};