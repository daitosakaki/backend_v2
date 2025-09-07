// src/config/index.js

const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

// .env dosyasını kök dizinde bulup yükle
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Ortam değişkenleri için bir doğrulama şeması (validation schema) oluşturuyoruz.
// Bu şema, hangi değişkenlerin gerekli olduğunu, tiplerini ve varsayılan değerlerini tanımlar.
const envVarsSchema = Joi.object()
    .keys({
        NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
        APP_PORT: Joi.number().default(3000),
        MONGODB_URI: Joi.string().required().description('MongoDB bağlantı adresi gerekli'),
        JWT_SECRET: Joi.string().required().description('JWT gizli anahtarı gerekli'),
        JWT_EXPIRES_IN: Joi.string().default('1d').description('JWT geçerlilik süresi'),
        BCRYPT_SALT_ROUNDS: Joi.number().default(10).description('Bcrypt tuzlama turu sayısı'),
    })
    .unknown(); // Bilinmeyen (şemada tanımlanmamış) değişkenlere izin ver

// Şemayı kullanarak process.env'yi doğrula
const { value: envVars, error } = envVarsSchema.validate(process.env);

// Eğer doğrulama sırasında bir hata oluşursa (örn: gerekli bir değişken eksikse),
// hatayı fırlat ve uygulamayı durdur.
if (error) {
    throw new Error(`Config doğrulama hatası: ${error.message}`);
}

// Doğrulanmış ve temizlenmiş ayarları, uygulamanın geri kalanında kullanılmak üzere
// yapılandırılmış bir obje olarak dışa aktar.
module.exports = {
    env: envVars.NODE_ENV,
    port: envVars.APP_PORT,
    mongoose: {
        uri: envVars.MONGODB_URI,
        options: {
            // Mongoose 6+ için genellikle ek seçeneklere gerek yoktur.
            // Gerekirse buraya eklenebilir.
        },
    },
    jwt: {
        secret: envVars.JWT_SECRET,
        expiresIn: envVars.JWT_EXPIRES_IN,
    },
    bcrypt: {
        saltRounds: envVars.BCRYPT_SALT_ROUNDS,
    },
};