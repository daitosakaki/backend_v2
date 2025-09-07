const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const repostSchema = new mongoose.Schema({
    // Repost (yeniden yayınlama) eylemini yapan kullanıcı.
    reposter: { 
        type: ObjectId, 
        ref: 'User', 
        required: true, 
        index: true 
    },
    
    // Yeniden yayınlanan orijinal gönderi.
    originalPost: { 
        type: ObjectId, 
        ref: 'Post', 
        required: true, 
        index: true 
    },
}, { 
    // `createdAt` alanı, repost'un ne zaman yapıldığını tutar.
    // Bu, zaman akışını (timeline) kronolojik olarak sıralamak için kritiktir.
    timestamps: true 
});

// Bir kullanıcının aynı gönderiyi birden fazla kez repost'lamasını engeller.
repostSchema.index({ reposter: 1, originalPost: 1 }, { unique: true });

const Repost = mongoose.model('Repost', repostSchema);
module.exports = Repost;
