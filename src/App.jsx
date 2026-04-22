import React, { useState, useEffect } from 'react';
import { ChevronDown, Phone, MessageSquare, Eye, X, Plus, LogOut, TrendingUp, Activity, Clock, Award, BarChart3, Zap } from 'lucide-react';

export default function SalesCommandCenter() {
  const [authState, setAuthState] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterTag, setFilterTag] = useState('all');
  const [viewMode, setViewMode] = useState('pipeline');
  const [installPrompt, setInstallPrompt] = useState(null);

  const salesReps = [
    { id: 'tristan', name: 'Tristan (Owner)' },
    { id: 'michael', name: 'Michael' },
    { id: 'jake-b', name: 'Jake Bernard' },
    { id: 'catherine', name: 'Catherine' }
  ];

  const technicians = [
    'Ed Pfeiffer', 'Jake Casmay', 'Josh Fazio', 'Greg Janowski',
    'Scott Deakin', 'Tyler Gilliland', 'Will Egoavil', 'Ethan Harker'
  ];

  // PWA Install
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Load all deals
  const loadDeals = async () => {
    setLoading(true);
    try {
      const [hcpRes, completedRes] = await Promise.all([
        fetch('/.netlify/functions/hcp-fetch-estimates'),
        fetch('/.netlify/functions/fetch-completed-jobs')
      ]);

      const hcpData = await hcpRes.json();
      const completedData = await completedRes.json();

      const allDeals = [
        ...(hcpData.deals || []),
        ...(completedData.deals || [])
      ];

      setDeals(allDeals);
      localStorage.setItem('lionsSalesDeals', JSON.stringify(allDeals));
    } catch (err) {
      console.error('Failed to load deals:', err);
    }
    setLoading(false);
  };

  // Load deals on mount
  useEffect(() => {
    const saved = localStorage.getItem('lionsSalesDeals');
    if (saved) {
      try {
        setDeals(JSON.parse(saved));
      } catch (e) {
        loadDeals();
      }
    } else {
      loadDeals();
    }
  }, []);

  // Helper functions
  const getDealTags = (deal) => {
    if (deal.jobTag) return [deal.jobTag];
    
    const desc = (deal.description || '').toLowerCase();
    const tags = [];
    if (desc.includes('service') || desc.includes('repair')) tags.push('Service');
    if (desc.includes('install')) tags.push('Install');
    if (desc.includes('maintenance') || desc.includes('tune')) tags.push('Maintenance');
    if (desc.includes('callback')) tags.push('Callbacks');
    if (!tags.length) tags.push('Sales');
    return tags;
  };

  const calculateCommission = (deal) => {
    if (deal.commissionAmount !== undefined) {
      return deal.commissionAmount;
    }
    if (deal.source === 'Completed') {
      return deal.commissionAmount || 0;
    }
    return 0;
  };

