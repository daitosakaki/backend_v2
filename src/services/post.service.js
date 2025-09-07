const mongoose = require('mongoose');
const Post = require('../models/post_model');
const User = require('../models/user_model');
const Video = require('../models/video_model');
const Audio = require('../models/audio_model');
const Poll = require('../models/poll_model');
const Image = require('../models/image_model');
const Repost = require('../models/repost.model');
const permissionService = require('./permission.service');
/**
 * Kullanıcının abonelik limitini aştığında fırlatılacak özel hata sınıfı.
 * Bu, kontrolcü katmanında hatayı daha kolay yakalamamızı sağlar.
 */
class LimitExceededError extends Error {
    constructor(message) {
        super(message);
        this.name = 'LimitExceededError';
    }
}

/**
 * Bir kullanıcı için kişiselleştirilmiş ana sayfa akışını oluşturur.
 * @param {string} userId - Giriş yapmış kullanıcının ID'si
 */
exports.getFeedForUser = async (userId, options) => {
    // 1. Adım: Kullanıcının takip ettiği kişilerin ID listesini al.
    const followingDocs = await Follow.find({ follower: userId, status: 'accepted' }).select('following');
    const followingIds = followingDocs.map(doc => doc.following);

    // 2. Adım: Kullanıcının kendisini de bu listeye ekle ki kendi gönderilerini de görsün.
    const authorsToShow = [...followingIds, userId];

    // 3. Adım: Gönderileri, sadece bu yazar listesinden olanları getirecek şekilde sorgula.
    // Bu sorgu, gizli profillerin gönderilerini otomatik olarak filtreler,
    // çünkü takip etmediğiniz gizli bir profilin ID'si 'authorsToShow' listesinde zaten olmayacaktır.
    const posts = await Post.find({
        author: { $in: authorsToShow },
        isDeleted: false,
        visibility: { $in: ['public', 'followers'] } // Sadece herkese açık veya takipçilere özel gönderileri göster
    })
        .sort({ createdAt: -1 })
        .limit(options.limit)
        .skip((options.page - 1) * options.limit)
        .populate('author', 'username displayName profilePhotoUrl')
        .populate('quotedPost') // Alıntılanan gönderiyi de doldur
        .populate({
            path: 'attachments.contentId'
        });

    return posts;
};

/**
 * Yeni bir gönderi oluşturur. Bu işlem, bir dizi veritabanı operasyonu içerdiği
 * için atomikliği (hepsinin başarılı olması veya hiçbirinin olmaması) sağlamak
 * amacıyla bir Transaction içinde yürütülür.
 * * @param {string} userId - Gönderiyi oluşturan kullanıcının ID'si.
 * @param {object} postData - Gönderinin metin, anket, alıntı gibi verileri.
 * @param {Array<object>} files - Multer tarafından yüklenen ve medya dosyalarını içeren dizi.
 * @returns {Promise<object>} - Oluşturulan ve populate edilmiş yeni gönderi dokümanı.
 */
