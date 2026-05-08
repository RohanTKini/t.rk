/* Cross-device store for the Rohan Kini portfolio.
 *
 * Backed by Firebase Realtime Database with a localStorage cache so first
 * paint is instant and the site still works fully offline. A single
 * `onValue` listener fans out remote changes to every subscriber.
 *
 * Top-level shape persisted to RTDB:
 *   {
 *     settings: {
 *       permDisabled, tempDisabled, blockedDates,
 *       locationMode, customLocation
 *     },
 *     content: {
 *       hero: { headline, tagline, statusPill, roles[] },
 *       about: { paragraphs[], quote },
 *       expertise: [{ title, desc, icon }],
 *       address: string, email1, email2, phone
 *     },
 *     experiences: [{ id, role, org, type, period, duration, location }],
 *     products: [{ id, name, image, launchDate, link, description }],
 *     gallery: [{ id, image, location, caption }],
 *     socials: [{ id, name, href, icon }],
 *     logs: [],
 *     notes: { high: [], low: [] }
 *   }
 */

import { ref, onValue, set } from 'firebase/database';
import { db, isFirebaseConfigured } from './firebase.js';

const CACHE_KEY = 'rk_state_v1';
const PATH = 'state';

const DEFAULT_CONTENT = {
  hero: {
    headline: 'Building tomorrow,\n<em>one bold idea</em>\nat a time.',
    tagline:
      'An aspiring entrepreneur driven by the vision of creating something impactful, futuristic, ' +
      'and meaningful for society — building ventures that lead, inspire and create change.',
    statusPill: 'Open to collaborations',
    roles: ['Aspiring Entrepreneur', 'Visionary Leader', 'Future Founder']
  },
  about: {
    paragraphs: [
      "An aspiring entrepreneur driven by the vision of creating something impactful, futuristic, and meaningful for society. Strongly believing that true success comes from innovation, leadership, and the courage to take risks — preparing to step into the world of business and build a company that stands for creativity, progress, and long-term value.",
      "Sees entrepreneurship not just as a profession, but as a responsibility to lead, inspire, and create change. Determined to become a strong business leader who can turn ideas into reality while building meaningful collaborations with individuals, organizations, and visionaries who share the same passion for innovation and development.",
      "Guided by ambition, discipline, confidence, and the desire to achieve something bigger than personal success — someone who believes in thinking ahead of time, embracing challenges, and continuously evolving with changing trends and technologies."
    ],
    quote:
      "I believe a true leader is someone who motivates others, builds trust, and transforms challenges into opportunities — building strong networks, meaningful partnerships, and influential ventures."
  },
  expertise: [
    { title: 'Vision', desc: 'Thinking ahead of time — building ventures that solve real-world problems and create opportunities at scale.' },
    { title: 'Leadership', desc: 'Taking responsibility, guiding teams, making bold decisions and building environments where ideas flourish.' },
    { title: 'Collaboration', desc: 'Forging meaningful partnerships with innovators, organizations and visionaries who share the same passion.' }
  ],
  address: 'Mangaluru, Karnataka, India',
  email1: 'rohan.t.kini@gmail.com',
  email2: 'Rohankini.rk18@gmail.com',
  phone: '+91 63615 29586'
};

const DEFAULT_EXPERIENCES = [
  { id: 1, role: 'Founder', org: 'Upcoming Venture', type: 'Full-time', period: 'Jan 2025 — Present', duration: '1 yr', location: 'Mangaluru, Karnataka, India' }
];

const DEFAULT_PRODUCTS = [
  {
    id: 'p1',
    name: 'Vision Hub',
    image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=900&q=80',
    launchDate: '2026-03-01',
    link: 'https://example.com',
    description: 'A collaboration platform connecting founders, mentors and investors across India — built for the next wave of bold ideas.'
  },
  {
    id: 'p2',
    name: 'Future Forge',
    image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=900&q=80',
    launchDate: '2026-06-15',
    link: 'https://example.com',
    description: 'An incubation studio turning early-stage ideas into shipped products — sprint-driven, design-led, founder-friendly.'
  },
  {
    id: 'p3',
    name: 'NextGen Labs',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&q=80',
    launchDate: '2026-11-20',
    link: '',
    description: ''
  }
];

