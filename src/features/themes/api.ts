import api from '../../lib/api';

export interface ThemeSection {
  enabled: boolean;
  title: string | null;
  subtitle: string | null;
  bgColor: string;
  bgImage: string | null;
  /** Illustrated banner at the top of the section (title sits on its left). */
  bannerImage: string | null;
  /** "Shop by" cards — tapping one searches for `query` (or the label). */
  tiles: ThemeTile[];
  productIds: number[];
}

export interface ThemeTile { label: string; image: string; query: string | null }

/** Everything the customer app + website know how to change. */
export interface ThemeConfig {
  headerColor: string;
  headerTextColor: 'light' | 'dark';
  headerImage: string | null;
  decorationImage: string | null;
  animationUrl: string | null;
  animationMode: 'header' | 'once';
  accentColor: string;
  greeting: string | null;
  searchPlaceholder: string | null;
  /** Light colour under the header (page top, category tiles). */
  pageTint: string | null;
  /** Faint pattern behind the top of the page. */
  pageImage: string | null;
  section: ThemeSection;
}

export type ThemeStatus = 'live' | 'scheduled' | 'ended' | 'off';

export interface AppTheme {
  id: number;
  name: string;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  storeIds: number[] | null;
  priority: number;
  config: ThemeConfig;
  status: ThemeStatus;
  created_at: string;
  updated_at: string;
}

export type ThemePayload = Partial<Pick<AppTheme, 'name' | 'isActive' | 'startsAt' | 'endsAt' | 'storeIds' | 'priority'>> & { config?: ThemeConfig };

export interface ThemeProduct { id: number; name: string; imageUrl: string | null; price: number; unit: string | null }
export interface StoreOption { id: number; name: string; city: string }

const base = '/api/admin/themes';

export const themeApi = {
  list:   () => api.get<{ themes: AppTheme[] }>(base).then(r => r.data.themes),
  get:    (id: number) => api.get<{ theme: AppTheme }>(`${base}/${id}`).then(r => r.data.theme),
  create: (data: ThemePayload) => api.post<{ theme: AppTheme }>(base, data).then(r => r.data.theme),
  update: (id: number, data: ThemePayload) => api.put<{ theme: AppTheme }>(`${base}/${id}`, data).then(r => r.data.theme),
  toggle: (id: number) => api.patch<{ theme: AppTheme }>(`${base}/${id}/toggle`).then(r => r.data.theme),
  remove: (id: number) => api.delete(`${base}/${id}`).then(r => r.data),
  stores: () => api.get<{ stores: StoreOption[] }>(`${base}/stores`).then(r => r.data.stores),
  searchProducts: (q: string) => api.get<{ products: ThemeProduct[] }>(`${base}/products`, { params: { q } }).then(r => r.data.products),
  productsByIds: (ids: number[]) =>
    ids.length ? api.get<{ products: ThemeProduct[] }>(`${base}/products`, { params: { ids: ids.join(',') } }).then(r => r.data.products) : Promise.resolve([]),
  uploadAnimation: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post<{ url: string }>(`${base}/animation`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data.url);
  },
};

export const DEFAULT_CONFIG: ThemeConfig = {
  headerColor: '#EA580C',
  headerTextColor: 'light',
  headerImage: null,
  decorationImage: null,
  animationUrl: null,
  animationMode: 'header',
  accentColor: '#EA580C',
  greeting: null,
  searchPlaceholder: null,
  pageTint: null,
  pageImage: null,
  section: { enabled: false, title: null, subtitle: null, bgColor: '#FFF7ED', bgImage: null, bannerImage: null, tiles: [], productIds: [] },
};

// Art packs live on the API server (quickkart_backend/public/theme-presets).
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://localhost:4000' : 'https://api.jhatpats.com');
const asset = (path: string) => `${API_BASE}/theme-presets/${path}`;
const tile = (label: string, icon: string, query: string): ThemeTile => ({ label, image: asset(`icons/${icon}.webp`), query });

