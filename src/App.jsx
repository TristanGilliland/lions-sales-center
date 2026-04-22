import React, { useState, useEffect } from 'react';
import { Phone, MessageSquare, LogOut, TrendingUp, Award, BarChart3, Zap, CheckCircle, XCircle, Truck, Mail, MapPin } from 'lucide-react';

export default function SalesCommandCenter() {
  const [authState, setAuthState] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterTag, setFilterTag] = useState('all');
  const [viewMode, setViewMode] = useState('pipeline');
  const [pipelineView, setPipelineView] = useState('open');
  const [dealStatus, setDealStatus] = useState({});

  const salesReps = [
    { id: 'tristan', name: 'Tristan (Owner)' },
    { id: 'michael', name: 'Michael' },
    { id: 'jake-b', name: 'Jake Bernard' },
    { id: 'catherine', name: 'Catherine' }
  ];

  const technicians = ['Ed Pfeiffer', 'Jake Casmay', 'Josh Fazio', 'Greg Janowski', 'Scott Deakin', 'Tyler Gilliland', 'Will Egoavil', 'Ethan Harker'];
  const allStaff = [...salesReps, ...technicians.map(tech => ({ id: tech, name: tech }))];

  const loadDeals = async () => {
    setLoading(true);
    try {
      const [hcpRes, completedRes] = await Promise.all([fetch('/.netlify/functions/hcp-fetch-estimates'), fetch('/.netlify/functions/fetch-completed-jobs')]);
      const hcpData = await hcpRes.json();
      const completedData = await completedRes.json();
      const allDeals = [...(hcpData.deals || []), ...(completedData.deals || [])];
      setDeals(allDeals);
      localStorage.setItem('lionsSalesDeals', JSON.stringify(allDeals));
    } catch (err) { console.error('Failed:', err); }
    setLoading(false);
  };

  useEffect(() => {
    const savedStatus = localStorage.getItem('lionsDealStatus');
    if (savedStatus) setDealStatus(JSON.parse(savedStatus));
    const saved = localStorage.getItem('lionsSalesDeals');
    if (saved) { try { setDeals(JSON.parse(saved)); } catch (e) { loadDeals(); } } else { loadDeals(); }
  }, []);

  useEffect(() => { localStorage.setItem('lionsDealStatus', JSON.stringify(dealStatus)); }, [dealStatus]);

  const getDealTags = (deal) => {
    if (deal.jobTag) return [deal.jobTag];
    const desc = (deal.description || '').toLowerCase();
    const tags = [];
    if (desc.includes('service')) tags.push('Service');
    if (desc.includes('install')) tags.push('Install');
    if (desc.includes('maintenance')) tags.push('Maintenance');
    if (!tags.length) tags.push('Sales');
    return tags;
  };

  const handleLogin = (id, type) => {
    if (type === 'rep') { setCurrentUser(salesReps.find(r => r.id === id)); setViewMode('pipeline'); } 
    else { setCurrentUser({ id, name: id }); setViewMode('performance'); }
    setUserType(type);
    setAuthState('dashboard');
  };

  const handleLogout = () => {
    setAuthState('login');
    setCurrentUser(null);
    setUserType(null);
  };

  const getDisplayPrice = (deal, status) => {
    return status.customPrice !== undefined ? status.customPrice : (deal.jobTotalAmount || 0);
  };

  if (authState === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-2xl p-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl font-bold">L</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-center text-slate-900 mb-2">Lions Sales Command Center</h1>
            <p className="text-center text-orange-600 font-semibold mb-8">We don't guess — we measure</p>
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">Sales Reps</h2>
                <div className="grid grid-cols-2 gap-2">
                  {salesReps.map(rep => (<button key={rep.id} onClick={() => handleLogin(rep.id, 'rep')} className="p-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-300 rounded-lg text-sm font-bold text-blue-900 transition">{rep.name}</button>))}
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">Technicians</h2>
                <div className="grid grid-cols-2 gap-2">
                  {technicians.map(tech => (<button key={tech} onClick={() => handleLogin(tech, 'tech')} className="p-3 bg-green-50 hover:bg-green-100 border-2 border-green-300 rounded-lg text-sm font-bold text-green-900 transition">{tech.split(' ')[0]}</button>))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const DealCard = ({ deal }) => {
    const status = dealStatus[deal.id] || {};
    const displayPrice = getDisplayPrice(deal, status);
    
    return (
      <div className="bg-gradient-to-br from-white to-blue-50 p-4 rounded-lg shadow-md border-2 border-blue-200">
        <div className="flex justify-between items-start mb-3">
          <div><h3 className="font-bold text-slate-900">{deal.customerName}</h3></div>
          <p className="font-bold text-orange-600 text-lg">${displayPrice.toLocaleString()}</p>
        </div>
        
        <div className="bg-blue-100 p-3 rounded-lg mb-3 space-y-1 text-sm">
          {deal.address && (<div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-blue-700 mt-0.5 flex-shrink-0" /><p className="text-slate-900">{deal.address}</p></div>)}
          {deal.phone && (<div className="flex items-center gap-2"><Phone className="w-4 h-4 text-blue-700 flex-shrink-0" /><p className="text-slate-900">{deal.phone}</p></div>)}
          {deal.email && (<div className="flex items-center gap-2"><Mail className="w-4 h-4 text-blue-700 flex-shrink-0" /><p className="text-slate-900 break-all">{deal.email}</p></div>)}
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {getDealTags(deal).map(tag => (<span key={tag} className="text-xs bg-orange-200 text-orange-900 px-2 py-1 rounded font-bold">{tag}</span>))}
        </div>

        <div className="flex gap-2 mb-3 border-t-2 border-blue-200 pt-3">
          {deal.phone && (<>
            <a href={`tel:${deal.phone}`} className="flex-1 flex items-center justify-center gap-1 text-sm text-white font-bold bg-blue-600 hover:bg-blue-700 rounded-lg py-2"><Phone className="w-4 h-4" /> Call</a>
            <a href={`sms:${deal.phone}`} className="flex-1 flex items-center justify-center gap-1 text-sm text-white font-bold bg-green-600 hover:bg-green-700 rounded-lg py-2"><MessageSquare className="w-4 h-4" /> Text</a>
          </>)}
        </div>

        <div className="flex gap-2 mb-3 border-t-2 border-blue-200 pt-3">
          <input type="number" value={displayPrice} onChange={(e) => setDealStatus(prev => ({ ...prev, [deal.id]: { ...prev[deal.id], customPrice: parseFloat(e.target.value) || 0 } }))} className="flex-1 px-3 py-2 border-2 border-orange-300 rounded-lg text-sm font-bold bg-white text-slate-900" placeholder="Price" />
        </div>

        <div className="space-y-2 border-t-2 border-blue-200 pt-3">
          <div className="flex gap-2">
            <button onClick={() => setDealStatus(prev => ({ ...prev, [deal.id]: { ...prev[deal.id], sold: !prev[deal.id]?.sold } }))} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-bold ${status.sold ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-900 hover:bg-slate-300'}`}><CheckCircle className="w-4 h-4" /> Sold</button>
            <button onClick={() => setDealStatus(prev => ({ ...prev, [deal.id]: { ...prev[deal.id], lost: !prev[deal.id]?.lost } }))} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-bold ${status.lost ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-900 hover:bg-slate-300'}`}><XCircle className="w-4 h-4" /> Lost</button>
          </div>
          <button onClick={() => setDealStatus(prev => ({ ...prev, [deal.id]: { ...prev[deal.id], equipped: !prev[deal.id]?.equipped } }))} className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-bold ${status.equipped ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-900 hover:bg-slate-300'}`}><Truck className="w-4 h-4" /> Equipment Ordered</button>
          <select value={status.assignedTech || ''} onChange={(e) => setDealStatus(prev => ({ ...prev, [deal.id]: { ...prev[deal.id], assignedTech: e.target.value } }))} className="w-full px-3 py-2 border-2 border-slate-400 rounded-lg text-sm font-semibold bg-white text-slate-900">
            <option value="">Assign Tech →</option>
            {technicians.map(tech => (<option key={tech} value={tech}>{tech}</option>))}
          </select>
          <select value={status.salesPerson || ''} onChange={(e) => setDealStatus(prev => ({ ...prev, [deal.id]: { ...prev[deal.id], salesPerson: e.target.value } }))} className="w-full px-3 py-2 border-2 border-orange-400 rounded-lg text-sm font-semibold bg-white text-slate-900">
            <option value="">Who Made Sale? →</option>
            {allStaff.map(person => (<option key={person.id} value={person.name}>{person.name}</option>))}
          </select>
        </div>
      </div>
    );
  };

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
      <div className="min-h-screen bg-gradient-to-b from-slate-100 to-blue-50">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-b-4 border-orange-500 sticky top-0 z-40 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div><h1 className="text-3xl font-bold text-white">Sales Pipeline</h1><p className="text-orange-300 font-semibold">{currentUser?.name}</p></div>
            <div className="flex gap-2">
              <button onClick={() => { localStorage.removeItem('lionsSalesDeals'); loadDeals(); }} className="p-2 hover:bg-slate-700 rounded-lg"><Zap className="w-5 h-5 text-orange-400" /></button>
              <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold"><LogOut className="w-4 h-4" /> Logout</button>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 py-2 flex gap-2 border-t border-slate-700">
            {['open', 'equipped', 'sold', 'lost'].map(view => (<button key={view} onClick={() => setPipelineView(view)} className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap ${pipelineView === view ? 'bg-orange-500 text-white' : 'text-white hover:bg-slate-700'}`}>{view === 'open' ? 'Open' : view === 'equipped' ? 'Equipment Ordered' : view === 'sold' ? 'Sold' : 'Lost'}</button>))}
          </div>
          <div className="max-w-7xl mx-auto px-4 py-3 border-t border-slate-700">
            <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} className="px-3 py-2 border-2 border-orange-500 rounded-lg text-sm font-bold bg-white text-slate-900">
              <option value="all">All Tags</option>
              <option value="Sales">Sales</option>
              <option value="Service">Service</option>
              <option value="Install">Install</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-6">
          {loading ? <p className="text-center py-12 text-slate-600 font-bold">Loading...</p> : filteredDeals.length === 0 ? <p className="text-center py-8 text-slate-600 font-bold">No deals</p> : <div className="grid gap-4">{filteredDeals.map(deal => <DealCard key={deal.id} deal={deal} />)}</div>}
        </div>
      </div>
    );
  }

  if (userType === 'tech' && viewMode === 'performance') {
    const techDeals = deals.filter(d => d.commissionTech === currentUser.name);
    const totalRevenue = techDeals.reduce((sum, d) => sum + (d.commissionAmount || 0), 0);
    const jobCount = techDeals.length;
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 to-green-50">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-b-4 border-orange-500 sticky top-0 z-40 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">{currentUser?.name}</h1>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold"><LogOut className="w-4 h-4" /> Logout</button>
          </div>
          <div className="max-w-7xl mx-auto px-4 py-2 flex gap-2 border-t border-slate-700">
            <button onClick={() => setViewMode('performance')} className="px-4 py-2 rounded-lg font-bold bg-orange-500 text-white">My Stats</button>
            <button onClick={() => setViewMode('history')} className="px-4 py-2 rounded-lg font-bold text-white hover:bg-slate-700">History</button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-orange-100 to-orange-200 p-6 rounded-lg shadow-lg border-2 border-orange-400"><p className="text-orange-800 text-sm font-bold">Commission</p><p className="text-4xl font-bold text-orange-900">${totalRevenue.toLocaleString()}</p><Award className="w-8 h-8 text-orange-600 mt-2" /></div>
            <div className="bg-gradient-to-br from-green-100 to-green-200 p-6 rounded-lg shadow-lg border-2 border-green-400"><p className="text-green-800 text-sm font-bold">Jobs Completed</p><p className="text-4xl font-bold text-green-900">{jobCount}</p><TrendingUp className="w-8 h-8 text-green-600 mt-2" /></div>
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-6 rounded-lg shadow-lg border-2 border-blue-400"><p className="text-blue-800 text-sm font-bold">Avg Commission</p><p className="text-4xl font-bold text-blue-900">${jobCount > 0 ? Math.round(totalRevenue / jobCount).toLocaleString() : 0}</p><BarChart3 className="w-8 h-8 text-blue-600 mt-2" /></div>
          </div>
        </div>
      </div>
    );
  }

  if (userType === 'tech' && viewMode === 'history') {
    const techDeals = deals.filter(d => d.commissionTech === currentUser.name);
    const groupedByMonth = {};
    techDeals.forEach(deal => {
      const date = deal.completedDate || new Date().toISOString().split('T')[0];
      const month = date.substring(0, 7);
      if (!groupedByMonth[month]) groupedByMonth[month] = [];
      groupedByMonth[month].push(deal);
    });
    const sortedMonths = Object.keys(groupedByMonth).sort().reverse();

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 to-green-50">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-b-4 border-orange-500 sticky top-0 z-40 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">{currentUser?.name} - History</h1>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold"><LogOut className="w-4 h-4" /> Logout</button>
          </div>
          <div className="max-w-7xl mx-auto px-4 py-2 flex gap-2 border-t border-slate-700">
            <button onClick={() => setViewMode('performance')} className="px-4 py-2 rounded-lg font-bold text-white hover:bg-slate-700">My Stats</button>
            <button onClick={() => setViewMode('history')} className="px-4 py-2 rounded-lg font-bold bg-orange-500 text-white">History</button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-6">
          {sortedMonths.length === 0 ? <p className="text-center py-8 text-slate-600 font-bold">No jobs</p> : sortedMonths.map(month => (<div key={month} className="mb-6"><h2 className="text-lg font-bold text-slate-900 mb-3 bg-orange-200 px-3 py-2 rounded-lg">{month}</h2><div className="space-y-2">{groupedByMonth[month].map(deal => (<div key={deal.id} className="bg-gradient-to-r from-white to-green-50 p-4 rounded-lg border-2 border-green-300"><div className="flex justify-between"><div><p className="font-bold text-slate-900">{deal.customerName}</p><p className="text-sm text-slate-600">{deal.completedDate}</p></div><p className="font-bold text-orange-600 text-lg">${(deal.commissionAmount || 0).toLocaleString()}</p></div></div>))}</div></div>))}
        </div>
      </div>
    );
  }

  return null;
}
