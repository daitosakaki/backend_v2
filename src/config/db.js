// src/config/db.js (GÜNCELLENMİŞ)

const mongoose = require('mongoose');
const config = require('./index'); // Kendi config dosyamızı import ediyoruz

const connectDB = async () => {
    // Bağlantı adresi artık merkezi config'den geliyor.
    const dbUri = config.mongoose.uri;
    
    // URI'nin var olup olmadığını kontrol etmeye gerek yok, çünkü config dosyası
    // bunu zaten bizim için uygulama başlarken yaptı.
    
    try {
        const conn = await mongoose.connect(dbUri, config.mongoose.options);
        console.log(`MongoDB Bağlantısı Başarılı: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Bağlantı Hatası: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;