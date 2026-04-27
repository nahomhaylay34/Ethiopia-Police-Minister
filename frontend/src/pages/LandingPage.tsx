import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

// ─── Static sample data ────────────────────────────────────────────────────────

const MISSING_PERSONS = [
  {
    id: 'mp1',
    name: 'Abebe Girma',
    age: 14,
    gender: 'Male',
    last_seen_wearing: 'Blue school uniform, black shoes',
    description: 'Slim build, short black hair, has a small scar on left cheek. Speaks Amharic and Oromo.',
    last_seen_location: 'Merkato Market, Addis Ababa',
    time_missing: '3 days ago',
    date_missing: '2026-04-21',
    contact: '+251 911 000 111',
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop&crop=face',
    case_ref: 'MP-2026-001'
  },
  {
    id: 'mp2',
    name: 'Tigist Bekele',
    age: 28,
    gender: 'Female',
    last_seen_wearing: 'White hijab, green traditional dress, sandals',
    description: 'Medium height, brown eyes, speaks Amharic. Last seen carrying a red handbag.',
    last_seen_location: 'Bole Road, near Edna Mall, Addis Ababa',
    time_missing: '6 hours ago',
    date_missing: '2026-04-24',
    contact: '+251 922 000 222',
    image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop&crop=face',
    case_ref: 'MP-2026-002'
  },
  {
    id: 'mp3',
    name: 'Dawit Haile',
    age: 67,
    gender: 'Male',
    last_seen_wearing: 'Grey shirt, dark trousers, walking stick',
    description: 'Elderly man with white hair and beard. Has memory difficulties (dementia). Responds to "Ato Dawit".',
    last_seen_location: 'Piassa Square, Addis Ababa',
    time_missing: '2 days ago',
    date_missing: '2026-04-22',
    contact: '+251 933 000 333',
    image: 'https://images.unsplash.com/photo-1489980557514-251d61e3eeb6?w=400&h=400&fit=crop&crop=face',
    case_ref: 'MP-2026-003'
  },
  {
    id: 'mp4',
    name: 'Mekdes Solomon',
    age: 9,
    gender: 'Female',
    last_seen_wearing: 'Yellow dress, white socks, pink backpack',
    description: 'Small build, braided hair with yellow ribbons, a small birthmark below left ear.',
    last_seen_location: 'Gerji area, near Betel Primary School',
    time_missing: '1 day ago',
    date_missing: '2026-04-23',
    contact: '+251 944 000 444',
    image: 'https://images.unsplash.com/photo-1504703395950-b89145a5425b?w=400&h=400&fit=crop&crop=face',
    case_ref: 'MP-2026-004'
  }
];

