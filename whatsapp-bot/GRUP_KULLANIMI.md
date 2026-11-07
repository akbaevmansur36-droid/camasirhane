# 📱 Grupta Kullanım Kılavuzu
# 📱 Group Usage Guide

## ✅ Botu Gruba Ekleme / Adding Bot to Group

### Adım 1: Botu Başlatın / Step 1: Start the Bot
```bash
npm start
```

Bot başladığında QR kod çıkacak. Telefonunuzdan WhatsApp'ı açın ve QR kodu tarayın.
When the bot starts, a QR code will appear. Open WhatsApp on your phone and scan it.

### Adım 2: Grup Oluşturun / Step 2: Create Group
1. WhatsApp'ta yeni grup oluşturun
   Create a new group in WhatsApp
2. Gruba istediğiniz kişileri ekleyin
   Add the people you want to the group
3. Grup adını ayarlayın (örnek: "Çamaşırhane" veya "Laundry")
   Set the group name (example: "Çamaşırhane" or "Laundry")

### Adım 3: Botu Gruba Ekleyin / Step 3: Add Bot to Group
⚠️ **ÖNEMLİ / IMPORTANT:**

Bot'u gruba eklemek için, botu çalıştıran numarayı gruba katılımcı olarak eklemeniz gerekir.
To add the bot to the group, you need to add the number running the bot as a participant.

**Nasıl eklerim? / How to add?**
1. Grupun ayarlarına girin / Go to group settings
2. "Katılımcı ekle" / "Add participant"
3. Bot'u çalıştıran numarayı ekleyin / Add the number running the bot

✅ Bot artık gruptaki tüm komutları görebilir!
✅ The bot can now see all commands in the group!

## 🤖 Komutlar / Commands

Grupta komutları kullanmak çok basit:
Using commands in the group is very simple:

```
/yikama
/kurutma 2
/sira
/bitti
/iptal
/yardim
```

## 📋 Örnek Kullanım / Example Usage

### Senaryo / Scenario:

**Ahmet:** `/yikama`
**Bot:** ✅ Makine 1 ayrıldı! ⏱️ Yıkama süresi: ~60 dakika

**Mehmet:** `/yikama`
**Bot:** ⏳ Tüm makineler dolu. Sıradasınız (sıra 1)

**Ayşe:** `/kurutma 2`
**Bot:** ✅ Askı 1, 2 ayrıldı!

**Ahmet:** `/bitti`
**Bot (Ahmet'e):** ✅ Teşekkürler! Kaynaklar serbest bırakıldı.
**Bot (Mehmet'e):** ✅ Makine 1 boşaldı! Artık kullanabilirsiniz.

**Herkes:** `/sira`
**Bot:**
```
📊 Mevcut Durum

🧺 Çamaşır Makineleri:
   Makine 1: 🔴 Dolu (15 dk)
   Makine 2: 🟢 Boş

👕 Kurutma Askıları:
   Boş: 8/10
   Dolu: 1, 2
```

## ⚡ Özellikler / Features

✅ **Grup mesajlarını görür** / Sees group messages
✅ **Herkese cevap verir** / Responds to everyone
✅ **Özel bildirimler** / Private notifications
✅ **Otomatik sıra yönetimi** / Automatic queue management

## 🔔 Bildirimler / Notifications

### Grup İçinde / In Group
- Komut çağrıldığında bot grupta cevap verir
  When a command is called, the bot responds in the group

### Özel Mesaj / Private Message
- 60 dakika sonra hatırlatma **özel mesaj** olarak gelir
  After 60 minutes, reminder comes as **private message**
- Sıra size geldiğinde **özel mesaj** olarak bildirim gelir
  When it's your turn, notification comes as **private message**

⚠️ Bu sayede diğer grup üyeleri spam'den rahatsız olmaz!
⚠️ This way other group members won't be bothered by spam!

## 🎯 İpuçları / Tips

### 1. Grup Kuralları Koyun / Set Group Rules
Grup açıklamasına ekleyin:
Add to group description:

```
🧺 Çamaşırhane Kuralları:
- /yikama ile makine ayırt
- /kurutma ile askı ayırt  
- /bitti ile işlemi bitir
- Zamanında gelip alın!
```

### 2. Grup Adını Net Yapın / Make Group Name Clear
```
🧺 X Yurt Çamaşırhane
🧺 X Dorm Laundry
```

### 3. Bot Numarasını Kaydedin / Save Bot Number
Özel bildirimler alabilmek için bot numarasını telefonunuza kaydedin.
Save the bot number to your phone to receive private notifications.

### 4. Test Edin / Test It
İlk kullanımda komutları test edin:
Test the commands on first use:
```
/yardim
/sira
/yikama
/iptal
```

## ❓ Sık Sorulan Sorular / FAQ

**S: Bot grubumda cevap vermiyor**
**Q: Bot doesn't respond in my group**

C: Şunları kontrol edin:
A: Check these:
1. Bot çalışıyor mu? (`npm start` ile başlattınız mı?)
   Is the bot running? (Did you start it with `npm start`?)
2. QR kod tarandı mı?
   Was the QR code scanned?
3. Bot numarası gruba eklendi mi?
   Was the bot number added to the group?
4. Komut `/` ile başlıyor mu? (örnek: `/yikama`)
   Does the command start with `/`? (example: `/yikama`)

**S: Hatırlatma gelmiyor**
**Q: Reminder doesn't come**

C: Hatırlatmalar **özel mesaj** olarak gelir, grup içinde değil.
A: Reminders come as **private message**, not in the group.

**S: Bot herkesin mesajını görüyor mu?**
**Q: Does the bot see everyone's messages?**

C: Bot sadece `/` ile başlayan komutları işler, diğer mesajları görmezden gelir.
A: The bot only processes commands starting with `/`, ignores other messages.

**S: Birden fazla grup için kullanabilir miyim?**
**Q: Can I use it for multiple groups?**

C: Evet! Aynı botu birden fazla gruba ekleyebilirsiniz. Sıra sistemi tüm gruplar için ortak çalışır.
A: Yes! You can add the same bot to multiple groups. The queue system works for all groups together.

## 🔧 Sorun Giderme / Troubleshooting

### Bot başlamıyor / Bot won't start
```bash
# Çözüm / Solution:
cd whatsapp-laundry-bot
npm install
npm start
```

### QR kod çıkmıyor / QR code doesn't appear
```bash
# Eski oturumu temizle / Clear old session:
rm -rf .wwebjs_auth
npm start
```

### Bot komutlara cevap vermiyor / Bot doesn't respond to commands
1. Konsolu kontrol edin, hata var mı?
   Check console, any errors?
2. Bot loglarına bakın:
   Check bot logs:
   ```
   📩 Mesaj: "/yikama" | Gönderen: Ahmet | Chat: Grup
   ```
3. Eğer log yoksa, bot mesajı görmüyor demektir
   If there's no log, the bot doesn't see the message

## 📞 Destek / Support

Sorun yaşıyorsanız:
If you're having issues:

1. Konsol loglarını kontrol edin
   Check console logs
2. `data.json` dosyasını kontrol edin
   Check `data.json` file
3. Botu yeniden başlatın
   Restart the bot

---

✅ Artık bot grubunuzda çalışıyor!
✅ Now the bot is working in your group!

Kolay gelsin! 🧺
Good luck! 🧺
