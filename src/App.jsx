import React, { useState, useEffect } from 'react';
import { LogOut, Phone, MessageSquare } from 'lucide-react';

export default function SalesCommandCenter() {
  const [screen, setScreen] = useState('login');
  const [user, setUser] = useState(null);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({});
  const [repFilter, setRepFilter] = useState('all');

  const reps = ['Tristan', 'Michael', 'Jake Bernard', 'Catherine'];
  const techs = ['Ed Pfeiffer', 'Jake Casmay', 'Josh Fazio', 'Greg Janowski', 'Scott Deakin', 'Tyler Gilliland', 'Will Egoavil', 'Ethan Harker'];
  const allUsers = [...reps, ...techs];

  const loadDeals = async () => {
    setLoading(true);
    try {
      const hcp = await fetch('/.netlify/functions/hcp-fetch-estimates').then(r => r.json()).catch(() => ({ deals: [] }));
      const comp = await fetch('/.netlify/functions/fetch-completed-jobs').then(r => r.json()).catch(() => ({ deals: [] }));
      setDeals([...(hcp.deals || []), ...(comp.deals || [])]);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    const s = localStorage.getItem('dealStatus');
    if (s) setStatus(JSON.parse(s));
    const d = localStorage.getItem('deals');
    if (d) setDeals(JSON.parse(d));
    else loadDeals();
  }, []);

  useEffect(() => { localStorage.setItem('dealStatus', JSON.stringify(status)); }, [status]);
  useEffect(() => { localStorage.setItem('deals', JSON.stringify(deals)); }, [deals]);

  const updateDeal = (id, key, val) => {
    setStatus(prev => ({ ...prev, [id]: { ...prev[id], [key]: val } }));
  };

  const DealCard = ({ deal }) => {
    const d = status[deal.id] || {};
    const price = d.customPrice !== undefined ? d.customPrice : (deal.jobTotalAmount || 0);

    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="font-bold text-white text-lg">{deal.customerName}</h3>
            {deal.phone && <p className="text-sm text-slate-400">{deal.phone}</p>}
          </div>
          <p className="text-amber-400 font-bold text-xl">${price.toLocaleString()}</p>
        </div>

        {deal.address && <p className="text-sm text-slate-400 mb-3">{deal.address}</p>}

        <div className="space-y-3 border-t border-slate-700 pt-3">
          <div className="flex gap-2">
            <input type="text" placeholder="Add tag" value={d.newTag || ''} onChange={(e) => updateDeal(deal.id, 'newTag', e.target.value)} className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm text-white" />
            <button onClick={() => { if (d.newTag?.trim()) { updateDeal(deal.id, 'tags', [...(d.tags || []), d.newTag.trim()]); updateDeal(deal.id, 'newTag', ''); } }} className="px-3 py-2 bg-amber-600 hover:bg-amber-700 rounded text-sm font-semibold text-white">Add</button>
          </div>

          {d.tags && d.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {d.tags.map(tag => (
                <div key={tag} className="bg-amber-900/40 border border-amber-700/50 px-2 py-1 rounded text-xs font-semibold text-amber-300 flex items-center gap-2">
                  {tag}
                  <button onClick={() => updateDeal(deal.id, 'tags', d.tags.filter(t => t !== tag))}>×</button>
                </div>
              ))}
            </div>
          )}

          <select value={d.stage || 'Negotiating'} onChange={(e) => updateDeal(deal.id, 'stage', e.target.value)} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm text-white font-semibold">
            <option>Negotiating</option>
            <option>Sold</option>
            <option>Lost</option>
            <option>On Hold</option>
          </select>

          <input type="number" value={price} onChange={(e) => updateDeal(deal.id, 'customPrice', parseFloat(e.target.value))} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm text-white font-semibold" />

          <div className="flex gap-2">
            {deal.phone && (
              <>
                <a href={`tel:${deal.phone}`} className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-semibold text-white text-center flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" /> Call
                </a>
                <a href={`sms:${deal.phone}`} className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 rounded text-sm font-semibold text-white text-center flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Text
                </a>
              </>
            )}
          </div>

          <select value={d.tech || ''} onChange={(e) => updateDeal(deal.id, 'tech', e.target.value)} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm text-white font-semibold">
            <option value="">Assign Tech</option>
            {techs.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select value={d.soldBy || ''} onChange={(e) => updateDeal(deal.id, 'soldBy', e.target.value)} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm text-white font-semibold">
            <option value="">Who Made Sale</option>
            {allUsers.map(u => <option key={u} value={u}>{u}</option>)}
          </select>

          <button onClick={() => updateDeal(deal.id, 'equipped', !d.equipped)} className={`w-full px-3 py-2 rounded text-sm font-semibold ${d.equipped ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
            {d.equipped ? '✓ Equipment Ordered' : 'Equipment Ordered'}
          </button>
        </div>
      </div>
    );
  };

  if (screen === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-6">
        <div className="w-full max-w-xl">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12">
            <div className="mb-12 text-center">
              <div className="inline-block bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl p-3 mb-6">
                <span className="text-white text-3xl">🦁</span>
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">Lions</h1>
              <p className="text-amber-400 font-semibold">Sales & Operations</p>
            </div>

            <div className="space-y-8">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Sales Reps</p>
                <div className="grid grid-cols-2 gap-3">
                  {reps.map(name => (
                    <button key={name} onClick={() => { setUser({ name, type: 'rep' }); setScreen('rep'); setRepFilter('all'); }} className="p-4 bg-blue-900/30 hover:bg-blue-800/50 border border-blue-700/50 rounded-lg text-sm font-semibold text-blue-100">
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-800 pt-8">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Technicians</p>
                <div className="grid grid-cols-2 gap-3">
                  {techs.map(name => (
                    <button key={name} onClick={() => { setUser({ name, type: 'tech' }); setScreen('tech'); }} className="p-4 bg-emerald-900/30 hover:bg-emerald-800/50 border border-emerald-700/50 rounded-lg text-sm font-semibold text-emerald-100">
                      {name.split(' ')[0]}
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

  if (screen === 'rep') {
    const filtered = deals.filter(deal => {
      const d = status[deal.id] || {};
      if (repFilter === 'all') return true;
      if (repFilter === 'negotiating') return (d.stage || 'Negotiating') === 'Negotiating';
      if (repFilter === 'sold') return d.stage === 'Sold';
      if (repFilter === 'lost') return d.stage === 'Lost';
      if (repFilter === 'onhold') return d.stage === 'On Hold';
      return false;
    });

    return (
      <div className="min-h-screen bg-slate-950">
        <div className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white">Sales Pipeline</h1>
              <p className="text-amber-400 text-sm">{user?.name}</p>
            </div>
            <button onClick={() => { setUser(null); setScreen('login'); }} className="flex items-center gap-2 px-4 py-2 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300 font-semibold">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
          <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto">
            {[{ id: 'all', label: 'All' }, { id: 'negotiating', label: 'Negotiating' }, { id: 'sold', label: 'Sold' }, { id: 'lost', label: 'Lost' }, { id: 'onhold', label: 'On Hold' }].map(f => (
              <button key={f.id} onClick={() => setRepFilter(f.id)} className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap ${repFilter === f.id ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map(deal => <DealCard key={deal.id} deal={deal} />)}
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'tech') {
    const myDeals = deals.filter(d => status[d.id]?.tech === user?.name);
    const totalCommission = myDeals.reduce((sum, d) => sum + (d.commissionAmount || 0), 0);

    return (
      <div className="min-h-screen bg-slate-950">
        <div className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white">{user?.name}</h1>
              <p className="text-emerald-400 text-sm">Performance</p>
            </div>
            <button onClick={() => { setUser(null); setScreen('login'); }} className="flex items-center gap-2 px-4 py-2 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300 font-semibold">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
          <div className="max-w-7xl mx-auto grid grid-cols-3 gap-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <p className="text-xs text-slate-400 font-semibold uppercase mb-2">Commission</p>
              <p className="text-2xl font-bold text-amber-400">${totalCommission.toLocaleString()}</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <p className="text-xs text-slate-400 font-semibold uppercase mb-2">Jobs</p>
              <p className="text-2xl font-bold text-emerald-400">{myDeals.length}</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <p className="text-xs text-slate-400 font-semibold uppercase mb-2">Avg</p>
              <p className="text-2xl font-bold text-blue-400">${myDeals.length > 0 ? Math.round(totalCommission / myDeals.length) : 0}</p>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {myDeals.map(deal => <DealCard key={deal.id} deal={deal} />)}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
