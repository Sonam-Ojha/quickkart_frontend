import { useEffect, useState, useCallback, useRef } from 'react';
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, UtensilsCrossed, Store, IndianRupee, LogOut, Loader2, Menu, X, Zap, ChevronDown, Bell, BellOff, BellRing, ArrowRight, Settings } from 'lucide-react';
import { usePartnerStore } from './partner.store';
import { partnerApi, PartnerOrder } from './api';
import { NewOrderModal, ORDERS_CHANGED } from './NewOrderModal';
import { usePartnerSettings, unlockAudio, ringNow } from './sounds';
import type { Restaurant } from '../food/api';
import { cn } from '../../lib/utils';

export type PartnerRestaurant = Restaurant & { openNow: boolean };
export interface PartnerOutletContext {
  restaurant: PartnerRestaurant | null;
  setRestaurant: (r: PartnerRestaurant) => void;
  newCount: number;
  refreshNew: () => void;
}

const NAV = [
  { to: '/partner',            label: 'Dashboard',  icon: LayoutDashboard, end: true },
  { to: '/partner/orders',     label: 'Orders',     icon: ClipboardList },
  { to: '/partner/menu',       label: 'Menu',       icon: UtensilsCrossed },
  { to: '/partner/earnings',   label: 'Earnings',   icon: IndianRupee },
  { to: '/partner/settings',   label: 'Settings',   icon: Settings },
];

/** Restaurant partner shell — same look as the admin panel (dark sidebar + white
 *  top bar), with the "taking orders" switch always in the top bar. */