const FUGITIVES = [
  {
    id: 'f1',
    name: 'Kebede Mulat',
    alias: 'K-Boss',
    age: 34,
    gender: 'Male',
    crime_committed: 'Armed Robbery & Aggravated Assault',
    crime_details: 'Suspected ringleader of a violent robbery gang responsible for 4 attacks across Addis Ababa. Considered armed and dangerous.',
    last_seen_location: 'Akaki-Kality Sub-city, near Dukem road junction',
    last_seen_date: '2026-04-20',
    description: 'Muscular build, approx 180cm tall, visible tattoo of a star on left forearm. Short cropped hair, often wears a dark jacket.',
    warning_level: 'ARMED & DANGEROUS',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
    case_ref: 'FUG-2026-001',
    reward: 'ETB 50,000'
  },
  {
    id: 'f2',
    name: 'Almaz Tesfaye',
    alias: 'The Accountant',
    age: 41,
    gender: 'Female',
    crime_committed: 'Large-scale Financial Fraud & Money Laundering',
    crime_details: 'Allegedly orchestrated a multi-million Birr fraud scheme targeting state pension funds. Escaped custody awaiting trial.',
    last_seen_location: 'Bole International Airport',
    last_seen_date: '2026-04-18',
    description: 'Medium height, often seen in professional business attire. Brown eyes, glasses. Multiple passports suspected.',
    warning_level: 'WANTED FOR ARREST',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=face',
    case_ref: 'FUG-2026-002',
    reward: 'ETB 100,000'
  },
  {
    id: 'f3',
    name: 'Yonas Bereket',
    alias: 'Ghost',
    age: 27,
    gender: 'Male',
    crime_committed: 'Drug Trafficking & Conspiracy',
    crime_details: 'Key distributor in an international narcotics ring operating across the Oromia and Amhara regions. Warrant issued for trafficking.',
    last_seen_location: 'Dire Dawa, near train station',
    last_seen_date: '2026-04-22',
    description: 'Slim build, approx 172cm, distinctive scar running from right eye to jawline. Frequently changes appearance.',
    warning_level: 'DO NOT APPROACH',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face',
    case_ref: 'FUG-2026-003',
    reward: 'ETB 75,000'
  },
  {
    id: 'f4',
    name: 'Rahel Dagne',
    alias: 'Red Rose',
    age: 31,
    gender: 'Female',
    crime_committed: 'Human Trafficking & Kidnapping',
    crime_details: 'Allegedly recruited victims under false employment promises and facilitated their trafficking across East Africa.',
    last_seen_location: 'Hawassa City, Sidama Region',
    last_seen_date: '2026-04-17',
    description: 'Average height, often wears red clothing. Has a small rose tattoo on right wrist. Fluent in Amharic, Sidamo, and English.',
    warning_level: 'WANTED FOR ARREST',
    image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop&crop=face',
    case_ref: 'FUG-2026-004',
    reward: 'ETB 150,000'
  }
];

const urgency = (date: string) => {
  const hours = (Date.now() - new Date(date).getTime()) / 3_600_000;
  if (hours < 24) return { label: 'URGENT', color: 'bg-red-600' };
  if (hours < 72) return { label: 'RECENT', color: 'bg-orange-500' };
  return { label: 'ONGOING', color: 'bg-gray-600' };
};

const warningStyle = (level: string) => {
  if (level === 'ARMED & DANGEROUS' || level === 'DO NOT APPROACH') return 'bg-red-700 text-white';
  return 'bg-yellow-500 text-gray-900';
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const DetailRow: React.FC<{ icon: string; label: string; value: string; urgent?: boolean }> = ({ icon, label, value, urgent }) => (
  <div>
    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{icon} {label}</p>
    <p className={`text-sm leading-snug ${urgent ? 'text-red-600 font-bold' : 'text-gray-700'}`}>{value}</p>
  </div>
);

const FugDetailRow: React.FC<{ icon: string; label: string; value: string; highlight?: boolean }> = ({ icon, label, value, highlight }) => (
  <div>
    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-0.5">{icon} {label}</p>
    <p className={`text-sm leading-snug ${highlight ? 'text-yellow-600 font-bold' : 'text-gray-700'}`}>{value}</p>
  </div>
);

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="p-10 rounded-3xl bg-white border border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-300 group">
    <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-inner">
      {icon}
    </div>
    <h3 className="text-2xl font-black text-gray-900 mb-4">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
);

const AnnouncementCard: React.FC<{ title: string; date: string; content: string }> = ({ title, date, content }) => (
  <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
    <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-sm text-gray-500 mb-4">{date}</p>
    <p className="text-gray-600">{content}</p>
  </div>
);

