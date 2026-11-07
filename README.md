# 🧺 Çamaşırhane Yönetim Projeleri / Laundry Management Projects

Общежитие için çamaşırhane yönetim sistemleri / Laundry management systems for dormitory

📅 **Oluşturulma tarihi / Created**: 7 Kasım 2026 / November 7, 2026

---

## 📂 Proje Yapısı / Project Structure

```
çamaşırhane/
├── whatsapp-bot/     # WhatsApp Bot Versiyonu
└── web-app/          # Web Uygulama Versiyonu
```

---

## 🤖 WhatsApp Bot (`whatsapp-bot/`)

WhatsApp üzerinden çalışan basit bot versiyonu.

### ✨ Özellikler:
- 2 çamaşır makinesi yönetimi
- 10 kurutma askısı yönetimi
- Otomatik sıra sistemi
- QR kod ile giriş
- Türkçe/İngilizce dil desteği

### 🚀 Çalıştırma:
```bash
cd whatsapp-bot
npm install
node index.js
```

### 📱 Kullanım:
- `/yikama [dakika]` - Makine ayırt
- `/kurutma [1-2]` - Askı ayırt
- `/sira` - Durumu gör
- `/bitti` - İşlemi bitir
- `/iptal` - İptal et
- `/yardim` - Yardım

**Detaylar**: `whatsapp-bot/README.md`

---

## 🌐 Web Application (`web-app/`)

Modern, tam özellikli web uygulaması.

### ✨ Özellikler:
- 🎨 Modern arayüz
- 📱 PWA - telefona yüklenebilir
- ⚡ Real-time güncellemeler (WebSocket)
- 👨‍💼 Admin paneli
- 🔔 Otomatik hatırlatmalar
- 🌍 Türkçe/İngilizce

### 🚀 Çalıştırma:
```bash
cd web-app
npm install
npm run dev
```

**Erişim**: http://localhost:5173

### 👨‍💼 Admin Kurulumu:
```bash
curl -X POST http://localhost:3000/api/admin/set \
  -H "Content-Type: application/json" \
  -d '{"phone":"TELEFON_NUMARANIZ", "password":"admin123"}'
```

**Detaylar**: `web-app/README.md`

---

## 📊 Karşılaştırma / Comparison

| Özellik / Feature | WhatsApp Bot | Web App |
|-------------------|--------------|---------|
| Kurulum / Setup | ⭐⭐⭐ Kolay | ⭐⭐ Orta |
| Kullanım / Usage | ⭐⭐ Komutlar | ⭐⭐⭐ Arayüz |
| Admin Panel | ❌ Yok | ✅ Var |
| Real-time | ❌ Yok | ✅ Var |
| Mobil | ✅ WhatsApp | ✅ PWA |
| Görsellik / Visual | ⭐ Basit | ⭐⭐⭐ Modern |

---

## 🎯 Hangisini Kullanmalı / Which to Use?

### WhatsApp Bot - İdeal İçin:
- ✅ Herkes zaten WhatsApp kullanıyorsa
- ✅ Hızlı kurulum gerekiyorsa
- ✅ Basit kullanım yeterli

### Web App - İdeal İçin:
- ✅ Modern arayüz istiyorsanız
- ✅ Admin kontrolü gerekiyorsa
- ✅ Detaylı yönetim istiyorsanız
- ✅ Real-time güncellemeler önemliyse

---

## 🔧 Genel Özellikler / Common Features

Her iki versiyonda da:
- 2 çamaşır makinesi
- 10 kurutma askısı (1-2 alınabilir)
- Otomatik sıra sistemi
- Otomatik makine boşaltma (10 dk sonra)
- Kurutma hatırlatması (2 gün sonra)
- Türkçe/İngilizce dil desteği
- Kullanıcı isimleri kayıtlı

---

## 📝 Notlar / Notes

### Güvenlik / Security:
⚠️ **Önemli**: Production'da:
1. Admin şifresini değiştirin
2. HTTPS kullanın
3. Rate limiting ekleyin
4. Çevre değişkenleri kullanın

### Yedekleme / Backup:
- WhatsApp: `whatsapp-bot/data.json`
- Web App: `web-app/server/data.json`

Bu dosyaları düzenli yedekleyin!

---

## 👨‍💻 Geliştirici / Developer

**Oluşturan / Created by**: Mansur  
**Tarih / Date**: 7 Kasım 2026 / November 7, 2026  
**Amaç / Purpose**: Yurt çamaşırhanesi yönetimi / Dormitory laundry management

---

## 📄 Lisans / License

MIT

---

## 🆘 Yardım / Help

Her proje klasöründe detaylı README bulunmaktadır:
- `whatsapp-bot/README.md` - WhatsApp bot detayları
- `web-app/README.md` - Web app detayları

Sorun yaşarsanız / For issues:
- Logları kontrol edin / Check logs
- Port çakışması olabilir / Port conflicts possible
- Node.js v16+ gereklidir / Node.js v16+ required

---

## 🚀 Hızlı Test / Quick Test

### WhatsApp Bot:
```bash
cd çamaşırhane/whatsapp-bot
npm install
node index.js
# QR kodu tarayın / Scan QR code
```

### Web App:
```bash
cd çamaşırhane/web-app
npm install
npm run dev
# http://localhost:5173 açın / Open
```

---

**Başarılar! / Good luck! 🎉**
