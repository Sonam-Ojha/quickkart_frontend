import React, { useState } from 'react';
import { Bell, Send, Clock } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

export function NotificationComposer() {
  const [title, setTitle]         = useState('');
  const [body, setBody]           = useState('');
  const [segment, setSegment]     = useState('all');
  const [scheduled, setScheduled] = useState(false);

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Push Notifications"
        subtitle="Send notifications to app users via FCM"
        breadcrumbs={[{ label: 'Home' }, { label: 'Notifications' }]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Form */}
        <div className="lg:col-span-3 space-y-4">
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
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 sticky top-4">
            <h3 className="font-semibold text-slate-800 mb-4 text-sm">Preview</h3>
            <div className="bg-[#1C1C1E] rounded-3xl p-4 min-h-48">
              {(title || body) ? (
                <div className="bg-white/10 backdrop-blur rounded-2xl p-3.5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg bg-[#EA580C] flex items-center justify-center">
                      <Bell size={10} className="text-white" />
                    </div>
                    <span className="text-white/60 text-[10px]">Jhatpats · now</span>
                  </div>
                  <div className="text-white text-sm font-semibold leading-snug">{title || 'Notification title'}</div>
                  {body && <div className="text-white/70 text-xs mt-1 leading-relaxed">{body.slice(0, 80)}{body.length > 80 ? '...' : ''}</div>}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-white/20 text-xs">
                  Preview appears here
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
