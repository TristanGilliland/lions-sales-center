import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  categorizeJob,
  categoryStats,
  getWeekRange,
  filterJobsByCompletedWeek,
} from '../lib/categorize';

const TABS = [
  { id: 'all',         label: 'All' },
  { id: 'service',     label: 'Service' },
  { id: 'install',     label: 'Install' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'callback',    label: 'Callback' },
];

const POLL_MS = 5 * 60 * 1000; // 5 minutes

export default function JobsView() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('all');
  const [lastFetched, setLastFetched] = useState(null);

  const fetchJobs = useCallback(async () => {
    try {
      setError(null);
      const resp = await fetch('/.netlify/functions/hcp-fetch-jobs?days_back=21');
      if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
      const data = await resp.json();
      setJobs(data.jobs || []);
      setLastFetched(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    const id = setInterval(fetchJobs, POLL_MS);
    return () => clearInterval(id);
  }, [fetchJobs]);

  const thisWeek = useMemo(() => getWeekRange(0), []);
  const lastWeek = useMemo(() => getWeekRange(-1), []);

  const jobsThisWeek = useMemo(
    () => filterJobsByCompletedWeek(jobs, thisWeek),
    [jobs, thisWeek]
  );
  const jobsLastWeek = useMemo(
    () => filterJobsByCompletedWeek(jobs, lastWeek),
    [jobs, lastWeek]
  );

  const statsThis = useMemo(() => categoryStats(jobsThisWeek), [jobsThisWeek]);
  const statsLast = useMemo(() => categoryStats(jobsLastWeek), [jobsLastWeek]);

  // Tab chip counts
  const tabCounts = useMemo(() => {
    const c = { all: 0, service: 0, install: 0, maintenance: 0, callback: 0 };
    for (const j of jobsThisWeek) {
      if ((j.work_status || '').includes('canceled') || j.deleted_at) continue;
      c.all++;
      const cat = categorizeJob(j);
      if (c[cat] !== undefined) c[cat]++;
    }
    return c;
  }, [jobsThisWeek]);

  // Filtered + sorted visible jobs
  const visibleJobs = useMemo(() => {
    const base = jobsThisWeek.filter(
      (j) => !(j.work_status || '').includes('canceled') && !j.deleted_at
    );
    const filtered = tab === 'all' ? base : base.filter((j) => categorizeJob(j) === tab);
    return [...filtered].sort(
      (a, b) =>
        new Date(b.work_timestamps?.completed_at || 0) -
        new Date(a.work_timestamps?.completed_at || 0)
    );
  }, [jobsThisWeek, tab]);

  // Stats banner values for the active tab
  const tabStat = useMemo(() => {
    if (tab === 'all') {
      const count =
        statsThis.service.count + statsThis.install.count +
        statsThis.maintenance.count + statsThis.callback.count;
      const revenue =
        statsThis.service.revenue + statsThis.install.revenue +
        statsThis.maintenance.revenue + statsThis.callback.revenue;
      const lastCount =
        statsLast.service.count + statsLast.install.count +
        statsLast.maintenance.count + statsLast.callback.count;
      const lastRevenue =
        statsLast.service.revenue + statsLast.install.revenue +
        statsLast.maintenance.revenue + statsLast.callback.revenue;
      return { count, revenue, lastCount, lastRevenue };
    }
    const t = statsThis[tab] || { count: 0, revenue: 0 };
    const l = statsLast[tab] || { count: 0, revenue: 0 };
    return { count: t.count, revenue: t.revenue, lastCount: l.count, lastRevenue: l.revenue };
  }, [tab, statsThis, statsLast]);

  const weekLabel = `${thisWeek.start.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  })} – ${thisWeek.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  return (
    <div className="space-y-4">
      {/* Tab bar + week label */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                tab === t.id
                  ? 'bg-orange-500 text-black'
                  : 'bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-800'
              }`}
            >
              {t.label}
              {tabCounts[t.id] !== undefined && (
                <span
                  className={`ml-1.5 text-xs tabular-nums ${
                    tab === t.id ? 'text-black/60' : 'text-gray-600'
                  }`}
                >
                  {tabCounts[t.id]}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-500">
          Week: {weekLabel}
          {lastFetched && (
            <>
              {' · Updated '}
              {lastFetched.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </>
          )}
        </div>
      </div>

      {/* Stats banner */}
      <StatsBanner
        label={TABS.find((t) => t.id === tab)?.label || 'All'}
        {...tabStat}
      />

      {/* Loading / error / empty states */}
      {loading && (
        <div className="text-gray-500 text-sm text-center py-8">Loading jobs…</div>
      )}
      {error && (
        <div className="text-red-400 text-sm text-center py-8">Error: {error}</div>
      )}
      {!loading && !error && visibleJobs.length === 0 && (
        <div className="text-gray-500 text-sm text-center py-8">
          No jobs completed this week in this category yet.
        </div>
      )}

      {/* Job grid */}
      {!loading && !error && visibleJobs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visibleJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Stats banner
// ============================================================================

function StatsBanner({ label, count, revenue, lastCount, lastRevenue }) {
  const deltaRev = revenue - lastRevenue;
  const pctRev = lastRevenue > 0 ? (deltaRev / lastRevenue) * 100 : null;
  const deltaColor = deltaRev >= 0 ? 'text-emerald-400' : 'text-red-400';
  const deltaSign = deltaRev >= 0 ? '+' : '-';
  const absRev = Math.abs(deltaRev);

  const avg = count > 0 ? revenue / count : 0;
  const lastAvg = lastCount > 0 ? lastRevenue / lastCount : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-900 border border-gray-800 rounded-lg">
      <Stat
        label={`${label} jobs`}
        value={count}
        sub={`vs ${lastCount} last week`}
      />
      <Stat
        label="Revenue"
        value={`$${revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        sub={`vs $${lastRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
      />
      <Stat
        label="Revenue Δ"
        value={
          <span className={deltaColor}>
            {deltaSign}${absRev.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        }
        sub={pctRev !== null ? `${deltaRev >= 0 ? '+' : ''}${pctRev.toFixed(0)}%` : '—'}
      />
      <Stat
        label="Avg ticket"
        value={count > 0 ? `$${avg.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
        sub={
          lastCount > 0
            ? `vs $${lastAvg.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
            : '—'
        }
      />
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">
        {label}
      </div>
      <div className="text-xl font-bold text-white mt-0.5 tabular-nums">{value}</div>
      <div className="text-xs text-gray-500 tabular-nums mt-0.5">{sub}</div>
    </div>
  );
}

// ============================================================================
// Job card
// ============================================================================

const CAT_STYLES = {
  service:     { bg: 'bg-blue-500/15',    text: 'text-blue-300',    ring: 'ring-blue-500/30',    label: 'Service' },
  install:     { bg: 'bg-emerald-500/15', text: 'text-emerald-300', ring: 'ring-emerald-500/30', label: 'Install' },
  maintenance: { bg: 'bg-slate-500/15',   text: 'text-slate-300',   ring: 'ring-slate-500/30',   label: 'Maintenance' },
  callback:    { bg: 'bg-rose-500/15',    text: 'text-rose-300',    ring: 'ring-rose-500/30',    label: 'Callback' },
  other:       { bg: 'bg-gray-500/15',    text: 'text-gray-400',    ring: 'ring-gray-500/30',    label: 'Other' },
};

function JobCard({ job }) {
  const cat = categorizeJob(job);
  const s = CAT_STYLES[cat];
  const revenue = (job.total_amount || 0) / 100;

  const techs = (job.assigned_employees || [])
    .filter((e) => e.role === 'field tech' || e.role === 'admin')
    .map((e) => e.first_name)
    .join(', ');

  const completed = job.work_timestamps?.completed_at;
  const completedLabel = completed
    ? new Date(completed).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '—';

  const customerName =
    `${job.customer?.first_name || ''} ${job.customer?.last_name || ''}`.trim() || 'Unknown';

  const city = job.address?.city;
  const state = job.address?.state;

  return (
    <div className="bg-gray-900 border border-gray-800 hover:border-orange-500 rounded-lg p-4 transition-all hover:shadow-lg hover:shadow-orange-500/10">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-xs text-gray-500">#{job.invoice_number || '—'}</span>
          <span
            className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded ring-1 ring-inset ${s.bg} ${s.text} ${s.ring}`}
          >
            {s.label}
          </span>
        </div>
        <span className="text-xs text-gray-500 flex-none">{completedLabel}</span>
      </div>

      <div className="text-sm font-semibold text-white truncate">{customerName}</div>
      <div className="text-xs text-gray-500 truncate mt-0.5">
        {job.description || '—'}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-800 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <div className="text-lg font-bold text-white tabular-nums">
            {revenue > 0
              ? `$${revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
              : '—'}
          </div>
          {techs && <div className="text-xs text-gray-500 mt-0.5 truncate">{techs}</div>}
        </div>
        {(city || state) && (
          <div className="text-xs text-gray-500 text-right flex-none">
            {city}{city && state ? ', ' : ''}{state}
          </div>
        )}
      </div>
    </div>
  );
}
