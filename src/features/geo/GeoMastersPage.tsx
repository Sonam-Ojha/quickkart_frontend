import { useState, useEffect } from 'react';
import { Plus, Edit2, Globe, MapPin, Building2, Store, ToggleLeft, ToggleRight, X, Loader2, AlertCircle, Trash2, Package } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import api from '../../lib/api';

// ─── Types ────────────────────────────────────────────────
interface Country { id: number; name: string; code: string; isActive: boolean }
interface State   { id: number; countryId: number; name: string; code: string; isActive: boolean; country?: Country }
interface City    { id: number; stateId: number; name: string; isActive: boolean; state?: State & { country?: Country } }
interface DarkStore {
  id: number; name: string; address: string; city: string;
  cityId: number | null; lat: number | null; lng: number | null;
  radius: number; isActive: boolean;
  cityMaster?: { name: string; state?: { name: string } };
}

type Tab = 'countries' | 'states' | 'cities' | 'stores';

// ─── Shared bits ────────────────────────────────────────────
function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${active ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

const selectClass = 'border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition';
const iconBtnClass = 'p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors';
const labelClass = 'text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block';

function TableShell({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">{children}</div>;
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th className={`px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide ${right ? 'text-right' : 'text-left'}`}>{children}</th>;
}

function LoadingRow() {
  return (
    <div className="flex items-center justify-center py-16 text-slate-400">
      <Loader2 size={22} className="animate-spin mr-2" /> Loading…
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="text-center py-16 text-slate-400">
      <Package size={36} className="mx-auto mb-3 text-slate-200" />
      <p className="font-medium text-sm">{text}</p>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────
function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className={`bg-white rounded-2xl shadow-xl w-full ${wide ? 'max-w-xl' : 'max-w-md'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 text-lg">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Countries Tab ────────────────────────────────────────
function CountriesTab() {
  const [rows, setRows]     = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState<null | 'add' | Country>(null);
  const [form, setForm]     = useState({ name: '', code: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const load = () => {
    setLoading(true);
    api.get('/api/admin/geo/countries').then(r => setRows(r.data.countries)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openAdd  = () => { setForm({ name: '', code: '' }); setError(''); setModal('add'); };
  const openEdit = (c: Country) => { setForm({ name: c.name, code: c.code }); setError(''); setModal(c); };

  const save = async () => {
    if (!form.name || !form.code) { setError('Name and code are required'); return; }
    setSaving(true); setError('');
    try {
      if (modal === 'add') await api.post('/api/admin/geo/countries', form);
      else                 await api.put(`/api/admin/geo/countries/${(modal as Country).id}`, form);
      setModal(null); load();
    } catch (e: any) { setError(e?.response?.data?.message ?? 'Save failed'); }
    finally { setSaving(false); }
  };

  const toggle = async (c: Country) => {
    await api.patch(`/api/admin/geo/countries/${c.id}/toggle`);
    load();
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={openAdd}><Plus size={14} /> Add Country</Button>
      </div>

      {loading ? <LoadingRow /> : rows.length === 0 ? (
        <EmptyRow text="No countries added yet" />
      ) : (
        <TableShell>
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <Th>Country</Th>
                <Th>Code</Th>
                <Th>Status</Th>
                <Th right>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                  <td className="px-4 py-3 text-slate-500">{c.code}</td>
                  <td className="px-4 py-3"><ActiveBadge active={c.isActive} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => openEdit(c)} className={iconBtnClass}><Edit2 size={14} /></button>
                      <button onClick={() => toggle(c)} className={iconBtnClass} title="Toggle active">
                        {c.isActive ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      )}

      {modal !== null && (
        <Modal title={modal === 'add' ? 'Add Country' : 'Edit Country'} onClose={() => setModal(null)}>
          {error && <p className="text-red-600 text-sm mb-3 flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-lg px-3 py-2"><AlertCircle size={13} />{error}</p>}
          <div className="space-y-3">
            <div>
              <label className={labelClass}>Country Name</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="India" />
            </div>
            <div>
              <label className={labelClass}>Code (ISO)</label>
              <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="IN" maxLength={3} />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <Button variant="outline" className="flex-1" onClick={() => setModal(null)}>Cancel</Button>
            <Button className="flex-1" onClick={save} disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin" />} Save
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ─── States Tab ───────────────────────────────────────────
function StatesTab() {
  const [rows, setRows]         = useState<State[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [filterCountry, setFilterCountry] = useState('');
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState<null | 'add' | State>(null);
  const [form, setForm]         = useState({ countryId: '', name: '', code: '' });
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const load = () => {
    setLoading(true);
    const params = filterCountry ? `?countryId=${filterCountry}` : '';
    Promise.all([
      api.get(`/api/admin/geo/states${params}`),
      api.get('/api/admin/geo/countries'),
    ]).then(([sr, cr]) => {
      setRows(sr.data.states);
      setCountries(cr.data.countries);
    }).finally(() => setLoading(false));
  };
  useEffect(load, [filterCountry]);

  const openAdd  = () => { setForm({ countryId: countries[0]?.id?.toString() ?? '', name: '', code: '' }); setError(''); setModal('add'); };
  const openEdit = (s: State) => { setForm({ countryId: String(s.countryId), name: s.name, code: s.code ?? '' }); setError(''); setModal(s); };

  const save = async () => {
    if (!form.countryId || !form.name) { setError('Country and name are required'); return; }
    setSaving(true); setError('');
    try {
      if (modal === 'add') await api.post('/api/admin/geo/states', { ...form, countryId: Number(form.countryId) });
      else                 await api.put(`/api/admin/geo/states/${(modal as State).id}`, { name: form.name, code: form.code });
      setModal(null); load();
    } catch (e: any) { setError(e?.response?.data?.message ?? 'Save failed'); }
    finally { setSaving(false); }
  };

  const toggle = async (s: State) => { await api.patch(`/api/admin/geo/states/${s.id}/toggle`); load(); };

  return (
    <>
      <div className="flex items-center justify-between mb-4 gap-3">
        <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)} className={selectClass}>
          <option value="">All Countries</option>
          {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <Button size="sm" onClick={openAdd}><Plus size={14} /> Add State</Button>
      </div>

      {loading ? <LoadingRow /> : rows.length === 0 ? (
        <EmptyRow text="No states found" />
      ) : (
        <TableShell>
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <Th>State</Th>
                <Th>Code</Th>
                <Th>Country</Th>
                <Th>Status</Th>
                <Th right>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                  <td className="px-4 py-3 text-slate-500">{s.code ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{s.country?.name ?? '—'}</td>
                  <td className="px-4 py-3"><ActiveBadge active={s.isActive} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => openEdit(s)} className={iconBtnClass}><Edit2 size={14} /></button>
                      <button onClick={() => toggle(s)} className={iconBtnClass}>
                        {s.isActive ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      )}

      {modal !== null && (
        <Modal title={modal === 'add' ? 'Add State' : 'Edit State'} onClose={() => setModal(null)}>
          {error && <p className="text-red-600 text-sm mb-3 flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-lg px-3 py-2"><AlertCircle size={13} />{error}</p>}
          <div className="space-y-3">
            {modal === 'add' && (
              <div>
                <label className={labelClass}>Country</label>
                <select value={form.countryId} onChange={e => setForm(f => ({ ...f, countryId: e.target.value }))} className={`w-full ${selectClass}`}>
                  {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className={labelClass}>State Name</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Haryana" />
            </div>
            <div>
              <label className={labelClass}>State Code</label>
              <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="HR" maxLength={10} />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <Button variant="outline" className="flex-1" onClick={() => setModal(null)}>Cancel</Button>
            <Button className="flex-1" onClick={save} disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin" />} Save
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ─── Cities Tab ───────────────────────────────────────────
function CitiesTab() {
  const [rows, setRows]       = useState<City[]>([]);
  const [states, setStates]   = useState<State[]>([]);
  const [filterState, setFilterState] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState<null | 'add' | City>(null);
  const [form, setForm]       = useState({ stateId: '', name: '' });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const load = () => {
    setLoading(true);
    const params = filterState ? `?stateId=${filterState}` : '';
    Promise.all([
      api.get(`/api/admin/geo/cities${params}`),
      api.get('/api/admin/geo/states'),
    ]).then(([cr, sr]) => {
      setRows(cr.data.cities);
      setStates(sr.data.states);
    }).finally(() => setLoading(false));
  };
  useEffect(load, [filterState]);

  const openAdd  = () => { setForm({ stateId: states[0]?.id?.toString() ?? '', name: '' }); setError(''); setModal('add'); };
  const openEdit = (c: City) => { setForm({ stateId: String(c.stateId), name: c.name }); setError(''); setModal(c); };

  const save = async () => {
    if (!form.stateId || !form.name) { setError('State and city name are required'); return; }
    setSaving(true); setError('');
    try {
      if (modal === 'add') await api.post('/api/admin/geo/cities', { stateId: Number(form.stateId), name: form.name });
      else                 await api.put(`/api/admin/geo/cities/${(modal as City).id}`, { name: form.name });
      setModal(null); load();
    } catch (e: any) { setError(e?.response?.data?.message ?? 'Save failed'); }
    finally { setSaving(false); }
  };

  const toggle = async (c: City) => { await api.patch(`/api/admin/geo/cities/${c.id}/toggle`); load(); };

  return (
    <>
      <div className="flex items-center justify-between mb-4 gap-3">
        <select value={filterState} onChange={e => setFilterState(e.target.value)} className={selectClass}>
          <option value="">All States</option>
          {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <Button size="sm" onClick={openAdd}><Plus size={14} /> Add City</Button>
      </div>

      {loading ? <LoadingRow /> : rows.length === 0 ? (
        <EmptyRow text="No cities found" />
      ) : (
        <TableShell>
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <Th>City</Th>
                <Th>State</Th>
                <Th>Country</Th>
                <Th>Status</Th>
                <Th right>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                  <td className="px-4 py-3 text-slate-500">{c.state?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{c.state?.country?.name ?? '—'}</td>
                  <td className="px-4 py-3"><ActiveBadge active={c.isActive} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => openEdit(c)} className={iconBtnClass}><Edit2 size={14} /></button>
                      <button onClick={() => toggle(c)} className={iconBtnClass}>
                        {c.isActive ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      )}

      {modal !== null && (
        <Modal title={modal === 'add' ? 'Add City' : 'Edit City'} onClose={() => setModal(null)}>
          {error && <p className="text-red-600 text-sm mb-3 flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-lg px-3 py-2"><AlertCircle size={13} />{error}</p>}
          <div className="space-y-3">
            {modal === 'add' && (
              <div>
                <label className={labelClass}>State</label>
                <select value={form.stateId} onChange={e => setForm(f => ({ ...f, stateId: e.target.value }))} className={`w-full ${selectClass}`}>
                  {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className={labelClass}>City Name</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Faridabad" />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <Button variant="outline" className="flex-1" onClick={() => setModal(null)}>Cancel</Button>
            <Button className="flex-1" onClick={save} disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin" />} Save
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ─── Stores Tab ───────────────────────────────────────────
interface StoreForm {
  name: string; address: string; cityId: string;
  lat: string; lng: string; radius: string; isActive: boolean;
}
const blankStore = (): StoreForm => ({ name: '', address: '', cityId: '', lat: '', lng: '', radius: '5', isActive: true });

function StoresTab() {
  const [rows, setRows]       = useState<DarkStore[]>([]);
  const [cities, setCities]   = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState<null | 'add' | DarkStore>(null);
  const [form, setForm]       = useState<StoreForm>(blankStore());
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/api/admin/dark-stores'),
      api.get('/api/admin/geo/cities'),
    ]).then(([sr, cr]) => {
      setRows(sr.data.stores);
      setCities(cr.data.cities);
    }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openAdd = () => {
    setForm({ ...blankStore(), cityId: cities[0]?.id?.toString() ?? '' });
    setError(''); setModal('add');
  };
  const openEdit = (s: DarkStore) => {
    setForm({
      name: s.name, address: s.address,
      cityId: s.cityId ? String(s.cityId) : '',
      lat: s.lat != null ? String(s.lat) : '',
      lng: s.lng != null ? String(s.lng) : '',
      radius: String(s.radius ?? 5),
      isActive: s.isActive,
    });
    setError(''); setModal(s);
  };

  const save = async () => {
    if (!form.name || !form.address) { setError('Name and address are required'); return; }
    if (!form.lat || !form.lng)      { setError('Latitude and longitude are required'); return; }
    if (!form.cityId)                { setError('Please select a city'); return; }
    setSaving(true); setError('');
    const payload = {
      name: form.name, address: form.address,
      cityId: Number(form.cityId),
      lat: Number(form.lat), lng: Number(form.lng),
      radius: Number(form.radius) || 5,
      isActive: form.isActive,
    };
    try {
      if (modal === 'add') await api.post('/api/admin/dark-stores', payload);
      else                 await api.put(`/api/admin/dark-stores/${(modal as DarkStore).id}`, payload);
      setModal(null); load();
    } catch (e: any) { setError(e?.response?.data?.message ?? 'Save failed'); }
    finally { setSaving(false); }
  };

  const toggle = async (s: DarkStore) => {
    await api.patch(`/api/admin/dark-stores/${s.id}/toggle`);
    load();
  };

  const remove = async (id: number) => {
    setDeleting(id);
    try { await api.delete(`/api/admin/dark-stores/${id}`); load(); }
    catch (e: any) { alert(e?.response?.data?.message ?? 'Delete failed'); }
    finally { setDeleting(null); }
  };

  const cityLabel = (s: DarkStore) =>
    s.cityMaster
      ? `${s.cityMaster.name}${s.cityMaster.state ? ', ' + s.cityMaster.state.name : ''}`
      : s.city || '—';

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={openAdd}><Plus size={14} /> Add Store</Button>
      </div>

      {loading ? <LoadingRow /> : rows.length === 0 ? (
        <EmptyRow text="No stores added yet" />
      ) : (
        <TableShell>
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <Th>Store</Th>
                <Th>City / State</Th>
                <Th>Coordinates</Th>
                <Th>Radius</Th>
                <Th>Status</Th>
                <Th right>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{s.name}</p>
                    <p className="text-xs text-slate-400 truncate max-w-[180px]">{s.address}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{cityLabel(s)}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs font-mono">
                    {s.lat != null && s.lng != null ? `${Number(s.lat).toFixed(4)}, ${Number(s.lng).toFixed(4)}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-orange-50 text-orange-700 font-medium px-2 py-0.5 rounded-full">
                      {s.radius} km
                    </span>
                  </td>
                  <td className="px-4 py-3"><ActiveBadge active={s.isActive} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => openEdit(s)} className={iconBtnClass}><Edit2 size={14} /></button>
                      <button onClick={() => toggle(s)} className={iconBtnClass}>
                        {s.isActive ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} />}
                      </button>
                      <button
                        onClick={() => remove(s.id)}
                        disabled={deleting === s.id}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-500 transition-colors"
                      >
                        {deleting === s.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      )}

      {modal !== null && (
        <Modal title={modal === 'add' ? 'Add Store' : 'Edit Store'} onClose={() => setModal(null)} wide>
          {error && <p className="text-red-600 text-sm mb-4 flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-lg px-3 py-2"><AlertCircle size={13} />{error}</p>}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Store Name *</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Sector-15 Faridabad" />
              </div>
              <div>
                <label className={labelClass}>City *</label>
                <select value={form.cityId} onChange={e => setForm(f => ({ ...f, cityId: e.target.value }))} className={`w-full ${selectClass}`}>
                  <option value="">Select city...</option>
                  {cities.map(c => <option key={c.id} value={c.id}>{c.name}{c.state ? ` (${c.state.name})` : ''}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Address *</label>
              <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Full address" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Latitude *</label>
                <Input type="number" step="any" value={form.lat} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} placeholder="28.4089" />
              </div>
              <div>
                <label className={labelClass}>Longitude *</label>
                <Input type="number" step="any" value={form.lng} onChange={e => setForm(f => ({ ...f, lng: e.target.value }))} placeholder="77.3178" />
              </div>
              <div>
                <label className={labelClass}>Radius (km)</label>
                <Input type="number" step="0.1" min="0.1" value={form.radius} onChange={e => setForm(f => ({ ...f, radius: e.target.value }))} placeholder="5" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="accent-[#EA580C]" />
              <span className="text-sm text-slate-600">Active</span>
            </label>
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="outline" className="flex-1" onClick={() => setModal(null)}>Cancel</Button>
            <Button className="flex-1" onClick={save} disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin" />} Save
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────
const TABS: { key: Tab; label: string; icon: typeof Globe }[] = [
  { key: 'countries', label: 'Countries', icon: Globe },
  { key: 'states',    label: 'States',    icon: MapPin },
  { key: 'cities',    label: 'Cities',    icon: Building2 },
  { key: 'stores',    label: 'Stores',    icon: Store },
];

export default function GeoMastersPage() {
  const [tab, setTab] = useState<Tab>('countries');

  return (
    <div>
      <PageHeader
        title="Geo Masters"
        subtitle="Manage Country → State → City hierarchy for store mapping"
        breadcrumbs={[{ label: 'Home' }, { label: 'Stores & Geo' }, { label: 'Geo Masters' }]}
      />

      {/* Tab Bar */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab === key ? 'bg-[#EA580C] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-orange-200'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'countries' && <CountriesTab />}
      {tab === 'states'    && <StatesTab />}
      {tab === 'cities'    && <CitiesTab />}
      {tab === 'stores'    && <StoresTab />}
    </div>
  );
}
