// All images are remote placeholders (Unsplash). Swap with local assets for production.
const u = (id: string, w = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const IMG = {
  hero: u('photo-1500382017468-9049fed747ef', 1400),
  veg: u('photo-1574943320219-553eb213f72d'),
  wheat: u('photo-1500651230702-0e2d8a49d4ad'),
  river: u('photo-1625246333195-78d9c38ad449'),
  orchard: u('photo-1464226184884-fa280b87c399'),
  greenhouse: u('photo-1530836369250-ef72a3f5cda8', 1400),
  tech: u('photo-1592982537447-7440770cbfc9'),
  avatar: u('photo-1500648767791-00dcc994a43e', 300),
};

export type Zone = { id: string; name: string; on: boolean };
export type Farm = {
  id: string; name: string; kind: string; pts: number; image: string;
  hectares: number; crop: string; health: number; moisture: number;
  temp: number; air: number; ph: number; stage: number; zones: Zone[];
};
export type Task = {
  id: string; cat: 'daily' | 'workers' | 'tools' | 'ongoing'; title: string; meta: string;
  pts: number; image: string; progress: number; status: 'Scheduled' | 'In Progress' | 'Done';
};
export type Note = {
  id: string; title: string; body: string; time: string; icon: string;
  tone: 'warn' | 'ok' | 'info'; read: boolean;
};

const zones = (n: string): Zone[] => [
  { id: `${n}-a`, name: 'Zone A · North rows', on: true },
  { id: `${n}-b`, name: 'Zone B · Drip line', on: false },
  { id: `${n}-c`, name: 'Zone C · Seedlings', on: false },
];

export const farms: Farm[] = [
  { id: 'gv', name: 'Green Valley Farm', kind: 'Dairy & Vegetables', pts: 1300, image: IMG.veg, hectares: 12.4, crop: 'Cabbage & Kale', health: 92, moisture: 58, temp: 28, air: 24, ph: 6.4, stage: 0.62, zones: zones('gv') },
  { id: 'sf', name: 'Sunrise Fields', kind: 'Grains & Harvest', pts: 1200, image: IMG.wheat, hectares: 28, crop: 'Winter wheat', health: 87, moisture: 44, temp: 31, air: 31, ph: 6.9, stage: 0.84, zones: zones('sf') },
  { id: 'rb', name: 'Riverbend Crops', kind: 'Maize & Beans', pts: 1400, image: IMG.river, hectares: 9.6, crop: 'Maize & beans', health: 95, moisture: 66, temp: 27, air: 18, ph: 6.1, stage: 0.35, zones: zones('rb') },
  { id: 'ht', name: 'Highland Terrace', kind: 'Citrus Orchard', pts: 1100, image: IMG.orchard, hectares: 6.2, crop: 'Sweet orange', health: 90, moisture: 52, temp: 25, air: 14, ph: 6.6, stage: 0.5, zones: zones('ht') },
];

export const tasks: Task[] = [
  { id: 't1', cat: 'daily', title: 'Field C Water Check', meta: 'Green Valley', pts: 1200, image: IMG.tech, progress: 8, status: 'In Progress' },
  { id: 't2', cat: 'daily', title: 'Crop Health Monitoring', meta: 'Sunrise Fields', pts: 1400, image: IMG.greenhouse, progress: 0, status: 'Scheduled' },
  { id: 't3', cat: 'daily', title: 'Soil Sampling · Block B', meta: 'Riverbend', pts: 900, image: IMG.river, progress: 3, status: 'In Progress' },
  { id: 't4', cat: 'daily', title: 'Pest Trap Inspection', meta: 'Highland Terrace', pts: 800, image: IMG.orchard, progress: 0, status: 'Scheduled' },
  { id: 'w1', cat: 'workers', title: 'Kwame Mensah', meta: 'Irrigation lead', pts: 1500, image: IMG.avatar, progress: 9, status: 'In Progress' },
  { id: 'w2', cat: 'workers', title: 'Abena Owusu', meta: 'Harvest crew', pts: 1100, image: IMG.wheat, progress: 5, status: 'In Progress' },
  { id: 'w3', cat: 'workers', title: 'Yaw Boateng', meta: 'Equipment ops', pts: 1000, image: IMG.tech, progress: 0, status: 'Scheduled' },
  { id: 'k1', cat: 'tools', title: 'Tractor T-40', meta: 'Fuel 72%', pts: 600, image: IMG.hero, progress: 7, status: 'In Progress' },
  { id: 'k2', cat: 'tools', title: 'Sprayer S-1', meta: 'Tank 40%', pts: 500, image: IMG.veg, progress: 0, status: 'Scheduled' },
  { id: 'k3', cat: 'tools', title: 'Drone D-2', meta: 'Battery 86%', pts: 700, image: IMG.tech, progress: 0, status: 'Scheduled' },
  { id: 'o1', cat: 'ongoing', title: 'Harvest · Block B', meta: 'Sunrise Fields', pts: 1600, image: IMG.wheat, progress: 10, status: 'In Progress' },
  { id: 'o2', cat: 'ongoing', title: 'Compost Cycle 4', meta: 'Green Valley', pts: 700, image: IMG.veg, progress: 4, status: 'In Progress' },
];

export const notes: Note[] = [
  { id: 'n1', title: 'Soil moisture dipping in Field C', body: 'Irrigation zone 2 is scheduled to run in 20 minutes.', time: '2m', icon: 'water', tone: 'warn', read: false },
  { id: 'n2', title: 'Drone D-2 scan finished', body: 'Crop health map for Sunrise Fields is ready to review.', time: '18m', icon: 'airplane', tone: 'ok', read: false },
  { id: 'n3', title: 'Frost risk tonight', body: 'Lows of 6°C expected after 2 AM. Greenhouse heating is armed.', time: '1h', icon: 'thermometer', tone: 'info', read: false },
  { id: 'n4', title: 'Crew check-in', body: 'Kwame Mensah started the harvest in Block B.', time: '3h', icon: 'people', tone: 'ok', read: true },
];

export const TIERS = [
  { name: 'Premium Farmer', at: 2500 },
  { name: 'Elite Farmer', at: 3245 },
  { name: 'Master Grower', at: 5000 },
];

export const earnSeed = [
  { id: 'e1', title: 'Log a soil sample', pts: 40 },
  { id: 'e2', title: 'Complete a field walk-through', pts: 60 },
  { id: 'e3', title: 'Review the weekly crop report', pts: 30 },
];

export const benefits = [
  { title: '10% off seed orders', tier: 0, icon: 'leaf' },
  { title: '2 free drone hours / month', tier: 0, icon: 'airplane' },
  { title: 'Priority agronomist chat', tier: 1, icon: 'chatbubbles' },
  { title: 'Equipment lease credit', tier: 2, icon: 'construct' },
];

export const automations = [
  { id: 'irrigation', title: 'Smart Irrigation', sub: 'Waters zones when soil drops below 42%', icon: 'water' },
  { id: 'drone', title: 'Drone Patrol', sub: 'Dawn scan of every field, 06:30', icon: 'airplane' },
  { id: 'climate', title: 'Greenhouse Climate', sub: 'Vents and heaters follow the forecast', icon: 'thermometer' },
  { id: 'pest', title: 'Pest Alerts', sub: 'Camera traps flag early infestations', icon: 'bug' },
  { id: 'lights', title: 'Night Lighting', sub: 'Dusk-to-dawn perimeter lights', icon: 'bulb' },
];

export const soilStatus = (m: number) => (m < 35 ? 'Dry' : m > 70 ? 'Wet' : 'Healthy');
export const airStatus = (a: number) => (a <= 25 ? 'Clean · Safe' : a <= 50 ? 'Moderate' : 'Poor');
export const weatherStatus = (t: number) => `${t >= 31 ? 'Hot' : 'Sunny'} · ${Math.round(t)}°C`;