export interface ThemePreset {
  key: string;
  name: string;
  emoji: string;
  config: ThemeConfig;
  /** Searched on apply to pre-fill the section's products (first matches of each). */
  productKeywords: string[];
}

const preset = (
  key: string, name: string, emoji: string,
  c: { header: string; accent: string; tint: string; greeting: string; search: string; title: string; subtitle: string; tiles: ThemeTile[]; dark?: boolean },
  productKeywords: string[],
): ThemePreset => ({
  key, name, emoji, productKeywords,
  config: {
    headerColor: c.header,
    headerTextColor: c.dark ? 'dark' : 'light',
    headerImage: asset(`${key}/header.webp`),
    decorationImage: asset(`${key}/decoration.webp`),
    animationUrl: asset(`${key}/animation.json`),
    animationMode: 'header',
    accentColor: c.accent,
    greeting: c.greeting,
    searchPlaceholder: c.search,
    pageTint: c.tint,
    pageImage: asset(`${key}/page.webp`),
    section: {
      enabled: true, title: c.title, subtitle: c.subtitle, bgColor: c.tint,
      bgImage: asset(`${key}/section.webp`), bannerImage: asset(`${key}/banner.webp`),
      tiles: c.tiles, productIds: [],
    },
  },
});

/** One tap fills everything — colours, pictures, animation, "Shop by" tiles and products. */
export const PRESETS: ThemePreset[] = [
  preset('diwali', 'Diwali', '🪔', {
    header: '#7C2D12', accent: '#D97706', tint: '#FEF3C7',
    greeting: 'Happy Diwali 🪔', search: 'Search for diyas, sweets, gifts…',
    title: 'Diwali Store', subtitle: 'Diyas, sweets, decor & gifting — delivered in minutes',
    tiles: [tile('Diyas & Candles', 'diya', 'diya'), tile('Lights & Decor', 'lights', 'lights'), tile('Rangoli', 'rangoli', 'rangoli'), tile('Sweets', 'sweets', 'sweets'),
      tile('Gifting', 'gift', 'gift'), tile('Pooja Needs', 'pooja', 'pooja'), tile('Flowers & Toran', 'marigold', 'flowers'), tile('Dry Fruits', 'dates', 'dry fruits')],
  }, ['almond', 'cashew', 'raisin', 'silk', 'dairy milk', 'cookies', 'ghee', 'chocolate']),
  preset('holi', 'Holi', '🎨', {
    header: '#BE185D', accent: '#7C3AED', tint: '#FCE7F3',
    greeting: 'Happy Holi 🎨', search: 'Search for gulal, pichkari, gujiya…',
    title: 'Holi Hai!', subtitle: 'Colours, pichkaris, thandai & party snacks',
    tiles: [tile('Gulal & Colours', 'colors', 'gulal'), tile('Pichkari', 'pichkari', 'pichkari'), tile('Gujiya & Sweets', 'sweets', 'gujiya'), tile('Thandai & Drinks', 'drinks', 'thandai'),
      tile('Party Snacks', 'snacks', 'namkeen'), tile('Balloons', 'balloons', 'balloons'), tile('Fresh Fruits', 'fruits', 'fruits'), tile('Gifts', 'gift', 'gift')],
  }, ['namkeen', 'chips', 'cold drink', 'juice', 'sweet', 'biscuit']),
  preset('newyear', 'New Year', '🎉', {
    header: '#1E1B4B', accent: '#CA8A04', tint: '#EDE9FE',
    greeting: 'Happy New Year 🎉', search: 'Search for party snacks, drinks…',
    title: 'New Year Party Store', subtitle: 'Snacks, mixers, cakes & decor for tonight',
    tiles: [tile('Party Snacks', 'snacks', 'chips'), tile('Drinks & Mixers', 'drinks', 'cold drink'), tile('Cakes', 'cake', 'cake'), tile('Balloons & Decor', 'balloons', 'balloons'),
      tile('Party Lights', 'lights', 'lights'), tile('Chocolates', 'sweets', 'chocolate'), tile('Sparklers', 'sparkles', 'candles'), tile('Gifts', 'gift', 'gift')],
  }, ['chips', 'cold drink', 'cake', 'chocolate', 'juice', 'nachos']),
  preset('christmas', 'Christmas', '🎄', {
    header: '#14532D', accent: '#DC2626', tint: '#DCFCE7',
    greeting: 'Merry Christmas 🎄', search: 'Search for cakes, decorations…',
    title: 'Christmas Store', subtitle: 'Plum cakes, cookies, decor & gifts',
    tiles: [tile('Cakes', 'cake', 'cake'), tile('Tree & Decor', 'tree', 'christmas'), tile('Ornaments', 'ornament', 'decoration'), tile('Gifts', 'gift', 'gift'),
      tile('Cookies', 'sweets', 'cookies'), tile('Fairy Lights', 'lights', 'lights'), tile('Party Drinks', 'drinks', 'juice'), tile('Snacks', 'snacks', 'chips')],
  }, ['cake', 'cookies', 'chocolate', 'biscuit', 'juice']),
  preset('independence', 'Independence Day', '🇮🇳', {
    header: '#EA580C', accent: '#15803D', tint: '#FFEDD5',
    greeting: 'Happy Independence Day 🇮🇳', search: 'Search for flags, sweets…',
    title: 'Celebrate India', subtitle: 'Tricolour picks, sweets & snacks',
    tiles: [tile('Flags', 'flag', 'flag'), tile('Sweets', 'sweets', 'sweets'), tile('Snacks', 'snacks', 'namkeen'), tile('Drinks', 'drinks', 'juice'),
      tile('Balloons', 'balloons', 'balloons'), tile('Gifts', 'gift', 'gift'), tile('Fruits', 'fruits', 'fruits'), tile('Rangoli', 'rangoli', 'rangoli')],
  }, ['sweet', 'namkeen', 'juice', 'chocolate', 'biscuit']),
  preset('eid', 'Eid', '🌙', {
    header: '#065F46', accent: '#CA8A04', tint: '#ECFDF5',
    greeting: 'Eid Mubarak 🌙', search: 'Search for sewaiyan, dates, dry fruits…',
    title: 'Eid Store', subtitle: 'Sewaiyan, dates, dry fruits & sweets',
    tiles: [tile('Sewaiyan', 'sewaiyan', 'sewaiyan'), tile('Dates', 'dates', 'dates'), tile('Dry Fruits', 'fruits', 'dry fruits'), tile('Sweets', 'sweets', 'sweets'),
      tile('Lanterns & Decor', 'lantern', 'decoration'), tile('Sharbat', 'drinks', 'sharbat'), tile('Gifts', 'gift', 'gift'), tile('Chaand Raat', 'moon', 'mehendi')],
  }, ['dates', 'almond', 'cashew', 'raisin', 'milk', 'sugar']),
  preset('navratri', 'Navratri', '🪷', {
    header: '#B91C1C', accent: '#EA580C', tint: '#FEF2F2',
    greeting: 'Shubh Navratri 🪷', search: 'Search for vrat items, fruits…',
    title: 'Navratri Store', subtitle: 'Vrat essentials, pooja needs & dandiya',
    tiles: [tile('Pooja Needs', 'pooja', 'pooja'), tile('Dandiya', 'dandiya', 'dandiya'), tile('Flowers', 'marigold', 'flowers'), tile('Vrat Snacks', 'snacks', 'makhana'),
      tile('Fruits', 'fruits', 'fruits'), tile('Diyas', 'diya', 'diya'), tile('Sweets', 'sweets', 'sweets'), tile('Rangoli', 'rangoli', 'rangoli')],
  }, ['makhana', 'fruits', 'sugar', 'ghee', 'milk', 'peanut']),
];
