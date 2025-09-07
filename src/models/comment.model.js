const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const commentSchema = new mongoose.Schema({
    // Yorumu yapan kullanıcı
    author: { type: ObjectId, ref: 'User', required: true, index: true },
    
    // Yorumun yapıldığı gönderi
    post: { type: ObjectId, ref: 'Post', required: true, index: true },

    // Eğer bu bir yanıtsa, yanıt verilen ana yorumun ID'si
    // Bu alan, Reddit tarzı dallanmalı sohbetlerin temelini oluşturur.
    parentComment: { type: ObjectId, ref: 'Comment', default: null, index: true },

    // Yorumun içeriği
    content: { type: String, required: true, trim: true, maxlength: 1000 },

    // --- GÜNCELLENMİŞ İSTATİSTİKLER ---
    // Yorumun kendi etkileşim sayaçları. Bu, UI'da hızlı gösterim ve
    // moderasyon için performansı artırır.
    stats: {
        viewsCount: { type: Number, default: 0, min: 0 },
        likesCount: { type: Number, default: 0, min: 0 },
        dislikesCount: { type: Number, default: 0, min: 0 },
        commentsCount: { type: Number, default: 0, min: 0 },
        quotesCount: { type: Number, default: 0, min: 0 },
        repostsCount: { type: Number, default: 0, min: 0 },
        bookmarksCount: { type: Number, default: 0, min: 0 },
    },
    // Moderasyon bayrakları
    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false }, // Soft-delete için

}, { timestamps: true });


// === İŞ MANTIĞI (LOGIC) ===
// Bu yeni sayaçlar nasıl güncellenecek?

// 1. BİR YORUMA YANIT VERİLDİĞİNDE:
//    - Yeni bir Comment dokümanı oluşturulur (parentComment alanı doldurularak).
//    - YANIT VERİLEN ana yorumun 'stats.repliesCount' alanı 1 artırılır.
//      (örn: Comment.updateOne({ _id: parentCommentId }, { $inc: { 'stats.repliesCount': 1 } }))

// 2. BİR YORUM BEĞENİLDİĞİNDE / BEĞENİLMEDİĞİNDE:
//    - İlgili Comment dokümanının 'stats.likesCount' veya 'stats.dislikesCount' alanı 1 artırılır.

// 3. BİR YORUM ŞİKAYET EDİLDİĞİNDE:
//    - Yeni bir Report dokümanı oluşturulur (Report'un hedefi bu yorumun ID'si olacak şekilde).
//    - Bu Comment dokümanının 'stats.reportsCount' alanı 1 artırılır.


const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;