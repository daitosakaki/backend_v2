// models/image_model.js
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const imageSchema = new mongoose.Schema({
    // Resmi yükleyen kullanıcı
    uploader: { 
        type: ObjectId, 
        ref: 'User', 
        required: true, 
        index: true 
    },
    // Resmin sunucudaki URL'si
    url: { 
        type: String, 
        required: true 
    },
    // Resim için alternatif metin (görme engelliler ve SEO için)
    altText: { 
        type: String, 
        trim: true 
    },
    // Resmin boyutları (opsiyonel, frontend'de yer tutucu için kullanılabilir)
    width: { type: Number },
    height: { type: Number },

}, { timestamps: true });

const Image = mongoose.model('Image', imageSchema);
module.exports = Image;