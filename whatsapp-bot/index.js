import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcodeTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';
import cron from 'node-cron';
import fs from 'fs';

const DATA_FILE = './data.json';

// Инициализация данных
let data = {
  washingMachines: [
    { id: 1, occupied: false, user: null, userName: null, startTime: null, duration: null },
    { id: 2, occupied: false, user: null, userName: null, startTime: null, duration: null }
  ],
  dryingRacks: Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    occupied: false,
    user: null,
    userName: null,
    startTime: null,
    reminderId: null
  })),
  washQueue: [],
  dryQueue: []
};

// Загрузка данных из файла
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
  }
}

// Сохранение данных в файл
function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Ошибка сохранения данных:', error);
  }
}

loadData();

// Создание клиента WhatsApp
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

// QR код для авторизации
client.on('qr', async (qr) => {
  console.log('\n📱 QR-kod oluşturuluyor / Generating QR code...\n');

  qrcodeTerminal.generate(qr, { small: true });

  try {
    await QRCode.toFile('qr-code.png', qr, {
      width: 400,
      margin: 2
    });
    console.log('\n✅ QR-kod kaydedildi: qr-code.png');
    console.log('✅ QR code saved: qr-code.png');
    console.log('\n📂 Dosya konumu / File location:');
    console.log('   C:\\Users\\akbae\\whatsapp-laundry-bot\\qr-code.png\n');
    console.log('📱 Bu dosyayı açın ve WhatsApp ile tarayın!');
    console.log('📱 Open this file and scan with WhatsApp!\n');
  } catch (err) {
    console.error('QR-kod kaydedilemedi / Failed to save QR code:', err);
  }
});

// Успешное подключение
client.on('ready', () => {
  console.log('✅ Бот готов к работе!');
});

// Определение языка сообщения
function detectLanguage(text) {
  const turkishChars = /[çğıöşüÇĞİÖŞÜ]/;
  const turkishWords = /\b(yikama|kurutma|sira|bitti|iptal|yardim|dakika|makine|aski)\b/i;

  if (turkishChars.test(text) || turkishWords.test(text)) {
    return 'tr';
  }
  return 'en';
}

