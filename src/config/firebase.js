// src/config/firebase.js (YENİ DOSYA)

const admin = require('firebase-admin');
const path = require('path');

try {
    const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');
    
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath)
    });

    console.log('Firebase Admin SDK başarıyla başlatıldı.');
} catch (error) {
    console.error('KRİTİK HATA: Firebase Admin SDK başlatılamadı. firebase-service-account.json dosyasının doğru yerde ve geçerli olduğundan emin olun.', error.message);
    process.exit(1);
}

module.exports = admin;