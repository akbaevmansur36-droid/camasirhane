import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import cron from 'node-cron';
import fs from 'fs';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = Number(process.env.PORT || 3000);
const DATA_FILE = './server/data.json';
const MAX_CONNECTED_USERS = Number(process.env.MAX_CONNECTED_USERS || 50);

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error('PORT must be a valid TCP port');
}

if (!Number.isInteger(MAX_CONNECTED_USERS) || MAX_CONNECTED_USERS < 1) {
  throw new Error('MAX_CONNECTED_USERS must be a positive integer');
}

app.use(cors());
app.use(express.json());
app.use(express.static('dist'));

// Данные приложения
let data = {
  washingMachines: [
    { id: 1, occupied: false, user: null, userName: null, userPhone: null, startTime: null, duration: null },
    { id: 2, occupied: false, user: null, userName: null, userPhone: null, startTime: null, duration: null }
  ],
  dryingRacks: Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    occupied: false,
    user: null,
    userName: null,
    userPhone: null,
    startTime: null
  })),
  washQueue: [],
  dryQueue: [],
  adminPhone: null, // Номер телефона администратора
  settings: {
    washAutoReleaseMinutes: 10, // Автоосвобождение через 10 минут после окончания
    dryReminderDays: 2 // Напоминание о сушке через 2 дня
  }
};

// Загрузка данных
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
  }
}

// Сохранение данных
function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Ошибка сохранения данных:', error);
  }
}

// Отправка обновлений всем клиентам через WebSocket
function broadcastUpdate() {
  const message = JSON.stringify({ type: 'update', data });
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
}

function assignNextWash(machine) {
  const next = data.washQueue.shift();
  if (!next) return;

  machine.occupied = true;
  machine.user = next.id;
  machine.userName = next.name;
  machine.userPhone = next.phone;
  machine.startTime = Date.now();
  machine.duration = next.duration;
  scheduleWashReminder(next.id, machine.id, next.duration);
}

function allocateDryQueue() {
  while (data.dryQueue.length > 0) {
    const next = data.dryQueue[0];
    const freeRacks = data.dryingRacks.filter(rack => !rack.occupied);
    if (freeRacks.length < next.count) return;
    data.dryQueue.shift();
    freeRacks.slice(0, next.count).forEach(rack => {
      rack.occupied = true;
      rack.user = next.id;
      rack.userName = next.name;
      rack.userPhone = next.phone;
      rack.startTime = Date.now();
    });
    scheduleDryingReminder(next.id, freeRacks.slice(0, next.count).map(rack => rack.id));
  }
}

loadData();

// WebSocket соединение
wss.on('connection', (ws) => {
  if (wss.clients.size > MAX_CONNECTED_USERS) {
    ws.send(JSON.stringify({
      type: 'error',
      code: 'SERVER_FULL',
      limit: MAX_CONNECTED_USERS,
      message: `Достигнут лимит подключений (${MAX_CONNECTED_USERS}). Попробуйте позже.`
    }), () => ws.close(1013, 'Server is at capacity'));
    return;
  }

  console.log('Новое WebSocket подключение');
  ws.send(JSON.stringify({ type: 'init', data }));
});

// API Endpoints

// Получить текущее состояние
app.get('/api/status', (req, res) => {
  res.json(data);
});

// Установить админа
app.post('/api/admin/set', (req, res) => {
  const { userId, phone, password } = req.body;
  // Простая проверка пароля (в продакшене использовать bcrypt)
  if (password === 'admin123') {
    data.adminPhone = userId || phone;
    saveData();
    res.json({ success: true, message: 'Админ установлен' });
  } else {
    res.status(403).json({ success: false, message: 'Неверный пароль' });
  }
});

// Проверить админа
app.post('/api/admin/check', (req, res) => {
  const { userId, phone } = req.body;
  res.json({ isAdmin: (userId || phone) === data.adminPhone });
});

