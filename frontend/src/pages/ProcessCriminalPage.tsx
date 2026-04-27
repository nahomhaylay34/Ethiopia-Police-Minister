import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCases, createCase, uploadEvidence } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { Case, CaseQuery } from '../types';

const ProcessCriminalPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const [search, setSearch] = useState({ national_id: '', case_number: '', full_name: '' });
  const [results, setResults] = useState<Case[]>([]);
  const [message, setMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [form, setForm] = useState({
    title: queryParams.get('title') || '',
    description: queryParams.get('description') || '',
    crime_type: (queryParams.get('crime_type') as any) || 'other',
    priority: 'medium',
    incident_date: queryParams.get('date') || new Date().toISOString().split('T')[0],
    location: queryParams.get('location') || '',
    latitude: '',
    longitude: '',
    report_ids: queryParams.get('report_id') ? [queryParams.get('report_id')!] : [] as string[]
  });

  const [evidenceFiles, setEvidenceFiles] = useState<FileList | null>(null);

  const [suspects, setSuspects] = useState<any[]>([{
    full_name: '',
    national_id: '',
    phone: '',
    address: '',
    photo_url: '',
    criminal_status: 'suspected'
  }]);

  useEffect(() => {
    if (user && user.role === 'citizen') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsSearching(true);

    try {
      const query: CaseQuery = { ...search, limit: 20 };
      const { data } = await getCases(query);
      setResults(data.data.cases || []);
      if (data.data.cases.length === 0) {
        setMessage('No matching cases found. You can create a new case below.');
      }
    } catch (error) {
      console.error('Search failed', error);
      setMessage('Search failed.');
    } finally {
      setIsSearching(false);
    }
  };

  const addSuspectField = () => {
    setSuspects([...suspects, {
      full_name: '',
      national_id: '',
      phone: '',
      address: '',
      photo_url: '',
      criminal_status: 'suspected'
    }]);
  };

  const updateSuspect = (index: number, field: string, value: string) => {
    const newSuspects = [...suspects];
    newSuspects[index][field] = value;
    setSuspects(newSuspects);
  };

  const removeSuspect = (index: number) => {
    if (suspects.length > 1) {
      setSuspects(suspects.filter((_, i) => i !== index));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsCreating(true);

    try {
      const caseData = {
        ...form,
        suspects: suspects.filter(s => s.full_name),
        assigned_to: user?.id,
        status: 'open'
      };
      const { data } = await createCase(caseData);
      
      // Upload new evidence if any
      if (evidenceFiles && evidenceFiles.length > 0) {
        const uploadData = new FormData();
        uploadData.append('case_id', data.data.case.id);
        for (let i = 0; i < evidenceFiles.length; i++) {
          uploadData.append('evidence', evidenceFiles[i]);
        }
        await uploadEvidence(uploadData);
      }

      setMessage(`Case ${data.data.case.case_number} created successfully.`);
      setTimeout(() => navigate(`/dashboard/cases`), 2000);
    } catch (error: any) {
      console.error('Failed to create case', error);
      const reason = error?.response?.data?.message || 'Failed to create case.';
      setMessage(reason);
    } finally {
      setIsCreating(false);
    }
  };

  if (user?.role === 'citizen') return null;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-black text-gray-900">Case Management</h1>
        <div className="badge badge-primary p-4 gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          Officer: {user?.full_name}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Search & Quick Actions */}
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-xl mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              Quick Search
            </h2>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="form-control">
                <label className="label text-xs font-bold text-gray-500 uppercase">National ID</label>
                <input
                  type="text"
                  className="input input-bordered w-full bg-gray-50"
                  value={search.national_id}
                  onChange={(e) => setSearch({ ...search, national_id: e.target.value })}
                  placeholder="CID123456"
                />
              </div>
              <div className="form-control">
                <label className="label text-xs font-bold text-gray-500 uppercase">Case Number</label>
                <input
                  type="text"
                  className="input input-bordered w-full bg-gray-50"
                  value={search.case_number}
                  onChange={(e) => setSearch({ ...search, case_number: e.target.value })}
                  placeholder="CASE-2024..."
                />
              </div>
              <button type="submit" className="btn btn-primary w-full shadow-lg shadow-indigo-100">
                {isSearching ? <span className="loading loading-spinner"></span> : 'Find Records'}
              </button>
            </form>

            {results.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider">Results</h3>
                {results.map((result) => (
                  <div key={result.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-indigo-200 transition-colors group">
                    <p className="font-bold text-gray-800">{result.case_number}</p>
                    <p className="text-sm text-gray-500 line-clamp-1">{result.title}</p>
                    <button
                      onClick={() => navigate(`/dashboard/cases/${result.id}`)}
                      className="mt-2 text-indigo-600 text-xs font-black uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all"
                    >
                      Open File <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            {message && !results.length && <p className="mt-4 text-sm text-center text-gray-500 italic">{message}</p>}
          </section>
        </div>

        {/* Right Column: Creation Form */}
        <div className="lg:col-span-2">
          <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-2xl mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Open New Case
            </h2>
            <form onSubmit={handleCreate} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-control md:col-span-2">
                  <label className="label font-bold text-gray-700">Case Title</label>
                  <input
                    className="input input-bordered w-full focus:ring-2 focus:ring-indigo-500"
                    placeholder="Brief title of the incident"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-control md:col-span-2">
                  <label className="label font-bold text-gray-700">Detailed Description</label>
                  <textarea
                    className="textarea textarea-bordered w-full h-32"
                    placeholder="Provide full details of the crime, incident, and initial findings..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label font-bold text-gray-700">Crime Type</label>
                  <select
                    className="select select-bordered w-full"
                    value={form.crime_type}
                    onChange={(e) => setForm({ ...form, crime_type: e.target.value as any })}
                  >
                    <option value="theft">Theft</option>
                    <option value="assault">Assault</option>
                    <option value="burglary">Burglary</option>
                    <option value="fraud">Fraud</option>
                    <option value="cybercrime">Cybercrime</option>
                    <option value="vandalism">Vandalism</option>
                    <option value="missing_person">Missing Person</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label font-bold text-gray-700">Priority Level</label>
                  <select
                    className="select select-bordered w-full"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label font-bold text-gray-700">Incident Date</label>
                  <input
                    type="date"
                    className="input input-bordered w-full"
                    value={form.incident_date}
                    onChange={(e) => setForm({ ...form, incident_date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label font-bold text-gray-700">Location</label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="Street, City, Area"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label font-bold text-gray-700">Latitude (Optional)</label>
                  <input
                    type="number"
                    step="any"
                    className="input input-bordered w-full"
                    placeholder="e.g. 40.7128"
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  />
                </div>

                <div className="form-control">
                  <label className="label font-bold text-gray-700">Longitude (Optional)</label>
                  <input
                    type="number"
                    step="any"
                    className="input input-bordered w-full"
                    placeholder="e.g. -74.0060"
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  />
                </div>
              </div>

              {/* Suspects Section */}
              <div className="space-y-6 pt-6 border-t">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-xl text-gray-800">Suspect Profiles</h3>
                  <button type="button" onClick={addSuspectField} className="btn btn-sm btn-outline btn-primary gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    Add Suspect
                  </button>
                </div>

                {suspects.map((suspect, index) => (
                  <div key={index} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 relative space-y-4">
                    {suspects.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSuspect(index)}
                        className="absolute top-4 right-4 text-red-400 hover:text-red-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label text-xs font-bold text-gray-500 uppercase">Full Name</label>
                        <input
                          className="input input-bordered w-full bg-white"
                          value={suspect.full_name}
                          onChange={(e) => updateSuspect(index, 'full_name', e.target.value)}
                          placeholder="Legal Name"
                          required
                        />
                      </div>
                      <div className="form-control">
                        <label className="label text-xs font-bold text-gray-500 uppercase">National ID</label>
                        <input
                          className="input input-bordered w-full bg-white"
                          value={suspect.national_id}
                          onChange={(e) => updateSuspect(index, 'national_id', e.target.value)}
                          placeholder="ID Number"
                        />
                      </div>
                      <div className="form-control">
                        <label className="label text-xs font-bold text-gray-500 uppercase">Contact Phone</label>
                        <input
                          className="input input-bordered w-full bg-white"
                          value={suspect.phone}
                          onChange={(e) => updateSuspect(index, 'phone', e.target.value)}
                          placeholder="+..."
                        />
                      </div>
                      <div className="form-control">
                        <label className="label text-xs font-bold text-gray-500 uppercase">Criminal Status</label>
                        <select
                          className="select select-bordered w-full bg-white"
                          value={suspect.criminal_status}
                          onChange={(e) => updateSuspect(index, 'criminal_status', e.target.value)}
                        >
                          <option value="suspected">Suspected</option>
                          <option value="arrested">Arrested</option>
                          <option value="convicted">Convicted</option>
                          <option value="released">Released</option>
                          <option value="unknown">Unknown</option>
                        </select>
                      </div>
                      <div className="form-control md:col-span-2">
                        <label className="label text-xs font-bold text-gray-500 uppercase">Address</label>
                        <input
                          className="input input-bordered w-full bg-white"
                          value={suspect.address}
                          onChange={(e) => updateSuspect(index, 'address', e.target.value)}
                          placeholder="Current Residence"
                        />
                      </div>
                      <div className="form-control md:col-span-2">
                        <label className="label text-xs font-bold text-gray-500 uppercase">Photograph URL</label>
                        <input
                          className="input input-bordered w-full bg-white"
                          value={suspect.photo_url}
                          onChange={(e) => updateSuspect(index, 'photo_url', e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Evidence Section */}
              <div className="space-y-6 pt-6 border-t">
                <h3 className="font-bold text-xl text-gray-800">New Evidence Files</h3>
                <div className="form-control">
                  <label className="label text-xs font-bold text-gray-500 uppercase">Attachments</label>
                  <input
                    type="file"
                    multiple
                    className="file-input file-input-bordered w-full"
                    onChange={(e) => setEvidenceFiles(e.target.files)}
                  />
                  <p className="text-[10px] text-gray-400 mt-2">Upload additional evidence found during the initial processing.</p>
                </div>
              </div>

              <div className="pt-8">
                <button
                  type="submit"
                  className="btn btn-primary w-full btn-lg shadow-xl shadow-indigo-200"
                  disabled={isCreating}
                >
                  {isCreating ? <span className="loading loading-spinner"></span> : 'Initialize Case & Assign ID'}
                </button>
                {message && <p className="mt-4 text-center font-bold text-indigo-600">{message}</p>}
              </div>

            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ProcessCriminalPage;