// Сообщения на разных языках
const messages = {
  tr: {
    help: `🧺 *Çamaşırhane Yönetim Botu*

*Komutlar:*
📌 /yikama [dakika] - makine ayırt (örnek: /yikama 45)
📌 /kurutma [1-2] - askı ayırt (örnek: /kurutma 2)
📌 /sira - mevcut durumu gör
📌 /bitti - işlemi bitir
📌 /iptal - rezervasyonu iptal et
📌 /yardim - bu mesajı göster

*Kurallar:*
• 2 çamaşır makinesi
• 10 kurutma askısı (1-2 tane alabilirsiniz)
• Süreyi kendiniz belirleyin (örn: /yikama 30)
• 2 gün sonra kurutma hatırlatması gelir`,

    machineReserved: (machineId, duration) =>
      `✅ Makine ${machineId} ayrıldı!\n⏱️ Süre: ${duration} dakika\n\nBittiğinde /bitti gönderin`,

    alreadyHasMachine: '⚠️ Zaten bir makine kullanıyorsunuz!',
    alreadyInWashQueue: '⚠️ Zaten yıkama sırasındasınız!',
    allMachinesOccupied: (position) => `⏳ Tüm makineler dolu. Sıradasınız (sıra ${position})`,

    racksReserved: (rackIds) =>
      `✅ Askı ${rackIds} ayrıldı!\n\n⏱️ 2 gün sonra hatırlatma gelecek.\nBittiğinde /bitti gönderin`,

    alreadyHasRacks: (count) => `⚠️ Zaten ${count} askınız var!`,
    alreadyInDryQueue: '⚠️ Zaten kurutma sırasındasınız!',
    notEnoughRacks: (free, needed, position) =>
      `⏳ Yeterli boş askı yok (boş: ${free}, gerekli: ${needed}).\nSıradasınız (sıra ${position})`,

    washFinished: (machineId) =>
      `⏰ *Hatırlatma!*\n\nMakine ${machineId} yıkama bitti!\n🚶 Lütfen kıyafetlerinizi alın.\n\n✅ /bitti göndererek makineyi serbest bırakın`,

    dryingReminder: (rackIds) =>
      `⏰ *2 Gün Geçti - Hatırlatma!*\n\nAskı ${rackIds} numaralı kıyafetlerinizi almayı unutmayın!\n🚶 Lütfen kıyafetlerinizi alın.\n\n✅ /bitti göndererek askıyı serbest bırakın`,

    machineAvailable: (machineId, duration) =>
      `✅ Makine ${machineId} boşaldı!\n⏱️ Süre: ${duration} dakika\n\nBittiğinde /bitti gönderin`,

    racksAvailable: (rackIds) =>
      `✅ Askı ${rackIds} boşaldı!\n\n⏱️ 2 gün sonra hatırlatma gelecek.\nBittiğinde /bitti gönderin`,

    finished: '✅ Teşekkürler! Kaynaklar serbest bırakıldı.',
    noReservations: '⚠️ Aktif rezervasyonunuz yok.',
    cancelled: '✅ Rezervasyonunuz iptal edildi.',
    invalidDuration: '⚠️ Geçersiz süre! Örnek: /yikama 45 (45 dakika)',
    invalidRackCount: '⚠️ 1-2 askı ayırtabilirsiniz. Örnek: /kurutma 2'
  },

  en: {
    help: `🧺 *Laundry Management Bot*

*Commands:*
📌 /wash [minutes] - reserve machine (example: /wash 45)
📌 /dry [1-2] - reserve racks (example: /dry 2)
📌 /queue - view current status
📌 /done - finish and release
📌 /cancel - cancel reservation
📌 /help - show this message

*Rules:*
• 2 washing machines
• 10 drying racks (you can take 1-2)
• Set duration yourself (e.g: /wash 30)
• Drying reminder comes after 2 days`,

    machineReserved: (machineId, duration) =>
      `✅ Machine ${machineId} reserved!\n⏱️ Duration: ${duration} minutes\n\nSend /done when finished`,

    alreadyHasMachine: '⚠️ You already have a machine!',
    alreadyInWashQueue: '⚠️ You are already in wash queue!',
    allMachinesOccupied: (position) => `⏳ All machines occupied. You're in queue (position ${position})`,

    racksReserved: (rackIds) =>
      `✅ Rack(s) ${rackIds} reserved!\n\n⏱️ Reminder in 2 days.\nSend /done when finished`,

    alreadyHasRacks: (count) => `⚠️ You already have ${count} rack(s)!`,
    alreadyInDryQueue: '⚠️ You are already in drying queue!',
    notEnoughRacks: (free, needed, position) =>
      `⏳ Not enough racks (free: ${free}, needed: ${needed}).\nYou're in queue (position ${position})`,

    washFinished: (machineId) =>
      `⏰ *Reminder!*\n\nMachine ${machineId} wash completed!\n🚶 Please pick up your clothes.\n\n✅ Send /done to free the machine`,

    dryingReminder: (rackIds) =>
      `⏰ *2 Days Passed - Reminder!*\n\nDon't forget to pick up your clothes from rack ${rackIds}!\n🚶 Please collect your items.\n\n✅ Send /done to free the rack`,

    machineAvailable: (machineId, duration) =>
      `✅ Machine ${machineId} is now free!\n⏱️ Duration: ${duration} minutes\n\nSend /done when finished`,

    racksAvailable: (rackIds) =>
      `✅ Rack(s) ${rackIds} are now free!\n\n⏱️ Reminder in 2 days.\nSend /done when finished`,

    finished: '✅ Thank you! Resources released.',
    noReservations: '⚠️ You have no active reservations.',
    cancelled: '✅ Your reservation has been cancelled.',
    invalidDuration: '⚠️ Invalid duration! Example: /wash 45 (45 minutes)',
    invalidRackCount: '⚠️ You can reserve 1-2 racks. Example: /dry 2'
  }
};

// Обработка сообщений
client.on('message', async (msg) => {
  if (msg.fromMe) return;

  const command = msg.body.toLowerCase().trim();
  if (!command.startsWith('/')) return;

  try {
    const userId = msg.author || msg.from;
    const contact = await msg.getContact();
    const userName = contact.pushname || contact.name || 'User';

    const lang = detectLanguage(msg.body);
    const m = messages[lang];

    console.log(`📩 Mesaj: "${msg.body}" | Gönderen: ${userName} | Dil: ${lang.toUpperCase()}`);

    // Все ответы приходят только в личку
    if (command === '/start' || command === '/yardim' || command === '/help') {
      await client.sendMessage(userId, m.help);
    } else if (command.startsWith('/yikama') || command.startsWith('/wash')) {
      await handleWashRequest(userId, userName, command, lang);
    } else if (command.startsWith('/kurutma') || command.startsWith('/dry')) {
      await handleDryRequest(userId, userName, command, lang);
    } else if (command === '/sira' || command === '/queue') {
      await handleQueueStatus(userId, lang);
    } else if (command === '/bitti' || command === '/done') {
      await handleFinish(userId, lang);
    } else if (command === '/iptal' || command === '/cancel') {
      await handleCancel(userId, lang);
    }
  } catch (error) {
    console.error('Hata:', error);
  }
});