const ReportForm: React.FC = () => {
  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    crime_type: '',
    location: '',
    occurrence_date: '',
    urgency_level: 'medium',
    anonymous: false,
    evidence: null as File | null
  });
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, evidence: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('crime_type', formData.crime_type);
      data.append('location', formData.location);
      data.append('occurrence_date', formData.occurrence_date);
      data.append('urgency_level', formData.urgency_level);
      if (formData.anonymous) {
        data.append('anonymous_reference', 'anonymous-' + Date.now());
      }
      if (formData.evidence) {
        data.append('evidence', formData.evidence);
      }

      await axios.post('http://localhost:5000/api/v1/reports', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessage('Report submitted successfully!');
      setFormData({
        title: '',
        description: '',
        crime_type: '',
        location: '',
        occurrence_date: '',
        urgency_level: 'medium',
        anonymous: false,
        evidence: null
      });
    } catch (error) {
      console.error('Submit error:', error);
      setMessage('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="form-control md:col-span-2">
          <label className="label font-bold text-gray-700">Incident Title</label>
          <input type="text" name="title" value={formData.title} onChange={handleChange} required className="input input-bordered w-full bg-gray-50 focus:bg-white" placeholder="Briefly describe what happened" />
        </div>
        <div className="form-control md:col-span-2">
          <label className="label font-bold text-gray-700">Detailed Description</label>
          <textarea name="description" value={formData.description} onChange={handleChange} required className="textarea textarea-bordered h-32 w-full bg-gray-50 focus:bg-white" placeholder="Provide as many details as possible..."></textarea>
        </div>
        <div className="form-control">
          <label className="label font-bold text-gray-700">Category</label>
          <select name="crime_type" value={formData.crime_type} onChange={handleChange} required className="select select-bordered w-full bg-gray-50 focus:bg-white">
            <option value="" disabled>Select category</option>
            <option value="theft">Theft / Burglary</option>
            <option value="assault">Assault / Violence</option>
            <option value="fraud">Fraud / Scam</option>
            <option value="vandalism">Vandalism</option>
            <option value="suspicious">Suspicious Activity</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="form-control">
          <label className="label font-bold text-gray-700">Urgency</label>
          <select name="urgency_level" value={formData.urgency_level} onChange={handleChange} required className="select select-bordered w-full bg-gray-50 focus:bg-white">
            <option value="low">Low - Non-emergency</option>
            <option value="medium">Medium - Needs attention</option>
            <option value="high">High - Urgent</option>
          </select>
        </div>
        <div className="form-control md:col-span-2">
          <label className="label font-bold text-gray-700">Location</label>
          <input type="text" name="location" value={formData.location} onChange={handleChange} required className="input input-bordered w-full bg-gray-50 focus:bg-white" placeholder="Where did this happen?" />
        </div>
        <div className="form-control">
          <label className="label font-bold text-gray-700">Date of Incident</label>
          <input type="date" name="occurrence_date" value={formData.occurrence_date} onChange={handleChange} required className="input input-bordered w-full bg-gray-50 focus:bg-white" />
        </div>
        <div className="form-control">
          <label className="label font-bold text-gray-700">Evidence (Optional)</label>
          <input type="file" onChange={handleFileChange} className="file-input file-input-bordered w-full bg-gray-50 focus:bg-white" accept="image/*,video/*" />
        </div>
      </div>
      <div className="form-control mt-4">
        <label className="label cursor-pointer justify-start gap-4">
          <input type="checkbox" name="anonymous" checked={formData.anonymous} onChange={handleChange} className="checkbox checkbox-primary" />
          <span className="label-text font-bold text-gray-700">Submit Anonymously</span>
        </label>
      </div>
      <button type="submit" disabled={loading} className="btn btn-primary w-full shadow-lg hover:shadow-xl transition-all">
        {loading ? <span className="loading loading-spinner"></span> : 'Submit Report'}
      </button>
      {message && <p className={`text-center font-bold mt-4 ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
    </form>
  );
};


// ─── Main Component ───────────────────────────────────────────────────────────

const LandingPage: React.FC = () => {
  const [missingSearch, setMissingSearch] = useState('');
  const [fugitiveSearch, setFugitiveSearch] = useState('');

  // Live data fetched from the officer board
  const [liveMissing, setLiveMissing] = useState<any[]>([]);
  const [liveFugitives, setLiveFugitives] = useState<any[]>([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/v1/public/missing-persons')
      .then(r => setLiveMissing(r.data.data.missing_persons || []))
      .catch(() => {});
    axios.get('http://localhost:5000/api/v1/public/fugitives')
      .then(r => setLiveFugitives(r.data.data.fugitives || []))
      .catch(() => {});
  }, []);

  // Merge static seed cards with live API cards (dedup by name)
  const liveNames = new Set(liveMissing.map((p: any) => p.name.toLowerCase()));
  const staticMissing = MISSING_PERSONS.filter(p => !liveNames.has(p.name.toLowerCase()));
  const allMissing = [
    ...liveMissing.map((p: any) => ({
      id: p.id, name: p.name, age: p.age, gender: p.gender,
      last_seen_wearing: p.last_seen_wearing, description: p.description,
      last_seen_location: p.last_seen_location,
      time_missing: (() => {
        const h = (Date.now() - new Date(p.date_missing).getTime()) / 3_600_000;
        if (h < 24) return `${Math.round(h)} hours ago`;
        return `${Math.round(h / 24)} days ago`;
      })(),
      date_missing: p.date_missing, contact: p.contact,
      image: p.photo_url || '', case_ref: p.case_ref
    })),
    ...staticMissing
  ];

  const liveFugNames = new Set(liveFugitives.map((f: any) => f.name.toLowerCase()));
  const staticFug = FUGITIVES.filter(f => !liveFugNames.has(f.name.toLowerCase()));
  const allFugitives = [
    ...liveFugitives.map((f: any) => ({
      id: f.id, name: f.name, alias: f.alias, age: f.age, gender: f.gender,
      crime_committed: f.crime_committed, crime_details: f.crime_details,
      last_seen_location: f.last_seen_location, last_seen_date: f.last_seen_date,
      description: f.description, warning_level: f.warning_level,
      image: f.photo_url || '', case_ref: f.case_ref, reward: f.reward
    })),
    ...staticFug
  ];

  const filteredMissing = allMissing.filter(p =>
    p.name.toLowerCase().includes(missingSearch.toLowerCase()) ||
    p.last_seen_location.toLowerCase().includes(missingSearch.toLowerCase())
  );

  const filteredFugitives = allFugitives.filter(f =>
    f.name.toLowerCase().includes(fugitiveSearch.toLowerCase()) ||
    f.crime_committed.toLowerCase().includes(fugitiveSearch.toLowerCase()) ||
    f.last_seen_location.toLowerCase().includes(fugitiveSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto sticky top-0 bg-white z-50">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
            C
          </div>
          <span className="text-2xl font-extrabold text-gray-900 tracking-tight">CMS Ethiopia</span>
        </div>
        <div className="hidden md:flex space-x-8 items-center">
          <a href="#missing" className="text-gray-600 font-medium hover:text-indigo-600 transition-colors">Missing</a>
          <a href="#fugitive" className="text-gray-600 font-medium hover:text-indigo-600 transition-colors">Fugitive</a>
          <a href="#report" className="text-gray-600 font-medium hover:text-indigo-600 transition-colors">Report</a>
          <a href="#events" className="text-gray-600 font-medium hover:text-indigo-600 transition-colors">Events</a>
          <a href="#announcements" className="text-gray-600 font-medium hover:text-indigo-600 transition-colors">Announcements</a>
          <Link to="/login" className="text-indigo-600 font-bold hover:text-indigo-700">Login</Link>
          <Link to="/register" className="bg-indigo-600 text-white px-6 py-2.5 rounded-full font-bold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
            Register
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-8 flex flex-col lg:flex-row items-center">
          <div className="lg:w-1/2 text-center lg:text-left z-10">
            <span className="inline-block py-1 px-3 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold tracking-widest uppercase mb-6">
              Official Crime Management System
            </span>
            <h1 className="text-5xl lg:text-7xl font-black text-gray-900 leading-tight mb-8">
              Securing the Future of <span className="text-indigo-600">Ethiopia</span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0">
              A modern, unified platform for citizens and law enforcement to report, track, and resolve crimes efficiently. Together, we build a safer nation.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center lg:justify-start">
              <Link to="/register" className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1">
                Get Started
              </Link>
              <Link to="/login" className="px-10 py-4 bg-white text-gray-900 border-2 border-gray-100 rounded-2xl font-bold text-lg hover:border-indigo-600 hover:text-indigo-600 transition-all">
                Access Portal
              </Link>
            </div>
          </div>
          <div className="lg:w-1/2 mt-20 lg:mt-0 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-50 rounded-full blur-3xl opacity-50 -z-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
              alt="Justice" 
              className="rounded-3xl shadow-2xl border-8 border-white transform rotate-3 hover:rotate-0 transition-transform duration-500"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-50 py-24 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="text-5xl font-black text-indigo-600 mb-2">24/7</div>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Incident Reporting</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-indigo-600 mb-2">100%</div>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Encrypted Data</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-indigo-600 mb-2">Real-time</div>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Case Updates</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Empowering Justice</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Our platform provides the tools needed for modern law enforcement and active citizenship.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>}
              title="Instant Reporting"
              description="Citizens can report incidents instantly with photo and video evidence directly from their devices."
            />
            <FeatureCard 
              icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>}
              title="Case Tracking"
              description="Monitor the progress of reported cases in real-time. Stay informed through every stage of the investigation."
            />
            <FeatureCard 
              icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>}
              title="Secure Messaging"
              description="Direct communication line between citizens and assigned officers for updates and additional information."
            />
          </div>
        </div>
      </section>

      {/* Missing Persons Section */}
      <section id="missing" className="py-32 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Missing Persons</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Help us locate missing individuals. If you have seen any of these individuals, please contact us immediately.
            </p>
            <div className="inline-flex flex-col sm:flex-row gap-3 justify-center items-center">
              <input
                type="text"
                value={missingSearch}
                onChange={e => setMissingSearch(e.target.value)}
                placeholder="Search by name or location..."
                className="px-5 py-3 rounded-2xl w-80 text-gray-900 text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredMissing.map(person => {
              const badge = urgency(person.date_missing);
              return (
                <div key={person.id} className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                  {/* MISSING header */}
                  <div className="bg-red-600 py-3 px-4 text-center relative">
                    <p className="text-white font-black text-2xl tracking-[0.25em] drop-shadow">MISSING</p>
                    <span className={`absolute top-2 right-2 ${badge.color} text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full`}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Photo */}
                  <div className="relative">
                    <img
                      src={person.image}
                      alt={person.name}
                      className="w-full h-56 object-cover object-center"
                      onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&size=400&background=e0e7ff&color=4338ca`; }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent py-3 px-4">
                      <p className="text-white font-black text-lg leading-tight">{person.name}</p>
                      <p className="text-gray-200 text-xs">{person.age} years old &bull; {person.gender}</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 p-5 space-y-3">
                    <DetailRow icon="👗" label="Last seen wearing" value={person.last_seen_wearing} />
                    <DetailRow icon="📍" label="Last seen at" value={person.last_seen_location} />
                    <DetailRow icon="🕐" label="Missing for" value={person.time_missing} urgent />
                    <DetailRow icon="📝" label="Description" value={person.description} />
                  </div>

                  {/* Footer */}
                  <div className="px-5 pb-5 pt-2 border-t border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Case Ref</span>
                      <span className="text-xs font-black text-indigo-600">{person.case_ref}</span>
                    </div>
                    <a
                      href={`tel:${person.contact.replace(/\s/g, '')}`}
                      className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-2xl transition-colors text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Report Sighting
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Fugitives Section */}
      <section id="fugitive" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
              Active Warrants
            </div>
            <h2 className="text-4xl font-black text-gray-900 mb-4">Most Wanted Fugitives</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              These individuals are wanted by law enforcement. Do not attempt to apprehend them yourself.
            </p>
            <div className="inline-flex flex-col sm:flex-row gap-3 justify-center items-center">
              <input
                type="text"
                value={fugitiveSearch}
                onChange={e => setFugitiveSearch(e.target.value)}
                placeholder="Search by name, crime, or location..."
                className="px-5 py-3 rounded-2xl w-80 sm:w-96 text-gray-900 text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredFugitives.map(fugitive => (
              <div key={fugitive.id} className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-200 hover:border-yellow-400 hover:-translate-y-1 transition-all duration-300 flex flex-col relative group">
                {/* WANTED header */}
                <div className="bg-gray-900 py-3 px-4 text-center relative border-b-2 border-yellow-400">
                  <p className="text-yellow-400 font-black text-2xl tracking-[0.3em] drop-shadow-lg">WANTED</p>
                </div>

                {/* Warning banner */}
                <div className={`py-1.5 px-3 text-center text-[10px] font-black uppercase tracking-widest ${warningStyle(fugitive.warning_level)}`}>
                  {fugitive.warning_level}
                </div>

                {/* Photo */}
                <div className="relative">
                  <img
                    src={fugitive.image}
                    alt={fugitive.name}
                    className="w-full h-56 object-cover object-center grayscale opacity-90 group-hover:grayscale-0 transition-all duration-500"
                    onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fugitive.name)}&size=400&background=1f2937&color=facc15`; }}
                  />
                  {/* Overlay gradient */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/90 to-transparent py-4 px-4">
                    <p className="text-white font-black text-lg leading-tight">{fugitive.name}</p>
                    {fugitive.alias && <p className="text-yellow-400 text-xs font-bold">AKA: "{fugitive.alias}"</p>}
                    <p className="text-gray-300 text-xs">{fugitive.age} years old &bull; {fugitive.gender}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 p-5 space-y-3 bg-gray-50">
                  <FugDetailRow icon="⚖️" label="Crime Committed" value={fugitive.crime_committed} highlight />
                  <FugDetailRow icon="📋" label="Details" value={fugitive.crime_details} />
                  <FugDetailRow icon="📍" label="Last Seen" value={fugitive.last_seen_location} />
                  <FugDetailRow icon="🕐" label="Last Seen Date" value={new Date(fugitive.last_seen_date).toLocaleDateString('en-ET', { day: 'numeric', month: 'long', year: 'numeric' })} />
                </div>

                {/* Footer */}
                <div className="px-5 pb-5 pt-3 border-t border-gray-200 bg-gray-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Warrant Ref</span>
                    <span className="text-xs font-black text-indigo-600">{fugitive.case_ref}</span>
                  </div>
                  {fugitive.reward && (
                    <div className="bg-white rounded-xl px-3 py-2 flex items-center justify-between border border-gray-200 shadow-sm">
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Reward</span>
                      <span className="text-sm font-black text-yellow-600">{fugitive.reward}</span>
                    </div>
                  )}
                  <a
                    href="tel:+251911765423"
                    className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-yellow-400 font-black py-3 rounded-2xl transition-colors text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Report Sighting
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Events / Announcements Section */}
      <section id="events" className="py-32 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4" id="announcements">Latest Events & Announcements</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Stay informed with the latest updates from the Crime Management System.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnnouncementCard
              title="New Safety Guidelines"
              date="March 15, 2026"
              content="Updated safety protocols for reporting crimes anonymously. Your privacy is our priority."
            />
            <AnnouncementCard
              title="Community Awareness Campaign"
              date="March 10, 2026"
              content="Join our campaign to reduce crime rates through community participation and awareness."
            />
            <AnnouncementCard
              title="System Maintenance"
              date="March 5, 2026"
              content="Scheduled maintenance on March 20th. Service may be temporarily unavailable."
            />
          </div>
        </div>
      </section>

      {/* Report Crime Section */}
      <section id="report" className="py-32 bg-indigo-50">
        <div className="max-w-4xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Report a Crime</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Help make Ethiopia safer. Report incidents anonymously or with your account.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
            <ReportForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-8">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">C</div>
            <span className="text-xl font-extrabold tracking-tight">CMS Ethiopia</span>
          </div>
          <p className="text-gray-400 mb-10 max-w-md mx-auto">Federal Crime Management System of Ethiopia. Dedicated to transparency, safety, and the rule of law.</p>
          <div className="pt-10 border-t border-gray-800 text-gray-500 text-sm">
            © 2026 CMS Ethiopia. All rights reserved. Official Government Portal.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;