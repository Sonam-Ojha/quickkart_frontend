import React, { useState } from 'react';
import {
  Bell, Send, Clock, Signal, Wifi, BatteryFull, Lock, Flashlight, Camera,
  Menu, Search, Star, Pencil, Mic, ChevronRight,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

type Channel = 'push' | 'email' | 'sms';

const PHONE_FONT = { fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' };

// ── Reusable iPhone bezel — status bar + dynamic island only; screen content is passed as children ──
function PhoneFrame({
  statusBarClass,
  background,
  children,
}: {
  statusBarClass: string;
  background: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-[300px] select-none" style={PHONE_FONT}>
      {/* Titanium-look outer edge */}
      <div className="relative rounded-[3.4rem] p-[3.5px] bg-gradient-to-br from-[#7a7a7d] via-[#3a3a3c] to-[#161618] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)]">
        {/* Black inner bezel */}
        <div className="relative bg-black rounded-[3.25rem] p-[10px]">
          {/* Side buttons (subtle 3D via gradient) */}
          <div className="absolute -left-[2px] top-[100px] w-[2.5px] h-6 bg-gradient-to-b from-[#8a8a8d] via-[#4a4a4c] to-[#2b2b2d] rounded-l-sm" />
          <div className="absolute -left-[2px] top-[136px] w-[2.5px] h-11 bg-gradient-to-b from-[#8a8a8d] via-[#4a4a4c] to-[#2b2b2d] rounded-l-sm" />
          <div className="absolute -left-[2px] top-[182px] w-[2.5px] h-11 bg-gradient-to-b from-[#8a8a8d] via-[#4a4a4c] to-[#2b2b2d] rounded-l-sm" />
          <div className="absolute -right-[2px] top-[155px] w-[2.5px] h-14 bg-gradient-to-b from-[#8a8a8d] via-[#4a4a4c] to-[#2b2b2d] rounded-r-sm" />

          {/* Screen */}
          <div className="relative flex flex-col aspect-[9/19.5] rounded-[2.75rem] overflow-hidden ring-1 ring-white/10" style={background}>
            {/* Glass glare */}
            <div
              className="pointer-events-none absolute inset-0 z-30"
              style={{ backgroundImage: 'linear-gradient(115deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 22%)' }}
            />

            {/* Dynamic island */}
            <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[100px] h-[28px] bg-black rounded-full z-20 flex items-center justify-end pr-2.5 shadow-[inset_0_0_2px_rgba(255,255,255,0.15)]">
              <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#1a1a2e] to-black ring-[0.5px] ring-white/20" />
            </div>

            {/* Status bar */}
            <div className={`relative z-10 flex items-center justify-between px-7 pt-3.5 text-[13px] font-semibold tracking-tight ${statusBarClass}`}>
              <span>9:41</span>
              <div className="flex items-center gap-1.5">
                <Signal size={13} strokeWidth={2.5} />
                <Wifi size={14} strokeWidth={2.5} />
                <BatteryFull size={19} strokeWidth={2} />
              </div>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Push notification — iOS lock screen ──────────────────────────────────────
function PushPreview({ title, body }: { title: string; body: string }) {
  return (
    <PhoneFrame
      statusBarClass="text-white"
      background={{
        backgroundImage:
          'radial-gradient(circle at 18% 15%, rgba(255,255,255,0.20), transparent 42%),' +
          'radial-gradient(circle at 85% 12%, rgba(255,171,102,0.35), transparent 45%),' +
          'radial-gradient(circle at 75% 80%, rgba(120,140,255,0.30), transparent 50%),' +
          'radial-gradient(circle at 15% 85%, rgba(255,120,160,0.22), transparent 45%),' +
          'linear-gradient(160deg, #3a3d6b 0%, #22223f 45%, #0c0c1a 100%)',
      }}
    >
      {/* Middle: lock icon + clock + notification */}
      <div className="relative z-10 flex-1 flex flex-col items-center pt-3">
        <Lock size={14} className="text-white/85" strokeWidth={2.25} />
        <div className="text-center mt-2 mb-5">
          <div className="text-white text-[58px] font-semibold leading-none tracking-tight">9:41</div>
          <div className="text-white/80 text-[13px] mt-2 font-medium">Monday, 17 August</div>
        </div>

        <div className="w-full px-3.5">
          {(title || body) ? (
            <div className="bg-white/15 backdrop-blur-xl rounded-2xl p-3.5 border border-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-[#EA580C] flex items-center justify-center shadow-sm">
                  <Bell size={10} className="text-white" />
                </div>
                <span className="text-white/60 text-[10px]">Jhatpats · now</span>
              </div>
              <div className="text-white text-sm font-semibold leading-snug">{title || 'Notification title'}</div>
              {body && <div className="text-white/70 text-xs mt-1 leading-relaxed">{body.slice(0, 80)}{body.length > 80 ? '...' : ''}</div>}
            </div>
          ) : (
            <div className="text-center text-white/25 text-xs mt-6">
              Preview appears here
            </div>
          )}
        </div>
      </div>

      {/* Bottom: flashlight / camera shortcuts + home indicator */}
      <div className="relative z-10 pb-2.5">
        <div className="flex justify-between px-8 mb-5">
          <div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-xl flex items-center justify-center ring-1 ring-white/10">
            <Flashlight size={17} className="text-white" strokeWidth={2} />
          </div>
          <div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-xl flex items-center justify-center ring-1 ring-white/10">
            <Camera size={17} className="text-white" strokeWidth={2} />
          </div>
        </div>
        <div className="flex justify-center">
          <div className="w-[130px] h-[5px] bg-white/85 rounded-full" />
        </div>
      </div>
    </PhoneFrame>
  );
}

// ── Email — Gmail inbox app ───────────────────────────────────────────────────
function EmailPreview({ title, body }: { title: string; body: string }) {
  return (
    <PhoneFrame statusBarClass="text-black" background={{ backgroundColor: '#ffffff' }}>
      {/* Gmail top bar */}
      <div className="relative z-10 flex items-center gap-3 px-4 pt-3 pb-3">
        <Menu size={18} className="text-slate-600" />
        <div className="flex-1 h-8 rounded-full bg-slate-100 flex items-center px-3 gap-2 text-slate-400 text-[11px]">
          <Search size={12} /> Search in mail
        </div>
        <div className="w-7 h-7 rounded-full bg-slate-300 shrink-0" />
      </div>

      {/* Inbox list */}
      <div className="relative z-10 flex-1 overflow-hidden">
        {/* Our notification — unread row */}
        <div className="flex items-start gap-2.5 px-4 py-3 bg-white">
          <div className="w-9 h-9 rounded-full bg-[#EA580C] flex items-center justify-center text-white text-xs font-bold shrink-0">J</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-black text-[13px] font-bold truncate">Jhatpats</span>
              <span className="text-slate-400 text-[10px] shrink-0">9:41 AM</span>
            </div>
            {(title || body) ? (
              <>
                <div className="text-black text-[12px] font-semibold truncate">{title || 'Notification title'}</div>
                {body && <div className="text-slate-500 text-[12px] truncate">{body}</div>}
              </>
            ) : (
              <div className="text-slate-300 text-[12px] mt-0.5">Preview appears here</div>
            )}
          </div>
          <Star size={14} className="text-slate-300 mt-0.5 shrink-0" />
        </div>

        {/* Faux muted rows for inbox depth */}
        {[0, 1, 2].map(i => (
          <div key={i} className="flex items-start gap-2.5 px-4 py-3 border-t border-slate-100 opacity-40">
            <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0" />
            <div className="flex-1 min-w-0 space-y-1.5 pt-0.5">
              <div className="h-2 w-20 bg-slate-200 rounded" />
              <div className="h-2 w-32 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Compose FAB */}
      <div className="absolute bottom-9 right-4 z-10 w-12 h-12 rounded-full bg-[#EA580C] shadow-lg flex items-center justify-center">
        <Pencil size={18} className="text-white" />
      </div>

      {/* Home indicator */}
      <div className="relative z-10 flex justify-center pb-2.5 pt-2">
        <div className="w-[130px] h-[5px] bg-black/70 rounded-full" />
      </div>
    </PhoneFrame>
  );
}

// ── SMS — iMessage-style thread ───────────────────────────────────────────────
function SmsPreview({ title, body }: { title: string; body: string }) {
  return (
    <PhoneFrame statusBarClass="text-black" background={{ backgroundColor: '#ffffff' }}>
      {/* Messages header */}
      <div className="relative z-10 flex flex-col items-center pt-3 pb-3 border-b border-slate-100">
        <div className="w-9 h-9 rounded-full bg-slate-300 flex items-center justify-center text-slate-600 font-semibold text-sm mb-1">J</div>
        <div className="text-black text-[13px] font-semibold flex items-center gap-0.5">
          JHATPATS <ChevronRight size={12} className="text-slate-400" />
        </div>
        <div className="text-slate-400 text-[10px]">Text Message</div>
      </div>

      {/* Chat area */}
      <div className="relative z-10 flex-1 px-3 pt-4 flex flex-col justify-end">
        <div className="text-center text-slate-400 text-[10px] mb-3">Today 9:41 AM</div>
        {(title || body) ? (
          <div className="self-start max-w-[80%] bg-slate-200 rounded-2xl rounded-bl-sm px-3.5 py-2.5">
            {title && <div className="text-black text-sm font-semibold leading-snug">{title}</div>}
            {body && <div className="text-black text-sm leading-snug mt-0.5">{body}</div>}
          </div>
        ) : (
          <div className="text-center text-slate-300 text-xs mb-6">Preview appears here</div>
        )}
      </div>

      {/* Input bar */}
      <div className="relative z-10 px-3 pb-2 pt-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
            <Camera size={14} className="text-slate-500" />
          </div>
          <div className="flex-1 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center px-3 text-slate-400 text-xs">
            Text Message
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
            <Mic size={14} className="text-slate-500" />
          </div>
        </div>
        <div className="flex justify-center">
          <div className="w-[130px] h-[5px] bg-black/70 rounded-full" />
        </div>
      </div>
    </PhoneFrame>
  );
}

export function NotificationComposer() {
  const [title, setTitle]         = useState('');
  const [body, setBody]           = useState('');
  const [segment, setSegment]     = useState('all');
  const [scheduled, setScheduled] = useState(false);
  const [channel, setChannel]     = useState<Channel>('push');

  return (
    <div>
      <PageHeader
        title="Push Notifications"
        subtitle="Send notifications to app users via FCM"
        breadcrumbs={[{ label: 'Home' }, { label: 'Notifications' }]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Form */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Compose Message</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Title *</label>
                <Input placeholder="Notification title" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Message *</label>
                <textarea
                  rows={4}
                  placeholder="Write your message here..."
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:border-transparent resize-none placeholder:text-slate-400"
                />
                <div className="text-xs text-slate-400 mt-1">{body.length}/160 characters</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Target Segment</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'all',      label: 'All Users' },
                    { value: 'active',   label: 'Active (7d)' },
                    { value: 'inactive', label: 'Inactive' },
                  ].map(s => (
                    <button
                      key={s.value}
                      onClick={() => setSegment(s.value)}
                      className={`p-3 rounded-xl border text-left transition-colors ${
                        segment === s.value ? 'border-[#EA580C] bg-orange-50' : 'border-slate-200 hover:border-orange-200'
                      }`}
                    >
                      <div className={`text-xs font-semibold ${segment === s.value ? 'text-[#EA580C]' : 'text-slate-700'}`}>{s.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Deep Link (optional)</label>
                <Input placeholder="jhatpats://offers/..." />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={scheduled}
                  onChange={e => setScheduled(e.target.checked)}
                  className="accent-[#EA580C]"
                  id="schedule"
                />
                <label htmlFor="schedule" className="text-sm text-slate-700 cursor-pointer">Schedule for later</label>
              </div>
              {scheduled && <Input type="datetime-local" className="mt-2" />}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1">
              <Clock size={14} /> Save Draft
            </Button>
            <Button className="flex-1" disabled={!title || !body}>
              <Send size={14} /> Send Now
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 sticky top-4">
            <h3 className="font-semibold text-slate-800 mb-4 text-sm">Preview</h3>

            {/* Channel tabs */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { value: 'push' as Channel,  label: 'Push' },
                { value: 'email' as Channel, label: 'Email' },
                { value: 'sms' as Channel,   label: 'SMS' },
              ].map(c => (
                <button
                  key={c.value}
                  onClick={() => setChannel(c.value)}
                  className={`py-2 rounded-xl border text-xs font-semibold transition-colors ${
                    channel === c.value ? 'border-[#EA580C] bg-orange-50 text-[#EA580C]' : 'border-slate-200 text-slate-500 hover:border-orange-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {channel === 'push'  && <PushPreview  title={title} body={body} />}
            {channel === 'email' && <EmailPreview title={title} body={body} />}
            {channel === 'sms'   && <SmsPreview   title={title} body={body} />}
          </div>
        </div>
      </div>
    </div>
  );
}
