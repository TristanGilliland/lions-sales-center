import React, { useState, useEffect } from 'react';
import { LogOut, Phone, MessageSquare, BarChart3 } from 'lucide-react';

export default function SalesCommandCenter() {
  const [screen, setScreen] = useState('login');
  const [user, setUser] = useState(null);
  const [deals, setDeals] = useState([]);
  const [status, setStatus] = useState({});

  const reps = ['Tristan', 'Michael', 'Jake Bernard', 'Catherine'];
  const techs = ['Ed Pfeiffer', 'Jake Casmay', 'Josh Fazio', 'Greg Janowski', 'Scott Deakin', 'Tyler Gilliland', 'Will Egoavil', 'Ethan Harker'];

  const loadDeals = async () => {
    try {
      const hcp = await fetch('/.netlify/functions/hcp-fetch-estimates').then(r => r.json()).catch(() => ({ deals: [] }));
      const comp = await fetch('/.netlify/functions/fetch-completed-jobs').then(r => r.json()).catch(() => ({ deals: [] }));
      setDeals([...(hcp.deals || []), ...(comp.deals || [])]);
    } catch (e) { console.error(e); }
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

  const updateDeal = (id, key, val) => setStatus(prev => ({ ...prev, [id]: { ...prev[id], [key]: val } }));

  const DealCard = ({ deal }) => {
    const d = status[deal.id] || {};
    const price = d.customPrice !== undefined ? d.customPrice : (deal.jobTotalAmount || 0);

    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-white">{deal.customerName}</h3>
          <p className="text-amber-400 font-bold">${price.toLocaleString()}</p>
        </div>
        {deal.phone && <p className="text-sm text-slate-400 mb-3">{deal.phone}</p>}
        {deal.address && <p className="text-sm text-slate-400 mb-3">{deal.address}</p>}

        <div className="space-y-2">
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
                <a href={`tel:${deal.phone}`} className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-xs font-semibold text-white text-center">
                  <Phone className="w-3 h-3 inline mr-1" /> Call
                </a>
                <a href={`sms:${deal.phone}`} className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 rounded text-xs font-semibold text-white text-center">
                  <MessageSquare className="w-3 h-3 inline mr-1" /> Text
                </a>
              </>
            )}
          </div>

          <button onClick={() => updateDeal(deal.id, 'equipped', !d.equipped)} className={`w-full px-3 py-2 rounded text-xs font-semibold ${d.equipped ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
            {d.equipped ? '✓ Equipment Ordered' : 'Equipment'}
          </button>
        </div>
      </div>
    );
  };

  if (screen === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12">
            <div className="text-center mb-12">
              <div className="inline-block bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl p-3 mb-6">
                <span className="text-white text-4xl">🦁</span>
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">Lions</h1>
              <p className="text-amber-400 font-semibold">Sales & Operations Hub</p>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Sales Reps</p>
                <div className="space-y-2">
                  {reps.map(name => (
                    <button key={name} onClick={() => { setUser({ name, type: 'rep' }); setScreen('dashboard'); }} className="w-full p-3 bg-blue-900/30 hover:bg-blue-800/50 border border-blue-700/50 rounded-lg text-sm font-semibold text-blue-100 text-left transition">
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Technicians</p>
                <div className="space-y-2">
                  {techs.map(name => (
                    <button key={name} onClick={() => { setUser({ name, type: 'tech' }); setScreen('dashboard'); }} className="w-full p-3 bg-emerald-900/30 hover:bg-emerald-800/50 border border-emerald-700/50 rounded-lg text-sm font-semibold text-emerald-100 text-left transition">
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

  if (screen === 'dashboard') {
    const isRep = user.type === 'rep';
    const userDeals = isRep ? deals : deals.filter(d => status[d.id]?.tech === user.name);
    const totalValue = userDeals.reduce((sum, d) => sum + (status[d.id]?.customPrice || d.jobTotalAmount || 0), 0);
    const totalCommission = userDeals.reduce((sum, d) => sum + (d.commissionAmount || 0), 0);
    const negotiating = userDeals.filter(d => (status[d.id]?.stage || 'Negotiating') === 'Negotiating');
    const sold = userDeals.filter(d => status[d.id]?.stage === 'Sold');
    const lost = userDeals.filter(d => status[d.id]?.stage === 'Lost');

    return (
      <div className="min-h-screen bg-slate-950">
        <div className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-white">{user.name}</h1>
                <p className={`text-sm mt-1 ${isRep ? 'text-blue-400' : 'text-emerald-400'}`}>
                  {isRep ? 'Sales Representative' : 'Technician'}
                </p>
              </div>
              <button onClick={() => { setUser(null); setScreen('login'); }} className="flex items-center gap-2 px-6 py-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300 font-semibold hover:bg-red-800/50 transition">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <p className="text-xs text-slate-400 uppercase mb-2 font-semibold">Pipeline Value</p>
                <p className="text-2xl font-bold text-amber-400">${totalValue.toLocaleString()}</p>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <p className="text-xs text-slate-400 uppercase mb-2 font-semibold">Commission</p>
                <p className="text-2xl font-bold text-amber-400">${totalCommission.toLocaleString()}</p>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <p className="text-xs text-slate-400 uppercase mb-2 font-semibold">Negotiating</p>
                <p className="text-2xl font-bold text-blue-400">{negotiating.length}</p>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <p className="text-xs text-slate-400 uppercase mb-2 font-semibold">Closed</p>
                <p className="text-2xl font-bold text-emerald-400">{sold.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="space-y-12">
            {[
              { title: 'Negotiating', deals: negotiating, color: 'blue' },
              { title: 'Sold', deals: sold, color: 'emerald' },
              { title: 'Lost', deals: lost, color: 'red' }
            ].map(section => (
              section.deals.length > 0 && (
                <div key={section.title}>
                  <h2 className={`text-lg font-bold mb-4 text-${section.color}-400`}>{section.title} ({section.deals.length})</h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {section.deals.map(deal => <DealCard key={deal.id} deal={deal} />)}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