// Запрос на стирку с временем
async function handleWashRequest(userId, userName, command, lang) {
  const m = messages[lang];

  // Извлекаем время из команды (например: /yikama 45)
  const match = command.match(/\/(yikama|wash)\s+(\d+)/);
  const duration = match ? parseInt(match[2]) : null;

  if (!duration || duration < 1 || duration > 300) {
    await client.sendMessage(userId, m.invalidDuration);
    return;
  }

  const freeMachine = data.washingMachines.find(m => !m.occupied);
  const userHasMachine = data.washingMachines.some(m => m.user === userId);

  if (userHasMachine) {
    await client.sendMessage(userId, m.alreadyHasMachine);
    return;
  }

  const userInQueue = data.washQueue.some(u => u.id === userId);
  if (userInQueue) {
    await client.sendMessage(userId, m.alreadyInWashQueue);
    return;
  }

  if (freeMachine) {
    freeMachine.occupied = true;
    freeMachine.user = userId;
    freeMachine.userName = userName;
    freeMachine.startTime = Date.now();
    freeMachine.duration = duration;
    saveData();

    await client.sendMessage(userId, m.machineReserved(freeMachine.id, duration));
    scheduleWashReminder(userId, freeMachine.id, duration, lang);
  } else {
    data.washQueue.push({ id: userId, name: userName, time: Date.now(), duration });
    saveData();
    await client.sendMessage(userId, m.allMachinesOccupied(data.washQueue.length));
  }
}

// Запрос на сушку с напоминанием через 2 дня
async function handleDryRequest(userId, userName, command, lang) {
  const m = messages[lang];
  const match = command.match(/\/(kurutma|dry)\s*(\d*)/);
  let count = match && match[2] ? parseInt(match[2]) : 1;

  if (count < 1 || count > 2) {
    await client.sendMessage(userId, m.invalidRackCount);
    return;
  }

  const userRacks = data.dryingRacks.filter(r => r.user === userId);
  if (userRacks.length > 0) {
    await client.sendMessage(userId, m.alreadyHasRacks(userRacks.length));
    return;
  }

  const userInQueue = data.dryQueue.some(u => u.id === userId);
  if (userInQueue) {
    await client.sendMessage(userId, m.alreadyInDryQueue);
    return;
  }

  const freeRacks = data.dryingRacks.filter(r => !r.occupied);

  if (freeRacks.length >= count) {
    const allocated = freeRacks.slice(0, count);
    allocated.forEach(rack => {
      rack.occupied = true;
      rack.user = userId;
      rack.userName = userName;
      rack.startTime = Date.now();
    });
    saveData();

    const rackIds = allocated.map(r => r.id).join(', ');
    await client.sendMessage(userId, m.racksReserved(rackIds));

    // Напоминание через 2 дня
    scheduleDryingReminder(userId, rackIds, lang);
  } else {
    data.dryQueue.push({ id: userId, name: userName, count, time: Date.now() });
    saveData();
    await client.sendMessage(userId, m.notEnoughRacks(freeRacks.length, count, data.dryQueue.length));
  }
}