export function PartnerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const token  = usePartnerStore(s => s.token);
  const staff  = usePartnerStore(s => s.staff);
  const logout = usePartnerStore(s => s.logout);
  const [restaurant, setRestaurant] = useState<PartnerRestaurant | null>(null);
  const [toggling, setToggling] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // New-order watch runs on every page: count badge, tab title and chime.
  const [newOrders, setNewOrders] = useState<PartnerOrder[]>([]);
  const newCount = newOrders.length;
  // Orders the restaurant chose to "decide later" — no pop-up for these again.
  const [later, setLater] = useState<Set<number>>(new Set());
  // soundOn = the restaurant wants sound (Settings, remembered per browser).
  // audioOk = the browser is actually letting us play it right now.
  const soundOn = usePartnerSettings(s => s.soundOn);
  const repeatSecs = usePartnerSettings(s => s.repeatSecs);
  const popupOn = usePartnerSettings(s => s.popup);
  const setSettings = usePartnerSettings(s => s.set);
  const [audioOk, setAudioOk] = useState(false);
  const knownNew = useRef<Set<number> | null>(null);
  const checkNew = useCallback(async () => {
    try {
      const r = await partnerApi.orders('new');
      const ids = r.orders.map(o => o.id);
      if (knownNew.current && ids.some(id => !knownNew.current!.has(id))) ringNow();
      knownNew.current = new Set(ids);
      setNewOrders(r.orders);
    } catch { /* offline — try again next tick */ }
  }, []);
  useEffect(() => {
    if (!token) return;
    checkNew();
    const t = setInterval(checkNew, 10_000);
    return () => clearInterval(t);
  }, [token, checkNew]);
  // Refresh straight away when an order is accepted/rejected anywhere in the panel.
  useEffect(() => {
    window.addEventListener(ORDERS_CHANGED, checkNew);
    return () => window.removeEventListener(ORDERS_CHANGED, checkNew);
  }, [checkNew]);
  useEffect(() => {
    const base = document.title;
    return () => { document.title = base; };
  }, []);
  useEffect(() => {
    document.title = newCount > 0 ? `(${newCount}) New order${newCount > 1 ? 's' : ''} — Jhatpats Partner` : 'Jhatpats Partner';
  }, [newCount]);
  // After a reload: unlock audio on the first tap / key press anywhere on the page.
  useEffect(() => {
    if (!soundOn) return;
    unlockAudio().then(setAudioOk); // works straight away if the browser already allows sound
    const onGesture = async () => {
      const ok = await unlockAudio();
      setAudioOk(ok);
      if (ok) {
        window.removeEventListener('pointerdown', onGesture);
        window.removeEventListener('keydown', onGesture);
      }
    };
    window.addEventListener('pointerdown', onGesture);
    window.addEventListener('keydown', onGesture);
    return () => {
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
    };
  }, [soundOn]);

  const toggleSound = async () => {
    const next = !soundOn;
    setSettings({ soundOn: next });
    if (next) {
      setAudioOk(await unlockAudio());
      ringNow();
    }
  };
  const soundLive = soundOn && audioOk;

  const popup = popupOn ? newOrders.find(o => !later.has(o.id)) ?? null : null;
  // Keep ringing while an order waits (pop-up open, or any new order when the
  // pop-up is turned off), like a phone call. repeatSecs 0 = ring once only.
  const ringingFor = popupOn ? popup?.id : newOrders[0]?.id;
  useEffect(() => {
    if (!ringingFor || !soundLive || !repeatSecs) return;
    const t = setInterval(ringNow, repeatSecs * 1000);
    return () => clearInterval(t);
  }, [ringingFor, soundLive, repeatSecs]);

  const refresh = useCallback(() => {
    partnerApi.restaurant().then(setRestaurant).catch(() => {});
  }, []);
  useEffect(() => { if (token) refresh(); }, [token, refresh]);
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  if (!token) return <Navigate to="/login" replace />;

  const toggleOpen = async () => {
    if (!restaurant) return;
    setToggling(true);
    try { setRestaurant(await partnerApi.updateRestaurant({ isOpen: !restaurant.isOpen })); }
    catch {} finally { setToggling(false); }
  };

  const signOut = () => { logout(); navigate('/login', { replace: true }); };

  const accepting = restaurant?.isOpen ?? false;
  const current = NAV.find(n => n.end ? location.pathname === n.to : location.pathname.startsWith(n.to));

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-30 bg-slate-900/50 transition-opacity lg:hidden ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col h-full bg-[#0F1923] select-none shrink-0 transition-transform duration-300',
          'fixed inset-y-0 left-0 z-40 w-64 max-w-[80vw] lg:static lg:z-auto lg:w-60 lg:translate-x-0',
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
        )}
      >
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-[#EA580C] flex items-center justify-center shrink-0">
            <Zap size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-white text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Jhatpats</span>
            <span className="block text-[10px] text-slate-400 leading-none">Restaurant Panel</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 lg:hidden" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        {/* Restaurant card */}
        <div className="mx-3 mt-3 rounded-xl bg-white/5 border border-white/10 p-3 flex items-center gap-2.5">
          {restaurant?.imageUrl
            ? <img src={restaurant.imageUrl} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
            : <div className="w-9 h-9 rounded-lg bg-[#EA580C]/20 text-[#FB923C] flex items-center justify-center shrink-0"><Store size={16} /></div>}
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white truncate">{restaurant?.name ?? '…'}</div>
            <div className={`text-[11px] font-medium ${accepting ? 'text-green-400' : 'text-slate-400'}`}>
              {accepting ? (restaurant?.openNow === false ? 'On · outside hours' : '● Taking orders') : '● Closed'}
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 lg:py-2 rounded-lg text-sm transition-colors',
                isActive ? 'bg-[#EA580C]/20 text-[#FB923C] font-semibold' : 'text-slate-400 hover:text-white hover:bg-white/5',
              )}>
              <Icon size={16} className="shrink-0" />
              <span className="flex-1">{label}</span>
              {to === '/partner/orders' && newCount > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#EA580C] text-white text-[11px] font-bold flex items-center justify-center animate-pulse">{newCount}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <button onClick={signOut} className="m-3 flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5">
          <LogOut size={16} /> Sign out
        </button>
      </aside>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 flex items-center gap-2 sm:gap-4 px-3 sm:px-4 bg-white border-b border-slate-100 shrink-0">
          <button onClick={() => setMobileOpen(v => !v)} aria-label="Open menu"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden">
            <Menu size={18} />
          </button>
          <h1 className="font-bold text-slate-900 text-base truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {current?.label ?? 'Orders'}
          </h1>

          <div className="flex items-center gap-1 sm:gap-2 ml-auto">
            {/* User menu */}
            <div className="relative">
              <button onClick={() => setMenuOpen(v => !v)}
                className="flex items-center gap-2 pl-1.5 pr-2 sm:pr-3 py-1.5 rounded-lg hover:bg-slate-100">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#EA580C] to-[#0F766E] flex items-center justify-center text-white text-xs font-bold">
                  {staff?.name?.[0]?.toUpperCase() ?? 'R'}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-semibold text-slate-800 leading-none">{staff?.name ?? 'Partner'}</div>
                  <div className="text-[10px] text-slate-400 leading-none mt-0.5">Restaurant Partner</div>
                </div>
                <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-56 max-w-[calc(100vw-1.5rem)] bg-white rounded-xl border border-slate-100 shadow-lg z-20 py-1 overflow-hidden">
                    <div className="px-3 py-2 border-b border-slate-50">
                      <div className="text-sm font-semibold text-slate-800 truncate">{staff?.name}</div>
                      <div className="text-xs text-slate-400 truncate">{staff?.mobile} · {restaurant?.name}</div>
                    </div>
                    <button onClick={signOut} className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                      <LogOut size={14} /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {newCount > 0 && !location.pathname.startsWith('/partner/orders') && (
          <button onClick={() => navigate('/partner/orders')}
            className="shrink-0 flex items-center justify-center gap-2 bg-[#EA580C] text-white text-sm font-semibold py-2.5 px-4 hover:bg-[#C2410C]">
            <BellRing size={16} className="animate-bounce" />
            {newCount} new order{newCount > 1 ? 's' : ''} waiting — tap to accept
            <ArrowRight size={15} />
          </button>
        )}
        {popup && (
          <NewOrderModal
            order={popup}
            queue={newCount}
            onDone={checkNew}
            onLater={() => setLater(prev => new Set(prev).add(popup.id))}
          />
        )}
        <main className="flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-6">
          {/* Order controls — top right of the page, no box around them */}
          <div className="flex flex-wrap items-center justify-end gap-2 mb-4">
            {soundOn && !audioOk ? (
              // Wanted on, but the browser is waiting for a first tap after reload.
              <button onClick={() => unlockAudio().then(setAudioOk)} title="Your browser needs one tap after reloading before it can play sound"
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border bg-amber-50 border-amber-300 text-amber-800 animate-pulse">
                <Bell size={14} /><span className="hidden sm:inline">Tap to start sound</span>
              </button>
            ) : (
              <button onClick={toggleSound} title={soundLive ? 'Sound is on — tap to turn off' : 'Turn on sound for new orders'}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border ${
                  soundLive ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-300 text-amber-800 animate-pulse'}`}>
                {soundLive ? <Bell size={14} /> : <BellOff size={14} />}
                <span className="hidden sm:inline">{soundLive ? 'Sound on' : 'Turn on sound'}</span>
              </button>
            )}
            {/* Taking orders on/off — the switch restaurants use most */}
            <button
              type="button" onClick={toggleOpen} disabled={!restaurant || toggling}
              className={`flex items-center gap-2 rounded-full pl-3 pr-1.5 py-1.5 text-xs font-bold border transition-colors disabled:opacity-70 ${
                accepting ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-100 border-slate-200 text-slate-600'}`}
            >
              {accepting ? 'Taking orders' : 'Closed'}
              <span className={`w-9 h-5 rounded-full relative ${accepting ? 'bg-green-600' : 'bg-slate-300'}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform flex items-center justify-center ${accepting ? 'translate-x-4' : 'translate-x-0.5'}`}>
                  {toggling && <Loader2 size={10} className="animate-spin text-slate-400" />}
                </span>
              </span>
            </button>
          </div>
          <Outlet context={{ restaurant, setRestaurant, newCount, refreshNew: checkNew } satisfies PartnerOutletContext} />
        </main>
      </div>
    </div>
  );
}
