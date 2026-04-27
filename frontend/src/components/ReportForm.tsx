import React, { useState } from 'react';
import { submitReport, uploadEvidence } from '../services/api';

interface ReportFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ReportForm: React.FC<ReportFormProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    crime_type: 'theft',
    location: '',
    urgency_level: 'medium',
    occurrence_date: ''
  });
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await submitReport(formData);
      if (files && files.length > 0) {
        const uploadData = new FormData();
        uploadData.append('report_id', data.data.report.id);
        for (let i = 0; i < files.length; i++) {
          uploadData.append('evidence', files[i]);
        }
        await uploadEvidence(uploadData);
      }
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Report submission failed', error);
      const reason = error?.response?.data?.message || 'Failed to submit report. Please try again.';
      alert(reason);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="alert bg-indigo-50 border-none rounded-2xl p-4 text-sm text-indigo-800 mb-6 flex gap-3">
        <svg className="w-5 h-5 text-indigo-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        Your report will be reviewed by officers for preliminary evaluation. Please provide as much evidence as possible.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="form-control">
          <label className="label font-bold text-gray-700 uppercase text-[10px] tracking-widest">Incident Title</label>
          <input type="text" name="title" placeholder="e.g. Suspicious activity at the park" value={formData.title} onChange={handleChange} className="input input-bordered w-full rounded-xl focus:ring-2 focus:ring-indigo-500" required />
        </div>
        <div className="form-control">
          <label className="label font-bold text-gray-700 uppercase text-[10px] tracking-widest">Potential Crime Type</label>
          <select name="crime_type" value={formData.crime_type} onChange={handleChange} className="select select-bordered w-full rounded-xl">
            <option value="theft">Theft</option>
            <option value="assault">Assault</option>
            <option value="burglary">Burglary</option>
            <option value="fraud">Fraud</option>
            <option value="cybercrime">Cybercrime</option>
            <option value="vandalism">Vandalism</option>
            <option value="missing person">Missing Person</option>
            <option value="other">Other Potential Incident</option>
          </select>
        </div>
      </div>

      <div className="form-control">
        <label className="label font-bold text-gray-700 uppercase text-[10px] tracking-widest">Description of Incident</label>
        <textarea name="description" placeholder="Full details of what you observed, suspect descriptions, etc." value={formData.description} onChange={handleChange} className="textarea textarea-bordered h-32 rounded-xl focus:ring-2 focus:ring-indigo-500" required />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="form-control">
          <label className="label font-bold text-gray-700 uppercase text-[10px] tracking-widest">Incident Location</label>
          <input type="text" name="location" placeholder="Where did this occur?" value={formData.location} onChange={handleChange} className="input input-bordered w-full rounded-xl focus:ring-2 focus:ring-indigo-500" required />
        </div>
        <div className="form-control">
          <label className="label font-bold text-gray-700 uppercase text-[10px] tracking-widest">Urgency Level</label>
          <select name="urgency_level" value={formData.urgency_level} onChange={handleChange} className="select select-bordered w-full rounded-xl">
            <option value="low">Low - Routine Tip</option>
            <option value="medium">Medium - Needs Attention</option>
            <option value="high">High - Urgent Concern</option>
            <option value="emergency">Emergency - Immediate Review</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="form-control">
          <label className="label font-bold text-gray-700 uppercase text-[10px] tracking-widest">Date & Time</label>
          <input type="datetime-local" name="occurrence_date" value={formData.occurrence_date} onChange={handleChange} className="input input-bordered w-full rounded-xl" required />
        </div>
        <div className="form-control">
          <label className="label font-bold text-gray-700 uppercase text-[10px] tracking-widest">Evidence Uploads</label>
          <input type="file" multiple onChange={handleFileChange} className="file-input file-input-bordered w-full rounded-xl" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" />
          <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold tracking-tighter">Photos, MP4, Voice records, Documents</p>
        </div>
      </div>

      <div className="flex gap-4 pt-6 border-t mt-4">
        <button type="submit" className="btn btn-primary px-12 rounded-xl font-black shadow-xl shadow-indigo-100" disabled={loading}>
          {loading ? <span className="loading loading-spinner"></span> : 'Submit Potential Crime Tip'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-ghost rounded-xl font-bold text-gray-400 hover:text-gray-600">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default ReportForm;
