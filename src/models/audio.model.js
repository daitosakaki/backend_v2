const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const audioSchema = new mongoose.Schema({
    uploader: { type: ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    
    // Artist artık zengin bir veri modeline referans veriyor.
    artist: { type: ObjectId, ref: 'Artist', index: true },
    
    album: { type: String },
    url: { type: String, required: true },
    artworkUrl: { type: String }, // Kapak fotoğrafı
    duration: { type: Number, required: true }, // Saniye cinsinden
    
    // Ses dosyasının kendi bağımsız istatistikleri
    stats: {
        viewsCount: { type: Number, default: 0, min: 0 },
        likesCount: { type: Number, default: 0, min: 0 },
        dislikesCount: { type: Number, default: 0, min: 0 },
        commentsCount: { type: Number, default: 0, min: 0 },
        sharesCount: { type: Number, default: 0, min: 0 }
    },
    
    genre: { type: String },

}, { timestamps: true });

const Audio = mongoose.model('Audio', audioSchema);
module.exports = Audio;