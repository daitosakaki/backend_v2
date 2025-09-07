const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

/**
 * === Anket Seçeneği Alt Şeması ===
 * Bir anketteki her bir seçeneği temsil eder.
 */
const pollOptionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    
    // Bu seçeneğe oy veren kullanıcıların ID'lerini tutar.
    // Bu dizinin boyutu, seçeneğin oy sayısını verir.
    voters: [{ type: ObjectId, ref: 'User' }]
}, { _id: false });


/**
 * === Ana Anket Şeması (Poll Schema) ===
 * Bu model, bir anketin tüm verilerini ve mantığını barındırır.
 * Bir 'Post' dokümanı, bu modeldeki bir dokümana referans vererek anketi "içerir".
 */
const pollSchema = new mongoose.Schema({
    // Anketi oluşturan kullanıcı
    author: { type: ObjectId, ref: 'User', required: true, index: true },
    
    // Bu anketin içinde bulunduğu gönderi.
    // Bu referans, anketten gönderiye geri dönmeyi kolaylaştırır.
    parentPost: { type: ObjectId, ref: 'Post', required: true, index: true },

    // Anketin ana sorusu
    question: { type: String, required: true, trim: true },

    // Anketin seçenekleri
    options: [pollOptionSchema],

    // Anketin ne zaman sona ereceğini belirtir.
    // 'null' olması, anketin süresiz olduğu anlamına gelir.
    expiresAt: { type: Date, default: null, index: true },

    // --- PERFORMANS ve KONTROL İÇİN ---
    // Bu dizide, bu ankete oy vermiş TÜM kullanıcıların ID'leri tutulur.
    // Bir kullanıcının daha önce oy verip vermediğini kontrol etmenin en hızlı yolu budur.
    // Bu sayede, her oy denemesinde tüm 'options.voters' dizilerini taramak zorunda kalmayız.
    voters: [{ type: ObjectId, ref: 'User', index: true }],

    // Anketin genel istatistikleri (Denormalization)
    stats: {
        // Tüm seçeneklerdeki toplam oy sayısı
        totalVotes: { type: Number, default: 0, min: 0 },
    },

}, { timestamps: true });


const Poll = mongoose.model('Poll', pollSchema);
module.exports = Poll;