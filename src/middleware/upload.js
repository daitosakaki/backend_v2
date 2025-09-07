// middleware/upload.js

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Dosya tiplerini kontrol et
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|mp3|wav/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Hata: Sadece resim, video ve ses dosyaları yüklenebilir!'));
    }
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Bu yol, container'ın İÇİNDEKİ yoldur.
        // docker-compose.yml'deki volume tanımı sayesinde bu klasör
        // ana makinemizdeki './uploads' klasörüne bağlanacaktır.
        const uploadPath = path.join('/app/uploads'); 
        
        // Klasörün var olduğundan emin ol (gerekirse oluştur)
        fs.mkdirSync(uploadPath, { recursive: true });
        
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 50 }, // 50 MB
    fileFilter: fileFilter
});

module.exports = upload;