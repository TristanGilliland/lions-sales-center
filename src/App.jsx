
import React, { useState, useEffect } from 'react';
import { ChevronDown, Phone, MessageSquare, Eye, X, Plus, LogOut, Settings, TrendingUp, Activity, Clock, Award, Download } from 'lucide-react';

export default function SalesCommandCenter() {
  const [authState, setAuthState] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [deals, setDeals] = useState([]);
  const [activities, setActivities] = useState([]);
  const [showNewDeal, setShowNewDeal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [filterRep, setFilterRep] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [viewMode, setViewMode] = useState('pipeline');
  const [installPrompt, setInstallPrompt] = useState(null);

  const salesReps = [
    { id: 'tristan', name: 'Tristan (Owner)', role: 'Owner' },
    { id: 'michael', name: 'Michael', role: 'Sales Rep' },
    { id: 'rep2', name: 'Sales Rep 2', role: 'Sales Rep' }
  ];

  const technicians = [
    'Ed Pfeiffer', 'Jake Casmay', 'Josh Fazio', 'Greg Janowski', 
    'Scott Deakin', 'Tyler Gilliland', 'Will Egoavil'
  ];

  const stages = ['Proposals', 'Negotiating', 'Sold', 'Lost'];

  // PWA Install Prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Load deals and activities
  useEffect(() => {
    const saved = localStorage.getItem('lionsSalesDeals');
    if (saved) {
      setDeals(JSON.parse(saved));
    } else {
// Fetch real HCP estimates
fetch('/.netlify/functions/hcp-fetch-estimates')
  .then(res => res.json())
  .then(data => {
    if (data.deals) {
      setDeals(data.deals);
    }
  })
  .catch(err => {
    console.error('Failed to load HCP deals:', err);
    setDeals([]);
  });
}
}, []); 

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallPrompt(null);
      }
    }
  };
