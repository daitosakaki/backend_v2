exports.blockUser = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const blockerId = req.user.id; // Engelleyen kullanıcı (giriş yapmış olan)
        const blockingId = req.params.userId; // Engellenecek kullanıcının ID'si

        // 1. Block kaydını oluştur
        await Block.create([{ blocker: blockerId, blocking: blockingId }], { session });

        // 2. Takipleşmeyi sonlandır (çift yönlü)
        const follow1 = await Follows.findOneAndDelete({ follower: blockerId, following: blockingId }, { session });
        const follow2 = await Follows.findOneAndDelete({ follower: blockingId, following: blockerId }, { session });

        // 3. Sayıları güncelle
        if (follow1) {
            await User.updateOne({ _id: blockerId }, { $inc: { followingCount: -1 } }, { session });
            await User.updateOne({ _id: blockingId }, { $inc: { followerCount: -1 } }, { session });
        }
        if (follow2) {
            await User.updateOne({ _id: blockingId }, { $inc: { followingCount: -1 } }, { session });
            await User.updateOne({ _id: blockerId }, { $inc: { followerCount: -1 } }, { session });
        }
        
        await session.commitTransaction();
        res.status(200).json({ message: 'Kullanıcı başarıyla engellendi.' });

    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: 'İşlem sırasında bir hata oluştu.' });
    } finally {
        session.endSession();
    }
};