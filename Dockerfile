# Dockerfile

# Node.js'in 18. versiyonunu temel al
FROM node:18-alpine

# Uygulama dosyalarının bulunacağı klasörü oluştur
WORKDIR /app

# Önce package.json dosyalarını kopyala ve bağımlılıkları yükle
# Bu, kod her değiştiğinde npm install'un tekrar çalışmasını engeller (cache'leme)
COPY package*.json ./
RUN npm install

# Tüm uygulama kodunu kopyala
COPY . .

# Uygulamanın çalışacağı port'u belirt
EXPOSE ${PORT}

# Uygulamayı başlatma komutu
CMD [ "node", "server.js" ]