const handleLogin = (repId) => {
    const rep = salesReps.find(r => r.id === repId);
    setCurrentUser(rep);
    setAuthState('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthState('login');
    setFilterRep('all');
    setFilterSource('all');
    setViewMode('pipeline');
  };
  const updateDeal = (dealId, updates) => {
    const oldDeal = deals.find(d => d.id === dealId);
    setDeals(deals.map(d => d.id === dealId ? { ...d, ...updates, lastActivity: new Date().toISOString().split('T')[0] } : d));
    
    if (updates.stage && oldDeal.stage !== updates.stage) {
      logActivity(dealId, 'stage_change', `Moved from ${oldDeal.stage} to ${updates.stage}`, 'status_change');
    }
    if (updates.sold && !oldDeal.sold) {
      logActivity(dealId, 'deal_won', `Deal marked as SOLD`, 'milestone');
    }
  };

  const logActivity = (dealId, activity, details, type) => {
    const deal = deals.find(d => d.id === dealId);
    const newActivity = {
      id: Date.now().toString(),
      dealId,
      customerName: deal?.customerName,
      timestamp: new Date().toISOString(),
      activity,
      details,
      type,
      salesRep: deal?.salesRep,
      source: deal?.source
    };
    setActivities([newActivity, ...activities]);
  };

  const deleteDeal = (dealId) => {
    setDeals(deals.filter(d => d.id !== dealId));
    setSelectedDeal(null);
  };

  const addNewDeal = (newDeal) => {
    const deal = {
      id: Date.now().toString(),
      createdDate: new Date().toISOString().split('T')[0],
      sold: false,
      equipmentOrdered: false,
      estimateViews: 0,
      lastActivity: new Date().toISOString().split('T')[0],
      salesRep: currentUser.id,
      source: 'HCP',
      ...newDeal
    };
    setDeals([...deals, deal]);
    logActivity(deal.id, 'deal_created', `New deal created for ${deal.customerName}`, 'milestone');
    setShowNewDeal(false);
  };

  // Filter deals
  let filteredDeals = deals;
  if (filterRep !== 'all') {
    filteredDeals = filteredDeals.filter(d => d.salesRep === filterRep);
  }
  if (filterSource !== 'all') {
    filteredDeals = filteredDeals.filter(d => d.source === filterSource);
  }

  const metrics = {
    totalPipeline: filteredDeals.reduce((sum, d) => sum + (d.stage !== 'Lost' ? d.amount : 0), 0),
    wonDeals: filteredDeals.filter(d => d.sold).length,
    closureRate: filteredDeals.length > 0 ? Math.round((filteredDeals.filter(d => d.sold).length / filteredDeals.length) * 100) : 0,
    totalDeals: filteredDeals.length,
    avgDealSize: filteredDeals.length > 0 ? Math.round(filteredDeals.reduce((sum, d) => sum + d.amount, 0) / filteredDeals.length) : 0
  };

  const dealsByStage = stages.map(stage => ({
    stage,
    deals: filteredDeals.filter(d => d.stage === stage)
  }));

  const filteredActivities = filterRep === 'all' ? activities : activities.filter(a => a.salesRep === filterRep);

  if (authState === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center p-4">
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');
        `}</style>
        
        <div className="w-full max-w-md">
          <div className="text-center mb-12">
            <div className="inline-block mb-6 px-4 py-2 bg-orange-500/20 border border-orange-500/40 rounded-lg">
              <span className="text-orange-500 text-sm font-semibold">LIONS HEATING & AC</span>
            </div>
            <h1 style={{ fontFamily: 'Syne' }} className="text-5xl font-bold text-white mb-2">
              Sales Command
            </h1>
            <p className="text-gray-400 text-lg">Real-time pipeline tracking</p>
          </div>

          <div className="space-y-3">
            {salesReps.map(rep => (
              <button
                key={rep.id}
                onClick={() => handleLogin(rep.id)}
                className="w-full group relative px-6 py-4 bg-gradient-to-r from-gray-800 to-gray-850 border border-gray-700 hover:border-orange-500 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20"
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="font-semibold text-white">{rep.name}</p>
                    <p className="text-xs text-gray-400">{rep.role}</p>
                  </div>
                  <div className="w-8 h-8 bg-orange-500/20 group-hover:bg-orange-500/40 rounded-lg flex items-center justify-center transition-colors">
                    <span className="text-orange-500 text-sm">→</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-12 p-4 bg-gray-900/50 border border-gray-800 rounded-lg text-center">
            <p className="text-gray-400 text-sm">Sales Command Center</p>
            <p className="text-gray-500 text-xs mt-1">HCP + OnCall Air Integration</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');
        
        .kanban-container::-webkit-scrollbar { height: 6px; }
        .kanban-container::-webkit-scrollbar-track { background: transparent; }
        .kanban-container::-webkit-scrollbar-thumb { background: rgba(249, 115, 22, 0.3); border-radius: 3px; }
        
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .deal-card {
          animation: slideInUp 0.4s ease-out;
        }

        .source-label {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .source-hcp {
          background: #1C1C1C;
          color: #E8A020;
          border: 1px solid #E8A020;
        }

        .source-oncall {
          background: #1e40af;
          color: #93c5fd;
          border: 1px solid #93c5fd;
        }
      `}</style>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontFamily: 'Syne' }} className="text-2xl font-bold text-white">
              Command Center
            </h1>
            <p className="text-sm text-gray-400 mt-1">{currentUser.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('pipeline')}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                  viewMode === 'pipeline'
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Pipeline
              </button>
              <button
                onClick={() => setViewMode('performance')}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                  viewMode === 'performance'
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Performance
              </button>
              <button
                onClick={() => setViewMode('activity')}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                  viewMode === 'activity'
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Activity
              </button>
            </div>
            {installPrompt && (
              <button
                onClick={handleInstall}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 text-xs"
              >
                <Download size={16} />
                Install
              </button>
            )}
            <button
              onClick={() => setShowNewDeal(true)}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              New Deal
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-orange-400 hover:bg-gray-900 rounded-lg transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Pipeline View */}
      {viewMode === 'pipeline' && (
        <>
          {/* Metrics Bar */}
          <div className="px-6 py-4 grid grid-cols-5 gap-4 border-b border-gray-800">
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-xs uppercase">Pipeline</p>
              <p className="text-2xl font-bold text-white mt-1">${(metrics.totalPipeline / 1000).toFixed(1)}K</p>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-xs uppercase">Won</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{metrics.wonDeals}</p>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-xs uppercase">Rate</p>
              <p className="text-2xl font-bold text-orange-500 mt-1">{metrics.closureRate}%</p>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-xs uppercase">Deals</p>
              <p className="text-2xl font-bold text-white mt-1">{metrics.totalDeals}</p>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-xs uppercase">Avg Size</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">${(metrics.avgDealSize / 1000).toFixed(1)}K</p>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-4 border-b border-gray-800 flex gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Rep:</span>
              <select
                value={filterRep}
                onChange={(e) => setFilterRep(e.target.value)}
                className="bg-gray-900 border border-gray-800 text-white rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All Reps</option>
                {salesReps.map(rep => (
                  <option key={rep.id} value={rep.id}>{rep.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Source:</span>
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="bg-gray-900 border border-gray-800 text-white rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All Sources</option>
                <option value="HCP">HouseCall Pro</option>
                <option value="OnCall Air">OnCall Air</option>
              </select>
            </div>
          </div>

          {/* Kanban Board */}
          <div className="p-6 kanban-container overflow-x-auto">
            <div className="grid grid-cols-4 gap-6 min-w-min">
              {dealsByStage.map(({ stage, deals: stageDeal }) => (
                <div key={stage} className="w-80 flex-shrink-0">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-semibold text-white">{stage}</h2>
                    <span className="bg-gray-800 text-gray-300 text-xs font-semibold px-2.5 py-1 rounded-full">
                      {stageDeal.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {stageDeal.map(deal => (
                      <div
                        key={deal.id}
                        onClick={() => setSelectedDeal(deal)}
                        className="deal-card cursor-pointer bg-gray-900 border border-gray-800 hover:border-orange-500 rounded-lg p-4 transition-all hover:shadow-lg hover:shadow-orange-500/10 group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-semibold text-white group-hover:text-orange-400 transition-colors text-sm flex-1">
                            {deal.customerName}
                          </p>
                          <span className={`source-label ${deal.source === 'HCP' ? 'source-hcp' : 'source-oncall'}`}>
                            {deal.source === 'HCP' ? 'HCP' : 'OnCall'}
                          </span>
                        </div>
                        <p className="text-xl font-bold text-gray-100 mt-2">${deal.amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mt-1">{deal.equipment}</p>

                        <div className="mt-3 pt-3 border-t border-gray-800 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Status</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateDeal(deal.id, { sold: !deal.sold });
                              }}
                              className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                                deal.sold
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-gray-800 text-gray-300 hover:bg-orange-500/20 hover:text-orange-500'
                              }`}
                            >
                              {deal.sold ? '✓ Sold' : 'Open'}
                            </button>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Equipment</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateDeal(deal.id, { equipmentOrdered: !deal.equipmentOrdered });
                              }}
                              className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                                deal.equipmentOrdered
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-gray-800 text-gray-300 hover:bg-blue-500/20 hover:text-blue-400'
                              }`}
                            >
                              {deal.equipmentOrdered ? '✓ Ordered' : 'Pending'}
                            </button>
                          </div>

                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Eye size={12} />
                            <span>{deal.estimateViews} views</span>
                          </div>
                        </div>

                        <div className="mt-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); logActivity(deal.id, 'call', 'Called customer', 'call'); }} className="flex-1 flex items-center justify-center gap-1 bg-gray-800 hover:bg-orange-500 text-gray-300 hover:text-white rounded py-1 text-xs font-semibold transition-colors">
                            <Phone size={14} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); logActivity(deal.id, 'sms', 'Sent SMS', 'sms'); }} className="flex-1 flex items-center justify-center gap-1 bg-gray-800 hover:bg-blue-500 text-gray-300 hover:text-white rounded py-1 text-xs font-semibold transition-colors">
                            <MessageSquare size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Performance View */}
      {viewMode === 'performance' && (
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-6">Sales Rep Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {salesReps.map(rep => {
              const repDeals = deals.filter(d => d.salesRep === rep.id);
              return (
                <div key={rep.id} className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-orange-500 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-white">{rep.name}</h3>
                      <p className="text-xs text-gray-500">{rep.role}</p>
                    </div>
                    <Award size={20} className="text-orange-500" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Total Deals</span>
                      <span className="text-white font-bold">{repDeals.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Deals Won</span>
                      <span className="text-green-400 font-bold">{repDeals.filter(d => d.sold).length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Close Rate</span>
                      <span className="text-orange-500 font-bold">
                        {repDeals.length > 0 ? Math.round((repDeals.filter(d => d.sold).length / repDeals.length) * 100) : 0}%
                      </span>
                    </div>
                    <div className="border-t border-gray-800 pt-3 flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Pipeline Value</span>
                      <span className="text-blue-400 font-bold">${(repDeals.reduce((sum, d) => sum + (d.stage !== 'Lost' ? d.amount : 0), 0) / 1000).toFixed(1)}K</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Activity View */}
      {viewMode === 'activity' && (
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity size={24} className="text-orange-500" />
              Recent Activity
            </h2>
          </div>
          <div className="space-y-3 max-w-2xl">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-12">
                <Clock size={48} className="text-gray-700 mx-auto mb-4" />
                <p className="text-gray-400">No activity yet</p>
              </div>
            ) : (
              filteredActivities.map(activity => (
                <div key={activity.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-orange-500 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-white text-sm">{activity.customerName}</p>
                      <p className="text-xs text-gray-500">{activity.activity}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      activity.type === 'milestone' ? 'bg-green-500/20 text-green-400' :
                      activity.type === 'status_change' ? 'bg-blue-500/20 text-blue-400' :
                      activity.type === 'call' ? 'bg-orange-500/20 text-orange-500' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {activity.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{activity.details}</p>
                  <p className="text-xs text-gray-600 mt-2">{new Date(activity.timestamp).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* New Deal Modal */}
      {showNewDeal && (
        <NewDealModal
          technicians={technicians}
          onAdd={addNewDeal}
          onClose={() => setShowNewDeal(false)}
        />
      )}

      {/* Detail Modal */}
      {selectedDeal && (
        <DealDetailModal
          deal={selectedDeal}
          technicians={technicians}
          stages={stages}
          onUpdate={(updates) => {
            updateDeal(selectedDeal.id, updates);
            setSelectedDeal({ ...selectedDeal, ...updates });
          }}
          onDelete={() => deleteDeal(selectedDeal.id)}
          onClose={() => setSelectedDeal(null)}
          onActivity={(activity, details) => logActivity(selectedDeal.id, activity, details, 'call')}
        />
      )}
    </div>
  );
}

function NewDealModal({ technicians, onAdd, onClose }) {
  const [formData, setFormData] = useState({
    customerName: '',
    amount: '',
    stage: 'Proposals',
    equipment: '',
    commissionTech: technicians[0]
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.customerName && formData.amount) {
      onAdd({
        ...formData,
        amount: parseInt(formData.amount)
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">New Deal</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Customer Name</label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2"
              placeholder="Enter customer name"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Amount ($)</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2"
              placeholder="5000"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Equipment</label>
            <input
              type="text"
              value={formData.equipment}
              onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2"
              placeholder="AC System, Furnace, etc."
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Stage</label>
            <select
              value={formData.stage}
              onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2"
            >
              {['Proposals', 'Negotiating', 'Sold', 'Lost'].map(stage => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Commission Tech</label>
            <select
              value={formData.commissionTech}
              onChange={(e) => setFormData({ ...formData, commissionTech: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2"
            >
              {technicians.map(tech => (
                <option key={tech} value={tech}>{tech}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold"
            >
              Create Deal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DealDetailModal({ deal, technicians, stages, onUpdate, onDelete, onClose, onActivity }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-gray-900 pb-4 border-b border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-white">{deal.customerName}</h2>
            <p className="text-xs text-gray-500 mt-1">Source: {deal.source === 'HCP' ? 'HouseCall Pro' : 'OnCall Air'}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Amount</p>
              <p className="text-2xl font-bold text-white mt-2">${deal.amount.toLocaleString()}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Equipment</p>
              <p className="text-lg font-semibold text-white mt-2">{deal.equipment}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Stage</label>
            <select
              value={deal.stage}
              onChange={(e) => onUpdate({ stage: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2"
            >
              {stages.map(stage => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Commission Tech</label>
            <select
              value={deal.commissionTech}
              onChange={(e) => onUpdate({ commissionTech: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2"
            >
              {technicians.map(tech => (
                <option key={tech} value={tech}>{tech}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={deal.sold}
                onChange={(e) => onUpdate({ sold: e.target.checked })}
                className="w-4 h-4 bg-gray-800 border border-gray-700 rounded"
              />
              <span className="text-gray-300">Sold / Closed</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={deal.equipmentOrdered}
                onChange={(e) => onUpdate({ equipmentOrdered: e.target.checked })}
                className="w-4 h-4 bg-gray-800 border border-gray-700 rounded"
              />
              <span className="text-gray-300">Equipment Ordered</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-800/50 rounded-lg">
            <div>
              <p className="text-gray-400 text-xs">Created</p>
              <p className="text-sm text-white font-semibold mt-1">{deal.createdDate}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Views</p>
              <p className="text-sm text-white font-semibold mt-1">{deal.estimateViews}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => { onActivity('call', 'Spoke with customer'); }} className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg py-2 font-semibold transition-colors">
              <Phone size={18} />
              Call
            </button>
            <button onClick={() => { onActivity('sms', 'Sent SMS'); }} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 font-semibold transition-colors">
              <MessageSquare size={18} />
              SMS
            </button>
          </div>

          <button
            onClick={onDelete}
            className="w-full px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
          >
            Delete Deal
          </button>
        </div>
      </div>
    </div>
  );
}
