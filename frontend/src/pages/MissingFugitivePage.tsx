import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  getMissingPersons, getFugitives,
  createMissingPerson, createFugitive,
  updateMissingPerson, updateFugitive,
  deleteMissingPerson, deleteFugitive
} from '../services/api';

type Tab = 'missing' | 'fugitive';

const EMPTY_MISSING = {
  name: '', age: '', gender: 'Male' as string,
  last_seen_wearing: '', description: '',
  last_seen_location: '', date_missing: '', contact: '', photo_url: '', case_ref: ''
};

const EMPTY_FUGITIVE = {
  name: '', alias: '', age: '', gender: 'Male' as string,
  crime_committed: '', crime_details: '',
  last_seen_location: '', last_seen_date: '', description: '',
  warning_level: 'WANTED FOR ARREST' as string,
  photo_url: '', case_ref: '', reward: ''
};

const statusBadge = (s: string) => {
  if (s === 'active') return 'badge badge-error text-white';
  if (s === 'found' || s === 'apprehended') return 'badge badge-success text-white';
  return 'badge badge-ghost';
};

const MissingFugitivePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('missing');

  const [missingList, setMissingList] = useState<any[]>([]);
  const [fugitiveList, setFugitiveList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // forms
  const [mForm, setMForm] = useState({ ...EMPTY_MISSING });
  const [fForm, setFForm] = useState({ ...EMPTY_FUGITIVE });

  // editing
  const [editingM, setEditingM] = useState<any | null>(null);
  const [editingF, setEditingF] = useState<any | null>(null);

  useEffect(() => {
    if (user?.role === 'citizen') navigate('/dashboard');
  }, [user, navigate]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [mRes, fRes] = await Promise.all([
        getMissingPersons({ status: 'all' }),
        getFugitives({ status: 'all' })
      ]);
      setMissingList(mRes.data.data.missing_persons || []);
      setFugitiveList(fRes.data.data.fugitives || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const flash = (text: string, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  };

  /* ── Missing Person submit ── */
  const handleMissing = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...mForm, age: mForm.age ? Number(mForm.age) : undefined };
      if (editingM) {
        await updateMissingPerson(editingM.id, payload);
        flash('Missing person record updated.');
        setEditingM(null);
      } else {
        await createMissingPerson(payload);
        flash('Missing person posted to public board.');
      }
      setMForm({ ...EMPTY_MISSING });
      fetchAll();
    } catch (err: any) {
      flash(err?.response?.data?.message || 'Failed to save record.', false);
    } finally { setSubmitting(false); }
  };

  const startEditM = (rec: any) => {
    setEditingM(rec);
    setMForm({
      name: rec.name, age: String(rec.age || ''), gender: rec.gender,
      last_seen_wearing: rec.last_seen_wearing || '',
      description: rec.description || '',
      last_seen_location: rec.last_seen_location,
      date_missing: rec.date_missing?.substring(0, 10) || '',
      contact: rec.contact, photo_url: rec.photo_url || '',
      case_ref: rec.case_ref || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteM = async (id: string) => {
    if (!confirm('Remove this missing person record?')) return;
    try { await deleteMissingPerson(id); flash('Deleted.'); fetchAll(); }
    catch { flash('Delete failed.', false); }
  };

  /* ── Fugitive submit ── */
  const handleFugitive = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...fForm, age: fForm.age ? Number(fForm.age) : undefined };
      if (editingF) {
        await updateFugitive(editingF.id, payload);
        flash('Fugitive record updated.');
        setEditingF(null);
      } else {
        await createFugitive(payload);
        flash('Fugitive posted to public board.');
      }
      setFForm({ ...EMPTY_FUGITIVE });
      fetchAll();
    } catch (err: any) {
      flash(err?.response?.data?.message || 'Failed to save record.', false);
    } finally { setSubmitting(false); }
  };

  const startEditF = (rec: any) => {
    setEditingF(rec);
    setFForm({
      name: rec.name, alias: rec.alias || '', age: String(rec.age || ''),
      gender: rec.gender, crime_committed: rec.crime_committed,
      crime_details: rec.crime_details || '',
      last_seen_location: rec.last_seen_location,
      last_seen_date: rec.last_seen_date?.substring(0, 10) || '',
      description: rec.description || '',
      warning_level: rec.warning_level,
      photo_url: rec.photo_url || '', case_ref: rec.case_ref || '',
      reward: rec.reward || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteF = async (id: string) => {
    if (!confirm('Remove this fugitive record?')) return;
    try { await deleteFugitive(id); flash('Deleted.'); fetchAll(); }
    catch { flash('Delete failed.', false); }
  };

  if (user?.role === 'citizen') return null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-gray-900">Public Alert Board</h1>
          <p className="text-gray-500 mt-1">Manage missing persons & fugitives shown on the public landing page.</p>
        </div>
        <span className="badge badge-primary p-4 gap-2 text-sm font-bold">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {user?.full_name}
        </span>
      </div>

      {/* Flash */}
      {msg && (
        <div className={`alert ${msg.ok ? 'alert-success' : 'alert-error'} shadow-lg`}>
          <span className="font-bold">{msg.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-gray-100 p-1 rounded-2xl w-fit">
        <button
          className={`tab tab-lg font-bold rounded-xl transition-all ${tab === 'missing' ? 'tab-active bg-white shadow text-red-600' : 'text-gray-500'}`}
          onClick={() => setTab('missing')}
        >
          🔴 Missing Persons ({missingList.length})
        </button>
        <button
          className={`tab tab-lg font-bold rounded-xl transition-all ${tab === 'fugitive' ? 'tab-active bg-white shadow text-yellow-700' : 'text-gray-500'}`}
          onClick={() => setTab('fugitive')}
        >
          ⚠️ Fugitives ({fugitiveList.length})
        </button>
      </div>

      {/* ────────── MISSING PERSONS TAB ────────── */}
      {tab === 'missing' && (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          {/* Form */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sticky top-4">
              <h2 className="font-black text-2xl text-gray-900 mb-6 flex items-center gap-2">
                <span className="w-8 h-8 bg-red-100 text-red-600 rounded-xl flex items-center justify-center text-lg">🔴</span>
                {editingM ? 'Edit Record' : 'Add Missing Person'}
              </h2>
              <form onSubmit={handleMissing} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-control col-span-2">
                    <label className="label font-bold text-gray-700">Full Name *</label>
                    <input className="input input-bordered w-full" required placeholder="e.g. Abebe Girma"
                      value={mForm.name} onChange={e => setMForm({ ...mForm, name: e.target.value })} />
                  </div>
                  <div className="form-control">
                    <label className="label font-bold text-gray-700">Age</label>
                    <input type="number" className="input input-bordered w-full" placeholder="e.g. 14"
                      value={mForm.age} onChange={e => setMForm({ ...mForm, age: e.target.value })} />
                  </div>
                  <div className="form-control">
                    <label className="label font-bold text-gray-700">Gender</label>
                    <select className="select select-bordered w-full"
                      value={mForm.gender} onChange={e => setMForm({ ...mForm, gender: e.target.value })}>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                  <div className="form-control col-span-2">
                    <label className="label font-bold text-gray-700">Last Seen Wearing *</label>
                    <input className="input input-bordered w-full" required placeholder="e.g. Blue school uniform, black shoes"
                      value={mForm.last_seen_wearing} onChange={e => setMForm({ ...mForm, last_seen_wearing: e.target.value })} />
                  </div>
                  <div className="form-control col-span-2">
                    <label className="label font-bold text-gray-700">Physical Description *</label>
                    <textarea className="textarea textarea-bordered w-full h-24" required
                      placeholder="Slim build, short black hair, has a small scar on left cheek..."
                      value={mForm.description} onChange={e => setMForm({ ...mForm, description: e.target.value })} />
                  </div>
                  <div className="form-control col-span-2">
                    <label className="label font-bold text-gray-700">Last Seen Location *</label>
                    <input className="input input-bordered w-full" required placeholder="e.g. Merkato Market, Addis Ababa"
                      value={mForm.last_seen_location} onChange={e => setMForm({ ...mForm, last_seen_location: e.target.value })} />
                  </div>
                  <div className="form-control">
                    <label className="label font-bold text-gray-700">Date Missing *</label>
                    <input type="date" className="input input-bordered w-full" required
                      value={mForm.date_missing} onChange={e => setMForm({ ...mForm, date_missing: e.target.value })} />
                  </div>
                  <div className="form-control">
                    <label className="label font-bold text-gray-700">Contact Number *</label>
                    <input className="input input-bordered w-full" required placeholder="+251 911 000 111"
                      value={mForm.contact} onChange={e => setMForm({ ...mForm, contact: e.target.value })} />
                  </div>
                  <div className="form-control col-span-2">
                    <label className="label font-bold text-gray-700">Photo URL (optional)</label>
                    <input className="input input-bordered w-full" placeholder="https://..."
                      value={mForm.photo_url} onChange={e => setMForm({ ...mForm, photo_url: e.target.value })} />
                  </div>
                  <div className="form-control col-span-2">
                    <label className="label font-bold text-gray-700">Case Reference (auto-generated if blank)</label>
                    <input className="input input-bordered w-full" placeholder="MP-2026-XXXX"
                      value={mForm.case_ref} onChange={e => setMForm({ ...mForm, case_ref: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="btn btn-error text-white flex-1" disabled={submitting}>
                    {submitting ? <span className="loading loading-spinner" /> : editingM ? 'Update Record' : 'Post to Public Board'}
                  </button>
                  {editingM && (
                    <button type="button" className="btn btn-ghost" onClick={() => { setEditingM(null); setMForm({ ...EMPTY_MISSING }); }}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* List */}
          <div className="xl:col-span-3 space-y-4">
            <h3 className="font-bold text-lg text-gray-600 uppercase tracking-widest text-sm">Posted Records</h3>
            {loading ? (
              <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg text-red-500" /></div>
            ) : missingList.length === 0 ? (
              <div className="text-center py-20 text-gray-400 bg-white rounded-3xl border border-gray-100">No missing person records yet.</div>
            ) : (
              missingList.map(p => (
                <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex gap-4 p-4">
                  <img
                    src={p.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=fee2e2&color=dc2626&size=80`}
                    alt={p.name}
                    className="w-20 h-20 rounded-2xl object-cover shrink-0"
                    onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=fee2e2&color=dc2626&size=80`; }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-black text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.age} yrs • {p.gender} • <span className="font-bold text-indigo-600">{p.case_ref}</span></p>
                      </div>
                      <span className={statusBadge(p.status)}>{p.status}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 truncate">📍 {p.last_seen_location}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Missing since: {new Date(p.date_missing).toLocaleDateString('en-ET')}</p>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => startEditM(p)} className="btn btn-xs btn-outline btn-primary">Edit</button>
                      <button onClick={() => handleDeleteM(p.id)} className="btn btn-xs btn-outline btn-error">Remove</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ────────── FUGITIVES TAB ────────── */}
      {tab === 'fugitive' && (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          {/* Form */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sticky top-4">
              <h2 className="font-black text-2xl text-gray-900 mb-6 flex items-center gap-2">
                <span className="w-8 h-8 bg-yellow-100 text-yellow-700 rounded-xl flex items-center justify-center text-lg">⚠️</span>
                {editingF ? 'Edit Record' : 'Add Fugitive'}
              </h2>
              <form onSubmit={handleFugitive} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-control col-span-2">
                    <label className="label font-bold text-gray-700">Full Name *</label>
                    <input className="input input-bordered w-full" required placeholder="e.g. Kebede Mulat"
                      value={fForm.name} onChange={e => setFForm({ ...fForm, name: e.target.value })} />
                  </div>
                  <div className="form-control">
                    <label className="label font-bold text-gray-700">Alias / Nickname</label>
                    <input className="input input-bordered w-full" placeholder="e.g. K-Boss"
                      value={fForm.alias} onChange={e => setFForm({ ...fForm, alias: e.target.value })} />
                  </div>
                  <div className="form-control">
                    <label className="label font-bold text-gray-700">Age</label>
                    <input type="number" className="input input-bordered w-full" placeholder="e.g. 34"
                      value={fForm.age} onChange={e => setFForm({ ...fForm, age: e.target.value })} />
                  </div>
                  <div className="form-control">
                    <label className="label font-bold text-gray-700">Gender</label>
                    <select className="select select-bordered w-full"
                      value={fForm.gender} onChange={e => setFForm({ ...fForm, gender: e.target.value })}>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label font-bold text-gray-700">Warning Level *</label>
                    <select className="select select-bordered w-full"
                      value={fForm.warning_level} onChange={e => setFForm({ ...fForm, warning_level: e.target.value })}>
                      <option>WANTED FOR ARREST</option>
                      <option>ARMED &amp; DANGEROUS</option>
                      <option>DO NOT APPROACH</option>
                    </select>
                  </div>
                  <div className="form-control col-span-2">
                    <label className="label font-bold text-gray-700">Crime Committed *</label>
                    <input className="input input-bordered w-full" required placeholder="e.g. Armed Robbery & Aggravated Assault"
                      value={fForm.crime_committed} onChange={e => setFForm({ ...fForm, crime_committed: e.target.value })} />
                  </div>
                  <div className="form-control col-span-2">
                    <label className="label font-bold text-gray-700">Crime Details</label>
                    <textarea className="textarea textarea-bordered w-full h-20"
                      placeholder="Suspected ringleader of a violent robbery gang..."
                      value={fForm.crime_details} onChange={e => setFForm({ ...fForm, crime_details: e.target.value })} />
                  </div>
                  <div className="form-control col-span-2">
                    <label className="label font-bold text-gray-700">Physical Description</label>
                    <textarea className="textarea textarea-bordered w-full h-20"
                      placeholder="Muscular build, approx 180cm tall, visible tattoo..."
                      value={fForm.description} onChange={e => setFForm({ ...fForm, description: e.target.value })} />
                  </div>
                  <div className="form-control col-span-2">
                    <label className="label font-bold text-gray-700">Last Seen Location *</label>
                    <input className="input input-bordered w-full" required placeholder="e.g. Akaki-Kality Sub-city"
                      value={fForm.last_seen_location} onChange={e => setFForm({ ...fForm, last_seen_location: e.target.value })} />
                  </div>
                  <div className="form-control">
                    <label className="label font-bold text-gray-700">Last Seen Date *</label>
                    <input type="date" className="input input-bordered w-full" required
                      value={fForm.last_seen_date} onChange={e => setFForm({ ...fForm, last_seen_date: e.target.value })} />
                  </div>
                  <div className="form-control">
                    <label className="label font-bold text-gray-700">Reward (optional)</label>
                    <input className="input input-bordered w-full" placeholder="e.g. ETB 50,000"
                      value={fForm.reward} onChange={e => setFForm({ ...fForm, reward: e.target.value })} />
                  </div>
                  <div className="form-control col-span-2">
                    <label className="label font-bold text-gray-700">Photo URL (optional)</label>
                    <input className="input input-bordered w-full" placeholder="https://..."
                      value={fForm.photo_url} onChange={e => setFForm({ ...fForm, photo_url: e.target.value })} />
                  </div>
                  <div className="form-control col-span-2">
                    <label className="label font-bold text-gray-700">Case Reference (auto-generated if blank)</label>
                    <input className="input input-bordered w-full" placeholder="FUG-2026-XXXX"
                      value={fForm.case_ref} onChange={e => setFForm({ ...fForm, case_ref: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="btn btn-warning flex-1 font-bold" disabled={submitting}>
                    {submitting ? <span className="loading loading-spinner" /> : editingF ? 'Update Record' : 'Post to Public Board'}
                  </button>
                  {editingF && (
                    <button type="button" className="btn btn-ghost" onClick={() => { setEditingF(null); setFForm({ ...EMPTY_FUGITIVE }); }}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* List */}
          <div className="xl:col-span-3 space-y-4">
            <h3 className="font-bold text-gray-600 uppercase tracking-widest text-sm">Posted Records</h3>
            {loading ? (
              <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg text-yellow-500" /></div>
            ) : fugitiveList.length === 0 ? (
              <div className="text-center py-20 text-gray-400 bg-white rounded-3xl border border-gray-100">No fugitive records yet.</div>
            ) : (
              fugitiveList.map(f => (
                <div key={f.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex gap-4 p-4">
                  <img
                    src={f.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name)}&background=1f2937&color=facc15&size=80`}
                    alt={f.name}
                    className="w-20 h-20 rounded-2xl object-cover shrink-0 grayscale"
                    onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name)}&background=1f2937&color=facc15&size=80`; }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-black text-gray-900">{f.name} {f.alias && <span className="text-yellow-600 font-bold text-sm">"{f.alias}"</span>}</p>
                        <p className="text-xs text-gray-500">{f.age} yrs • {f.gender} • <span className="font-bold text-indigo-600">{f.case_ref}</span></p>
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${f.warning_level === 'WANTED FOR ARREST' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-700 text-white'}`}>
                        {f.warning_level}
                      </span>
                    </div>
                    <p className="text-sm text-red-600 font-bold mt-1 truncate">⚖️ {f.crime_committed}</p>
                    <p className="text-sm text-gray-600 truncate">📍 {f.last_seen_location}</p>
                    {f.reward && <p className="text-xs text-yellow-700 font-bold mt-0.5">Reward: {f.reward}</p>}
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => startEditF(f)} className="btn btn-xs btn-outline btn-warning">Edit</button>
                      <button onClick={() => handleDeleteF(f.id)} className="btn btn-xs btn-outline btn-error">Remove</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MissingFugitivePage;