const handleLogin = (id, type) => {
  if (type === 'rep') {
    setCurrentUser(salesReps.find(r => r.id === id));
    setViewMode('pipeline');
  } else {
    setCurrentUser({ id, name: id });
    setViewMode('performance'); // Set to performance for techs
  }
  setUserType(type);
  setAuthState('dashboard');
};
  const handleLogout = () => {
    setAuthState('login');
    setCurrentUser(null);
    setUserType(null);
    setViewMode('pipeline');
  };

  const handleRefresh = () => {
    localStorage.removeItem('lionsSalesDeals');
    loadDeals();
  };

  // Login Screen
  if (authState === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-2xl p-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-2xl font-bold">L</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-center text-slate-900 mb-2">Lions Sales Command Center</h1>
            <p className="text-center text-slate-600 mb-8">We don't guess — we measure</p>

            <div className="space-y-6">
              {/* Sales Reps */}
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">Sales Reps</h2>
                <div className="grid grid-cols-2 gap-2">
                  {salesReps.map(rep => (
                    <button
                      key={rep.id}
                      onClick={() => handleLogin(rep.id, 'rep')}
                      className="p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm font-medium text-blue-900 transition"
                    >
                      {rep.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Technicians */}
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">Technicians</h2>
                <div className="grid grid-cols-2 gap-2">
                  {technicians.map(tech => (
                    <button
                      key={tech}
                      onClick={() => handleLogin(tech, 'tech')}
                      className="p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-sm font-medium text-green-900 transition"
                    >
                      {tech.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard
const loadDeals = async () => {
  setLoading(true);
  try {
    const [hcpRes, completedRes] = await Promise.all([
      fetch('/.netlify/functions/hcp-fetch-estimates'),
      fetch('/.netlify/functions/fetch-completed-jobs')
    ]);

    const hcpData = await hcpRes.json();
    const completedData = await completedRes.json();

    console.log('HCP deals:', hcpData.deals?.length);
    console.log('Completed deals:', completedData.deals?.length);
    console.log('Completed data sample:', completedData.deals?.[0]);

    const allDeals = [
      ...(hcpData.deals || []),
      ...(completedData.deals || [])
    ];

    setDeals(allDeals);
    localStorage.setItem('lionsSalesDeals', JSON.stringify(allDeals));
  } catch (err) {
    console.error('Failed to load deals:', err);
  }
  setLoading(false);
};
    return true;
  });

  if (viewMode === 'pipeline' && userType === 'rep') {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Sales Pipeline</h1>
              <p className="text-slate-600">{currentUser.name}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
                title="Refresh data"
              >
                <Zap className="w-5 h-5 text-orange-600" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border-b border-slate-200 sticky top-16 z-30">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="all">All Tags</option>
              <option value="Sales">Sales</option>
              <option value="Service">Service</option>
              <option value="Install">Install</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Callbacks">Callbacks</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-slate-600">Loading deals...</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredDeals.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No deals found</p>
              ) : (
                filteredDeals.map(deal => (
                  <div key={deal.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-slate-900">{deal.customerName}</h3>
                        <p className="text-sm text-slate-600">{deal.address}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">${(deal.jobTotalAmount || deal.amount || 0).toLocaleString()}</p>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          deal.sold ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {deal.stage || deal.work_status || 'Open'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {getDealTags(deal).map(tag => (
                        <span key={tag} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    {deal.phone && (
                      <div className="flex gap-2 mt-3">
                        <a href={`tel:${deal.phone}`} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                          <Phone className="w-4 h-4" />
                          Call
                        </a>
                        <a href={`sms:${deal.phone}`} className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700">
                          <MessageSquare className="w-4 h-4" />
                          SMS
                        </a>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Tech Dashboard
  if (userType === 'tech') {
    const techDeals = deals.filter(d => d.commissionTech === currentUser.name || d.customerName);

    if (viewMode === 'performance') {
      const totalRevenue = techDeals.reduce((sum, d) => sum + (d.commissionAmount || 0), 0);
      const jobCount = techDeals.length;
      const avgJob = jobCount > 0 ? Math.round(totalRevenue / jobCount) : 0;

      return (
        <div className="min-h-screen bg-slate-50">
          <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-slate-900">{currentUser.name}</h1>
              <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
            <div className="max-w-7xl mx-auto px-4 py-2 flex gap-2 border-t border-slate-200">
              {['performance', 'history'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    viewMode === mode
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {mode === 'performance' ? 'My Stats' : 'History'}
                </button>
              ))}
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Commission</p>
                    <p className="text-3xl font-bold text-slate-900">${totalRevenue.toLocaleString()}</p>
                  </div>
                  <Award className="w-8 h-8 text-orange-600" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Jobs Completed</p>
                    <p className="text-3xl font-bold text-slate-900">{jobCount}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Avg Commission</p>
                    <p className="text-3xl font-bold text-slate-900">${avgJob.toLocaleString()}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (viewMode === 'history') {
      const groupedByMonth = {};
      techDeals.forEach(deal => {
        const date = deal.completedDate || deal.lastActivity || new Date().toISOString().split('T')[0];
        const month = date.substring(0, 7);
        if (!groupedByMonth[month]) groupedByMonth[month] = [];
        groupedByMonth[month].push(deal);
      });

      const sortedMonths = Object.keys(groupedByMonth).sort().reverse();

      return (
        <div className="min-h-screen bg-slate-50">
          <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-slate-900">{currentUser.name} - History</h1>
              <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
            <div className="max-w-7xl mx-auto px-4 py-2 flex gap-2 border-t border-slate-200">
              {['performance', 'history'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    viewMode === mode
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {mode === 'performance' ? 'My Stats' : 'History'}
                </button>
              ))}
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 py-6">
            {sortedMonths.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No completed jobs yet</p>
            ) : (
              sortedMonths.map(month => (
                <div key={month} className="mb-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-3">{month}</h2>
                  <div className="space-y-2">
                    {groupedByMonth[month].map(deal => (
                      <div key={deal.id} className="bg-white p-4 rounded-lg border border-slate-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-slate-900">{deal.customerName}</p>
                            <p className="text-sm text-slate-600">{deal.completedDate || 'N/A'}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-900">${(calculateCommission(deal) || 0).toLocaleString()}</p>
                            <p className="text-xs text-slate-600">{getDealTags(deal)[0]}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-right text-slate-600 text-sm font-medium">
                    Total: ${groupedByMonth[month].reduce((sum, d) => sum + (calculateCommission(d) || 0), 0).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }
  }

  return null;
}
