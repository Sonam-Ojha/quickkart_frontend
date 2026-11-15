import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PartnerRestaurantPage } from './PartnerRestaurantPage';
import { Store, BellRing, Bell, BellOff, Check, Play, Volume1, Volume2, VolumeX, Repeat, MonitorSmartphone, Info } from 'lucide-react';
import { TONES, usePartnerSettings, playTone, unlockAudio, audioReady } from './sounds';

const REPEAT_OPTIONS = [
  { secs: 0,  label: 'Once' },
  { secs: 4,  label: 'Every 4 sec' },
  { secs: 10, label: 'Every 10 sec' },
  { secs: 30, label: 'Every 30 sec' },
];

const TABS = [
  { key: 'restaurant', label: 'Restaurant profile', icon: Store },
  { key: 'alerts',     label: 'Order alerts & sound', icon: BellRing },
] as const;

/** Settings: the restaurant's public profile, and per-browser order alerts. */
export function PartnerSettingsPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'alerts' ? 'alerts' : 'restaurant';
  return (
    <div>
      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 mb-5 w-full sm:w-fit overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setParams(t.key === 'restaurant' ? {} : { tab: t.key }, { replace: true })}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
              tab === t.key ? 'bg-[#EA580C] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>
      {tab === 'restaurant' ? <PartnerRestaurantPage /> : <AlertSettings />}
    </div>
  );
}

/** Per-browser settings for new-order alerts: tone, volume, repeat, pop-up. */
function AlertSettings() {
  const s = usePartnerSettings();
  const [playing, setPlaying] = useState<string | null>(null);

  const preview = async (id: string, volume = s.volume) => {
    await unlockAudio();
    playTone(id, volume);
    setPlaying(id);
    setTimeout(() => setPlaying(p => (p === id ? null : p)), 1200);
  };
  const pick = (id: string) => { s.set({ tone: id }); preview(id); };

  const VolIcon = s.volume === 0 ? VolumeX : s.volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
      {/* Tone picker */}
      <section className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-slate-900">New order tone</h3>
            <p className="text-xs text-slate-500">Tap a tone to hear it and pick it.</p>
          </div>
          <Toggle
            on={s.soundOn}
            onChange={async (on) => { s.set({ soundOn: on }); if (on) preview(s.tone); }}
            labelOn="Sound on" labelOff="Sound off" iconOn={Bell} iconOff={BellOff}
          />
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-3 ${s.soundOn ? '' : 'opacity-50'}`}>
          {TONES.map(t => {
            const selected = s.tone === t.id;
            return (
              <button key={t.id} onClick={() => pick(t.id)}
                className={`relative text-left flex items-center gap-3 rounded-xl border-2 p-3.5 transition-all ${
                  selected ? 'border-[#EA580C] bg-orange-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  selected ? 'bg-[#EA580C] text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {playing === t.id ? <Wave /> : <Play size={16} className="ml-0.5" />}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold text-slate-900 text-sm">{t.name}</span>
                  <span className="block text-xs text-slate-500 truncate">{t.hint}</span>
                </span>
                {selected && <span className="w-5 h-5 rounded-full bg-[#EA580C] text-white flex items-center justify-center"><Check size={12} strokeWidth={3} /></span>}
              </button>
            );
          })}
        </div>
      </section>

      <div className="space-y-4">
        {/* Volume */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 mb-3">Volume</h3>
          <div className="flex items-center gap-3">
            <VolIcon size={18} className="text-slate-500 shrink-0" />
            <input type="range" min={0} max={100} step={5} value={Math.round(s.volume * 100)}
              onChange={e => s.set({ volume: Number(e.target.value) / 100 })}
              onPointerUp={() => preview(s.tone)} onKeyUp={() => preview(s.tone)}
              className="flex-1 accent-[#EA580C] h-2" />
            <span className="w-10 text-right text-sm font-semibold text-slate-700">{Math.round(s.volume * 100)}%</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Also keep the computer / phone volume up.</p>
        </section>

        {/* Repeat */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Repeat size={16} className="text-slate-500" />
            <h3 className="font-bold text-slate-900">Keep ringing</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {REPEAT_OPTIONS.map(o => (
              <button key={o.secs} onClick={() => s.set({ repeatSecs: o.secs })}
                className={`h-10 rounded-lg text-sm font-semibold border ${
                  s.repeatSecs === o.secs ? 'bg-[#0F1923] border-[#0F1923] text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                {o.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">Rings until you accept or reject the order.</p>
        </section>

        {/* Pop-up */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <MonitorSmartphone size={16} className="text-slate-500 mt-0.5" />
              <div>
                <h3 className="font-bold text-slate-900">New order pop-up</h3>
                <p className="text-xs text-slate-500">Big window with Accept / Reject when an order comes in.</p>
              </div>
            </div>
            <Toggle on={s.popup} onChange={on => s.set({ popup: on })} />
          </div>
        </section>

        <div className="flex gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">
          <Info size={14} className="shrink-0 mt-0.5" />
          <span>
            These settings are saved on this device / browser only.
            {!audioReady() && s.soundOn && ' After reloading the page, tap anywhere once so the browser allows sound.'}
          </span>
        </div>
      </div>
    </div>
  );
}

function Switch({ on }: { on: boolean }) {
  return (
    <span className={`relative inline-block w-11 h-6 rounded-full shrink-0 transition-colors ${on ? 'bg-green-600' : 'bg-slate-300'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0'}`} />
    </span>
  );
}

function Toggle({ on, onChange, labelOn, labelOff, iconOn: IconOn, iconOff: IconOff }: {
  on: boolean; onChange: (on: boolean) => void;
  labelOn?: string; labelOff?: string; iconOn?: React.ElementType; iconOff?: React.ElementType;
}) {
  const Icon = on ? IconOn : IconOff;
  if (!labelOn) {
    return (
      <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="shrink-0">
        <Switch on={on} />
      </button>
    );
  }
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)}
      className={`flex items-center gap-2 rounded-full pl-3 pr-1 py-1 text-xs font-bold border shrink-0 whitespace-nowrap ${
        on ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
      {Icon && <Icon size={14} />}
      {on ? labelOn : labelOff}
      <Switch on={on} />
    </button>
  );
}

function Wave() {
  return (
    <span className="flex items-end gap-0.5 h-4">
      {[0, 150, 300].map(d => (
        <span key={d} className="w-1 bg-current rounded-full animate-bounce" style={{ height: '100%', animationDelay: `${d}ms` }} />
      ))}
    </span>
  );
}