exports.createPost = async (userId, postData, files) => {

    // --- 1. Adım: LİMİT KONTROLÜ (TRANSACTION DIŞINDA) ---
    // Veritabanına ağır bir yük bindirmeden önce kullanıcının bu işlemi yapma hakkı olup
    // olmadığını hızlıca kontrol ederiz.
    const user = await User.findById(userId).populate('subscription');
    if (!user || !user.subscription) {
        throw new Error('Kullanıcı veya abonelik bilgisi bulunamadı.');
    }

    const postCreateLimit = user.subscription.limits.postCreate;
    const usageData = user.usage.postCreate;
    const todayPeriod = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD' formatı

    if (usageData.period === todayPeriod && usageData.count >= postCreateLimit) {
        // Limit aşıldıysa, özel hatamızı fırlatıp işlemi anında durdururuz.
        throw new LimitExceededError('Günlük gönderi oluşturma limitinize ulaştınız.');
    }

    // --- 2. Adım: VERİTABANI İŞLEMLERİ (TRANSACTION İÇİNDE) ---
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let attachments = [];

        // Adım 2a: Varsa, yüklenen medyalar için veritabanı kayıtları oluştur.
        if (files && files.length > 0) {
            for (const file of files) {
                let newMedia;
                let contentType;

                if (file.mimetype.startsWith('video/')) {
                    contentType = 'Video';
                    newMedia = new Video({ uploader: userId, url: file.location });
                } else if (file.mimetype.startsWith('audio/')) {
                    contentType = 'Audio';
                    newMedia = new Audio({ uploader: userId, url: file.location });
                } else if (file.mimetype.startsWith('image/')) {
                    contentType = 'Image';
                    newMedia = new Image({ uploader: userId, url: file.location });
                }

                if (newMedia) {
                    await newMedia.save({ session });
                    attachments.push({ contentType, contentId: newMedia._id });
                }
            }
        }

        // Adım 2b: Varsa, anket için veritabanı kaydı oluştur.
        if (postData.poll) {
            const pollData = JSON.parse(postData.poll);
            const poll = new Poll({
                author: userId,
                question: pollData.question,
                options: pollData.options,
                expiresAt: pollData.expiresAt || null
            });
            await poll.save({ session });
            attachments.push({ contentType: 'Poll', contentId: poll._id });
        }

        // Adım 2c: Ana Post dokümanını oluştur.
        const newPost = new Post({
            author: userId,
            text: postData.text,
            attachments: attachments,
            quotedPost: postData.quotedPost || null,
            visibility: postData.visibility || 'public',
            replyPolicy: postData.replyPolicy || 'everyone',
            metadata: {
                // deviceInfo ve ipAddress gibi bilgiler req objesinden alınabilir
            }
        });

        // Adım 2d: Varsa, alıntılanan gönderinin sayaçlarını güncelle.
        if (newPost.quotedPost) {
            await Post.updateOne({ _id: newPost.quotedPost }, { $inc: { 'stats.quotesCount': 1 } }, { session });
        }

        // Adım 2e: Kullanıcının gönderi ve kullanım sayaçlarını güncelle.
        if (usageData.period === todayPeriod) {
            user.usage.postCreate.count++; // Bugün zaten gönderi atmış, sayacı artır.
        } else {
            user.usage.postCreate.count = 1; // Bugünün ilk gönderisi, sayacı sıfırla.
            user.usage.postCreate.period = todayPeriod;
        }
        user.postCount++; // Toplam gönderi sayacını her zaman artır.

        await user.save({ session });

        // Adım 2f: Varsa, anketin 'parentPost' alanını bu yeni post'un ID'si ile güncelle (çift yönlü bağ).
        const pollAttachment = attachments.find(a => a.contentType === 'Poll');
        if (pollAttachment) {
            await Poll.updateOne({ _id: pollAttachment.contentId }, { parentPost: newPost._id }, { session });
        }

        // Adım 2g: Son olarak, tüm referansları içeren ana gönderiyi kaydet.
        await newPost.save({ session });

        // Her şey yolundaysa, işlemi onayla.
        await session.commitTransaction();

        // --- 3. Adım: YANITI HAZIRLAMA (TRANSACTION SONRASI) ---
        // Oluşturulan post'u, frontend'in ihtiyaç duyacağı tüm bilgilerle
        // (yazar bilgileri, eklenti detayları) zenginleştirerek geri döndürürüz.
        const populatedPost = await Post.findById(newPost._id)
            .populate('author', 'username displayName profilePhotoUrl')
            .populate({
                path: 'attachments.contentId',
                model: (doc) => doc.attachments.contentType // refPath'i dinamik olarak kullan
            });

        return populatedPost;

    } catch (error) {
        // Herhangi bir adımda hata olursa, tüm değişiklikleri geri al.
        await session.abortTransaction();
        // Hatayı, kontrolcü katmanının yakalaması için yeniden fırlat.
        if (error instanceof LimitExceededError) {
            throw error;
        }
        throw new Error(`Gönderi oluşturma işlemi sırasında bir veritabanı hatası oluştu: ${error.message}`);
    } finally {
        // İşlem başarılı da olsa, başarısız da olsa session'ı sonlandır.
        session.endSession();
    }
};

