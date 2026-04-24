import React, { useState, useEffect } from 'react';
import { Phone, MessageSquare, LogOut, TrendingUp, Award, BarChart3, Zap, CheckCircle, XCircle, Truck, Mail, MapPin, ChevronRight } from 'lucide-react';

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
    { id: 'tristan', name: 'Tristan' },
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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-10">
            <div className="flex justify-center mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold tracking-tighter">L</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-center text-slate-900 mb-2 tracking-tight">Lions Sales</h1>
            <p className="text-center text-amber-700 font-semibold mb-10 text-sm">Command Center</p>
            <div className="space-y-8">
              <div>
                <h2 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-widest">Sales Representatives</h2>
                <div className="grid grid-cols-2 gap-3">
                  {salesReps.map(rep => (<button key={rep.id} onClick={() => handleLogin(rep.id, 'rep')} className="p-3 bg-slate-50 hover:bg-amber-50 border-2 border-slate-200 hover:border-amber-400 rounded-lg text-sm font-semibold text-slate-900 transition duration-200">{rep.name}</button>))}
                </div>
              </div>
              <div className="border-t border-slate-200 pt-8">
                <h2 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-widest">Technicians</h2>
                <div className="grid grid-cols-2 gap-3">
                  {technicians.map(tech => (<button key={tech} onClick={() => handleLogin(tech, 'tech')} className="p-3 bg-slate-50 hover:bg-emerald-50 border-2 border-slate-200 hover:border-emerald-400 rounded-lg text-sm font-semibold text-slate-900 transition duration-200">{tech.split(' ')[0]}</button>))}
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
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md border border-slate-200 hover:border-slate-300 transition overflow-hidden">
        <div className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 text-lg mb-1">{deal.customerName}</h3>
              <p className="text-sm text-slate-500">{deal.phone || 'No phone'}</p>
            </div>
            <p className="font-bold text-amber-700 text-2xl ml-4">${displayPrice.toLocaleString()}</p>
          </div>

          {(deal.address || deal.phone || deal.email) && (
            <div className="bg-slate-50 p-4 rounded-lg mb-4 space-y-2 text-sm">
              {deal.address && (<div className="flex items-start gap-3"><MapPin className="w-4 h-4 text-slate-600 mt-0.5 flex-shrink-0" /><p className="text-slate-700">{deal.address}</p></div>)}
              {deal.email && (<div className="flex items-center gap-3"><Mail className="w-4 h-4 text-slate-600 flex-shrink-0" /><p className="text-slate-700 break-all">{deal.email}</p></div>)}
            </div>
          )}

          <div className="flex gap-2 mb-4">
            {getDealTags(deal).map(tag => (<span key={tag} className="text-xs bg-amber-100 text-amber-900 px-3 py-1 rounded-full font-semibold">{tag}</span>))}
          </div>

          {deal.phone && (
            <div className="flex gap-2 mb-4">
              <a href={`tel:${deal.phone}`} className="flex-1 flex items-center justify-center gap-2 text-sm text-white font-semibold bg-blue-600 hover:bg-blue-700 rounded-lg py-2.5 transition"><Phone className="w-4 h-4" /> Call</a>
              <a href={`sms:${deal.phone}`} className="flex-1 flex items-center justify-center gap-2 text-sm text-white font-semibold bg-emerald-600 hover:bg-emerald-700 rounded-lg py-2.5 transition"><MessageSquare className="w-4 h-4" /> Text</a>
            </div>
          )}

          <div className="border-t border-slate-200 pt-4 space-y-3">
            <input type="number" value={displayPrice} onChange={(e) => setDealStatus(prev => ({ ...prev, [deal.id]: { ...prev[deal.id], customPrice: parseFloat(e.target.value) || 0 } }))} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold bg-white text-slate-900 placeholder-slate-500" placeholder="Edit price" />

            <div className="flex gap-2">
              <button onClick={() => setDealStatus(prev => ({ ...prev, [deal.id]: { ...prev[deal.id], sold: !prev[deal.id]?.sold } }))} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${status.sold ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}><CheckCircle className="w-4 h-4" /> Sold</button>
              <button onClick={() => setDealStatus(prev => ({ ...prev, [deal.id]: { ...prev[deal.id], lost: !prev[deal.id]?.lost } }))} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${status.lost ? 'bg-red-600 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}><XCircle className="w-4 h-4" /> Lost</button>
            </div>
            <button onClick={() => setDealStatus(prev => ({ ...prev, [deal.id]: { ...prev[deal.id], equipped: !prev[deal.id]?.equipped } }))} className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${status.equipped ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}><Truck className="w-4 h-4" /> Equipment Ordered</button>
            <select value={status.assignedTech || ''} onChange={(e) => setDealStatus(prev => ({ ...prev, [deal.id]: { ...prev[deal.id], assignedTech: e.target.value } }))} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold bg-white text-slate-900"><option value="">Assign Tech</option>{technicians.map(tech => (<option key={tech} value={tech}>{tech}</option>))}</select>
            <select value={status.salesPerson || ''} onChange={(e) => setDealStatus(prev => ({ ...prev, [deal.id]: { ...prev[deal.id], salesPerson: e.target.value } }))} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold bg-white text-slate-900"><option value="">Who Made Sale</option>{allStaff.map(person => (<option key={person.id} value={person.name}>{person.name}</option>))}</select>
          </div>
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
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Sales Pipeline</h1>
                <p className="text-sm text-slate-600 mt-1">{currentUser?.name}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { localStorage.removeItem('lionsSalesDeals'); loadDeals(); }} className="p-2.5 hover:bg-slate-100 rounded-lg transition"><Zap className="w-5 h-5 text-amber-600" /></button>
                <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-semibold text-sm transition"><LogOut className="w-4 h-4" /> Logout</button>
              </div>
            </div>
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {['open', 'equipped', 'sold', 'lost'].map(view => (<button key={view} onClick={() => setPipelineView(view)} className={`px-4 py-2.5 rounded-lg font-semibold text-sm whitespace-nowrap transition ${pipelineView === view ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{view === 'open' ? 'Open' : view === 'equipped' ? 'Equipment Ordered' : view === 'sold' ? 'Sold' : 'Lost'}</button>))}
            </div>
            <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold bg-white text-slate-900"><option value="all">All Tags</option><option value="Sales">Sales</option><option value="Service">Service</option><option value="Install">Install</option><option value="Maintenance">Maintenance</option></select>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-8">
          {loading ? <p className="text-center py-12 text-slate-500">Loading...</p> : filteredDeals.length === 0 ? <p className="text-center py-8 text-slate-500">No deals in this view</p> : <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{filteredDeals.map(deal => <DealCard key={deal.id} deal={deal} />)}</div>}
        </div>
      </div>
    );
  }

  if (userType === 'tech' && viewMode === 'performance') {
    const techDeals = deals.filter(d => d.commissionTech === currentUser.name);
    const totalRevenue = techDeals.reduce((sum, d) => sum + (d.commissionAmount || 0), 0);
    const jobCount = techDeals.length;
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-slate-900">{currentUser?.name}</h1>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-semibold text-sm transition"><LogOut className="w-4 h-4" /> Logout</button>
          </div>
          <div className="max-w-7xl mx-auto px-6 pb-4 flex gap-2 border-t border-slate-200">
            <button onClick={() => setViewMode('performance')} className="px-4 py-3 rounded-t-lg font-semibold text-sm bg-amber-600 text-white">Performance</button>
            <button onClick={() => setViewMode('history')} className="px-4 py-3 rounded-t-lg font-semibold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200">History</button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-semibold text-slate-600 mb-2">Total Commission</p><p className="text-4xl font-bold text-amber-700">${totalRevenue.toLocaleString()}</p></div><Award className="w-10 h-10 text-amber-200" /></div></div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-semibold text-slate-600 mb-2">Jobs Completed</p><p className="text-4xl font-bold text-slate-900">{jobCount}</p></div><TrendingUp className="w-10 h-10 text-slate-200" /></div></div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-semibold text-slate-600 mb-2">Avg Commission</p><p className="text-4xl font-bold text-slate-900">${jobCount > 0 ? Math.round(totalRevenue / jobCount).toLocaleString() : 0}</p></div><BarChart3 className="w-10 h-10 text-slate-200" /></div></div>
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
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-slate-900">{currentUser?.name} — History</h1>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-semibold text-sm transition"><LogOut className="w-4 h-4" /> Logout</button>
          </div>
          <div className="max-w-7xl mx-auto px-6 pb-4 flex gap-2 border-t border-slate-200">
            <button onClick={() => setViewMode('performance')} className="px-4 py-3 rounded-t-lg font-semibold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200">Performance</button>
            <button onClick={() => setViewMode('history')} className="px-4 py-3 rounded-t-lg font-semibold text-sm bg-amber-600 text-white">History</button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-8">
          {sortedMonths.length === 0 ? <p className="text-center py-12 text-slate-500">No jobs completed</p> : sortedMonths.map(month => (<div key={month} className="mb-8"><h2 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-widest">{month}</h2><div className="space-y-2">{groupedByMonth[month].map(deal => (<div key={deal.id} className="bg-white p-4 rounded-lg border border-slate-200 hover:border-slate-300 flex justify-between items-center transition"><div><p className="font-semibold text-slate-900">{deal.customerName}</p><p className="text-sm text-slate-500">{deal.completedDate}</p></div><p className="font-bold text-amber-700 text-lg">${(deal.commissionAmount || 0).toLocaleString()}</p></div>))}</div></div>))}
        </div>
      </div>
    );
  }

  return null;
}
