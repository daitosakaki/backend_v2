const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const videoSchema = new mongoose.Schema({
    uploader: { type: ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    url: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    duration: { type: Number, required: true }, // Saniye cinsinden
    
    // Videonun kendi bağımsız istatistikleri
    stats: {
        viewsCount: { type: Number, default: 0, min: 0 },
        likesCount: { type: Number, default: 0, min: 0 },
        dislikesCount: { type: Number, default: 0, min: 0 },
        commentsCount: { type: Number, default: 0, min: 0 },
        sharesCount: { type: Number, default: 0, min: 0 }
    },
    
    // Bu videoya ait yorumlar, kendi Comment koleksiyonunda 'parentVideo' alanı ile tutulabilir.
    
    visibility: { type: String, enum: ['public', 'unlisted', 'private'], default: 'public' },
    tags: [String],

}, { timestamps: true });

const Video = mongoose.model('Video', videoSchema);
module.exports = Video;