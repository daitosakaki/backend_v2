const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const config = require('../config');
const User = require('../models/user.model');

/**
 * Gelen istekte geçerli bir JWT olup olmadığını kontrol eden middleware.
 * Başarılı olursa, kullanıcı bilgisini 'req.user' içine ekler ve bir sonraki adıma geçer.
 * Başarısız olursa, 401 Unauthorized hatası fırlatır.
 */
const auth = async (req, res, next) => {
    try {
        let token;
        
        // 1. Adım: Token'ı Authorization header'ından al
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            // 'Bearer eyJhbGciOiJI...' formatından token'ı ayıkla
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            // Eğer token yoksa, yetkisiz erişim hatası fırlat
            return next(new ApiError(401, 'Bu işleme erişim için kimliğinizi doğrulamanız gerekmektedir.'));
        }

        // 2. Adım: Token'ı doğrula
        // Bu işlem, token'ın bizim gizli anahtarımızla imzalanıp imzalanmadığını ve
        // süresinin dolup dolmadığını kontrol eder.
        const decoded = jwt.verify(token, config.jwt.secret);

        // 3. Adım: Token içindeki kullanıcı ID'si ile veritabanında kullanıcıyı bul
        // Bu, token geçerli olsa bile kullanıcının silinmiş olma ihtimaline karşı bir güvencedir.
        // '.select("-password")' ile şifre alanını asla çekmediğimizden emin oluruz.
        const currentUser = await User.findById(decoded.sub).select('-password');

        if (!currentUser) {
            return next(new ApiError(401, 'Bu token\'a sahip kullanıcı artık mevcut değil.'));
        }
        
        // (İsteğe bağlı) Kullanıcının şifresini değiştirdikten sonra eski token'ları
        // geçersiz kılmak için ek bir kontrol burada yapılabilir.

        // 4. Adım: Kullanıcı bilgisini request objesine ekle
        // Bu sayede, bu middleware'den sonra çalışacak olan tüm kontrolcüler ve servisler
        // 'req.user' üzerinden giriş yapmış olan kullanıcının tüm bilgilerine erişebilir.
        req.user = currentUser;

        // Her şey yolunda, bir sonraki middleware'e veya kontrolcüye geç
        next();
    } catch (error) {
        // jwt.verify() süresi dolmuş veya geçersiz bir token için hata fırlatacaktır.
        // Bu hataları yakalayıp standart bir yetkisizlik mesajına dönüştürüyoruz.
        return next(new ApiError(401, 'Geçersiz veya süresi dolmuş kimlik bilgisi.'));
    }
};

module.exports = auth;