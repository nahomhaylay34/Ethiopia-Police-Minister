import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getCase, getCaseTimeline, addCaseNote } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { Case, CaseTimelineItem, Suspect, Evidence } from '../types';

const CaseDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [timeline, setTimeline] = useState<CaseTimelineItem[]>([]);
  const [note, setNote] = useState<string>('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'suspects' | 'evidence' | 'timeline'>('overview');

  const fetchCaseData = async () => {
    if (!id) return;
    try {
      const { data } = await getCase(id);
      setCaseData(data.data.case);
      const timelineData = await getCaseTimeline(id);
      setTimeline(timelineData.data.data.timeline);
    } catch (error) {
      console.error('Failed to fetch case data', error);
    }
  };

  useEffect(() => {
    fetchCaseData();
  }, [id]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !note.trim()) return;
    
    setIsSubmittingNote(true);
    try {
      await addCaseNote(id, note);
      setNote('');
      const timelineData = await getCaseTimeline(id);
      setTimeline(timelineData.data.data.timeline);
    } catch (error) {
      console.error('Failed to add note', error);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  if (!caseData) return (
    <div className="flex items-center justify-center h-screen">
      <span className="loading loading-spinner loading-lg text-indigo-600"></span>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="bg-indigo-50 text-indigo-700 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-100">
              {caseData.case_number}
            </span>
            <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${
              caseData.status === 'open' ? 'bg-green-50 text-green-700 border-green-100' :
              caseData.status === 'closed' ? 'bg-gray-50 text-gray-700 border-gray-100' :
              'bg-amber-50 text-amber-700 border-amber-100'
            }`}>
              {caseData.status.replace('_', ' ')}
            </span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">{caseData.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              Opened: {new Date(caseData.opened_at).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              {caseData.location}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Assigned Officer</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                {caseData.Officer?.full_name?.charAt(0) || 'U'}
              </div>
              <p className="font-bold text-gray-900">{caseData.Officer?.full_name || 'Unassigned'}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <button className="btn btn-sm btn-ghost border border-gray-200 rounded-xl font-bold">Print Case File</button>
            <button className="btn btn-sm btn-primary rounded-xl font-black px-6 shadow-lg shadow-indigo-100">Update Status</button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-4 border-b border-gray-100 px-4">
        {[
          { id: 'overview', label: 'Overview', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
          { id: 'suspects', label: 'Suspects', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197' },
          { id: 'evidence', label: 'Evidence Files', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
          { id: 'timeline', label: 'Case Timeline', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 py-4 px-2 border-b-4 transition-all duration-300 font-bold ${
              activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon}></path></svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                <h2 className="text-2xl font-black text-gray-900 mb-6">Case Summary</h2>
                <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-wrap">{caseData.description}</p>
              </section>

              {caseData.crime_details && (
                <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                  <h2 className="text-xl font-black text-gray-900 mb-4">Investigation Details</h2>
                  <p className="text-gray-600">{caseData.crime_details}</p>
                </section>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-indigo-600 text-white p-8 rounded-[2rem] shadow-xl shadow-indigo-100">
                <h3 className="font-black text-lg uppercase tracking-widest opacity-80 mb-4 text-indigo-200">Incident Metadata</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-black uppercase text-indigo-300">Crime Type</p>
                    <p className="font-bold text-xl capitalize">{caseData.crime_type?.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-indigo-300">Priority Level</p>
                    <p className="font-bold text-xl capitalize">{caseData.priority}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-indigo-300">Report Links</p>
                    <p className="font-bold">{caseData.Reports?.length || 0} Incident Reports</p>
                  </div>
                </div>
              </div>

              {caseData.latitude && caseData.longitude && (
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden relative h-48 group">
                  <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                     <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Map View Unavailable</span>
                  </div>
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur p-3 rounded-2xl shadow-lg border border-white">
                    <p className="text-[10px] font-black text-gray-400 uppercase">Coordinates</p>
                    <p className="text-xs font-bold font-mono">{caseData.latitude}, {caseData.longitude}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'suspects' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {caseData.Suspects?.map((suspect: Suspect) => (
              <div key={suspect.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl transition-all duration-500">
                <div className="h-48 bg-gray-100 relative overflow-hidden">
                  {suspect.photo_url ? (
                    <img src={suspect.photo_url} alt={suspect.full_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      suspect.criminal_status === 'convicted' ? 'bg-red-500 text-white' :
                      suspect.criminal_status === 'arrested' ? 'bg-orange-500 text-white' :
                      'bg-indigo-600 text-white'
                    }`}>
                      {suspect.criminal_status}
                    </span>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-black text-gray-900">{suspect.full_name}</h3>
                    <p className="text-sm font-bold text-gray-400">ID: {suspect.national_id || 'NOT REGISTERED'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Phone</p>
                      <p className="text-sm font-bold">{suspect.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Address</p>
                      <p className="text-sm font-bold truncate">{suspect.address || 'N/A'}</p>
                    </div>
                  </div>
                  <button className="btn btn-block btn-ghost btn-sm text-indigo-600 font-black uppercase tracking-widest text-xs mt-2 border-indigo-50 bg-indigo-50/30">View Criminal History</button>
                </div>
              </div>
            ))}
            {(!caseData.Suspects || caseData.Suspects.length === 0) && (
              <div className="col-span-full py-20 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                <p className="text-gray-400 font-bold">No suspects identified for this case.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'evidence' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {caseData.Evidences?.map((evidence: Evidence) => (
                <div key={evidence.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden group">
                  <div className="h-40 bg-gray-50 relative flex items-center justify-center">
                    {evidence.file_type.startsWith('image/') ? (
                      <img src={`http://localhost:5000${evidence.file_url}`} alt="Evidence" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <svg className="w-12 h-12 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                        <p className="text-[10px] font-black text-gray-400 uppercase mt-2">{evidence.file_type.split('/')[1]}</p>
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <p className="text-sm font-bold text-gray-800 line-clamp-1">{evidence.description || 'No description'}</p>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-[10px] font-black text-gray-400">{(evidence.file_size / 1024).toFixed(1)} KB</span>
                      <a href={`http://localhost:5000${evidence.file_url}`} target="_blank" rel="noreferrer" className="text-indigo-600 font-black text-xs uppercase hover:underline">Download</a>
                    </div>
                  </div>
                  
                  {/* Chain of Custody Detail */}
                  <div className="bg-gray-50 p-4 border-t border-gray-100">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Recent Custody Action</p>
                    {evidence.EvidenceCustodies && evidence.EvidenceCustodies.length > 0 ? (
                      <div className="flex gap-2">
                         <div className="w-1 h-8 bg-indigo-200 rounded-full"></div>
                         <div>
                            <p className="text-[11px] font-bold text-gray-700">{evidence.EvidenceCustodies[0].action}</p>
                            <p className="text-[9px] text-gray-500">{new Date(evidence.EvidenceCustodies[0].created_at).toLocaleDateString()}</p>
                         </div>
                      </div>
                    ) : <p className="text-[10px] text-gray-400 italic">No logs available</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-4 before:bottom-4 before:w-0.5 before:bg-indigo-100">
              {timeline.map((item, idx) => (
                <div key={item.id} className="relative animate-in slide-in-from-left duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                  <div className="absolute -left-8 top-1 w-6 h-6 rounded-full bg-white border-4 border-indigo-600 shadow-sm z-10"></div>
                  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                          {item.User.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{item.User.full_name}</p>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.update_type}</p>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-gray-400">{new Date(item.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-gray-600 leading-relaxed">{item.notes}</p>
                  </div>
                </div>
              ))}
            </div>

            {(user?.role === 'officer' || user?.role === 'detective' || user?.role === 'admin') && (
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-indigo-50 border border-indigo-50 mt-12">
                <h3 className="text-xl font-black text-gray-900 mb-6">Add Official Case Note</h3>
                <form onSubmit={handleAddNote} className="space-y-4">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Enter investigation details, notes, or evidence findings..."
                    className="textarea textarea-bordered w-full h-32 rounded-2xl focus:ring-4 focus:ring-indigo-100"
                    required
                  />
                  <button 
                    type="submit" 
                    className="btn btn-primary px-12 rounded-2xl font-black shadow-lg shadow-indigo-200"
                    disabled={isSubmittingNote}
                  >
                    {isSubmittingNote ? <span className="loading loading-spinner"></span> : 'Submit Official Entry'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseDetailsPage;

