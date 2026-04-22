import React, { useState, useEffect } from 'react';
import { Phone, MessageSquare, LogOut, TrendingUp, Award, BarChart3, Zap, CheckCircle, XCircle, Truck } from 'lucide-react';

export default function SalesCommandCenter() {
  const [authState, setAuthState] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterTag, setFilterTag] = useState('all');
  const [viewMode, setViewMode] = useState('pipeline');
  const [pipelineView, setPipelineView] = useState('open'); // open, equipped, sold, lost
  const [dealStatus, setDealStatus] = useState({});

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

  // Load deals
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

  // Load on mount
  useEffect(() => {
    const saved = localStorage.getItem('lionsSalesDeals');
    const savedStatus = localStorage.getItem('lionsDealStatus');
    if (savedStatus) {
      setDealStatus(JSON.parse(savedStatus));
    }
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

  // Save deal status
  useEffect(() => {
    localStorage.setItem('lionsDealStatus', JSON.stringify(dealStatus));
  }, [dealStatus]);

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

  const toggleSold = (dealId) => {
    setDealStatus(prev => ({
      ...prev,
      [dealId]: { ...prev[dealId], sold: !prev[dealId]?.sold }
    }));
  };

  const toggleLost = (dealId) => {
    setDealStatus(prev => ({
      ...prev,
      [dealId]: { ...prev[dealId], lost: !prev[dealId]?.lost }
    }));
  };

  const toggleEquipped = (dealId) => {
    setDealStatus(prev => ({
      ...prev,
      [dealId]: { ...prev[dealId], equipped: !prev[dealId]?.equipped }
    }));
  };

  const setAssignedTech = (dealId, tech) => {
    setDealStatus(prev => ({
      ...prev,
      [dealId]: { ...prev[dealId], assignedTech: tech }
    }));
  };

  const handleLogin = (id, type) => {
    if (type === 'rep') {
      setCurrentUser(salesReps.find(r => r.id === id));
      setViewMode('pipeline');
    } else {
      setCurrentUser({ id, name: id });
      setViewMode('performance');
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

  // Deal Card Component
  const DealCard = ({ deal, isRep }) => {
    const status = dealStatus[deal.id] || {};
    const isSold = status.sold;
    const isLost = status.lost;
    const isEquipped = status.equipped;

    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-slate-900">{deal.customerName}</h3>
            <p className="text-sm text-slate-600">{deal.address}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-900">${(deal.jobTotalAmount || deal.amount || 0).toLocaleString()}</p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {getDealTags(deal).map(tag => (
            <span key={tag} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">{tag}</span>
          ))}
        </div>

        {isRep && (
          <div className="space-y-3 mb-3 border-t border-slate-200 pt-3">
            {/* Sold/Lost Toggles */}
            <div className="flex gap-2">
              <button
                onClick={() => toggleSold(deal.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isSold ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                Sold
              </button>
              <button
                onClick={() => toggleLost(deal.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isLost ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <XCircle className="w-4 h-4" />
                Lost
              </button>
            </div>

            {/* Equipment Ordered */}
            <button
              onClick={() => toggleEquipp

rm src/App.jsx
cat > src/App.jsx << 'ENDFILE'
import React, { useState, useEffect } from 'react';
import { Phone, MessageSquare, LogOut, TrendingUp, Award, BarChart3, Zap, CheckCircle, XCircle, Truck } from 'lucide-react';

export default function SalesCommandCenter() {
  const [authState, setAuthState] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterTag, setFilterTag] = useState('all');
  const [viewMode, setViewMode] = useState('pipeline');
  const [pipelineView, setPipelineView] = useState('open'); // open, equipped, sold, lost
  const [dealStatus, setDealStatus] = useState({});

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

  // Load deals
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

  // Load on mount
  useEffect(() => {
    const saved = localStorage.getItem('lionsSalesDeals');
    const savedStatus = localStorage.getItem('lionsDealStatus');
    if (savedStatus) {
      setDealStatus(JSON.parse(savedStatus));
    }
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

  // Save deal status
  useEffect(() => {
    localStorage.setItem('lionsDealStatus', JSON.stringify(dealStatus));
  }, [dealStatus]);

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

  const toggleSold = (dealId) => {
    setDealStatus(prev => ({
      ...prev,
      [dealId]: { ...prev[dealId], sold: !prev[dealId]?.sold }
    }));
  };

  const toggleLost = (dealId) => {
    setDealStatus(prev => ({
      ...prev,
      [dealId]: { ...prev[dealId], lost: !prev[dealId]?.lost }
    }));
  };

  const toggleEquipped = (dealId) => {
    setDealStatus(prev => ({
      ...prev,
      [dealId]: { ...prev[dealId], equipped: !prev[dealId]?.equipped }
    }));
  };

  const setAssignedTech = (dealId, tech) => {
    setDealStatus(prev => ({
      ...prev,
      [dealId]: { ...prev[dealId], assignedTech: tech }
    }));
  };

  const handleLogin = (id, type) => {
    if (type === 'rep') {
      setCurrentUser(salesReps.find(r => r.id === id));
      setViewMode('pipeline');
    } else {
      setCurrentUser({ id, name: id });
      setViewMode('performance');
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

  // Deal Card Component
  const DealCard = ({ deal, isRep }) => {
    const status = dealStatus[deal.id] || {};
    const isSold = status.sold;
    const isLost = status.lost;
    const isEquipped = status.equipped;

    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-slate-900">{deal.customerName}</h3>
            <p className="text-sm text-slate-600">{deal.address}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-900">${(deal.jobTotalAmount || deal.amount || 0).toLocaleString()}</p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {getDealTags(deal).map(tag => (
            <span key={tag} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">{tag}</span>
          ))}
        </div>

        {isRep && (
          <div className="space-y-3 mb-3 border-t border-slate-200 pt-3">
            {/* Sold/Lost Toggles */}
            <div className="flex gap-2">
              <button
                onClick={() => toggleSold(deal.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isSold ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                Sold
              </button>
              <button
                onClick={() => toggleLost(deal.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isLost ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <XCircle className="w-4 h-4" />
                Lost
              </button>
            </div>

            {/* Equipment Ordered */}
            <button
              onClick={() => toggleEquipped(deal.id)}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                isEquipped ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Truck className="w-4 h-4" />
              Equipment Ordered
            </button>

            {/* Tech Commission Dropdown */}
            <select
              value={status.assignedTech || deal.commissionTech || ''}
              onChange={(e) => setAssignedTech(deal.id, e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="">Assign Tech</option>
              {technicians.map(tech => (
                <option key={tech} value={tech}>{tech}</option>
              ))}
            </select>
          </div>
        )}

        {/* Contact */}
        {deal.phone && (
          <div className="flex gap-2 pt-3 border-t border-slate-200">
            <a href={`tel:${deal.phone}`} className="flex-1 flex items-center justify-center gap-1 text-sm text-blue-600 hover:text-blue-700">
              <Phone className="w-4 h-4" />
              Call
            </a>
            <a href={`sms:${deal.phone}`} className="flex-1 flex items-center justify-center gap-1 text-sm text-green-600 hover:text-green-700">
              <MessageSquare className="w-4 h-4" />
              SMS
            </a>
          </div>
        )}
      </div>
    );
  };

  // Sales Rep Pipeline
  if (viewMode === 'pipeline' && userType === 'rep') {
    const filteredDeals = deals.filter(deal => {
      if (filterTag !== 'all' && !getDealTags(deal).includes(filterTag)) return false;
      const status = dealStatus[deal.id] || {};
      if (pipelineView === 'open' && !status.sold && !status.lost) return true;
      if (pipelineView === 'equipped' && status.equipped && !status.sold && !status.lost) return true;
      if (pipelineView === 'sold' && status.sold) return true;
      if (pipelineView === 'lost' && status.lost) return true;
      return false;
    });

    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Sales Pipeline</h1>
              <p className="text-slate-600">{currentUser?.name}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleRefresh} className="p-2 hover:bg-slate-100 rounded-lg">
                <Zap className="w-5 h-5 text-orange-600" />
              </button>
              <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>

          {/* Pipeline Views */}
          <div className="max-w-7xl mx-auto px-4 py-2 flex gap-2 border-t border-slate-200 overflow-x-auto">
            {[
              { id: 'open', label: 'Open' },
              { id: 'equipped', label: 'Equipment Ordered' },
              { id: 'sold', label: 'Sold' },
              { id: 'lost', label: 'Lost' }
            ].map(view => (
              <button
                key={view.id}
                onClick={() => setPipelineView(view.id)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                  pipelineView === view.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {view.label}
              </button>
            ))}
          </div>

          {/* Tag Filter */}
          <div className="max-w-7xl mx-auto px-4 py-2 border-t border-slate-200">
            <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
              <option value="all">All Tags</option>
              <option value="Sales">Sales</option>
              <option value="Service">Service</option>
              <option value="Install">Install</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Callbacks">Callbacks</option>
            </select>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          {loading ? (
            <p className="text-center text-slate-600 py-12">Loading deals...</p>
          ) : filteredDeals.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No deals in this view</p>
          ) : (
            <div className="grid gap-4">
              {filteredDeals.map(deal => (
                <DealCard key={deal.id} deal={deal} isRep={true} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Tech Performance
  if (userType === 'tech' && viewMode === 'performance') {
    const techDeals = deals.filter(d => d.commissionTech === currentUser.name);
    const totalRevenue = techDeals.reduce((sum, d) => sum + (d.commissionAmount || 0), 0);
    const jobCount = techDeals.length;
    const avgJob = jobCount > 0 ? Math.round(totalRevenue / jobCount) : 0;

    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">{currentUser?.name}</h1>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
          <div className="max-w-7xl mx-auto px-4 py-2 flex gap-2 border-t border-slate-200">
            <button onClick={() => setViewMode('performance')} className="px-4 py-2 rounded-lg font-medium bg-blue-600 text-white">My Stats</button>
            <button onClick={() => setViewMode('history')} className="px-4 py-2 rounded-lg font-medium text-slate-700 hover:bg-slate-100">History</button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-3 gap-4">
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

  // Tech History
  if (userType === 'tech' && viewMode === 'history') {
    const techDeals = deals.filter(d => d.commissionTech === currentUser.name);
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
            <h1 className="text-2xl font-bold text-slate-900">{currentUser?.name} - History</h1>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
          <div className="max-w-7xl mx-auto px-4 py-2 flex gap-2 border-t border-slate-200">
            <button onClick={() => setViewMode('performance')} className="px-4 py-2 rounded-lg font-medium text-slate-700 hover:bg-slate-100">My Stats</button>
            <button onClick={() => setViewMode('history')} className="px-4 py-2 rounded-lg font-medium bg-blue-600 text-white">History</button>
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
                          <p className="font-bold text-slate-900">${(deal.commissionAmount || 0).toLocaleString()}</p>
                          <p className="text-xs text-slate-600">{deal.jobTag}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-right text-slate-600 text-sm font-medium">
                  Total: ${groupedByMonth[month].reduce((sum, d) => sum + (d.commissionAmount || 0), 0).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return null;
}
