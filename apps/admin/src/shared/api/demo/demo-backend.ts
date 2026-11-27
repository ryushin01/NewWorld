import { z } from 'zod';
import {
  AdminError,
  badgeSchema,
  courseSchema,
  destinationSchema,
  reportSchema,
  stampSchema,
  userSchema,
  type AdminBackend,
  type AdminSession,
} from '../types';
import { createSeed, type DemoData } from './seed';

export const DEMO_STORAGE_KEY = 'newworld-admin.demo.v1';
export const DEMO_SESSION_KEY = 'newworld-admin.demo-session';
const DEMO_SESSION: AdminSession = { name: '데모 관리자', demo: true };

const demoDataSchema = z.object({
  version: z.literal(1),
  seededAt: z.string(),
  destinations: z.array(destinationSchema),
  courses: z.array(courseSchema),
  badges: z.array(badgeSchema),
  users: z.array(userSchema),
  stamps: z.array(stampSchema),
  reports: z.array(reportSchema),
});

/** 브라우저 저장소를 못 쓰면(사생활 보호 모드 등) 메모리에만 둡니다. */
function createStore(storage: Storage | null) {
  const memory = new Map<string, string>();
  return {
    get: (key: string) => {
      try {
        return storage ? storage.getItem(key) : (memory.get(key) ?? null);
      } catch {
        return memory.get(key) ?? null;
      }
    },
    set: (key: string, value: string) => {
      try {
        if (storage) storage.setItem(key, value);
        else memory.set(key, value);
      } catch {
        memory.set(key, value);
      }
    },
    remove: (key: string) => {
      memory.delete(key);
      try {
        storage?.removeItem(key);
      } catch {
        // 지우지 못해도 메모리 값은 지웠습니다.
      }
    },
  };
}

const defaultStorage = (): Storage | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
};

/**
 * 데모 모드 백엔드. 시드 데이터를 브라우저 저장소에 두고 고칩니다.
 * 서버·CDN 요청이 없어 인터넷이 끊겨도 모든 화면이 돕니다.
 */
export function createDemoBackend(
  options: { storage?: Storage | null; now?: () => Date } = {},
): AdminBackend {
  const store = createStore(options.storage === undefined ? defaultStorage() : options.storage);
  const now = options.now ?? (() => new Date());

  const load = (): DemoData => {
    const raw = store.get(DEMO_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = demoDataSchema.safeParse(JSON.parse(raw));
        if (parsed.success) return parsed.data;
      } catch {
        // 깨진 값은 새 시드로 바꿉니다.
      }
    }
    const seed = createSeed(now());
    store.set(DEMO_STORAGE_KEY, JSON.stringify(seed));
    return seed;
  };
  const save = (data: DemoData) => store.set(DEMO_STORAGE_KEY, JSON.stringify(data));
  const update = <T>(change: (data: DemoData) => T): T => {
    const data = load();
    const result = change(data);
    save(data);
    return result;
  };
  const stamp = () => now().toISOString();

  return {
    mode: 'demo',
    async getSession() {
      return store.get(DEMO_SESSION_KEY) ? DEMO_SESSION : null;
    },
    async signIn() {
      store.set(DEMO_SESSION_KEY, '1');
      load();
      return DEMO_SESSION;
    },
    async signOut() {
      store.remove(DEMO_SESSION_KEY);
    },
    async listDestinations() {
      return load().destinations;
    },
    async saveDestination(input, mode) {
      return update((data) => {
        const index = data.destinations.findIndex((item) => item.id === input.id);
        if (mode === 'create' && index >= 0)
          throw new AdminError('같은 ID의 여행지가 이미 있습니다.', 'conflict');
        if (mode === 'update' && index < 0)
          throw new AdminError('여행지를 찾을 수 없습니다.', 'not_found');
        const previous = data.destinations[index];
        const next = { ...input, hidden: previous?.hidden ?? false, updatedAt: stamp() };
        if (index >= 0) data.destinations[index] = next;
        else data.destinations.unshift(next);
        return next;
      });
    },
    async setDestinationHidden(id, hidden) {
      update((data) => {
        const item = data.destinations.find((destination) => destination.id === id);
        if (!item) throw new AdminError('여행지를 찾을 수 없습니다.', 'not_found');
        item.hidden = hidden;
        item.updatedAt = stamp();
      });
    },
    async listCourses() {
      return load().courses;
    },
    async saveCourse(input, mode) {
      return update((data) => {
        const index = data.courses.findIndex((item) => item.id === input.id);
        if (mode === 'create' && index >= 0)
          throw new AdminError('같은 ID의 코스가 이미 있습니다.', 'conflict');
        if (mode === 'update' && index < 0)
          throw new AdminError('코스를 찾을 수 없습니다.', 'not_found');
        const next = { ...input, hidden: data.courses[index]?.hidden ?? false, updatedAt: stamp() };
        if (index >= 0) data.courses[index] = next;
        else data.courses.unshift(next);
        return next;
      });
    },
    async setCourseHidden(id, hidden) {
      update((data) => {
        const item = data.courses.find((course) => course.id === id);
        if (!item) throw new AdminError('코스를 찾을 수 없습니다.', 'not_found');
        item.hidden = hidden;
        item.updatedAt = stamp();
      });
    },
    async listBadges() {
      return load().badges;
    },
    async saveBadge(id, input) {
      return update((data) => {
        const item = data.badges.find((badge) => badge.id === id);
        if (!item) throw new AdminError('뱃지를 찾을 수 없습니다.', 'not_found');
        Object.assign(item, input, { updatedAt: stamp() });
        return { ...item };
      });
    },
    async setBadgeHidden(id, hidden) {
      update((data) => {
        const item = data.badges.find((badge) => badge.id === id);
        if (!item) throw new AdminError('뱃지를 찾을 수 없습니다.', 'not_found');
        item.hidden = hidden;
        item.updatedAt = stamp();
      });
    },
    async listStamps() {
      return load().stamps;
    },
    async revokeStamp(id) {
      update((data) => {
        data.stamps = data.stamps.filter((item) => item.id !== id);
      });
    },
    async listUsers() {
      return load().users;
    },
    async listReports() {
      return load().reports;
    },
    async handleReport(id, action, note) {
      update((data) => {
        const report = data.reports.find((item) => item.id === id);
        if (!report) throw new AdminError('신고를 찾을 수 없습니다.', 'not_found');
        if (report.status !== 'open') throw new AdminError('이미 처리한 신고입니다.', 'conflict');
        const user = data.users.find((item) => item.id === report.targetId);
        if (user && action === 'reset_nickname') user.nickname = `여행자${user.id.slice(-4)}`;
        if (user && action === 'remove_avatar') user.avatarUrl = null;
        // 같은 회원·같은 항목에 쌓인 다른 신고도 함께 닫습니다.
        const handledAt = stamp();
        for (const item of data.reports) {
          const same =
            item.id === id ||
            (action !== 'dismiss' &&
              item.status === 'open' &&
              item.targetId === report.targetId &&
              item.target === report.target);
          if (!same) continue;
          item.status = action === 'dismiss' ? 'dismissed' : 'resolved';
          item.resolutionNote = note;
          item.handledAt = handledAt;
        }
      });
    },
    async resetDemo() {
      store.set(DEMO_STORAGE_KEY, JSON.stringify(createSeed(now())));
    },
  };
}
