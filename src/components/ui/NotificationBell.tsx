import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, CheckCheck, Trash2, X, ShoppingBag, FileText, User, Info } from 'lucide-react';
import api from '../../lib/api';

interface Notif {
  id: number;
  title: string;
  body: string;
  type: 'order' | 'kyc_document' | 'rider' | 'system';
  sourceId: number | null;
  isRead: boolean;
  icon: string | null;
  created_at: string;
}

const CATEGORIES = [
  { key: 'all',        label: 'All' },
  { key: 'today',      label: 'Today' },
  { key: 'yesterday',  label: 'Yesterday' },
  { key: 'this_week',  label: 'This Week' },
  { key: 'last_week',  label: 'Last Week' },
  { key: 'this_month', label: 'This Month' },
];

function typeIcon(type: string) {
  if (type === 'order')        return <ShoppingBag size={14} className="text-orange-500" />;
  if (type === 'kyc_document') return <FileText size={14} className="text-blue-500" />;
  if (type === 'rider')        return <User size={14} className="text-green-500" />;
  return <Info size={14} className="text-gray-400" />;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'Just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)   return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function NotificationBell() {
  const [open,        setOpen]        = useState(false);
  const [notifs,      setNotifs]      = useState<Notif[]>([]);
  const [unread,      setUnread]      = useState(0);
  const [category,    setCategory]    = useState('all');
  const [loading,     setLoading]     = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetch = useCallback(async (cat = category) => {
    setLoading(true);
    try {
      const params = cat !== 'all' ? `?category=${cat}` : '';
      const { data } = await api.get(`/api/admin/admin-notifications${params}`);
      setNotifs(data.notifications ?? []);
      setUnread(data.unreadCount ?? 0);
    } catch { /* ignore */ }
    setLoading(false);
  }, [category]);

  // Poll every 30s for new notifications
  useEffect(() => {
    fetch();
    const id = setInterval(() => fetch(), 30000);
    return () => clearInterval(id);
  }, [fetch]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = async (id: number) => {
    await api.patch(`/api/admin/admin-notifications/${id}/read`);
    setNotifs(n => n.map(x => x.id === id ? { ...x, isRead: true } : x));
    setUnread(u => Math.max(0, u - 1));
  };

  const markReadAll = async () => {
    await api.patch('/api/admin/admin-notifications/read-all');
    setNotifs(n => n.map(x => ({ ...x, isRead: true })));
    setUnread(0);
  };

  const remove = async (id: number) => {
    await api.delete(`/api/admin/admin-notifications/${id}`);
    const removed = notifs.find(x => x.id === id);
    setNotifs(n => n.filter(x => x.id !== id));
    if (removed && !removed.isRead) setUnread(u => Math.max(0, u - 1));
  };

  const removeAll = async () => {
    await api.delete('/api/admin/admin-notifications');
    setNotifs([]);
    setUnread(0);
  };

  const changeCategory = (cat: string) => {
    setCategory(cat);
    fetch(cat);
  };

  return (
    <div className="relative" ref={ref}>
      {/* Bell Button */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetch(); }}
        className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
      >
        <Bell size={18} className="text-slate-600" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-11 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden"
             style={{ maxHeight: '80vh' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-orange-500" />
              <span className="font-inter font-bold text-slate-800 text-sm">Notifications</span>
              {unread > 0 && (
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{unread} new</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button onClick={markReadAll} title="Mark all read"
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-green-600 transition-colors">
                  <CheckCheck size={15} />
                </button>
              )}
              {notifs.length > 0 && (
                <button onClick={removeAll} title="Clear all"
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-red-500 transition-colors">
                  <Trash2 size={15} />
                </button>
              )}
              <button onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-1 px-3 py-2 border-b border-slate-100 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map(c => (
              <button key={c.key} onClick={() => changeCategory(c.key)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-inter font-semibold transition-colors ${
                  category === c.key
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {c.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <Bell size={32} className="text-slate-200 mb-2" />
                <p className="text-sm font-inter font-semibold text-slate-400">No notifications</p>
                <p className="text-xs text-slate-300 mt-0.5">You're all caught up!</p>
              </div>
            ) : (
              notifs.map(n => (
                <div key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors group ${!n.isRead ? 'bg-orange-50/40' : ''}`}>
                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${!n.isRead ? 'bg-orange-100' : 'bg-slate-100'}`}>
                    {n.icon ? <span className="text-sm">{n.icon}</span> : typeIcon(n.type)}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!n.isRead ? 'font-semibold text-slate-800' : 'font-medium text-slate-700'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {/* Actions */}
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {!n.isRead && (
                      <button onClick={() => markRead(n.id)} title="Mark read"
                        className="w-6 h-6 rounded-lg bg-green-50 hover:bg-green-100 flex items-center justify-center text-green-600 transition-colors">
                        <Check size={11} />
                      </button>
                    )}
                    <button onClick={() => remove(n.id)} title="Remove"
                      className="w-6 h-6 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-400 transition-colors">
                      <X size={11} />
                    </button>
                  </div>
                  {/* Unread dot */}
                  {!n.isRead && (
                    <div className="w-2 h-2 bg-orange-500 rounded-full shrink-0 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
