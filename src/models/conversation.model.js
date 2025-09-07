const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const conversationSchema = new mongoose.Schema({
    // Sohbete dahil olan tüm kullanıcıların ID'leri.
    // Hızlı sorgular için index'lenmiştir.
    participants: {
        type: [{ type: ObjectId, ref: 'User' }],
        required: true,
        index: true
    },

    // Sohbette gönderilen en son mesajın ID'si.
    // Bu, "gelen kutusu" ekranında mesaj önizlemesi göstermek için
    // kullanılan bir performans optimizasyonudur (denormalization).
    lastMessage: {
        type: ObjectId,
        ref: 'Message'
    },

    // Sohbetin türünü belirtir.
    type: {
        type: String,
        enum: ['private', 'group'],
        default: 'private'
    },

    // --- GRUP SOHBETLERİNE ÖZEL ALANLAR ---
    groupName: {
        type: String,
        trim: true
    },
    groupAvatar: {
        type: String
    },
    admins: {
        type: [{ type: ObjectId, ref: 'User' }]
    },
    // Grubu oluşturan kişi
    createdBy: {
        type: ObjectId,
        ref: 'User'
    }

}, { timestamps: true }); // `updatedAt` alanı, sohbetin en son ne zaman aktif olduğunu gösterir.

const Conversation = mongoose.model('Conversation', conversationSchema);
module.exports = Conversation;