// Статус очереди
async function handleQueueStatus(userId, lang) {
  const isTurkish = lang === 'tr';
  let status = isTurkish ? '📊 *Mevcut Durum*\n\n' : '📊 *Current Status*\n\n';

  status += isTurkish ? '🧺 *Çamaşır Makineleri:*\n' : '🧺 *Washing Machines:*\n';
  data.washingMachines.forEach(m => {
    if (m.occupied) {
      const elapsed = Math.floor((Date.now() - m.startTime) / 60000);
      const remaining = m.duration - elapsed;
      const userName = m.userName || 'Kullanıcı';
      status += isTurkish
        ? `   Makine ${m.id}: 🔴 Dolu - ${userName} (${remaining > 0 ? remaining : 0} dk kaldı)\n`
        : `   Machine ${m.id}: 🔴 Occupied - ${userName} (${remaining > 0 ? remaining : 0} min left)\n`;
    } else {
      status += isTurkish
        ? `   Makine ${m.id}: 🟢 Boş\n`
        : `   Machine ${m.id}: 🟢 Free\n`;
    }
  });

  if (data.washQueue.length > 0) {
    status += isTurkish
      ? `\n⏳ Yıkama sırası: ${data.washQueue.length} kişi\n`
      : `\n⏳ Wash queue: ${data.washQueue.length} people\n`;
  }

  const occupiedRacks = data.dryingRacks.filter(r => r.occupied);
  const freeRacksCount = 10 - occupiedRacks.length;

  status += isTurkish ? `\n👕 *Kurutma Askıları:*\n` : `\n👕 *Drying Racks:*\n`;
  status += isTurkish
    ? `   Boş: ${freeRacksCount}/10\n`
    : `   Free: ${freeRacksCount}/10\n`;

  if (occupiedRacks.length > 0) {
    const racksByUser = {};
    occupiedRacks.forEach(r => {
      const userName = r.userName || 'Kullanıcı';
      if (!racksByUser[userName]) {
        racksByUser[userName] = [];
      }
      racksByUser[userName].push(r.id);
    });

    status += isTurkish ? `   Dolu:\n` : `   Occupied:\n`;
    Object.entries(racksByUser).forEach(([userName, racks]) => {
      status += `      ${racks.join(', ')} - ${userName}\n`;
    });
  }

  if (data.dryQueue.length > 0) {
    status += isTurkish
      ? `\n⏳ Kurutma sırası: ${data.dryQueue.length} kişi\n`
      : `\n⏳ Drying queue: ${data.dryQueue.length} people\n`;
  }

  await client.sendMessage(userId, status);
}

// Завершение использования
async function handleFinish(userId, lang) {
  const m = messages[lang];
  let finished = false;

  const machine = data.washingMachines.find(m => m.user === userId);
  if (machine) {
    machine.occupied = false;
    machine.user = null;
    machine.userName = null;
    machine.startTime = null;
    machine.duration = null;
    finished = true;

    if (data.washQueue.length > 0) {
      const next = data.washQueue.shift();
      machine.occupied = true;
      machine.user = next.id;
      machine.userName = next.name;
      machine.startTime = Date.now();
      machine.duration = next.duration;

      const nextLang = detectLanguage(next.name);
      const nextM = messages[nextLang];
      await client.sendMessage(next.id, nextM.machineAvailable(machine.id, next.duration));
      scheduleWashReminder(next.id, machine.id, next.duration, nextLang);
    }
  }

  const userRacks = data.dryingRacks.filter(r => r.user === userId);
  if (userRacks.length > 0) {
    userRacks.forEach(rack => {
      if (rack.reminderId) {
        clearTimeout(rack.reminderId);
      }
      rack.occupied = false;
      rack.user = null;
      rack.userName = null;
      rack.startTime = null;
      rack.reminderId = null;
    });
    finished = true;

    if (data.dryQueue.length > 0) {
      const freeRacks = data.dryingRacks.filter(r => !r.occupied);
      const next = data.dryQueue[0];

      if (freeRacks.length >= next.count) {
        data.dryQueue.shift();
        const allocated = freeRacks.slice(0, next.count);
        allocated.forEach(rack => {
          rack.occupied = true;
          rack.user = next.id;
          rack.userName = next.name;
          rack.startTime = Date.now();
        });

        const rackIds = allocated.map(r => r.id).join(', ');
        const nextLang = detectLanguage(next.name);
        const nextM = messages[nextLang];
        await client.sendMessage(next.id, nextM.racksAvailable(rackIds));
        scheduleDryingReminder(next.id, rackIds, nextLang);
      }
    }
  }

  saveData();

  if (finished) {
    await client.sendMessage(userId, m.finished);
  } else {
    await client.sendMessage(userId, m.noReservations);
  }
}

