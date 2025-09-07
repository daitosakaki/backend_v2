const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const notificationSchema = new mongoose.Schema({
    // --- TEMEL BİLGİLER ---

    // Bildirimi alan kullanıcı
    recipient: { type: ObjectId, ref: 'User', required: true, index: true },
    
    // Bildirimi tetikleyen kullanıcı (aktör). Sistem bildirimleri için boş olabilir.
    actor: { type: ObjectId, ref: 'User', index: true },

    // Bildirimin okunup okunmadığı. Hızlı sorgular için index'lenmiştir.
    isRead: { type: Boolean, default: false, index: true },

    // --- BİLDİRİM TÜRÜ ve İÇERİĞİ ---

    // Bildirimin tipini belirleyen anahtar. Uygulama bu tipe göre ikon, metin ve davranış belirler.
    type: {
        type: String,
        required: true,
        enum: [
            // Sosyal Etkileşimler
            'new_follower',
            'like_post',
            'comment_post',
            'reply_comment',
            'quote_post',
            'repost_post',
            'mention_in_post',
            'mention_in_comment',
            
            // Flört Modülü
            'new_match',
            'new_message_from_match',

            // Mesajlaşma
            'new_message',

            // E-Ticaret Modülü
            'item_sold',
            'new_offer_on_item',
            'item_shipped',
            'new_review_on_item',
            'offer_accepted',

            // Sistem ve Hesap
            'welcome_notification',
            'account_verified',
            'security_alert',
            'app_update',
        ]
    },

    // --- POLİMORFİK İLİŞKİ (EN ÖNEMLİ KISIM) ---
    // Bildirimin hangi varlıkla ilgili olduğunu belirtir.
    // Örneğin, 'like_post' tipi için bu alanlar ilgili 'Post' dokümanını işaret eder.

    // İlgili varlığın (Post, Comment, User vb.) ID'si
    entityRef: {
        type: ObjectId,
        refPath: 'entityModel'
    },
    // İlgili varlığın model adını tutar.
    entityModel: {
        type: String,
        enum: ['Post', 'Comment', 'User', 'Item', 'DatingProfile']
    },
    
    // --- LOKALİZASYON (ÇOKLU DİL DESTEĞİ) ---
    // Bildirim metnini doğrudan kaydetmek yerine, frontend'in metni oluşturması için
    // gerekli bilgileri burada tutarız.
    messageKey: { type: String, required: true }, // Örn: 'notification.new_follower'
    messageParams: {
        // Örn: { actorName: 'kullanici_adi' }
        // Frontend, "notification.new_follower" anahtarını ve bu parametreyi alarak
        // kendi dilinde şu metni oluşturur: "{actorName} sizi takip etmeye başladı."
        type: mongoose.Schema.Types.Mixed 
    },

}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;