import React, { useState, useEffect } from 'react';
import { ChevronDown, Phone, MessageSquare, Eye, X, Plus, LogOut, Settings, TrendingUp, Activity, Clock, Award, Download, BarChart3 } from 'lucide-react';

export default function SalesCommandCenter() {
  const [authState, setAuthState] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [userType, setUserType] = useState(null); // 'rep' or 'tech'
  const [deals, setDeals] = useState([]);
  const [activities, setActivities] = useState([]);
  const [showNewDeal, setShowNewDeal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [filterRep, setFilterRep] = useState('all');
  const [filterTech, setFilterTech] = useState('all');
  const [filterTag, setFilterTag] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [viewMode, setViewMode] = useState('pipeline');
  const [installPrompt, setInstallPrompt] = useState(null);

  const salesReps = [
    { id: 'tristan', name: 'Tristan (Owner)', role: 'Owner' },
    { id: 'michael', name: 'Michael', role: 'Sales Rep' },
    { id: 'jake-b', name: 'Jake Bernard', role: 'Sales Rep' },
    { id: 'catherine', name: 'Catherine', role: 'CSR' }
  ];

  const technicians = [
    'Ed Pfeiffer', 'Jake Casmay', 'Josh Fazio', 'Greg Janowski', 
    'Scott Deakin', 'Tyler Gilliland', 'Will Egoavil', 'Ethan Harker'
  ];

  const stages = ['Proposals', 'Negotiating', 'Sold', 'Lost'];
  const tags = ['Sales', 'Service', 'Install', 'Maintenance', 'Callbacks'];

  // PWA Install Prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Load deals
  useEffect(() => {
    const saved = localStorage.getItem('lionsSalesDeals');
    if (saved) {
      setDeals(JSON.parse(saved));
    } else {
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

    const savedActivities = localStorage.getItem('lionsSalesActivities');
    if (savedActivities) {
      setActivities(JSON.parse(savedActivities));
    }
  }, []);

  useEffect(() => {
    if (deals.length > 0) {
      localStorage.setItem('lionsSalesDeals', JSON.stringify(deals));
    }
  }, [deals]);

  useEffect(() => {
    if (activities.length > 0) {
      localStorage.setItem('lionsSalesActivities', JSON.stringify(activities));
    }
  }, [activities]);

  const handleLogin = (userId, type) => {
    if (type === 'rep') {
      const rep = salesReps.find(r => r.id === userId);
      setCurrentUser(rep);
    } else {
      setCurrentUser({ id: userId, name: userId, role: 'Technician' });
    }
    setUserType(type);
    setAuthState('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserType(null);
    setAuthState('login');
    setFilterRep('all');
    setFilterTech('all');
    setFilterTag('all');
    setFilterSource('all');
    setViewMode('pipeline');
  };

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallPrompt(null);
      }
    }
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

  // Extract tags from deal
  const getDealTags = (deal) => {
    const tagsFound = [];
    const description = (deal.equipment || '').toLowerCase();
    if (description.includes('service')) tagsFound.push('Service');
    if (description.includes('install')) tagsFound.push('Install');
    if (description.includes('maintenance')) tagsFound.push('Maintenance');
    if (description.includes('callback')) tagsFound.push('Callbacks');
    if (description.includes('sales')) tagsFound.push('Sales');
    return tagsFound.length > 0 ? tagsFound : ['Other'];
  };

  // Calculate commission (2% of parts, excluding dispatch/diagnostic)
  const calculateCommission = (deal) => {
    if (deal.source !== 'HCP') return 0;
    const isDispatchOrDiagnostic = deal.equipment?.toLowerCase().includes('dispatch') || deal.equipment?.toLowerCase().includes('diagnostic');
    if (isDispatchOrDiagnostic) return 0;
    return Math.round(deal.amount * 0.02);
  };

  // Filter deals based on user type and filters
  let filteredDeals = deals;
  
  if (userType === 'tech') {
    // Techs see only their assigned jobs
    filteredDeals = filteredDeals.filter(d => d.commissionTech === currentUser.name);
  } else {
    // Reps see all jobs
    if (filterRep !== 'all') {
      filteredDeals = filteredDeals.filter(d => d.salesRep === filterRep);
    }
  }

  if (filterTech !== 'all') {
    filteredDeals = filteredDeals.filter(d => d.commissionTech === filterTech);
  }

  if (filterTag !== 'all') {
    filteredDeals = filteredDeals.filter(d => getDealTags(d).includes(filterTag));
  }

  if (filterSource !== 'all') {
    filteredDeals = filteredDeals.filter(d => d.source === filterSource);
  }

  const metrics = {
    totalPipeline: filteredDeals.reduce((sum, d) => sum + (d.stage !== 'Lost' ? d.amount : 0), 0),
    wonDeals: filteredDeals.filter(d => d.sold).length,
    closureRate: filteredDeals.length > 0 ? Math.round((filteredDeals.filter(d => d.sold).length / filteredDeals.length) * 100) : 0,
    totalDeals: filteredDeals.length,
    avgDealSize: filteredDeals.length > 0 ? Math.round(filteredDeals.reduce((sum, d) => sum + d.amount, 0) / filteredDeals.length) : 0,
    totalCommission: filteredDeals.reduce((sum, d) => sum + calculateCommission(d), 0)
  };

  const dealsByStage = stages.map(stage => ({
    stage,
    deals: filteredDeals.filter(d => d.stage === stage)
  }));

  const filteredActivities = userType === 'tech' 
    ? activities.filter(a => a.details && deals.find(d => d.id === a.dealId && d.commissionTech === currentUser.name))
    : filterRep === 'all' ? activities : activities.filter(a => a.salesRep === filterRep);

  // Tech Performance Data
  const getTechPerformance = (techName) => {
    const techDeals = deals.filter(d => d.commissionTech === techName);
    return {
      totalRevenue: techDeals.reduce((sum, d) => sum + d.amount, 0),
      totalCommission: techDeals.reduce((sum, d) => sum + calculateCommission(d), 0),
      jobsCompleted: techDeals.filter(d => d.sold).length,
      totalJobs: techDeals.length,
      avgJobSize: techDeals.length > 0 ? Math.round(techDeals.reduce((sum, d) => sum + d.amount, 0) / techDeals.length) : 0
    };
  };

  if (authState === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center p-4">
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');
        `}</style>
        
        <div className="w-full max-w-2xl">
          <div className="text-center mb-12">
            <img src="/lions-logo.png" alt="Lions Logo" className="h-20 mx-auto mb-6" />
            <h1 style={{ fontFamily: 'Syne' }} className="text-5xl font-bold text-white mb-2">
              Sales Command
            </h1>
            <p className="text-gray-400 text-lg">Real-time pipeline tracking</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Sales Reps */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4 text-center">Sales Reps</h2>
              <div className="space-y-3">
                {salesReps.map(rep => (
                  <button
                    key={rep.id}
                    onClick={() => handleLogin(rep.id, 'rep')}
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
            </div>

            {/* Technicians */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4 text-center">Technicians</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {technicians.map(tech => (
                  <button
                    key={tech}
                    onClick={() => handleLogin(tech, 'tech')}
                    className="w-full group relative px-6 py-4 bg-gradient-to-r from-blue-900 to-blue-850 border border-blue-700 hover:border-blue-400 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="font-semibold text-white">{tech}</p>
                        <p className="text-xs text-blue-400">Technician</p>
                      </div>
                      <div className="w-8 h-8 bg-blue-500/20 group-hover:bg-blue-500/40 rounded-lg flex items-center justify-center transition-colors">
                        <span className="text-blue-400 text-sm">→</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
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
              {userType === 'tech' ? '🔧 Tech Dashboard' : 'Command Center'}
            </h1>
            <p className="text-sm text-gray-400 mt-1">{currentUser.name}</p>
          </div><button
              onClick={() => {
                localStorage.removeItem('lionsSalesDeals');
                fetch('/.netlify/functions/hcp-fetch-estimates')
                  .then(res => res.json())
                  .then(data => {
                    if (data.deals) {
                      setDeals(data.deals);
                    }
                  })
                  .catch(err => console.error('Refresh failed:', err));
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <TrendingUp size={18} />
              Refresh
            </button>
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
                {userType === 'tech' ? 'My Stats' : 'Performance'}
              </button>
              <button
                onClick={() => setViewMode('activity')}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                  viewMode === 'activity'
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
{userType === 'tech' && (
                <button
                  onClick={() => setViewMode('history')}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                    viewMode === 'history'
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  History
                </button>
              )}
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
            {userType === 'rep' && (
              <button
                onClick={() => setShowNewDeal(true)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <Plus size={18} />
                New Deal
              </button>
            )}
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
              <p className="text-gray-400 text-xs uppercase">{userType === 'tech' ? 'Commission' : 'Avg Size'}</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">
                {userType === 'tech' ? `$${metrics.totalCommission}` : `$${(metrics.avgDealSize / 1000).toFixed(1)}K`}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-4 border-b border-gray-800 flex gap-4 flex-wrap">
            {userType === 'rep' && (
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
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Tech:</span>
              <select
                value={filterTech}
                onChange={(e) => setFilterTech(e.target.value)}
                className="bg-gray-900 border border-gray-800 text-white rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All Techs</option>
                {technicians.map(tech => (
                  <option key={tech} value={tech}>{tech}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Tag:</span>
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="bg-gray-900 border border-gray-800 text-white rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All Tags</option>
                {tags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
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

                        {/* Tags */}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {getDealTags(deal).map(tag => (
                            <span key={tag} className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Commission */}
                        {calculateCommission(deal) > 0 && (
                          <div className="mt-2 text-xs text-green-400">
                            Commission: ${calculateCommission(deal)}
                          </div>
                        )}

                        <div className="mt-3 pt-3 border-t border-gray-800 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Status</span>
                            {userType === 'rep' && (
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
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Eye size={12} />
                            <span>{deal.estimateViews} views</span>
                          </div>
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
          <h2 className="text-xl font-bold text-white mb-6">
            {userType === 'tech' ? 'Your Performance' : 'Team Performance'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {userType === 'tech' ? (
              // Tech performance
              <div className="col-span-3">
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-orange-500 transition-colors">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="font-semibold text-white text-2xl">{currentUser.name}</h3>
                      <p className="text-xs text-gray-500">Technician</p>
                    </div>
                    <Award size={24} className="text-orange-500" />
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <span className="text-gray-400 text-sm">Total Revenue</span>
                      <p className="text-2xl font-bold text-white mt-2">${(getTechPerformance(currentUser.name).totalRevenue / 1000).toFixed(1)}K</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Commission Earned</span>
                      <p className="text-2xl font-bold text-green-400 mt-2">${getTechPerformance(currentUser.name).totalCommission}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Jobs Completed</span>
                      <p className="text-2xl font-bold text-blue-400 mt-2">{getTechPerformance(currentUser.name).jobsCompleted}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Avg Job Size</span>
                      <p className="text-2xl font-bold text-purple-400 mt-2">${(getTechPerformance(currentUser.name).avgJobSize / 1000).toFixed(1)}K</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // All techs performance
              technicians.map(tech => {
                const perf = getTechPerformance(tech);
                return (
                  <div key={tech} className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-orange-500 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-white">{tech}</h3>
                        <p className="text-xs text-gray-500">Technician</p>
                      </div>
                      <Award size={20} className="text-orange-500" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Revenue</span>
                        <span className="text-white font-bold">${(perf.totalRevenue / 1000).toFixed(1)}K</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Commission</span>
                        <span className="text-green-400 font-bold">${perf.totalCommission}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Completed</span>
                        <span className="text-blue-400 font-bold">{perf.jobsCompleted}/{perf.totalJobs}</span>
                      </div>
                      <div className="border-t border-gray-800 pt-3 flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Avg Job</span>
                        <span className="text-purple-400 font-bold">${(perf.avgJobSize / 1000).toFixed(1)}K</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
{/* History View */}
{viewMode === 'history' && userType === 'tech' && (
  <div className="p-6">
    <div className="mb-6 flex items-center justify-between">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <Award size={24} className="text-orange-500" />
        Job History
      </h2>
    </div>

    <div className="mb-6 flex items-center gap-2">
      <span className="text-sm text-gray-400">Filter by Tag:</span>
      <select
        value={filterTag}
        onChange={(e) => setFilterTag(e.target.value)}
        className="bg-gray-900 border border-gray-800 text-white rounded-lg px-3 py-2 text-sm"
      >
        <option value="all">All Tags</option>
        {tags.map(tag => (
          <option key={tag} value={tag}>{tag}</option>
        ))}
      </select>
    </div>

    <div className="space-y-6">
      {(() => {
        const completedJobs = filteredDeals.filter(d => d.sold && d.commissionTech === currentUser.name);
        
        if (completedJobs.length === 0) {
          return (
            <div className="text-center py-12">
              <Clock size={48} className="text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400">No completed jobs yet</p>
            </div>
          );
        }

        // Group by week
        const jobsByWeek = {};
        completedJobs.forEach(job => {
          const date = new Date(job.lastActivity);
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          const weekKey = weekStart.toISOString().split('T')[0];
          
          if (!jobsByWeek[weekKey]) {
            jobsByWeek[weekKey] = [];
          }
          jobsByWeek[weekKey].push(job);
        });

        return Object.entries(jobsByWeek)
          .sort(([a], [b]) => new Date(b) - new Date(a))
          .map(([week, weekJobs]) => (
            <div key={week} className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h3 className="font-semibold text-white mb-4">Week of {new Date(week).toLocaleDateString()}</h3>
              
              <div className="space-y-3">
                {weekJobs.map(job => (
                  <div key={job.id} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-white">{job.customerName}</p>
                        <p className="text-xs text-gray-500">{job.lastActivity}</p>
                      </div>
                      <span className="text-lg font-bold text-green-400">${job.amount.toLocaleString()}</span>
                    </div>
                    
                    <p className="text-sm text-gray-400 mb-3">{job.equipment}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        {getDealTags(job).map(tag => (
                          <span key={tag} className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Commission</p>
                        <p className="font-bold text-green-400">${calculateCommission(job)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between">
                <span className="text-gray-400">Week Total</span>
                <span className="font-bold text-green-400">
                  ${weekJobs.reduce((sum, j) => sum + calculateCommission(j), 0)} commission
                </span>
              </div>
            </div>
          ));
      })()}
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
          userType={userType}
          getDealTags={getDealTags}
          calculateCommission={calculateCommission}
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
            <label className="block text-sm text-gray-400 mb-2">Tech</label>
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

function DealDetailModal({ deal, technicians, stages, userType, getDealTags, calculateCommission, onUpdate, onDelete, onClose, onActivity }) {
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

          {/* Tags */}
          <div>
            <p className="text-gray-400 text-sm mb-2">Tags</p>
            <div className="flex flex-wrap gap-2">
              {getDealTags(deal).map(tag => (
                <span key={tag} className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-lg text-sm font-semibold">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Commission */}
          {calculateCommission(deal) > 0 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <p className="text-green-400 text-sm">Commission</p>
              <p className="text-2xl font-bold text-green-400 mt-2">${calculateCommission(deal)}</p>
            </div>
          )}

          {userType === 'rep' && (
            <>
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
                <label className="block text-sm text-gray-400 mb-2">Tech</label>
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
            </>
          )}

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

          {userType === 'rep' && (
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
          )}

          {userType === 'rep' && (
            <button
              onClick={onDelete}
              className="w-full px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
            >
              Delete Deal
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
