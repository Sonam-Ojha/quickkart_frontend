import { useState, useEffect } from 'react';
import { Plus, Pencil, Globe, MapPin, Building2, Store, ToggleLeft, ToggleRight, X, Loader2, AlertCircle, Trash2 } from 'lucide-react';
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

// ─── Shared toggle badge ──────────────────────────────────
function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

// ─── Modal ────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold text-base">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={16} /></button>
        </div>
        <div className="p-5">{children}</div>
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
        <Button size="sm" onClick={openAdd}><Plus size={14} className="mr-1" /> Add Country</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-400" /></div>
      ) : rows.length === 0 ? (
        <p className="text-center text-gray-400 py-12">No countries added yet</p>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Country</th>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.code}</td>
                  <td className="px-4 py-3"><ActiveBadge active={c.isActive} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><Pencil size={14} /></button>
                      <button onClick={() => toggle(c)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Toggle active">
                        {c.isActive ? <ToggleRight size={16} className="text-green-500" /> : <ToggleLeft size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal !== null && (
        <Modal title={modal === 'add' ? 'Add Country' : 'Edit Country'} onClose={() => setModal(null)}>
          {error && <p className="text-red-500 text-sm mb-3 flex items-center gap-1"><AlertCircle size={13} />{error}</p>}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Country Name</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="India" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Code (ISO)</label>
              <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="IN" maxLength={3} />
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <Button variant="outline" className="flex-1" onClick={() => setModal(null)}>Cancel</Button>
            <Button className="flex-1" onClick={save} disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : null} Save
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
        <select
          value={filterCountry}
          onChange={e => setFilterCountry(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm text-gray-700 bg-white"
        >
          <option value="">All Countries</option>
          {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <Button size="sm" onClick={openAdd}><Plus size={14} className="mr-1" /> Add State</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-400" /></div>
      ) : rows.length === 0 ? (
        <p className="text-center text-gray-400 py-12">No states found</p>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">State</th>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Country</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-gray-500">{s.code ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{s.country?.name ?? '—'}</td>
                  <td className="px-4 py-3"><ActiveBadge active={s.isActive} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><Pencil size={14} /></button>
                      <button onClick={() => toggle(s)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
                        {s.isActive ? <ToggleRight size={16} className="text-green-500" /> : <ToggleLeft size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal !== null && (
        <Modal title={modal === 'add' ? 'Add State' : 'Edit State'} onClose={() => setModal(null)}>
          {error && <p className="text-red-500 text-sm mb-3 flex items-center gap-1"><AlertCircle size={13} />{error}</p>}
          <div className="space-y-3">
            {modal === 'add' && (
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Country</label>
                <select
                  value={form.countryId}
                  onChange={e => setForm(f => ({ ...f, countryId: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">State Name</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Haryana" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">State Code</label>
              <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="HR" maxLength={10} />
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <Button variant="outline" className="flex-1" onClick={() => setModal(null)}>Cancel</Button>
            <Button className="flex-1" onClick={save} disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : null} Save
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
        <select
          value={filterState}
          onChange={e => setFilterState(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm text-gray-700 bg-white"
        >
          <option value="">All States</option>
          {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <Button size="sm" onClick={openAdd}><Plus size={14} className="mr-1" /> Add City</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-400" /></div>
      ) : rows.length === 0 ? (
        <p className="text-center text-gray-400 py-12">No cities found</p>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">City</th>
                <th className="px-4 py-3 text-left">State</th>
                <th className="px-4 py-3 text-left">Country</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.state?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.state?.country?.name ?? '—'}</td>
                  <td className="px-4 py-3"><ActiveBadge active={c.isActive} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><Pencil size={14} /></button>
                      <button onClick={() => toggle(c)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
                        {c.isActive ? <ToggleRight size={16} className="text-green-500" /> : <ToggleLeft size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal !== null && (
        <Modal title={modal === 'add' ? 'Add City' : 'Edit City'} onClose={() => setModal(null)}>
          {error && <p className="text-red-500 text-sm mb-3 flex items-center gap-1"><AlertCircle size={13} />{error}</p>}
          <div className="space-y-3">
            {modal === 'add' && (
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">State</label>
                <select
                  value={form.stateId}
                  onChange={e => setForm(f => ({ ...f, stateId: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">City Name</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Faridabad" />
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <Button variant="outline" className="flex-1" onClick={() => setModal(null)}>Cancel</Button>
            <Button className="flex-1" onClick={save} disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : null} Save
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
        <Button size="sm" onClick={openAdd}><Plus size={14} className="mr-1" /> Add Store</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-400" /></div>
      ) : rows.length === 0 ? (
        <p className="text-center text-gray-400 py-12">No stores added yet</p>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Store</th>
                <th className="px-4 py-3 text-left">City / State</th>
                <th className="px-4 py-3 text-left">Coordinates</th>
                <th className="px-4 py-3 text-left">Radius</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{s.name}</p>
                    <p className="text-xs text-gray-400 truncate max-w-[180px]">{s.address}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{cityLabel(s)}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                    {s.lat != null && s.lng != null ? `${Number(s.lat).toFixed(4)}, ${Number(s.lng).toFixed(4)}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded-full">
                      {s.radius} km
                    </span>
                  </td>
                  <td className="px-4 py-3"><ActiveBadge active={s.isActive} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><Pencil size={14} /></button>
                      <button onClick={() => toggle(s)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
                        {s.isActive ? <ToggleRight size={16} className="text-green-500" /> : <ToggleLeft size={16} />}
                      </button>
                      <button
                        onClick={() => remove(s.id)}
                        disabled={deleting === s.id}
                        className="p-1.5 rounded hover:bg-red-50 text-red-400"
                      >
                        {deleting === s.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal !== null && (
        <Modal title={modal === 'add' ? 'Add Store' : 'Edit Store'} onClose={() => setModal(null)}>
          {error && <p className="text-red-500 text-sm mb-3 flex items-center gap-1"><AlertCircle size={13} />{error}</p>}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Store Name *</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Sector-15 Faridabad" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Address *</label>
              <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Full address" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">City *</label>
              <select
                value={form.cityId}
                onChange={e => setForm(f => ({ ...f, cityId: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select city...</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.name}{c.state ? ` (${c.state.name})` : ''}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Latitude *</label>
                <Input type="number" step="any" value={form.lat} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} placeholder="28.4089" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Longitude *</label>
                <Input type="number" step="any" value={form.lng} onChange={e => setForm(f => ({ ...f, lng: e.target.value }))} placeholder="77.3178" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Radius (km)</label>
              <Input type="number" step="0.1" min="0.1" value={form.radius} onChange={e => setForm(f => ({ ...f, radius: e.target.value }))} placeholder="5" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="accent-[#EA580C]" />
              <span className="text-sm text-gray-600">Active</span>
            </label>
          </div>
          <div className="flex gap-2 mt-5">
            <Button variant="outline" className="flex-1" onClick={() => setModal(null)}>Cancel</Button>
            <Button className="flex-1" onClick={save} disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : null} Save
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
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Geo Masters"
        subtitle="Manage Country → State → City hierarchy for store mapping"
      />

      {/* Tab Bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={15} />
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
