const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const addressSchema = new mongoose.Schema({
    // Bu adresin sahibi olan kullanıcı.
    // Bir kullanıcının birden fazla adresi olabilir.
    user: {
        type: ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Kullanıcının adresi kolayca tanıması için verdiği başlık (örn: "Evim", "İş Yerim").
    addressTitle: {
        type: String,
        required: [true, 'Adres başlığı gereklidir.'],
        trim: true
    },

    // --- TESLİMAT BİLGİLERİ ---
    // Adres, kullanıcının kendisi için değil, bir hediye için de olabilir.
    // Bu yüzden isim ve telefon numarasını ayrıca saklarız.
    firstName: {
        type: String,
        required: [true, 'Ad gereklidir.'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Soyad gereklidir.'],
        trim: true
    },
    phoneNumber: {
        type: String,
        required: [true, 'Telefon numarası gereklidir.'],
        trim: true
    },

    // --- DETAYLI ADRES ALANLARI ---
    country: {
        type: String,
        required: true,
        default: 'Türkiye'
    },
    province: { // İl
        type: String,
        required: [true, 'İl bilgisi gereklidir.']
    },
    district: { // İlçe
        type: String,
        required: [true, 'İlçe bilgisi gereklidir.']
    },
    neighborhood: { // Mahalle
        type: String,
        trim: true
    },
    // Cadde, sokak, bina no, daire no gibi bilgileri içeren tam adres satırı.
    streetAddress: {
        type: String,
        required: [true, 'Açık adres gereklidir.'],
        trim: true
    },
    postalCode: {
        type: String,
        trim: true
    },

    // --- ÖZEL DURUM BAYRAKLARI (FLAGS) ---
    // Bu adresin kullanıcının varsayılan kargo adresi olup olmadığını belirtir.
    isDefaultShipping: {
        type: Boolean,
        default: false
    },
    // Bu adresin kullanıcının varsayılan fatura adresi olup olmadığını belirtir.
    isDefaultBilling: {
        type: Boolean,
        default: false
    },

    // --- EK BİLGİLER (İSTEĞE BAĞLI) ---
    addressType: {
        type: String,
        enum: ['residential', 'commercial'], // Ev adresi, İş adresi
        default: 'residential'
    },
    // Kurye için özel notlar (örn: "Zili çalmayın, köpeği uyandırıyor.").
    deliveryInstructions: {
        type: String,
        trim: true,
        maxlength: 250
    },

}, { timestamps: true });


// === AKILLI VARSAYILAN ADRES MANTIĞI (PRE-SAVE MIDDLEWARE) ===
// Bu fonksiyon, bir adres dokümanı kaydedilmeden HEMEN ÖNCE çalışır.
addressSchema.pre('save', async function (next) {
    // Eğer bu adres 'isDefaultShipping' olarak işaretlendiyse...
    if (this.isModified('isDefaultShipping') && this.isDefaultShipping) {
        // ...bu kullanıcıya ait ve 'isDefaultShipping=true' olan DİĞER tüm adresleri bul
        // ve onların 'isDefaultShipping' bayrağını 'false' yap.
        await this.constructor.updateMany(
            { user: this.user, _id: { $ne: this._id }, isDefaultShipping: true },
            { isDefaultShipping: false }
        );
    }

    // Aynı mantığı 'isDefaultBilling' için de uygula.
    if (this.isModified('isDefaultBilling') && this.isDefaultBilling) {
        await this.constructor.updateMany(
            { user: this.user, _id: { $ne: this._id }, isDefaultBilling: true },
            { isDefaultBilling: false }
        );
    }

    next();
});


const Address = mongoose.model('Address', addressSchema);
module.exports = Address;