import { create } from 'zustand';
import * as Haptics from 'expo-haptics';
import { farms as seedFarms, tasks as seedTasks, notes as seedNotes, TIERS, earnSeed, Farm, Task, Note } from './data';

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const jitter = (r: number) => (Math.random() * 2 - 1) * r;
let evId = 0;
const ev = (text: string) => ({ id: ++evId, text });

type State = {
  authed: boolean;
  userName: string;
  farms: Farm[];
  selectedId: string;
  hist: Record<string, number[]>;
  tasks: Task[];
  notes: Note[];
  auto: Record<string, boolean>;
  points: number;
  tierIdx: number;
  earned: Record<string, boolean>;
  flying: boolean;
  battery: number;
  altitude: number;
  speed: number;
  event: { id: number; text: string } | null;
  login: (name: string) => void;
  select: (id: string) => void;
  toggleAuto: (id: string) => void;
  setAllAuto: (on: boolean) => void;
  toggleZone: (farmId: string, zoneId: string) => void;
  irrigate: (farmId: string, amount: number) => void;
  startTask: (id: string) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  earn: (id: string) => void;
  claim: () => boolean;
  notify: (text: string) => void;
  toggleFlight: () => void;
  tick: () => void;
};

export const useStore = create<State>((set, get) => ({
  authed: false,
  userName: 'Alex Hales',
  farms: seedFarms,
  selectedId: seedFarms[0].id,
  hist: Object.fromEntries(
    seedFarms.map((f) => [f.id, Array.from({ length: 14 }, (_, i) => clamp(f.moisture + Math.sin(i * 0.9) * 4 + jitter(1.5), 5, 95))])
  ),
  tasks: seedTasks,
  notes: seedNotes,
  auto: { irrigation: true, drone: true, climate: true, pest: false, lights: true },
  points: 3120,
  tierIdx: 0,
  earned: {},
  flying: false,
  battery: 86,
  altitude: 0,
  speed: 0,
  event: null,

  login: (name) => set({ authed: true, userName: name }),
  select: (id) => set({ selectedId: id }),
  toggleAuto: (id) => set((s) => ({ auto: { ...s.auto, [id]: !s.auto[id] } })),
  setAllAuto: (on) => set((s) => ({ auto: Object.fromEntries(Object.keys(s.auto).map((k) => [k, on])) })),
  toggleZone: (farmId, zoneId) =>
    set((s) => ({
      farms: s.farms.map((f) =>
        f.id !== farmId ? f : { ...f, zones: f.zones.map((z) => (z.id === zoneId ? { ...z, on: !z.on } : z)) }
      ),
    })),
  irrigate: (farmId, amount) =>
    set((s) => ({
      farms: s.farms.map((f) => (f.id === farmId ? { ...f, moisture: clamp(f.moisture + amount, 10, 90) } : f)),
      event: ev('Irrigation cycle finished · moisture rising'),
    })),
  startTask: (id) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id && t.status === 'Scheduled' ? { ...t, status: 'In Progress', progress: 1 } : t)),
      event: ev('Task started — progress is syncing live'),
    })),
  markRead: (id) => set((s) => ({ notes: s.notes.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
  markAllRead: () => set((s) => ({ notes: s.notes.map((n) => ({ ...n, read: true })) })),
  earn: (id) => {
    const s = get();
    const item = earnSeed.find((e) => e.id === id);
    if (!item || s.earned[id]) return;
    set({ points: s.points + item.pts, earned: { ...s.earned, [id]: true }, event: ev(`+${item.pts} pts · ${item.title}`) });
  },
  claim: () => {
    const s = get();
    const next = TIERS[s.tierIdx + 1];
    if (!next || s.points < next.at) return false;
    set({ tierIdx: s.tierIdx + 1, event: ev(`You reached ${next.name}!`) });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return true;
  },
  notify: (text) => set({ event: ev(text) }),
  toggleFlight: () => {
    const s = get();
    if (!s.flying && s.battery < 20) {
      set({ event: ev('Battery too low for takeoff') });
      return;
    }
    set({ flying: !s.flying, event: ev(s.flying ? 'Drone returning home' : 'Drone D-2 airborne') });
  },

  tick: () => {
    const s = get();
    const farms = s.farms.map((f) => {
      const watering = f.zones.filter((z) => z.on).length;
      let moisture = f.moisture + jitter(0.9) + watering * 0.35 - 0.25;
      if (s.auto.irrigation && moisture < 42) moisture += 0.8;
      return {
        ...f,
        moisture: clamp(moisture, 18, 88),
        temp: clamp(f.temp + jitter(0.25), 20, 38),
        air: clamp(f.air + jitter(1.2), 8, 70),
      };
    });
    const hist: Record<string, number[]> = {};
    farms.forEach((f) => (hist[f.id] = [...s.hist[f.id], f.moisture].slice(-14)));

    let points = s.points;
    let event = s.event;
    const tasks = s.tasks.map((t) => {
      if (t.status !== 'In Progress' || Math.random() > 0.4) return t;
      const p = t.progress + 1;
      if (p >= 12) {
        const gain = Math.round(t.pts / 60);
        points += gain;
        event = ev(`${t.title} completed · +${gain} pts`);
        return { ...t, progress: 12, status: 'Done' as const };
      }
      return { ...t, progress: p };
    });

    let { flying, battery, altitude, speed } = s;
    if (flying) {
      battery = clamp(battery - 0.45, 0, 100);
      altitude = clamp(40 + jitter(3), 30, 52);
      speed = clamp(24 + jitter(4), 14, 34);
      if (battery <= 15) {
        flying = false;
        altitude = 0;
        speed = 0;
        event = ev('Drone battery low — returning home');
      }
    } else {
      battery = clamp(battery + 0.35, 0, 100);
      altitude = 0;
      speed = 0;
    }
    set({ farms, hist, tasks, points, flying, battery, altitude, speed, event });
  },
}));

export const selectFarm = (s: State) => s.farms.find((f) => f.id === s.selectedId) as Farm;