const DEFAULT_GALLERY = [
  { id: 'g1', image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1100&q=80', location: 'TEDx · Mangaluru', caption: 'Sharing the entrepreneurial vision on stage.' },
  { id: 'g2', image: 'https://images.unsplash.com/photo-1559223607-a43f990c692c?w=1100&q=80',  location: 'Bengaluru · Founders Meet 2026', caption: 'Roundtable with India\'s next-gen builders.' },
  { id: 'g3', image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1100&q=80',  location: 'Innovation Awards · Mumbai',        caption: 'Recognised for forward-thinking ventures.' },
  { id: 'g4', image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1100&q=80',  location: 'Team Offsite · Coorg',             caption: 'Building culture before building product.' },
  { id: 'g5', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1100&q=80', location: 'Studio · Mangaluru',                caption: 'The space where ideas take shape.' },
  { id: 'g6', image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1100&q=80', location: 'Investor Roundtable · Delhi',       caption: 'Pitching the long view to backers.' },
  { id: 'g7', image: 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=1100&q=80',  location: 'Mangaluru Skyline',                caption: 'Where the journey began.' },
  { id: 'g8', image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1100&q=80',  location: 'Workshop · Manipal',               caption: 'Mentoring student founders.' }
];

const DEFAULT_SOCIALS = [
  { id: 'instagram', name: 'Instagram', href: 'https://instagram.com/' },
  { id: 'linkedin',  name: 'LinkedIn',  href: 'https://linkedin.com/' },
  { id: 'x',         name: 'X',         href: 'https://x.com/' },
  { id: 'whatsapp',  name: 'WhatsApp',  href: 'https://wa.me/916361529586' }
];

const DEFAULT_STATE = {
  settings: {
    permDisabled: false,
    tempDisabled: false,
    blockedDates: [],
    locationMode: null,
    customLocation: null
  },
  content: DEFAULT_CONTENT,
  experiences: DEFAULT_EXPERIENCES,
  products: DEFAULT_PRODUCTS,
  gallery: DEFAULT_GALLERY,
  socials: DEFAULT_SOCIALS,
  logs: [],
  notes: { high: [], low: [] }
};

const clone = (o) => JSON.parse(JSON.stringify(o));

function normalize(data) {
  const d = data || {};
  return {
    settings: { ...DEFAULT_STATE.settings, ...(d.settings || {}) },
    content:  { ...DEFAULT_CONTENT, ...(d.content || {}) },
    experiences: Array.isArray(d.experiences) ? d.experiences : clone(DEFAULT_EXPERIENCES),
    products:    Array.isArray(d.products)    ? d.products    : clone(DEFAULT_PRODUCTS),
    gallery:     Array.isArray(d.gallery)     ? d.gallery     : clone(DEFAULT_GALLERY),
    socials:     Array.isArray(d.socials)     ? d.socials     : clone(DEFAULT_SOCIALS),
    logs:        Array.isArray(d.logs)        ? d.logs        : [],
    notes: {
      high: Array.isArray(d?.notes?.high) ? d.notes.high : [],
      low:  Array.isArray(d?.notes?.low)  ? d.notes.low  : []
    }
  };
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? normalize(JSON.parse(raw)) : clone(DEFAULT_STATE);
  } catch { return clone(DEFAULT_STATE); }
}
function writeCache(state) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(state)); } catch {}
  window.dispatchEvent(new CustomEvent('rk:state', { detail: state }));
}

let remoteAttached = false;
function attachRemote() {
  if (remoteAttached || !isFirebaseConfigured) return;
  remoteAttached = true;
  const node = ref(db, PATH);
  onValue(node, (snap) => {
    const v = snap.val();
    writeCache(normalize(v || {}));
  }, (err) => {
    console.warn('[firebase] read failed, using cache:', err?.message);
  });
}

async function pushRemote(state) {
  if (!isFirebaseConfigured) return;
  const clean = JSON.parse(JSON.stringify(state));
  await set(ref(db, PATH), clean);
}

export const Store = {
  getState() { return readCache(); },

  subscribe(fn) {
    attachRemote();
    const handler = () => fn(readCache());
    window.addEventListener('rk:state', handler);
    const onStorage = (e) => { if (e.key === CACHE_KEY) handler(); };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('rk:state', handler);
      window.removeEventListener('storage', onStorage);
    };
  },

  async refresh() { return readCache(); },

  async setSettings(partial) {
    const next = readCache();
    next.settings = { ...next.settings, ...partial };
    writeCache(next); pushRemote(next).catch(() => {});
    return next;
  },

  async setContent(partial) {
    const next = readCache();
    next.content = { ...next.content, ...partial };
    writeCache(next); pushRemote(next).catch(() => {});
    return next;
  },

  async setExperiences(list) {
    const next = readCache();
    next.experiences = Array.isArray(list) ? list : [];
    writeCache(next); pushRemote(next).catch(() => {});
    return next;
  },

  async setProducts(list) {
    const next = readCache();
    next.products = Array.isArray(list) ? list : [];
    writeCache(next); pushRemote(next).catch(() => {});
    return next;
  },

  async setGallery(list) {
    const next = readCache();
    next.gallery = Array.isArray(list) ? list : [];
    writeCache(next); pushRemote(next).catch(() => {});
    return next;
  },

  async setSocials(list) {
    const next = readCache();
    next.socials = Array.isArray(list) ? list : [];
    writeCache(next); pushRemote(next).catch(() => {});
    return next;
  },

  async appendLog(entry) {
    const next = readCache();
    next.logs = [...(next.logs || []), entry];
    writeCache(next); pushRemote(next).catch(() => {});
    return next;
  },
  async deleteLog(id) {
    const next = readCache();
    next.logs = (next.logs || []).filter(l => l.id !== id);
    writeCache(next); pushRemote(next).catch(() => {});
    return next;
  },
  async clearLogs() {
    const next = readCache();
    next.logs = [];
    writeCache(next); pushRemote(next).catch(() => {});
    return next;
  },

  startPolling() { attachRemote(); return () => {}; },
  stopPolling() {}
};
