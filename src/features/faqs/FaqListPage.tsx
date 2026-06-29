import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Loader2, AlertCircle, X, HelpCircle, GripVertical } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { faqApi, Faq, FaqPayload } from './api';

const PAGE_OPTIONS = [
  { value: 'print',   label: '🖨️ QuickPrints Page' },
  { value: 'general', label: '🏠 General / Home'    },
  { value: 'orders',  label: '📦 Orders Page'       },
];

// ── Modal ────────────────────────────────────────────────

function FaqModal({ faq, onClose, onSave }: { faq?: Faq | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState<FaqPayload>({
    question:  faq?.question  ?? '',
    answer:    faq?.answer    ?? '',
    page:      faq?.page      ?? 'print',
    sortOrder: faq?.sortOrder ?? 0,
    isActive:  faq?.isActive  ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (k: keyof FaqPayload, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.question.trim()) { setError('Question is required'); return; }
    if (!form.answer.trim())   { setError('Answer is required'); return; }
    setSaving(true); setError('');
    try {
      faq ? await faqApi.update(faq.id, form) : await faqApi.create(form);
      onSave();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Something went wrong');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="font-semibold text-slate-800">{faq ? 'Edit FAQ' : 'Add FAQ'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
              <AlertCircle size={14} />{error}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Page *</label>
            <select
              value={form.page}
              onChange={e => set('page', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
            >
              {PAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Question *</label>
            <Input
              value={form.question}
              onChange={e => set('question', e.target.value)}
              placeholder="e.g. How long does delivery take?"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Answer *</label>
            <textarea
              value={form.answer}
              onChange={e => set('answer', e.target.value)}
              placeholder="Write the answer here..."
              rows={4}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Sort Order</label>
            <Input
              type="number"
              min="0"
              value={form.sortOrder ?? 0}
              onChange={e => set('sortOrder', Number(e.target.value))}
            />
            <p className="text-xs text-slate-400 mt-1">Lower number = shown first</p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive ?? true} onChange={e => set('isActive', e.target.checked)} className="accent-[#EA580C]" />
            <span className="text-sm text-slate-600">Active (visible on customer site)</span>
          </label>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin" />}
              {faq ? 'Save Changes' : 'Add FAQ'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────

export function FaqListPage() {
  const [faqs, setFaqs]       = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [filterPage, setFilterPage] = useState('print');
  const [modal, setModal]     = useState<{ open: boolean; faq?: Faq | null }>({ open: false });
  const [toggling, setToggling] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = async () => {
    setLoading(true); setError('');
    try { setFaqs(await faqApi.getAll(filterPage)); }
    catch (err: any) { setError(err?.response?.data?.message ?? 'Failed to load FAQs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterPage]);

  const handleToggle = async (faq: Faq) => {
    setToggling(faq.id);
    try {
      const updated = await faqApi.toggle(faq.id);
      setFaqs(prev => prev.map(f => f.id === faq.id ? updated : f));
    } catch {}
    finally { setToggling(null); }
  };

  const handleDelete = async (faq: Faq) => {
    if (!confirm(`Delete this FAQ?\n"${faq.question}"`)) return;
    setDeleting(faq.id);
    try { await faqApi.remove(faq.id); setFaqs(prev => prev.filter(f => f.id !== faq.id)); }
    catch (err: any) { setError(err?.response?.data?.message ?? 'Delete failed'); }
    finally { setDeleting(null); }
  };

  const activeCount = faqs.filter(f => f.isActive).length;

  return (
    <div>
      <PageHeader
        title="FAQs"
        subtitle={loading ? 'Loading...' : `${activeCount} active / ${faqs.length} total`}
        breadcrumbs={[{ label: 'Home' }, { label: 'FAQs' }]}
        action={
          <Button size="sm" onClick={() => setModal({ open: true, faq: null })}>
            <Plus size={14} /> Add FAQ
          </Button>
        }
      />

      {/* Page filter tabs */}
      <div className="flex gap-2 mb-6">
        {PAGE_OPTIONS.map(o => (
          <button
            key={o.value}
            onClick={() => setFilterPage(o.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterPage === o.value
                ? 'bg-orange-500 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-orange-300'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          <AlertCircle size={14} />{error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 size={24} className="animate-spin mr-2" /> Loading FAQs...
        </div>
      ) : faqs.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <HelpCircle size={40} className="mx-auto mb-3 text-slate-200" />
          <p className="font-medium">No FAQs yet for this page</p>
          <p className="text-sm mt-1">Click "Add FAQ" to create one</p>
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={faq.id}
              className={`bg-white rounded-xl border p-4 flex items-start gap-4 hover:shadow-sm transition-all ${
                faq.isActive ? 'border-slate-100' : 'border-slate-100 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2 shrink-0 text-slate-300 mt-1">
                <GripVertical size={14} />
                <span className="text-xs font-mono text-slate-400">#{idx + 1}</span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-sm">{faq.question}</p>
                <p className="text-slate-500 text-sm mt-1 leading-relaxed line-clamp-2">{faq.answer}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggle(faq)}
                  disabled={toggling === faq.id}
                  className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                    faq.isActive
                      ? 'bg-green-50 text-green-700 hover:bg-green-100'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {toggling === faq.id ? <Loader2 size={11} className="animate-spin" /> : faq.isActive ? <Eye size={11} /> : <EyeOff size={11} />}
                  {faq.isActive ? 'Live' : 'Hidden'}
                </button>
                <button
                  onClick={() => setModal({ open: true, faq })}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(faq)}
                  disabled={deleting === faq.id}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40"
                >
                  {deleting === faq.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.open && (
        <FaqModal
          faq={modal.faq}
          onClose={() => setModal({ open: false })}
          onSave={() => { setModal({ open: false }); load(); }}
        />
      )}
    </div>
  );
}
