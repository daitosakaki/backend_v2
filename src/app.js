// src/app.js

const express = require('express');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/index');
const ApiError = require('./utils/ApiError');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// --- GÜVENLİK MIDDLEWARE'LERİ ---
// Temel güvenlik için HTTP başlıklarını ayarlar
app.use(helmet());

// Gelen isteklerin body'sini (JSON) parse eder
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Veriyi XSS saldırılarına karşı temizler
app.use(xss());

// MongoDB injection saldırılarına karşı veriyi temizler
app.use(mongoSanitize());

// --- PERFORMANS ve ERİŞİM ---
// Yanıtları sıkıştırarak performansı artırır
app.use(compression());

// CORS (Cross-Origin Resource Sharing) politikalarını etkinleştirir
app.use(cors());
app.options('*', cors());

// --- STATİK DOSYALAR ---
// Yüklenen dosyaları sunmak için (örn: /static/posts/dosya.jpg)
app.use('/static', express.static(path.join(__dirname, '../uploads')));

// --- API ROTALARI ---
// Tüm /api isteklerini routes/index.js dosyasına yönlendirir
app.use('/api', apiRoutes);

// --- HATA YÖNETİMİ ---
// Tanımlanmamış herhangi bir rotaya istek gelirse 404 hatası oluştur
app.use((req, res, next) => {
    next(new ApiError(404, `Bu sunucuda ${req.originalUrl} adresi bulunamadı.`));
});

// Tüm hataları yakalayan merkezi hata yöneticisi
app.use(errorHandler);

// app.listen() burada ÇAĞIRILMAZ.
// Sadece yapılandırılmış app objesini dışa aktarırız.
module.exports = app;