import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getCases, updateCase, addCaseCharge, getCase } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { Case, CaseQuery } from '../types';

const CasesPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const assignedToParam = urlParams.get('assigned_to');

  const [cases, setCases] = useState<Case[]>([]);
  const [search, setSearch] = useState({ case_number: '', national_id: '', full_name: '', assigned_to: assignedToParam || '' });
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [caseUpdate, setCaseUpdate] = useState({ status: '', assigned_to: '', priority: '' });
  const [charge, setCharge] = useState('');
  const [message, setMessage] = useState('');

  const fetchCases = useCallback(async (query: CaseQuery = {}) => {
    try {
      const mergedQuery: CaseQuery = { ...query };
      if (assignedToParam) {
        mergedQuery.assigned_to = assignedToParam;
      }
      const { data } = await getCases(mergedQuery);
      setCases(data.data.cases);
    } catch (error) {
      console.error('Failed to fetch cases', error);
    }
  }, [assignedToParam]);



  useEffect(() => {
    fetchCases(search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignedToParam]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchCases(search);
  };

  const openCase = async (caseId: string) => {
    try {
      const { data } = await getCase(caseId);
      setSelectedCase(data.data.case);
      setCaseUpdate({
        status: data.data.case.status || '',
        assigned_to: data.data.case.assigned_to || '',
        priority: data.data.case.priority || ''
      });
    } catch (error) {
      console.error('Failed to fetch case details', error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedCase) return;

    try {
      await updateCase(selectedCase.id, caseUpdate);
      setMessage('Case updated successfully.');
      fetchCases(search);
      openCase(selectedCase.id);
    } catch (error) {
      console.error('Failed to update case', error);
      setMessage('Update failed');
    }
  };

  const handleAddCharge = async () => {
    if (!selectedCase || !charge.trim()) return;

    try {
      await addCaseCharge(selectedCase.id, charge);
      setMessage('Charge added successfully.');
      setCharge('');
      openCase(selectedCase.id);
    } catch (error) {
      console.error('Failed to add charge', error);
      setMessage('Failed to add charge');
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Cases & Criminal Processing</h1>

      {(user?.role === 'officer' || user?.role === 'detective' || user?.role === 'admin') && (
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <input type="text" placeholder="Case Number" value={search.case_number} onChange={(e) => setSearch({...search, case_number: e.target.value})} className="input input-bordered" />
          <input type="text" placeholder="Citizen National ID" value={search.national_id} onChange={(e) => setSearch({...search, national_id: e.target.value})} className="input input-bordered" />
          <input type="text" placeholder="Citizen Full Name" value={search.full_name} onChange={(e) => setSearch({...search, full_name: e.target.value})} className="input input-bordered" />
          <button type="submit" className="btn btn-primary col-span-1 md:col-span-3">Search Cases / Criminal History</button>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cases.map((caseItem) => (
              <div key={caseItem.id} className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  <h2 className="card-title">{caseItem.case_number} - {caseItem.title}</h2>
                  <p className="text-sm text-gray-500">Status: {caseItem.status.replace('_', ' ')} • Priority: {caseItem.priority}</p>
                  <p className="text-sm">Suspect: {caseItem.Suspects && caseItem.Suspects.length > 0 ? (caseItem.Suspects.length > 1 ? `${caseItem.Suspects[0].full_name} (+${caseItem.Suspects.length - 1})` : caseItem.Suspects[0].full_name) : 'Unknown'}</p>
                  <p className="text-sm">Assigned to: {caseItem.Officer?.full_name || 'Unassigned'}</p>
                  <div className="card-actions justify-end">
                    <button className="btn btn-xs btn-primary" onClick={() => openCase(caseItem.id)}>Open</button>
                    <Link to={`/dashboard/cases/${caseItem.id}`} className="btn btn-xs btn-secondary">View</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold mb-4">Case Detail & Process</h2>
          {selectedCase ? (
            <div className="space-y-3">
              <p><span className="font-bold">Case:</span> {selectedCase.case_number}</p>
              <p><span className="font-bold">Title:</span> {selectedCase.title}</p>
              <p><span className="font-bold">Description:</span> {selectedCase.description}</p>
              <div className="space-y-2">
                <label className="text-sm font-bold">Update Status</label>
                <select value={caseUpdate.status} onChange={(e) => setCaseUpdate({...caseUpdate, status: e.target.value})} className="select select-bordered w-full">
                  <option value="open">Open</option>
                  <option value="under_investigation">Under Investigation</option>
                  <option value="awaiting_court">Awaiting Court</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Case Priority</label>
                <select value={caseUpdate.priority} onChange={(e) => setCaseUpdate({...caseUpdate, priority: e.target.value})} className="select select-bordered w-full">
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                  <option value="critical">critical</option>
                </select>
              </div>
              {selectedCase.Suspects && selectedCase.Suspects.length > 0 && (
                <div className="mt-4">
                  <label className="text-sm font-bold">Suspects</label>
                  <div className="space-y-2 mt-1">
                    {selectedCase.Suspects.map(s => (
                      <div key={s.id} className="p-2 bg-gray-50 rounded text-sm border border-gray-100">
                        <p className="font-bold">{s.full_name}</p>
                        <p className="text-xs text-gray-500">ID: {s.national_id || 'N/A'} • Status: {s.criminal_status}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedCase.Evidences && selectedCase.Evidences.length > 0 && (
                <div className="mt-4">
                  <label className="text-sm font-bold">Evidence Records</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {selectedCase.Evidences.map(e => (
                      <div key={e.id} className="p-2 bg-gray-50 rounded text-xs border border-gray-100 flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        <span className="truncate">{e.file_type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={handleUpdate} className="btn btn-primary w-full mt-4">Save Case Information</button>
              <hr />
              <div>
                <label className="text-sm font-bold">Add additional charge</label>
                <input type="text" value={charge} onChange={(e) => setCharge(e.target.value)} className="input input-bordered w-full" placeholder="e.g. fraud, assault" />
                <button onClick={handleAddCharge} className="btn btn-secondary w-full mt-2">Add Charge</button>
              </div>
              {message && <p className="text-sm text-green-600">{message}</p>}
            </div>
          ) : (
            <p>Select a case to view and process.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CasesPage;