// Резервирование стиральной машины
app.post('/api/wash/reserve', (req, res) => {
  const { userName, userId: submittedUserId, userPhone, duration } = req.body;
  const userId = submittedUserId || userPhone;

  if (!userName || !userId || !Number.isInteger(duration) || duration < 15 || duration > 180) {
    return res.status(400).json({ success: false, message: 'Заполните все поля' });
  }

  const freeMachine = data.washingMachines.find(m => !m.occupied);
  const userHasMachine = data.washingMachines.some(m => m.user === userId);

  if (userHasMachine) {
    return res.status(400).json({ success: false, message: 'У вас уже есть машина' });
  }

  const userInQueue = data.washQueue.some(u => u.id === userId);
  if (userInQueue) {
    return res.status(400).json({ success: false, message: 'Вы уже в очереди' });
  }

  if (freeMachine) {
    freeMachine.occupied = true;
    freeMachine.user = userId;
    freeMachine.userName = userName;
    freeMachine.userPhone = userId;
    freeMachine.startTime = Date.now();
    freeMachine.duration = duration;
    saveData();
    broadcastUpdate();
    scheduleWashReminder(userId, freeMachine.id, duration);
    res.json({ success: true, machine: freeMachine });
  } else {
    data.washQueue.push({ id: userId, name: userName, phone: userId, time: Date.now(), duration });
    saveData();
    broadcastUpdate();
    res.json({ success: true, queued: true, position: data.washQueue.length });
  }
});

// Резервирование вешалок
app.post('/api/dry/reserve', (req, res) => {
  const { userName, userId: submittedUserId, userPhone, count } = req.body;
  const userId = submittedUserId || userPhone;

  if (!userName || !userId || !Number.isInteger(count) || count < 1 || count > 2) {
    return res.status(400).json({ success: false, message: 'Заполните все поля' });
  }

  const userRacks = data.dryingRacks.filter(r => r.user === userId);

  if (userRacks.length > 0) {
    return res.status(400).json({ success: false, message: `У вас уже ${userRacks.length} вешалок` });
  }

  const userInQueue = data.dryQueue.some(u => u.id === userId);
  if (userInQueue) {
    return res.status(400).json({ success: false, message: 'Вы уже в очереди на сушку' });
  }

  const freeRacks = data.dryingRacks.filter(r => !r.occupied);

  if (freeRacks.length >= count) {
    const allocated = freeRacks.slice(0, count);
    allocated.forEach(rack => {
      rack.occupied = true;
      rack.user = userId;
      rack.userName = userName;
      rack.userPhone = userId;
      rack.startTime = Date.now();
    });
    saveData();
    broadcastUpdate();
    scheduleDryingReminder(userId, allocated.map(r => r.id));
    res.json({ success: true, racks: allocated.map(r => r.id) });
  } else {
    data.dryQueue.push({ id: userId, name: userName, phone: userId, count, time: Date.now() });
    saveData();
    broadcastUpdate();
    res.json({ success: true, queued: true, position: data.dryQueue.length });
  }
});

// Завершить использование
app.post('/api/finish', (req, res) => {
  const { userId: submittedUserId, userPhone } = req.body;
  const userId = submittedUserId || userPhone;
  let finished = false;

  const machine = data.washingMachines.find(m => m.user === userId);
  if (machine) {
    machine.occupied = false;
    machine.user = null;
    machine.userName = null;
    machine.userPhone = null;
    machine.startTime = null;
    machine.duration = null;
    finished = true;

    assignNextWash(machine);
  }

  const userRacks = data.dryingRacks.filter(r => r.user === userId);
  if (userRacks.length > 0) {
    userRacks.forEach(rack => {
      rack.occupied = false;
      rack.user = null;
      rack.userName = null;
      rack.userPhone = null;
      rack.startTime = null;
    });
    finished = true;

    allocateDryQueue();
  }

  saveData();
  broadcastUpdate();
  res.json({ success: finished });
});

