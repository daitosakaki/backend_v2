// src/models/follow.model.js
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const followSchema = new mongoose.Schema({
    // Takip etme eylemini başlatan kullanıcı (Takipçi)
    follower: { 
        type: ObjectId, 
        ref: 'User', 
        required: true, 
        index: true 
    },
    
    // Takip edilen kullanıcı
    following: { 
        type: ObjectId, 
        ref: 'User', 
        required: true, 
        index: true 
    },

    // Takip ilişkisinin durumu. Gizli profiller için hayati önem taşır.
    status: {
        type: String,
        enum: ['pending', 'accepted'], // pending: istek, accepted: onaylanmış takip
        required: true,
        default: 'pending'
    }
}, { 
    timestamps: true 
});

// Bir kullanıcının başka bir kullanıcıya sadece bir takip isteği gönderebilmesini/takip edebilmesini sağlar.
followSchema.index({ follower: 1, following: 1 }, { unique: true });

const Follow = mongoose.model('Follow', followSchema);
module.exports = Follow;