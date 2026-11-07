# 🧺 Çamaşırhane Botu Kullanım Kılavuzu
# 🧺 Laundry Bot User Guide

## 🚀 Kurulum / Installation

### 1. Botu Başlatın / Start the Bot
```bash
npm start
```

### 2. WhatsApp'a Bağlanın / Connect to WhatsApp

Terminal'de QR kod çıkacak. Telefonunuzdan:
A QR code will appear in terminal. From your phone:

1. WhatsApp'ı açın / Open WhatsApp
2. **Ayarlar** → **Bağlı Cihazlar** / **Settings** → **Linked Devices**
3. **Cihaz Bağla** / **Link a Device**
4. QR kodu tarayın / Scan the QR code

✅ Bağlantı tamamlandı! / Connection complete!

## 📱 Komutlar / Commands

### Yıkama / Washing

**Makine ayırtmak için / To reserve a machine:**
```
/yikama
```
veya / or
```
/wash
```

✅ Boş makine varsa hemen ayrılır
   If a machine is free, it's reserved immediately

⏳ Dolu ise sıraya girersiniz
   If occupied, you enter the queue

### Kurutma / Drying

**1 askı ayırtmak için / To reserve 1 rack:**
```
/kurutma
```
veya / or
```
/dry
```

**2 askı ayırtmak için / To reserve 2 racks:**
```
/kurutma 2
```
veya / or
```
/dry 2
```

### Durum Kontrolü / Status Check

**Mevcut durumu görmek için / To view current status:**
```
/sira
```
veya / or
```
/queue
```

Gösterir / Shows:
- 🧺 Makine durumları / Machine status
- 👕 Boş askı sayısı / Free racks count
- ⏳ Sıradaki kişiler / Queue length

### İşlem Bitirme / Finish

**Kullanımı bitirdiğinizde / When you're done:**
```
/bitti
```
veya / or
```
/done
```

⚠️ **ÖNEMLİ / IMPORTANT:** 
Makineyi veya askıları boşalttığınızda mutlaka bu komutu gönderin!
Always send this command when you free the machine or racks!

Sıradaki kişi otomatik olarak bilgilendirilir.
The next person in queue will be notified automatically.

### İptal / Cancel

**Rezervasyonu iptal etmek için / To cancel reservation:**
```
/iptal
```
veya / or
```
/cancel
```

### Yardım / Help

**Komutları görmek için / To view commands:**
```
/yardim
```
veya / or
```
/help
```

## 🔔 Bildirimler / Notifications

### Yıkama Tamamlandı / Wash Completed
60 dakika sonra otomatik hatırlatma gelir:
After 60 minutes, automatic reminder arrives:

```
⏰ Hatırlatma!
Makine X yıkama bitti!
🚶 Lütfen kıyafetlerinizi alın.
```

### Sıra Size Geldi / Your Turn
Sıra size geldiğinde bildirim:
When it's your turn, notification:

```
✅ Makine X boşaldı!
Artık kullanabilirsiniz.
```

## 📊 Kapasite / Capacity

- 🧺 **2 çamaşır makinesi** / **2 washing machines**
- 👕 **10 kurutma askısı** / **10 drying racks**
- 👤 Kişi başı maksimum **1 makine + 2 askı**
     Maximum per person: **1 machine + 2 racks**

## ⚠️ Kurallar / Rules

1. ✅ Kullanımı bitince **mutlaka** `/bitti` gönderin
   **Always** send `/bitti` when done

2. ⏰ 60 dakika sonra hatırlatma gelir, hemen alın
   Pick up clothes when reminder arrives after 60 min

3. 🚫 Başkasının sırasını almayın
   Don't take someone else's turn

4. 🧹 Makineyi temiz bırakın
   Leave the machine clean

5. 📱 Sıraya girdiğinizde telefonunuzu kontrol edin
   Check your phone when in queue

## 🐛 Sorun Giderme / Troubleshooting

**Bot cevap vermiyor / Bot not responding:**
- Botu yeniden başlatın / Restart the bot: `npm start`
- QR kodu tekrar tarayın / Rescan QR code

**Komut çalışmıyor / Command not working:**
- Komutun başında `/` olduğundan emin olun
  Make sure there's a `/` at the start
- Türkçe veya İngilizce komut kullanın
  Use Turkish or English command

**QR kod çıkmıyor / QR code not showing:**
- `.wwebjs_auth` klasörünü silin ve tekrar başlatın
  Delete `.wwebjs_auth` folder and restart

## 💡 İpuçları / Tips

- 📱 Sabah sıraya girin, öğlen hazır olsun
  Enter queue in morning, ready by noon

- 🔄 İşlem bitince hemen `/bitti` göndererek sıradakilere yardım edin
  Send `/bitti` right away to help people in queue

- 👥 Arkadaşınıza bot numarasını gönderin
  Share bot number with roommates

- 📊 `/sira` ile durumu kontrol edip uygun zamanda gidin
  Check status with `/sira` and go at right time

---

**Sorularınız için / For questions:**
Botu çalıştıran kişiye yazın
Contact the person running the bot
