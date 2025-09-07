// models/user_model.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usageLimitSchema = new mongoose.Schema({
    count: { type: Number, default: 0 },
    lastReset: { type: Date, default: () => new Date() },
}, { _id: false });

const userSchema = new mongoose.Schema({
    firebaseUid: { type: String, required: true, unique: true, index: true },
    fcmTokens: [
        { type: String }
    ],
    phoneNumber: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true, unique: true, index: true, trim: true },
    email: { type: String, unique: true, sparse: true, trim: true, lowercase: true }, // sparse: null değerler için unique kuralını esnetir
    password: { type: String, required: true, minlength: 8, private: true },

    // Temel Profil Bilgileri
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    displayName: { type: String, trim: true },
    profilePhotoUrl: { type: String, default: null },
    bio: { type: String, trim: true, maxlength: 160 },

    isVerified: { type: Boolean, default: false }, // E-posta veya telefon doğrulaması değil, 'mavi tik' gibi
    isPrivate: { type: Boolean, default: false },
    followerCount: { type: Number, default: 0, min: 0 },
    followingCount: { type: Number, default: 0, min: 0 },
    postCount: { type: Number, default: 0, min: 0 },
    // Sosyal Grafik (Denormalize Edilmiş Sayımlar)
    followerCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    notificationSettings: {
        likes: { type: Boolean, default: true },
        comments: { type: Boolean, default: true },
        newFollower: { type: Boolean, default: true },
    },
    subscription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscription',
        required: true,
    },
    usage: {
        // --- Sosyal Etkileşim Limitleri (Günlük) ---
        postCreate: usageLimitSchema,
        commentCreate: usageLimitSchema,
        reactionAdd: usageLimitSchema,
        repost: usageLimitSchema,
        userReport: usageLimitSchema,
        followRequest: usageLimitSchema,
        profileUpdate: usageLimitSchema,

        // --- Flört Modülü Limitleri (Günlük) ---
        swipe: usageLimitSchema,
        superLike: usageLimitSchema,
        undoSwipe: usageLimitSchema,
        matchMessageInitiate: usageLimitSchema,
        revealAdmirer: usageLimitSchema,

        // --- Mesajlaşma Limitleri (Günlük) ---
        newMessageThread: usageLimitSchema,
        groupCreate: usageLimitSchema,

        // --- İçerik Üretici Limitleri (Günlük) ---
        videoUploadCount: usageLimitSchema,
        audioUploadCount: usageLimitSchema,
        livestreamDuration: usageLimitSchema,

        // --- E-ticaret Limitleri (Aylık) ---
        // Not: Bu alanların periyot takibi ('YYYY-MM') middleware'de farklı yönetilmelidir.
        listingCreate: usageLimitSchema,
        listingBoost: usageLimitSchema,
    },
    // E-Ticaret Bilgileri
    // Stripe, Iyzico gibi ödeme sağlayıcısındaki müşteri ID'sini burada saklarız.
    // ASLA kredi kartı bilgisi saklamayın!
    paymentProviderCustomerId: { type: String, private: true },


    // Flört Modülü Profili
    datingProfile: { type: ObjectId, ref: 'DatingProfile', default: null, index: true },

    // E-Ticaret Satıcı Profili
    sellerProfile: { type: ObjectId, ref: 'SellerProfile', default: null, index: true },

    // İçerik Üretici Profili
    creatorProfile: { type: ObjectId, ref: 'CreatorProfile', default: null, index: true },

    // Kariyer Profili
    professionalProfile: { type: ObjectId, ref: 'ProfessionalProfile', default: null, index: true },

    // İlan Veren Profili
    agentProfile: { type: ObjectId, ref: 'AgentProfile', default: null, index: true },

    // Oyuncu Profili
    gamerProfile: { type: ObjectId, ref: 'GamerProfile', default: null, index: true },

}, { timestamps: true });

// Middleware ve Metodlar (Değişiklik yok)
userSchema.pre('save', async function (next) {
    if (this.isModified('firstName') || this.isModified('lastName')) {
        this.displayName = `${this.firstName || ''} ${this.lastName || ''}`.trim();
    }
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

userSchema.methods.isPasswordMatch = async function (password) {
    return bcrypt.compare(password, this.password);
};

userSchema.methods.toJSON = function () {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.paymentProviderCustomerId;
    delete userObject.fcmTokens;
    return userObject;
};

const User = mongoose.model('User', userSchema);
module.exports = User;