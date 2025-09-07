const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const messageSchema = new mongoose.Schema({
    // Bu mesajın ait olduğu sohbet. Her mesaj bir sohbete aittir.
    conversation: {
        type: ObjectId,
        ref: 'Conversation',
        required: true,
        index: true
    },

    // Mesajı gönderen kullanıcı.
    sender: {
        type: ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Mesajın içeriğinin türü.
    contentType: {
        type: String,
        required: true,
        enum: [
            'text',         // Düz metin
            'image',        // Resim URL'si
            'video',        // Video URL'si
            'audio',        // Ses kaydı URL'si
            'location',     // Konum bilgisi (GeoJSON)
            'system'        // Sistem mesajı (örn: "X kullanıcı gruptan ayrıldı")
        ]
    },

    // Metin mesajları için metin içeriği, medya mesajları için medya URL'si.
    content: {
        type: String,
        required: true,
        trim: true
    },

    // --- OKUNDU BİLGİSİ (READ RECEIPTS) ---
    // Bu mesajı okuyan kullanıcıların ID'lerini tutan dizi.
    // Bir kullanıcının ID'si bu dizide varsa, o mesajı görmüş demektir.
    readBy: {
        type: [{ type: ObjectId, ref: 'User' }],
        index: true
    },

    // Moderasyon ve kullanıcı işlemleri için
    isDeleted: { type: Boolean, default: false } // Soft-delete

}, { timestamps: true }); // `createdAt` alanı, mesajın gönderilme zamanını verir.

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;