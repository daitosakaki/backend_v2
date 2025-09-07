const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

/**
 * === Ana Gönderi Şeması (Post Schema) - Son Hal ===
 * MİMARİ NOTLARI:
 * Bu model artık bir "Kapsayıcı" (Container) veya "Çerçeve" (Wrapper) görevi görür.
 * Video, Ses, Anket gibi karmaşık ve yeniden kullanılabilir içerikler kendi bağımsız
 * koleksiyonlarında ('Video', 'Audio', 'Poll' modelleri) saklanır.
 * Bu model, bu içeriklere 'attachments' alanı üzerinden referans verir.
 * Bu, mimariyi son derece modüler ve ölçeklenebilir kılar.
 */
const postSchema = new mongoose.Schema({
    // --- TEMEL BİLGİLER ---
    author: { type: ObjectId, ref: 'User', required: true, index: true },
    // Gönderiye yazar tarafından eklenen ana metin.
    text: { type: String, trim: true, maxlength: 2200 },
    
    // --- EKLENTİLER (ATTACHMENTS) ---
    // Gönderiye eklenen ana içerikleri (Video, Ses, Anket, Resim) barındırır.
    // 'refPath' sayesinde dinamik olarak farklı modellere bağlanabilir.
    attachments: [{
        // Hangi modelin eklendiğini belirtir.
        contentType: { 
            type: String, 
            required: true, 
            enum: ['Video', 'Audio', 'Image', 'Poll'] 
        },
        // Eklenen dokümanın ID'si.
        contentId: { 
            type: ObjectId, 
            required: true, 
            refPath: 'attachments.contentType' 
        }
    }],

    // --- İLİŞKİSEL ALANLAR ---
    // Bu gönderi, başka bir gönderiyi "alıntılıyorsa" o gönderinin referansı.
    quotedPost: { type: ObjectId, ref: 'Post', default: null },

    // Süper uygulama özelliği: Bu gönderiyi bir modül ögesiyle (Ürün, Kitap vb.) ilişkilendirir.
    associatedContentRef: { type: ObjectId, refPath: 'associatedContentType' },
    associatedContentType: { type: String, enum: ['Item', 'Book', 'Vehicle', 'Author', 'DatingProfile', 'User'] },

    // --- AYARLAR ---
    visibility: { type: String, enum: ['public', 'followers', 'private'], default: 'public', index: true },
    replyPolicy: { type: String, enum: ['everyone', 'followers', 'mentioned'], default: 'everyone' },

    // --- İSTATİSTİKLER (SAYAÇLAR) ---
    // Gönderinin KENDİSİNE ait etkileşimler. Eklentilerin (örn: Video) kendi sayaçları ayrıdır.
    stats: {
        viewsCount: { type: Number, default: 0, min: 0 },
        likesCount: { type: Number, default: 0, min: 0 },
        dislikesCount: { type: Number, default: 0, min: 0 },
        commentsCount: { type: Number, default: 0, min: 0 },
        quotesCount: { type: Number, default: 0, min: 0 },
        repostsCount: { type: Number, default: 0, min: 0 },
        bookmarksCount: { type: Number, default: 0, min: 0 },
    },
    
    // --- METADATA ve MODERASYON ---
    metadata: {
        deviceInfo: { type: String },
        ipAddress: { type: String },
        isSensitive: { type: Boolean, default: false },
        hasCopyright: { type: Boolean, default: false },
        lang: { type: String, index: true },
    },
    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false }, // Soft-delete için
    reportsCount: { type: Number, default: 0, min: 0 },

}, {
    timestamps: true
});


/**
 * === METOTLAR ===
 */
// API yanıtlarında, güvenlik için hassas olan IP adresi gibi verileri gizle.
postSchema.methods.toJSON = function () {
    const postObject = this.toObject();
    if (postObject.metadata && postObject.metadata.ipAddress) {
        delete postObject.metadata.ipAddress;
    }
    return postObject;
};

const Post = mongoose.model('Post', postSchema);
module.exports = Post;