exports.repostPost = async (userId, postId) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // 1. Gönderinin var olup olmadığını kontrol et
        const post = await Post.findById(postId).session(session);
        if (!post) {
            throw new ApiError(404, 'Gönderi bulunamadı.');
        }

        // 2. Kullanıcının bu gönderiyi zaten repost'layıp repost'lamadığını kontrol et
        const existingRepost = await Repost.findOne({ reposter: userId, originalPost: postId }).session(session);
        if (existingRepost) {
            // Eğer zaten varsa, hata vermek yerine sessizce başarılı dönebiliriz.
            // Bu, UI'da oluşabilecek çift tıklama gibi sorunları engeller.
            await session.abortTransaction();
            return;
        }

        // 3. Yeni bir Repost dokümanı oluştur
        await Repost.create([{ reposter: userId, originalPost: postId }], { session });

        // 4. Orijinal gönderinin repost sayacını 1 artır
        await Post.updateOne({ _id: postId }, { $inc: { 'stats.repostsCount': 1 } }, { session });

        // 5. İşlemi onayla
        await session.commitTransaction();

        // (Opsiyonel) Bildirim gönderme servisi burada çağrılabilir.
        // notificationService.createNotification(post.author, userId, 'repost_post', post._id);

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Bir kullanıcının bir gönderiye yaptığı yeniden yayınlamayı geri almasını sağlar.
 * @param {string} userId - Repost'u geri alan kullanıcının ID'si.
 * @param {string} postId - Repost'u yapılan orijinal gönderinin ID'si.
 */
exports.undoRepost = async (userId, postId) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // 1. Silinecek repost kaydını bul ve sil
        const deletedRepost = await Repost.findOneAndDelete({ reposter: userId, originalPost: postId }).session(session);

        // 2. Eğer bir kayıt silindiyse (yani kullanıcı gerçekten repost yapmışsa)
        if (deletedRepost) {
            // Orijinal gönderinin repost sayacını 1 azalt
            // Sayacın 0'ın altına düşmemesini garantilemek için bir koşul ekleyebiliriz.
            await Post.updateOne(
                { _id: postId, 'stats.repostsCount': { $gt: 0 } },
                { $inc: { 'stats.repostsCount': -1 } },
                { session }
            );
        }

        // 3. İşlemi onayla
        await session.commitTransaction();
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Bir içeriği beğenir. Kullanıcı daha önce beğenmediyse, beğenisini kaldırır.
 * @param {string} userId - İşlemi yapan kullanıcı ID'si
 * @param {string} contentId - Beğenilen içeriğin ID'si
 * @param {string} contentType - İçeriğin modeli ('Post', 'Comment' vb.)
 */
exports.likeContent = async (userId, contentId, contentType) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // 1. Olası bir 'dislike' kaydını kontrol et ve kaldır.
        const existingDislike = await Dislike.findOneAndDelete({ user: userId, contentId, contentType }).session(session);
        if (existingDislike) {
            await mongoose.model(contentType).updateOne({ _id: contentId }, { $inc: { 'stats.dislikesCount': -1 } }).session(session);
        }

        // 2. Zaten beğenilmiş mi diye kontrol et.
        const existingLike = await Like.findOne({ user: userId, contentId, contentType }).session(session);
        if (existingLike) {
            // Eğer zaten beğenilmişse, beğeniyi geri al (unlike).
            await existingLike.deleteOne({ session });
            await mongoose.model(contentType).updateOne({ _id: contentId }, { $inc: { 'stats.likesCount': -1 } }).session(session);
            await session.commitTransaction();
            return { liked: false, message: 'Beğeni geri alındı.' };
        }

        // 3. Yeni 'Like' kaydını oluştur.
        await Like.create([{ user: userId, contentId, contentType }], { session });

        // 4. İçeriğin beğeni sayacını artır.
        await mongoose.model(contentType).updateOne({ _id: contentId }, { $inc: { 'stats.likesCount': 1 } }).session(session);

        await session.commitTransaction();
        // (Opsiyonel) İçerik sahibine bildirim gönder.
        return { liked: true, message: 'İçerik beğenildi.' };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Bir içeriği beğenmez (dislike). Mantık, likeContent'in simetriğidir.
 */
