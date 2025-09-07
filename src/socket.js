// src/socket.js

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('./config');
const User = require('./models/user.model');

// 'io' örneğini dışa aktararak uygulamanın diğer kısımlarından
// (örn: notification.service.js) olay tetiklememizi sağlarız.
let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*", // Geliştirme için *, üretimde Flutter uygulamanızın adresini yazın
            methods: ["GET", "POST"]
        }
    });

    // --- Socket.IO Middleware: Kimlik Doğrulama ---
    // Her yeni bağlantı denemesinde bu fonksiyon çalışır.
    // Geçerli bir JWT olmadan hiçbir bağlantıya izin verilmez.
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Kimlik doğrulama hatası: Token bulunamadı.'));
            }
            const decoded = jwt.verify(token, config.jwt.secret);
            const user = await User.findById(decoded.sub).select('username');

            if (!user) {
                return next(new Error('Kimlik doğrulama hatası: Kullanıcı bulunamadı.'));
            }

            // Doğrulanmış kullanıcıyı socket nesnesine ekle
            socket.user = user;
            next();
        } catch (error) {
            next(new Error('Kimlik doğrulama hatası: Geçersiz token.'));
        }
    });


    // --- Bağlantı Yönetimi ---
    io.on('connection', (socket) => {
        console.log(`Socket.IO: Bir kullanıcı bağlandı -> ${socket.user.username} (ID: ${socket.id})`);

        // Her kullanıcıyı, kendi kullanıcı ID'si ile adlandırılmış özel bir odaya (room) al.
        // Bu, o kullanıcıya özel bildirimler veya güncellemeler göndermeyi çok kolaylaştırır.
        socket.join(socket.user.id.toString());

        // İstemciden gelen olayları dinle
        socket.on('joinConversation', (conversationId) => {
            socket.join(conversationId);
            console.log(`${socket.user.username}, ${conversationId} sohbet odasına katıldı.`);
        });

        socket.on('leaveConversation', (conversationId) => {
            socket.leave(conversationId);
            console.log(`${socket.user.username}, ${conversationId} sohbet odasından ayrıldı.`);
        });
        
        socket.on('typing', (data) => {
            // 'typing' olayını, gönderen hariç odadaki diğer herkese gönder
            socket.to(data.conversationId).emit('typing', { username: socket.user.username });
        });

        // Bağlantı kesildiğinde
        socket.on('disconnect', () => {
            console.log(`Socket.IO: Bir kullanıcının bağlantısı kesildi -> ${socket.user.username}`);
        });
    });

    return io;
};

// 'io' örneğini ve başlatma fonksiyonunu dışa aktar
module.exports = { initSocket, getIO: () => {
    if (!io) {
        throw new Error("Socket.io başlatılmadı!");
    }
    return io;
}};