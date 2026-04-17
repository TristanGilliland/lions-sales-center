/**
 * netlify/functions/hcp-fetch-jobs.cjs
 *
 * Pulls HCP jobs via the Apify HCP MCP actor.
 * Same credentials as the existing hcp-fetch-estimates function.
 *
 * Query params:
 *   days_back — how far back to pull (default 21, max 60)
 *
 * Returns: { jobs: [...], count: N, range: { min, max } }
 *
 * Uses `.cjs` extension because package.json has "type": "module".
 */

exports.handler = async (event) => {
  const APIFY_TOKEN = process.env.APIFY_TOKEN;
  const HCP_API_KEY = process.env.HCP_API_KEY;

  if (!APIFY_TOKEN || !HCP_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Missing APIFY_TOKEN or HCP_API_KEY in Netlify env vars',
      }),
    };
  }

  // Parse + clamp days_back
  const raw = parseInt(event.queryStringParameters?.days_back || '21', 10);
  const daysBack = Math.min(Math.max(raw, 1), 60);

  const now = new Date();
  const minDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  const fmt = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const scheduled_start_min = `${fmt(minDate)}T00:00:00`;
  const scheduled_start_max = `${fmt(now)}T23:59:59`;

  const apifyUrl = `https://api.apify.com/v2/acts/flow_logic_automation~flow-logic-automation---hcp-mcp/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=90`;

  try {
    const jobs = [];
    let page = 1;
    const MAX_PAGES = 10;

    while (page <= MAX_PAGES) {
      const resp = await fetch(apifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hcpApiKey: HCP_API_KEY,
          companyTimezone: 'America/New_York',
          operation: 'hcp_get_jobs',
          args: { scheduled_start_min, scheduled_start_max, page, page_size: 200 },
        }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        return {
          statusCode: resp.status,
          body: JSON.stringify({ error: `Apify responded ${resp.status}`, detail: text.slice(0, 500) }),
        };
      }

      const data = await resp.json();
      const batch = (Array.isArray(data) && data[0]?.result?.jobs) || [];
      jobs.push(...batch);
      const totalPages = (Array.isArray(data) && data[0]?.result?.total_pages) || 1;
      if (page >= totalPages || batch.length === 0) break;
      page++;
    }
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        // 60s edge cache — client polls every 5 min, so this just absorbs bursts
        'Cache-Control': 'public, max-age=60, s-maxage=60',
      },
      body: JSON.stringify({
        jobs,
        count: jobs.length,
        range: { min: scheduled_start_min, max: scheduled_start_max },
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
