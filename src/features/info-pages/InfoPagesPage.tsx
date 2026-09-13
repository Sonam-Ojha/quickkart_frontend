import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { infoPageApi, InfoPage, InfoSection } from './api';
import { PageHeader } from '../../components/common/PageHeader';

const SLUGS = ['privacy-policy', 'terms-of-service', 'about-us', 'refund-policy', 'shipping-policy'];

function SectionEditor({
  sections, onChange,
}: { sections: InfoSection[]; onChange: (s: InfoSection[]) => void }) {
  const add    = () => onChange([...sections, { heading: '', body: '' }]);
  const remove = (i: number) => onChange(sections.filter((_, j) => j !== i));
  const update = (i: number, field: keyof InfoSection, val: string) => {
    const next = sections.map((s, j) => j === i ? { ...s, [field]: val } : s);
    onChange(next);
  };
  const move = (i: number, dir: -1 | 1) => {
    const next = [...sections];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3">
      {sections.map((s, i) => (
        <div key={i} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Section {i + 1}</span>
            <div className="flex gap-1">
              {i > 0 && <button type="button" onClick={() => move(i, -1)} className="p-1 text-slate-400 hover:text-slate-600"><ChevronUp size={14} /></button>}
              {i < sections.length - 1 && <button type="button" onClick={() => move(i, 1)} className="p-1 text-slate-400 hover:text-slate-600"><ChevronDown size={14} /></button>}
              <button type="button" onClick={() => remove(i)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
            </div>
          </div>
          <input
            className="w-full border border-slate-200 rounded px-2 py-1 text-sm mb-2"
            placeholder="Section heading"
            value={s.heading}
            onChange={e => update(i, 'heading', e.target.value)}
          />
          <textarea
            className="w-full border border-slate-200 rounded px-2 py-1 text-sm resize-none"
            rows={4}
            placeholder="Section body"
            value={s.body}
            onChange={e => update(i, 'body', e.target.value)}
          />
        </div>
      ))}
      <button type="button" onClick={add} className="text-sm text-indigo-600 hover:underline text-left">+ Add section</button>
    </div>
  );
}

function Modal({ page, onClose, onSave }: { page: Partial<InfoPage> | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState<Partial<InfoPage>>(page ?? { slug: '', title: '', subtitle: '', sections: [], isActive: true });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.slug || !form.title) return alert('Slug and title required');
    setSaving(true);
    try {
      if (form.id) await infoPageApi.update(form.id, form);
      else await infoPageApi.create(form);
      onSave();
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-4">
        <h2 className="text-lg font-semibold">{form.id ? 'Edit Page' : 'New Page'}</h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Slug *</label>
            <select className="w-full border border-slate-200 rounded px-2 py-2 text-sm"
              value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}>
              <option value="">Select slug</option>
              {SLUGS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Title *</label>
            <input className="w-full border border-slate-200 rounded px-2 py-2 text-sm"
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Subtitle</label>
          <input className="w-full border border-slate-200 rounded px-2 py-2 text-sm"
            value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 mb-2 block">Sections</label>
          <SectionEditor sections={form.sections ?? []} onChange={s => setForm(f => ({ ...f, sections: s }))} />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="active" checked={form.isActive ?? true}
            onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
          <label htmlFor="active" className="text-sm">Active</label>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InfoPagesPage() {
  const [pages, setPages]   = useState<InfoPage[]>([]);
  const [editing, setEditing] = useState<Partial<InfoPage> | null | false>(false);

  const load = () => infoPageApi.list().then(setPages);
  useEffect(() => { load(); }, []);

  const remove = async (id: number) => {
    if (!confirm('Delete this page?')) return;
    await infoPageApi.remove(id);
    load();
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Info Pages"
        subtitle="Manage Privacy Policy, Terms of Service, and other static pages"
        action={
          <button onClick={() => setEditing({})} className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm px-3 py-2 rounded-lg">
            <Plus size={15} /> New Page
          </button>
        }
      />

      <div className="mt-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Slug</th>
              <th className="px-4 py-3 text-left">Sections</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pages.map(p => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{p.title}</td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{p.slug}</td>
                <td className="px-4 py-3 text-slate-500">{p.sections?.length ?? 0}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditing(p)} className="p-1.5 text-slate-400 hover:text-indigo-600"><Pencil size={14} /></button>
                    <button onClick={() => remove(p.id)} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {pages.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No pages yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing !== false && (
        <Modal page={editing} onClose={() => setEditing(false)} onSave={() => { setEditing(false); load(); }} />
      )}
    </div>
  );
}