// Отмена брони
async function handleCancel(userId, lang) {
  const m = messages[lang];
  let cancelled = false;

  const machine = data.washingMachines.find(m => m.user === userId);
  if (machine) {
    machine.occupied = false;
    machine.user = null;
    machine.userName = null;
    machine.startTime = null;
    machine.duration = null;
    cancelled = true;
  }

  const userRacks = data.dryingRacks.filter(r => r.user === userId);
  if (userRacks.length > 0) {
    userRacks.forEach(rack => {
      if (rack.reminderId) {
        clearTimeout(rack.reminderId);
      }
      rack.occupied = false;
      rack.user = null;
      rack.userName = null;
      rack.startTime = null;
      rack.reminderId = null;
    });
    cancelled = true;
  }

  const washQueueIndex = data.washQueue.findIndex(u => u.id === userId);
  if (washQueueIndex !== -1) {
    data.washQueue.splice(washQueueIndex, 1);
    cancelled = true;
  }

  const dryQueueIndex = data.dryQueue.findIndex(u => u.id === userId);
  if (dryQueueIndex !== -1) {
    data.dryQueue.splice(dryQueueIndex, 1);
    cancelled = true;
  }

  saveData();

  if (cancelled) {
    await client.sendMessage(userId, m.cancelled);
  } else {
    await client.sendMessage(userId, m.noReservations);
  }
}

// Напоминание о завершении стирки и автоматическое освобождение машины
function scheduleWashReminder(userId, machineId, minutes, lang) {
  const m = messages[lang];

  // Напоминание когда время истекло
  setTimeout(async () => {
    try {
      await client.sendMessage(userId, m.washFinished(machineId));
    } catch (error) {
      console.error('Ошибка отправки напоминания:', error);
    }
  }, minutes * 60 * 1000);

  // Автоматическое освобождение через 10 минут после окончания
  setTimeout(async () => {
    try {
      const machine = data.washingMachines.find(m => m.id === machineId && m.user === userId);
      if (machine && machine.occupied) {
        const warningMsg = lang === 'tr'
          ? '⚠️ *Uyarı!*\n\nMakine otomatik olarak serbest bırakılacak!\n10 dakika içinde kıyafetlerinizi alın veya /bitti gönderin.'
          : '⚠️ *Warning!*\n\nMachine will be auto-released!\nPick up your clothes or send /done within 10 minutes.';

        await client.sendMessage(userId, warningMsg);

        // Освобождение через 10 минут если пользователь не ответил
        setTimeout(async () => {
          const machineCheck = data.washingMachines.find(m => m.id === machineId && m.user === userId);
          if (machineCheck && machineCheck.occupied) {
            machineCheck.occupied = false;
            machineCheck.user = null;
            machineCheck.userName = null;
            machineCheck.startTime = null;
            machineCheck.duration = null;

            const autoReleaseMsg = lang === 'tr'
              ? `✅ Makine ${machineId} otomatik olarak serbest bırakıldı.`
              : `✅ Machine ${machineId} has been automatically released.`;

            await client.sendMessage(userId, autoReleaseMsg);

            // Передаём машину следующему в очереди
            if (data.washQueue.length > 0) {
              const next = data.washQueue.shift();
              machineCheck.occupied = true;
              machineCheck.user = next.id;
              machineCheck.userName = next.name;
              machineCheck.startTime = Date.now();
              machineCheck.duration = next.duration;

              const nextLang = detectLanguage(next.name);
              const nextM = messages[nextLang];
              await client.sendMessage(next.id, nextM.machineAvailable(machineCheck.id, next.duration));
              scheduleWashReminder(next.id, machineCheck.id, next.duration, nextLang);
            }

            saveData();
          }
        }, 10 * 60 * 1000); // 10 минут
      }
    } catch (error) {
      console.error('Ошибка автоматического освобождения:', error);
    }
  }, (minutes + 0) * 60 * 1000); // Сразу после окончания стирки
}

// Напоминание о сушке через 2 дня
function scheduleDryingReminder(userId, rackIds, lang) {
  const m = messages[lang];
  const twoDaysInMs = 2 * 24 * 60 * 60 * 1000; // 2 дня

  const reminderId = setTimeout(async () => {
    try {
      await client.sendMessage(userId, m.dryingReminder(rackIds));
    } catch (error) {
      console.error('Ошибка отправки напоминания о сушке:', error);
    }
  }, twoDaysInMs);

  // Сохраняем ID таймера чтобы можно было отменить
  const racks = data.dryingRacks.filter(r => r.user === userId);
  racks.forEach(rack => {
    rack.reminderId = reminderId;
  });
  saveData();
}

// Запуск клиента
client.initialize();

console.log('🚀 Запуск бота...');