// Отменить резервацию
app.post('/api/cancel', (req, res) => {
  const { userId: submittedUserId, userPhone } = req.body;
  const userId = submittedUserId || userPhone;
  let cancelled = false;

  const machine = data.washingMachines.find(m => m.user === userId);
  if (machine) {
    machine.occupied = false;
    machine.user = null;
    machine.userName = null;
    machine.userPhone = null;
    machine.startTime = null;
    machine.duration = null;
    assignNextWash(machine);
    cancelled = true;
  }

  const userRacks = data.dryingRacks.filter(r => r.user === userId);
  if (userRacks.length > 0) {
    userRacks.forEach(rack => {
      rack.occupied = false;
      rack.user = null;
      rack.userName = null;
      rack.userPhone = null;
      rack.startTime = null;
    });
    allocateDryQueue();
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
  broadcastUpdate();
  res.json({ success: cancelled });
});

// ADMIN: Удалить пользователя из любого места
app.post('/api/admin/remove', (req, res) => {
  const { adminId, adminPhone, targetId, targetPhone } = req.body;

  if ((adminId || adminPhone) !== data.adminPhone) {
    return res.status(403).json({ success: false, message: 'Недостаточно прав' });
  }

  const userId = targetId || targetPhone;
  let removed = false;

  const machine = data.washingMachines.find(m => m.user === userId);
  if (machine) {
    machine.occupied = false;
    machine.user = null;
    machine.userName = null;
    machine.userPhone = null;
    machine.startTime = null;
    machine.duration = null;
    assignNextWash(machine);
    removed = true;
  }

  const userRacks = data.dryingRacks.filter(r => r.user === userId);
  if (userRacks.length > 0) {
    userRacks.forEach(rack => {
      rack.occupied = false;
      rack.user = null;
      rack.userName = null;
      rack.userPhone = null;
      rack.startTime = null;
    });
    allocateDryQueue();
    removed = true;
  }

  const washQueueIndex = data.washQueue.findIndex(u => u.id === userId);
  if (washQueueIndex !== -1) {
    data.washQueue.splice(washQueueIndex, 1);
    removed = true;
  }

  const dryQueueIndex = data.dryQueue.findIndex(u => u.id === userId);
  if (dryQueueIndex !== -1) {
    data.dryQueue.splice(dryQueueIndex, 1);
    removed = true;
  }

  saveData();
  broadcastUpdate();
  res.json({ success: removed });
});

// ADMIN: Изменить количество вешалок
app.post('/api/admin/racks/count', (req, res) => {
  const { adminId, adminPhone, count } = req.body;

  if ((adminId || adminPhone) !== data.adminPhone) {
    return res.status(403).json({ success: false, message: 'Недостаточно прав' });
  }

  const currentCount = data.dryingRacks.length;
  const occupiedCount = data.dryingRacks.filter(r => r.occupied).length;

  if (!Number.isInteger(count) || count < 0 || count > 20) {
    return res.status(400).json({ success: false, message: 'Количество должно быть от 0 до 20' });
  }

  if (count < occupiedCount) {
    return res.status(400).json({
      success: false,
      message: `Нельзя уменьшить меньше ${occupiedCount} (столько занято)`
    });
  }

  if (count > currentCount) {
    for (let i = currentCount; i < count; i++) {
      data.dryingRacks.push({
        id: i + 1,
        occupied: false,
        user: null,
        userName: null,
        userPhone: null,
        startTime: null
      });
    }
  } else if (count < currentCount) {
    data.dryingRacks = data.dryingRacks.slice(0, count);
  }

  allocateDryQueue();
  saveData();
  broadcastUpdate();
  res.json({ success: true, newCount: data.dryingRacks.length });
});

// Напоминания и автоосвобождение
function scheduleWashReminder(userId, machineId, minutes) {
  setTimeout(() => {
    console.log(`Напоминание: Машина ${machineId} для ${userId} завершила стирку`);
    broadcastUpdate();
  }, minutes * 60 * 1000);

  setTimeout(() => {
    const machine = data.washingMachines.find(m => m.id === machineId && m.user === userId);
    if (machine && machine.occupied) {
      console.log(`Предупреждение: Машина ${machineId} освободится через 10 минут`);
      broadcastUpdate();

      setTimeout(() => {
        const machineCheck = data.washingMachines.find(m => m.id === machineId && m.user === userId);
        if (machineCheck && machineCheck.occupied) {
          machineCheck.occupied = false;
          machineCheck.user = null;
          machineCheck.userName = null;
          machineCheck.userPhone = null;
          machineCheck.startTime = null;
          machineCheck.duration = null;

          assignNextWash(machineCheck);

          saveData();
          broadcastUpdate();
          console.log(`Машина ${machineId} автоматически освобождена`);
        }
      }, 10 * 60 * 1000);
    }
  }, minutes * 60 * 1000);
}

function scheduleDryingReminder(userId, rackIds) {
  const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
  setTimeout(() => {
    console.log(`Напоминание о сушке для ${userId}, вешалки: ${rackIds.join(', ')}`);
    broadcastUpdate();
  }, twoDaysInMs);
}

// Запуск сервера
server.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
  console.log(`📡 WebSocket доступен на ws://localhost:${PORT}`);
});
