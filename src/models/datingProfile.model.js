const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const datingProfileSchema = new mongoose.Schema({
    // Bu flört profilinin sahibi olan ana kullanıcı.
    // Bir kullanıcının sadece bir flört profili olabileceğinden 'unique' olmalıdır.
    user: { 
        type: ObjectId, 
        ref: 'User', 
        required: true, 
        unique: true, 
        index: true 
    },

    // Flört profilinde gösterilecek fotoğraflar.
    // Genellikle ilk fotoğraf ana profil fotoğrafı olarak kullanılır.
    photos: {
        type: [{ type: String, required: true }],
        validate: [arr => arr.length > 0 && arr.length <= 9, 'En az 1, en fazla 9 fotoğraf yüklenmelidir.']
    },

    // Kullanıcının kendini anlattığı metin.
    bio: { type: String, trim: true, maxlength: 500 },

    // --- KİŞİSEL BİLGİLER ve YAŞAM TARZI ---
    // Bu alanlar, filtreleme ve eşleştirme kalitesini artırmak için kullanılır.
    height: { type: Number }, // Santimetre cinsinden
    jobTitle: { type: String, trim: true },
    company: { type: String, trim: true },
    educationLevel: { 
        type: String, 
        enum: ['Lise', 'Ön Lisans', 'Lisans', 'Yüksek Lisans', 'Doktora', 'Belirtmek istemiyorum'] 
    },
    lookingFor: { 
        type: String, 
        enum: ['İlişki', 'Flört', 'Arkadaşlık', 'Emin değilim'],
        required: true
    },
    lifestyle: {
        smoking: { type: String, enum: ['Evet', 'Hayır', 'Bazen'] },
        drinking: { type: String, enum: ['Evet', 'Hayır', 'Bazen'] },
        exercise: { type: String, enum: ['Aktif', 'Düzenli', 'Bazen', 'Nadiren'] }
    },
    
    // Kullanıcının seçebileceği ilgi alanları etiketleri
    interests: [{ type: String, trim: true }],

    // --- EŞLEŞME TERCİHLERİ ---
    // Kullanıcının aradığı profile dair kriterler.
    interestedIn: {
        type: [{ type: String, enum: ['Men', 'Women', 'Everyone'], required: true }],
        default: ['Everyone']
    },
    ageRange: {
        min: { type: Number, default: 18, min: 18 },
        max: { type: Number, default: 55, max: 100 }
    },
    distancePreference: { type: Number, default: 50 }, // Kilometre cinsinden

    // --- KONUM BİLGİSİ (EN ÖNEMLİ ALAN) ---
    // MongoDB'nin coğrafi sorgularını (örneğin 'yakınımdakileri bul')
    // çok hızlı yapabilmesi için GeoJSON formatında saklanır.
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude] formatında
            default: [0, 0]
        }
    },

    // Profilin flört modülünde aktif olup olmadığını belirtir.
    // Kullanıcı 'mola vermek' istediğinde false yapılabilir.
    isActive: { type: Boolean, default: true, index: true },

}, { timestamps: true });


// === PERFORMANS İÇİN KRİTİK INDEX ===
// Bu index, 'bana yakın olanları bul' sorgularının ışık hızında çalışmasını sağlar.
datingProfileSchema.index({ location: '2dsphere' });

const DatingProfile = mongoose.model('DatingProfile', datingProfileSchema);
module.exports = DatingProfile;
