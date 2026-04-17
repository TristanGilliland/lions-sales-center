/**
 * src/lib/categorize.js
 *
 * Pure functions for job categorization and week-range filtering.
 * No React, no dependencies. Safe to import anywhere.
 *
 * Mirrors the Python logic in lions_callback_radar_zapier.py so the
 * Command Center and the Slack alert use the same rules.
 */

export function categorizeJob(job) {
  const tags = (job.tags || []).map((t) => t.toLowerCase().replace(/\s+/g, ''));

  // Priority matters: a callback that also has an "Install" tag is still a callback.
  if (tags.includes('callback')) return 'callback';
  if (tags.includes('install') || tags.includes('oncallair')) return 'install';
  if (
    tags.includes('maintenance') ||
    tags.includes('coolpm') ||
    tags.includes('heatpm') ||
    tags.includes('commercialmaintenance')
  ) {
    return 'maintenance';
  }
  if (tags.includes('service')) return 'service';
  return 'other';
}

/**
 * Aggregate a list of jobs into per-category counts and revenue.
 * Revenue is in dollars (converted from HCP cents).
 * Canceled/deleted jobs are excluded from the buckets but counted separately.
 */
export function categoryStats(jobs) {
  const buckets = {
    service: { count: 0, revenue: 0 },
    install: { count: 0, revenue: 0 },
    maintenance: { count: 0, revenue: 0 },
    callback: { count: 0, revenue: 0 },
    other: { count: 0, revenue: 0 },
  };
  let canceled = 0;

  for (const job of jobs) {
    if ((job.work_status || '').includes('canceled') || job.deleted_at) {
      canceled++;
      continue;
    }
    const cat = categorizeJob(job);
    buckets[cat].count++;
    buckets[cat].revenue += (job.total_amount || 0) / 100;
  }

  return { totalJobs: jobs.length, canceled, ...buckets };
}

/**
 * Returns { start, end } for a week boundary, Monday 00:00 to Sunday 23:59:59.
 * offset = 0 for current week, -1 for last week, +1 for next week.
 * Uses local browser time — fine for the Command Center since staff are all in ET.
 */
export function getWeekRange(offset = 0) {
  const now = new Date();
  const day = now.getDay() === 0 ? 7 : now.getDay(); // Sunday → 7 so Monday is "day 1"
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day - 1) + offset * 7);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 7);
  sunday.setMilliseconds(-1);

  return { start: monday, end: sunday };
}

/**
 * Filter jobs by their completion timestamp into a given week window.
 * Jobs without a completed_at are excluded (they haven't actually happened yet).
 */
export function filterJobsByCompletedWeek(jobs, { start, end }) {
  return jobs.filter((job) => {
    const completed = job.work_timestamps?.completed_at;
    if (!completed) return false;
    const date = new Date(completed);
    return date >= start && date <= end;
  });
}
