// server.js

const http = require('http');
const mongoose = require('mongoose');
const app = require('./src/app'); // Express uygulamasını import et
const config = require('./src/config');
const connectDB = require('./src/config/db');
const { initSocket } = require('./src/socket'); // Socket.IO başlatma fonksiyonu

// Node.js HTTP sunucusunu oluştur
const server = http.createServer(app);

// Veritabanına bağlan ve ardından sunucuyu başlat
connectDB().then(() => {
    // Socket.IO'yu başlat ve HTTP sunucusuna bağla
    initSocket(server);

    server.listen(config.port, () => {
        console.log(`Sunucu, ${config.env} modunda ${config.port} portunda dinleniyor...`);
    });
});

// --- BEKLENMEDİK HATA YÖNETİMİ ---
// Yakalanmamış hatalar için genel bir işleyici
const exitHandler = () => {
    if (server) {
        server.close(() => {
            console.log('Sunucu kapatıldı.');
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
};

const unexpectedErrorHandler = (error) => {
    console.error('BEKLENMEDİK HATA!', error);
    exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

// SIGTERM sinyali (örn: 'docker stop' komutu) geldiğinde sunucuyu düzgünce kapat
process.on('SIGTERM', () => {
    console.log('SIGTERM sinyali alındı. Sunucu düzgün bir şekilde kapatılıyor...');
    exitHandler();
});