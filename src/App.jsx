import React, { useState, useEffect, useMemo } from 'react';
import { LogOut, Phone, MessageSquare, Search } from 'lucide-react';

export default function App() {
  const [screen, setScreen] = useState('login');
  const [user, setUser] = useState(null);
  const [deals, setDeals] = useState([]);
  const [dealState, setDealState] = useState({});
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const salesTeam = [
    { id: 'tristan', name: 'Tristan Gilliland' },
    { id: 'michael', name: 'Michael Nicoletti' },
    { id: 'jake', name: 'Jake Bernard' },
    { id: 'catherine', name: 'Catherine Scheswohl' }
  ];

  const techTeam = [
    'Ed Pfeiffer', 'Jake Casmay', 'Josh Fazio', 'Greg Janowski',
    'Scott Deakin', 'Tyler Gilliland', 'Will Egoavil', 'Ethan Harker'
  ];

  const loadDeals = async () => {
    try {
      const [hcp, comp] = await Promise.all([
        fetch('/.netlify/functions/hcp-fetch').then(r => r.json()).catch(() => ({ deals: [] })),
        fetch('/.netlify/functions/completed-fetch').then(r => r.json()).catch(() => ({ deals: [] }))
      ]);
      const all = [...(hcp.deals || []), ...(comp.deals || [])];
      setDeals(all);
    } catch (e) {
      console.error('Load error:', e);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('dealState');
    if (saved) setDealState(JSON.parse(saved));
    loadDeals();
  }, []);

  useEffect(() => {
    localStorage.setItem('dealState', JSON.stringify(dealState));
  }, [dealState]);

  const updateState = (id, field, value) => {
    setDealState(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const filtered = useMemo(() => {
    let result = deals;
    if (user?.type === 'tech') {
      result = result.filter(d => dealState[d.id]?.assignedTech === user.name);
    }
    if (search) {
      result = result.filter(d =>
        d.customerName.toLowerCase().includes(search.toLowerCase()) ||
        d.phone.includes(search)
      );
    }
    if (filter !== 'all') {
      result = result.filter(d => (dealState[d.id]?.stage || 'open') === filter);
    }
    return result;
  }, [deals, dealState, search, filter, user]);

  const getTypeStyle = (type) => {
    if (!type) return 'bg-slate-700 text-slate-200 border-slate-600';
    const lower = type.toLowerCase();
    if (lower.includes('service')) return 'bg-cyan-700 text-cyan-100 border-cyan-600';
    if (lower.includes('maintenance')) return 'bg-purple-700 text-purple-100 border-purple-600';
    if (lower.includes('install')) return 'bg-orange-700 text-orange-100 border-orange-600';
    return 'bg-indigo-700 text-indigo-100 border-indigo-600';
  };

  if (screen === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-6">
        <div className="w-full max-w-5xl">
          <div className="text-center mb-16">
            <div className="text-6xl mb-4">🦁</div>
            <h1 className="text-5xl font-bold text-white mb-1">Lions Operations</h1>
            <p className="text-amber-500 font-semibold">Sales Command Center</p>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Sales Team</h2>
              <div className="space-y-2">
                {salesTeam.map(rep => (
                  <button key={rep.id} onClick={() => { setUser({ name: rep.name, type: 'rep' }); setScreen('dash'); }} className="w-full p-3 bg-blue-900/40 hover:bg-blue-800/60 border border-blue-700/50 rounded text-left text-blue-100 font-semibold text-sm transition">
                    {rep.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Technicians</h2>
              <div className="space-y-2">
                {techTeam.map(tech => (
                  <button key={tech} onClick={() => { setUser({ name: tech, type: 'tech' }); setScreen('dash'); }} className="w-full p-3 bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-700/50 rounded text-left text-emerald-100 font-semibold text-sm transition">
                    {tech}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'dash') {
    const isTech = user?.type === 'tech';
    const open = filtered.filter(d => (dealState[d.id]?.stage || 'open') === 'open').length;
    const sold = filtered.filter(d => dealState[d.id]?.stage === 'sold').length;
    const totalValue = filtered.reduce((sum, d) => sum + d.total, 0);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
        <div className="sticky top-0 z-50 bg-slate-950/95 border-b border-white/10 backdrop-blur">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                <p className="text-sm text-slate-400">{isTech ? 'Technician' : 'Sales Rep'}</p>
              </div>
              <button onClick={() => { setUser(null); setScreen('login'); }} className="flex items-center gap-2 px-4 py-2 bg-red-900/30 hover:bg-red-800/50 border border-red-700/40 rounded text-red-300 text-sm font-semibold transition">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="bg-white/5 border border-white/10 rounded p-3">
                <p className="text-xs text-slate-400 font-bold mb-1">PIPELINE</p>
                <p className="text-2xl font-bold text-amber-400">${(totalValue / 1000).toFixed(1)}k</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded p-3">
                <p className="text-xs text-slate-400 font-bold mb-1">OPEN</p>
                <p className="text-2xl font-bold text-blue-400">{open}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded p-3">
                <p className="text-xs text-slate-400 font-bold mb-1">SOLD</p>
                <p className="text-2xl font-bold text-emerald-400">{sold}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded p-3">
                <p className="text-xs text-slate-400 font-bold mb-1">TOTAL DEALS</p>
                <p className="text-2xl font-bold text-white">{filtered.length}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Search customer or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-3 py-2 bg-white/10 border border-white/20 rounded text-sm text-white placeholder-slate-400" />
              </div>
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 bg-white/10 border border-white/20 rounded text-sm text-white font-semibold">
                <option value="all">All Stages</option>
                <option value="open">Open</option>
                <option value="negotiating">Negotiating</option>
                <option value="sold">Sold</option>
                <option value="lost">Lost</option>
              </select>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-8 py-8">
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-slate-400">{isTech ? 'No jobs assigned yet' : 'No deals found'}</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map(deal => {
                const state = dealState[deal.id] || {};
                return (
                  <div key={deal.id} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-white/20 transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-white text-sm">{deal.customerName}</h3>
                        <p className="text-xs text-slate-400">{deal.phone}</p>
                      </div>
                      <p className="font-bold text-amber-400">${deal.total.toLocaleString()}</p>
                    </div>
                    {deal.address && <p className="text-xs text-slate-400 mb-2">{deal.address}</p>}
                    {deal.jobType && <div className="mb-3"><span className={`badge ${getTypeStyle(deal.jobType)}`}>{deal.jobType}</span></div>}
                    <div className="space-y-2">
                      <select value={state.stage || 'open'} onChange={(e) => updateState(deal.id, 'stage', e.target.value)} className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded text-xs text-white font-semibold">
                        <option value="open">Open</option>
                        <option value="negotiating">Negotiating</option>
                        <option value="sold">Sold</option>
                        <option value="lost">Lost</option>
                      </select>
                      {deal.phone && (
                        <div className="flex gap-2">
                          <a href={`tel:${deal.phone}`} className="flex-1 px-2 py-1.5 bg-blue-600/40 hover:bg-blue-600/60 border border-blue-500/30 rounded text-xs font-semibold text-blue-300 text-center transition flex items-center justify-center gap-1">
                            <Phone className="w-3 h-3" /> Call
                          </a>
                          <a href={`sms:${deal.phone}`} className="flex-1 px-2 py-1.5 bg-emerald-600/40 hover:bg-emerald-600/60 border border-emerald-500/30 rounded text-xs font-semibold text-emerald-300 text-center transition flex items-center justify-center gap-1">
                            <MessageSquare className="w-3 h-3" /> Text
                          </a>
                        </div>
                      )}
                      {!isTech && (
                        <select value={state.assignedTech || ''} onChange={(e) => updateState(deal.id, 'assignedTech', e.target.value)} className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded text-xs text-white font-semibold">
                          <option value="">Assign Tech...</option>
                          {techTeam.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
