import React, { useState, useEffect, useMemo } from 'react';
import { LogOut, Users, TrendingUp, Phone, MessageSquare, Plus, Edit2, Trash2, Search, Filter } from 'lucide-react';

export default function LionsHub() {
  const [view, setView] = useState('login');
  const [user, setUser] = useState(null);
  const [deals, setDeals] = useState([]);
  const [dealMeta, setDealMeta] = useState({});
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const salesTeam = [
    { id: 'tristan', name: 'Tristan Gilliland', title: 'Owner', color: 'from-blue-600 to-blue-800' },
    { id: 'michael', name: 'Michael Nicoletti', title: 'Sales Rep', color: 'from-blue-500 to-blue-700' },
    { id: 'jake-b', name: 'Jake Bernard', title: 'Sales Rep', color: 'from-blue-500 to-blue-700' },
    { id: 'catherine', name: 'Catherine Scheswohl', title: 'CSR', color: 'from-blue-500 to-blue-700' }
  ];

  const techTeam = [
    { id: 'ed', name: 'Ed Pfeiffer', title: 'Lead Tech', color: 'from-emerald-600 to-emerald-800' },
    { id: 'jake-c', name: 'Jake Casmay', title: 'Technician', color: 'from-emerald-500 to-emerald-700' },
    { id: 'josh', name: 'Josh Fazio', title: 'Technician', color: 'from-emerald-500 to-emerald-700' },
    { id: 'greg', name: 'Greg Janowski', title: 'Technician', color: 'from-emerald-500 to-emerald-700' },
    { id: 'scott', name: 'Scott Deakin', title: 'Technician', color: 'from-emerald-500 to-emerald-700' },
    { id: 'tyler', name: 'Tyler Gilliland', title: 'Technician', color: 'from-emerald-500 to-emerald-700' },
    { id: 'will', name: 'Will Egoavil', title: 'Technician', color: 'from-emerald-500 to-emerald-700' },
    { id: 'ethan', name: 'Ethan Harker', title: 'Technician', color: 'from-emerald-500 to-emerald-700' }
  ];

  const loadDeals = async () => {
    try {
      const [hcp, comp] = await Promise.all([
        fetch('/.netlify/functions/hcp-fetch-estimates').then(r => r.json()).catch(() => ({ deals: [] })),
        fetch('/.netlify/functions/fetch-completed-jobs').then(r => r.json()).catch(() => ({ deals: [] }))
      ]);
      const all = [...(hcp.deals || []), ...(comp.deals || [])];
      setDeals(all.map((d, i) => ({ ...d, id: d.id || `deal-${i}` })));
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const meta = localStorage.getItem('dealMeta');
    if (meta) setDealMeta(JSON.parse(meta));
    const d = localStorage.getItem('deals');
    if (d) setDeals(JSON.parse(d));
    else loadDeals();
  }, []);

  useEffect(() => { localStorage.setItem('dealMeta', JSON.stringify(dealMeta)); }, [dealMeta]);
  useEffect(() => { localStorage.setItem('deals', JSON.stringify(deals)); }, [deals]);

  const updateDeal = (id, field, val) => setDealMeta(prev => ({ ...prev, [id]: { ...prev[id], [field]: val } }));

  // Filter & search
  const filteredDeals = useMemo(() => {
    return deals.filter(d => {
      const meta = dealMeta[d.id] || {};
      const matchesSearch = d.customerName?.toLowerCase().includes(search.toLowerCase()) || d.phone?.includes(search);
      const matchesFilter = filter === 'all' || (meta.stage || 'open') === filter;
      return matchesSearch && matchesFilter;
    });
  }, [deals, dealMeta, search, filter]);

  // Analytics
  const analytics = useMemo(() => {
    return {
      totalValue: deals.reduce((sum, d) => sum + (dealMeta[d.id]?.price || d.jobTotalAmount || 0), 0),
      totalCommission: deals.reduce((sum, d) => sum + (d.commissionAmount || 0), 0),
      byStage: {
        open: deals.filter(d => (dealMeta[d.id]?.stage || 'open') === 'open').length,
        negotiating: deals.filter(d => (dealMeta[d.id]?.stage || 'open') === 'negotiating').length,
        sold: deals.filter(d => dealMeta[d.id]?.stage === 'sold').length,
        lost: deals.filter(d => dealMeta[d.id]?.stage === 'lost').length
      },
      byType: {
        service: deals.filter(d => dealMeta[d.id]?.type === 'service').length,
        maintenance: deals.filter(d => dealMeta[d.id]?.type === 'maintenance').length,
        install: deals.filter(d => dealMeta[d.id]?.type === 'install').length,
        sales: deals.filter(d => dealMeta[d.id]?.type === 'sales').length
      }
    };
  }, [deals, dealMeta]);

  const StatCard = ({ label, value, color = 'amber' }) => (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 backdrop-blur-sm">
      <p className="text-xs font-bold text-slate-400 uppercase mb-1">{label}</p>
      <p className={`text-2xl font-bold text-${color}-400`}>{value}</p>
    </div>
  );

  const DealRow = ({ deal }) => {
    const meta = dealMeta[deal.id] || {};
    const price = meta.price || deal.jobTotalAmount || 0;

    return (
      <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-4 hover:bg-slate-800/60 transition">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-white">{deal.customerName}</h3>
            <p className="text-sm text-slate-400">{deal.phone}</p>
          </div>
          <p className="text-amber-500 font-bold text-lg ml-4">${price.toLocaleString()}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <select value={meta.type || ''} onChange={(e) => updateDeal(deal.id, 'type', e.target.value)} className="px-3 py-1.5 bg-slate-700/50 border border-slate-600/50 rounded text-xs text-white font-semibold">
            <option value="">Type</option>
            <option value="service">Service</option>
            <option value="maintenance">Maintenance</option>
            <option value="install">Install</option>
            <option value="sales">Sales</option>
          </select>

          <select value={meta.stage || 'open'} onChange={(e) => updateDeal(deal.id, 'stage', e.target.value)} className="px-3 py-1.5 bg-slate-700/50 border border-slate-600/50 rounded text-xs text-white font-semibold">
            <option value="open">Open</option>
            <option value="negotiating">Negotiating</option>
            <option value="sold">Sold</option>
            <option value="lost">Lost</option>
          </select>

          <input type="number" value={price} onChange={(e) => updateDeal(deal.id, 'price', parseFloat(e.target.value))} className="px-3 py-1.5 bg-slate-700/50 border border-slate-600/50 rounded text-xs text-white font-semibold" />
        </div>

        <div className="flex gap-2">
          {deal.phone && (
            <>
              <a href={`tel:${deal.phone}`} className="flex-1 px-3 py-1.5 bg-blue-600/40 hover:bg-blue-600/60 border border-blue-500/30 rounded text-xs font-semibold text-blue-300 text-center transition flex items-center justify-center gap-1">
                <Phone className="w-3 h-3" /> Call
              </a>
              <a href={`sms:${deal.phone}`} className="flex-1 px-3 py-1.5 bg-emerald-600/40 hover:bg-emerald-600/60 border border-emerald-500/30 rounded text-xs font-semibold text-emerald-300 text-center transition flex items-center justify-center gap-1">
                <MessageSquare className="w-3 h-3" /> Text
              </a>
            </>
          )}
        </div>
      </div>
    );
  };

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-6">
        <div className="w-full max-w-5xl">
          <div className="text-center mb-16">
            <div className="text-6xl mb-6">🦁</div>
            <h1 className="text-5xl font-bold text-white mb-2">Lions Operations</h1>
            <p className="text-amber-500 text-lg font-semibold">Command Hub</p>
          </div>

          <div className="grid grid-cols-2 gap-12">
            <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-700/30 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Sales Team</h2>
              <div className="space-y-3">
                {salesTeam.map(rep => (
                  <button key={rep.id} onClick={() => { setUser({ ...rep, type: 'rep' }); setView('dashboard'); }} className="w-full p-4 bg-blue-900/30 hover:bg-blue-800/50 border border-blue-700/40 rounded-lg text-left transition">
                    <h3 className="font-bold text-blue-100">{rep.name}</h3>
                    <p className="text-xs text-blue-300/70 mt-1">{rep.title}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 border border-emerald-700/30 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Tech Team</h2>
              <div className="space-y-3">
                {techTeam.map(tech => (
                  <button key={tech.id} onClick={() => { setUser({ ...tech, type: 'tech' }); setView('dashboard'); }} className="w-full p-4 bg-emerald-900/30 hover:bg-emerald-800/50 border border-emerald-700/40 rounded-lg text-left transition">
                    <h3 className="font-bold text-emerald-100">{tech.name}</h3>
                    <p className="text-xs text-emerald-300/70 mt-1">{tech.title}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'dashboard') {
    const isTech = user.type === 'tech';
    const userDeals = isTech ? deals.filter(d => dealMeta[d.id]?.tech === user.name) : deals;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
        {/* Header */}
        <div className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/90 border-b border-slate-800/50">
          <div className="max-w-7xl mx-auto px-8 py-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold text-white">{user.name}</h1>
                <p className={`text-sm mt-2 font-semibold ${isTech ? 'text-emerald-400' : 'text-blue-400'}`}>{user.title}</p>
              </div>
              <button onClick={() => { setUser(null); setView('login'); }} className="flex items-center gap-2 px-6 py-3 bg-red-900/30 hover:bg-red-800/50 border border-red-700/40 rounded-lg text-red-300 font-semibold">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>

            {/* Analytics */}
            <div className="grid grid-cols-6 gap-3 mb-6">
              <StatCard label="Pipeline" value={`$${(analytics.totalValue / 1000).toFixed(1)}k`} />
              <StatCard label="Commission" value={`$${(analytics.totalCommission / 1000).toFixed(1)}k`} />
              <StatCard label="Open" value={analytics.byStage.open} color="blue" />
              <StatCard label="Negotiating" value={analytics.byStage.negotiating} color="yellow" />
              <StatCard label="Sold" value={analytics.byStage.sold} color="emerald" />
              <StatCard label="Lost" value={analytics.byStage.lost} color="red" />
            </div>

            {/* Search & Filter */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input type="text" placeholder="Search deals..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white placeholder-slate-400" />
              </div>
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white font-semibold">
                <option value="all">All Deals</option>
                <option value="open">Open</option>
                <option value="negotiating">Negotiating</option>
                <option value="sold">Sold</option>
                <option value="lost">Lost</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-8 py-12">
          {filteredDeals.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-400 text-lg">No deals found</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredDeals.map(deal => <DealRow key={deal.id} deal={deal} />)}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
