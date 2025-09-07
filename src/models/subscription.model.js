const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    // Abonelik seviyesinin adı (Örn: 'Free', 'Premium', 'Pro')
    name: { type: String, required: true, unique: true },

    // Görünen adı (Örn: 'Standart Paket', 'Altın Üyelik')
    displayName: { type: String, required: true },

    // Fiyatlandırma bilgileri (isteğe bağlı, Stripe/Iyzico'dan da yönetilebilir)
    price: { type: Number, default: 0 },
    currency: { type: String, default: 'TRY' },
    billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },

    // === ÖZELLİK ERİŞİM KONTROLÜ (FEATURE GATING) ===
    // Bu kısım, bu aboneliğe sahip kullanıcıların hangi özellikleri
    // KULLANIP KULLANAMAYACAĞINI belirler.
    features: {
        // Genel
        adFreeExperience: { type: Boolean, default: false },
        verifiedBadge: { type: Boolean, default: false },
        profileBoost: { type: Boolean, default: false },
        advancedAnalytics: { type: Boolean, default: false },
        customProfileTheme: { type: Boolean, default: false },
        stealthMode: { type: Boolean, default: false },

        // Flört
        canSeeWhoLikedYou: { type: Boolean, default: false },
        canUndoSwipe: { type: Boolean, default: false },
        unlimitedSwipes: { type: Boolean, default: false },
        canChangeLocation: { type: Boolean, default: false },
        canUseAdvancedFilters: { type: Boolean, default: false },
        readReceipts: { type: Boolean, default: false },

        // Sosyal & İçerik
        canPostVideos: { type: Boolean, default: false },
        canCreatePolls: { type: Boolean, default: false },
        canSchedulePosts: { type: Boolean, default: false },

        // Mesajlaşma
        canSendVoiceMessages: { type: Boolean, default: false },
        canRecallMessage: { type: Boolean, default: false },

        // İçerik Üretici
        canUploadHDContent: { type: Boolean, default: false },
        canMonetizeContent: { type: Boolean, default: false },
        privateUploads: { type: Boolean, default: false },

        // E-ticaret
        videoInListing: { type: Boolean, default: false },
        zeroCommissionSales: { type: Boolean, default: false },
    },
    // === KULLANIM LİMİTLERİ (RATE LIMITING) ===
    // Bu kısım, erişimi olan özelliklerin günlük limitlerini belirler.
    // 'null' veya tanımsız bir değer, limitsiz anlamına gelebilir.
    limits: {
        // Sosyal
        postCreate: { type: Number, default: 5 },
        commentCreate: { type: Number, default: 50 },
        reactionAdd: { type: Number, default: 100 },
        repost: { type: Number, default: 10 },
        userReport: { type: Number, default: 5 },
        followRequest: { type: Number, default: 20 },
        profileUpdate: { type: Number, default: 3 },

        // Flört
        swipe: { type: Number, default: 20 },
        superLike: { type: Number, default: 1 },
        undoSwipe: { type: Number, default: 1 },
        matchMessageInitiate: { type: Number, default: 5 },
        revealAdmirer: { type: Number, default: 1 },

        // Mesajlaşma
        newMessageThread: { type: Number, default: 3 },
        groupCreate: { type: Number, default: 1 },

        // İçerik Üretici
        videoUploadCount: { type: Number, default: 1 },
        audioUploadCount: { type: Number, default: 2 },
        livestreamDuration: { type: Number, default: 15 }, // Dakika
        storageQuotaMB: { type: Number, default: 500 }, // Megabyte

        // E-ticaret
        listingCreate: { type: Number, default: 2 }, // Aylık
        listingBoost: { type: Number, default: 1 }, // Aylık
    }

}, { timestamps: true });

const Subscription = mongoose.model('Subscription', subscriptionSchema);
module.exports = Subscription;