exports.dislikeContent = async (userId, contentId, contentType) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // 1. Olası bir 'like' kaydını kontrol et ve kaldır.
        const existingLike = await Like.findOneAndDelete({ user: userId, contentId, contentType }).session(session);
        if (existingLike) {
            await mongoose.model(contentType).updateOne({ _id: contentId }, { $inc: { 'stats.likesCount': -1 } }).session(session);
        }

        // 2. Zaten dislike edilmiş mi diye kontrol et.
        const existingDislike = await Dislike.findOne({ user: userId, contentId, contentType }).session(session);
        if (existingDislike) {
            // Eğer zaten dislike edilmişse, geri al (undislike).
            await existingDislike.deleteOne({ session });
            await mongoose.model(contentType).updateOne({ _id: contentId }, { $inc: { 'stats.dislikesCount': -1 } }).session(session);
            await session.commitTransaction();
            return { disliked: false, message: 'Beğenmeme geri alındı.' };
        }

        // 3. Yeni 'Dislike' kaydını oluştur.
        await Dislike.create([{ user: userId, contentId, contentType }], { session });

        // 4. İçeriğin dislike sayacını artır.
        await mongoose.model(contentType).updateOne({ _id: contentId }, { $inc: { 'stats.dislikesCount': 1 } }).session(session);

        await session.commitTransaction();
        return { disliked: true, message: 'İçerik beğenilmedi.' };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Bir içeriği yer imlerine ekler veya kaldırır.
 */
exports.bookmarkContent = async (userId, contentId, contentType) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const existingBookmark = await Bookmark.findOne({ user: userId, contentId, contentType }).session(session);

        if (existingBookmark) {
            // Zaten varsa, kaldır.
            await existingBookmark.deleteOne({ session });
            await mongoose.model(contentType).updateOne({ _id: contentId }, { $inc: { 'stats.bookmarksCount': -1 } }).session(session);
            await session.commitTransaction();
            return { bookmarked: false, message: 'Yer imlerinden kaldırıldı.' };
        } else {
            // Yoksa, ekle.
            await Bookmark.create([{ user: userId, contentId, contentType }], { session });
            await mongoose.model(contentType).updateOne({ _id: contentId }, { $inc: { 'stats.bookmarksCount': 1 } }).session(session);
            await session.commitTransaction();
            return { bookmarked: true, message: 'Yer imlerine eklendi.' };
        }
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Bir içeriği şikayet eder.
 */
exports.reportContent = async (userId, contentId, contentType, reportData) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { reason, details } = reportData;
        if (!reason) {
            throw new ApiError(400, 'Şikayet nedeni belirtilmelidir.');
        }

        // Kullanıcının aynı içeriği aynı nedenle tekrar şikayet etmesini engelle
        const existingReport = await Report.findOne({ reporter: userId, contentId, contentType, reason }).session(session);
        if (existingReport) {
            throw new ApiError(409, 'Bu içeriği bu nedenle zaten şikayet ettiniz.');
        }

        // Yeni şikayet kaydı oluştur
        await Report.create([{ reporter: userId, contentId, contentType, reason, details }], { session });

        // İçeriğin şikayet sayacını artır (Eğer moderasyon için ayrı bir sayaç tutuyorsak)
        const contentModel = mongoose.model(contentType);
        // reportsCount alanı Post modelinde var ama Comment modelinde olmayabilir, kontrol et.
        if (contentModel.schema.path('reportsCount') || contentModel.schema.path('stats.reportsCount')) {
            await contentModel.updateOne({ _id: contentId }, { $inc: { reportsCount: 1 } }).session(session);
        }

        await session.commitTransaction();
        // (Opsiyonel) Moderatörlere bildirim veya e-posta gönder
        return { message: 'Şikayetiniz başarıyla alındı.' };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Belirli bir kullanıcının gönderilerini, gizlilik kontrolü yaparak getirir.
 * @param {string} currentUserId - İstek yapan kullanıcının ID'si
 * @param {string} targetUserId - Gönderileri listelenecek kullanıcının ID'si
 */
exports.getPostsForUser = async (currentUserId, targetUserId) => {
    // 1. Adım: Önce yetkiyi kontrol et.
    const canView = await permissionService.canViewUserContent(currentUserId, targetUserId);

    // 2. Adım: Yetki yoksa, hata fırlat veya boş dizi dön.
    if (!canView) {
        // Frontend'in "Bu hesap gizli" mesajı göstermesi için 403 Forbidden hatası fırlatabiliriz.
        throw new ApiError(403, 'Bu hesabın gönderilerini görme yetkiniz yok.');
    }

    // 3. Adım: Yetki varsa, gönderileri çek ve döndür.
    const posts = await Post.find({ author: targetUserId, isDeleted: false })
        .sort({ createdAt: -1 })
        .populate('author', 'username displayName profilePhotoUrl');

    return posts;
};