// Pure laundry logic operating on a state object (ported from server/index.js).

export type Result = { status: number; body: unknown };

const AUTO_RELEASE_MINUTES = 10;

const emptyMachine = (id: number) => ({
  id, occupied: false, user: null, userName: null, userPhone: null, startTime: null, duration: null,
});
const emptyRack = (id: number) => ({
  id, occupied: false, user: null, userName: null, userPhone: null, startTime: null,
});

export function initialState() {
  return {
    washingMachines: [emptyMachine(1), emptyMachine(2)],
    dryingRacks: Array.from({ length: 10 }, (_, i) => emptyRack(i + 1)),
    washQueue: [] as any[],
    dryQueue: [] as any[],
    adminPhone: null as string | null,
    settings: { washAutoReleaseMinutes: AUTO_RELEASE_MINUTES, dryReminderDays: 2 },
  };
}

function clearMachine(m: any) {
  Object.assign(m, emptyMachine(m.id));
}
function clearRack(r: any) {
  Object.assign(r, emptyRack(r.id));
}

function assignNextWash(data: any, machine: any) {
  const next = data.washQueue.shift();
  if (!next) return;
  Object.assign(machine, {
    occupied: true, user: next.id, userName: next.name, userPhone: next.phone,
    startTime: Date.now(), duration: next.duration,
  });
}

function allocateDryQueue(data: any) {
  while (data.dryQueue.length > 0) {
    const next = data.dryQueue[0];
    const freeRacks = data.dryingRacks.filter((r: any) => !r.occupied);
    if (freeRacks.length < next.count) return;
    data.dryQueue.shift();
    freeRacks.slice(0, next.count).forEach((rack: any) => {
      Object.assign(rack, {
        occupied: true, user: next.id, userName: next.name, userPhone: next.phone, startTime: Date.now(),
      });
    });
  }
}

// Replaces the server's timers: release machines whose wash ended more than N minutes ago.
// Returns true if state changed.
export function tick(data: any): boolean {
  const graceMs = (data.settings?.washAutoReleaseMinutes ?? AUTO_RELEASE_MINUTES) * 60_000;
  let changed = false;
  for (const m of data.washingMachines) {
    if (m.occupied && m.startTime && m.duration && Date.now() > m.startTime + m.duration * 60_000 + graceMs) {
      clearMachine(m);
      assignNextWash(data, m);
      changed = true;
    }
  }
  return changed;
}

function releaseUser(data: any, userId: string, includeQueues: boolean): boolean {
  let done = false;
  const machine = data.washingMachines.find((m: any) => m.user === userId);
  if (machine) {
    clearMachine(machine);
    assignNextWash(data, machine);
    done = true;
  }
  const racks = data.dryingRacks.filter((r: any) => r.user === userId);
  if (racks.length > 0) {
    racks.forEach(clearRack);
    allocateDryQueue(data);
    done = true;
  }
  if (includeQueues) {
    for (const q of [data.washQueue, data.dryQueue]) {
      const i = q.findIndex((u: any) => u.id === userId);
      if (i !== -1) {
        q.splice(i, 1);
        done = true;
      }
    }
  }
  return done;
}

const ok = (body: unknown): Result => ({ status: 200, body });
const fail = (status: number, message: string): Result => ({ status, body: { success: false, message } });

export function handle(route: string, data: any, body: any, adminPassword: string): Result {
  const userId = body?.userId || body?.userPhone;

  switch (route) {
    case "admin/set":
      if (body?.password === adminPassword && userId) {
        data.adminPhone = userId;
        return ok({ success: true, message: "Админ установлен" });
      }
      return fail(403, "Неверный пароль");

    case "admin/check":
      return ok({ isAdmin: !!userId && userId === data.adminPhone });

    case "wash/reserve": {
      const { userName, duration } = body ?? {};
      if (!userName || !userId || !Number.isInteger(duration) || duration < 15 || duration > 180) {
        return fail(400, "Заполните все поля");
      }
      if (data.washingMachines.some((m: any) => m.user === userId)) return fail(400, "У вас уже есть машина");
      if (data.washQueue.some((u: any) => u.id === userId)) return fail(400, "Вы уже в очереди");
      const free = data.washingMachines.find((m: any) => !m.occupied);
      if (free) {
        Object.assign(free, {
          occupied: true, user: userId, userName, userPhone: userId, startTime: Date.now(), duration,
        });
        return ok({ success: true, machine: free });
      }
      data.washQueue.push({ id: userId, name: userName, phone: userId, time: Date.now(), duration });
      return ok({ success: true, queued: true, position: data.washQueue.length });
    }

    case "dry/reserve": {
      const { userName, count } = body ?? {};
      if (!userName || !userId || !Number.isInteger(count) || count < 1 || count > 2) {
        return fail(400, "Заполните все поля");
      }
      const userRacks = data.dryingRacks.filter((r: any) => r.user === userId);
      if (userRacks.length > 0) return fail(400, `У вас уже ${userRacks.length} вешалок`);
      if (data.dryQueue.some((u: any) => u.id === userId)) return fail(400, "Вы уже в очереди на сушку");
      const freeRacks = data.dryingRacks.filter((r: any) => !r.occupied);
      if (freeRacks.length >= count) {
        const allocated = freeRacks.slice(0, count);
        allocated.forEach((rack: any) =>
          Object.assign(rack, { occupied: true, user: userId, userName, userPhone: userId, startTime: Date.now() }),
        );
        return ok({ success: true, racks: allocated.map((r: any) => r.id) });
      }
      data.dryQueue.push({ id: userId, name: userName, phone: userId, count, time: Date.now() });
      return ok({ success: true, queued: true, position: data.dryQueue.length });
    }

    case "finish":
      return ok({ success: !!userId && releaseUser(data, userId, false) });

    case "cancel":
      return ok({ success: !!userId && releaseUser(data, userId, true) });

    case "admin/remove": {
      const adminId = body?.adminId || body?.adminPhone;
      if (!adminId || adminId !== data.adminPhone) return fail(403, "Недостаточно прав");
      const target = body?.targetId || body?.targetPhone;
      return ok({ success: !!target && releaseUser(data, target, true) });
    }

    case "admin/racks/count": {
      const adminId = body?.adminId || body?.adminPhone;
      if (!adminId || adminId !== data.adminPhone) return fail(403, "Недостаточно прав");
      const count = body?.count;
      if (!Number.isInteger(count) || count < 0 || count > 20) {
        return fail(400, "Количество должно быть от 0 до 20");
      }
      const occupiedCount = data.dryingRacks.filter((r: any) => r.occupied).length;
      if (count < occupiedCount) return fail(400, `Нельзя уменьшить меньше ${occupiedCount} (столько занято)`);
      const current = data.dryingRacks.length;
      if (count > current) {
        for (let i = current; i < count; i++) data.dryingRacks.push(emptyRack(i + 1));
      } else if (count < current) {
        data.dryingRacks = data.dryingRacks.slice(0, count);
      }
      allocateDryQueue(data);
      return ok({ success: true, newCount: data.dryingRacks.length });
    }

    default:
      return { status: 404, body: { success: false, message: "Not found" } };
  }
}
