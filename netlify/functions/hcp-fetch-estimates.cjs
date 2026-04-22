exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const HCP_API_KEY = process.env.HCP_API_KEY;
    const HCP_BASE_URL = 'https://api.housecallpro.com';
    
    const headers = {
      'Authorization': `Token ${HCP_API_KEY}`,
      'Content-Type': 'application/json'
    };

    // Fetch active jobs (scheduled, in_progress)
    const activeUrl = `${HCP_BASE_URL}/jobs?limit=500&work_status=scheduled,in_progress`;
    
    // Fetch finished jobs
    const finishedUrl = `${HCP_BASE_URL}/jobs?limit=500&work_status=finished`;
    
    const [activeRes, finishedRes] = await Promise.all([
      fetch(activeUrl, { headers }),
      fetch(finishedUrl, { headers })
    ]);

    if (!activeRes.ok || !finishedRes.ok) {
      return { statusCode: 500, body: JSON.stringify({ error: 'HCP API error' }) };
    }

    const activeData = await activeRes.json();
    const finishedData = await finishedRes.json();
    
    const jobs = [...(activeData.jobs || []), ...(finishedData.jobs || [])];

    const deals = jobs.map(job => ({
      id: `hcp-${job.id}`,
      customerName: job.customer?.first_name + ' ' + job.customer?.last_name || 'Unknown',
      amount: job.total_amount ? Math.round(job.total_amount / 100) : 0,
      stage: job.work_status === 'finished' ? 'Sold' : 'Proposals',
      createdDate: new Date(job.created_at).toISOString().split('T')[0],
      salesRep: 'tristan',
      equipment: job.description || 'HVAC Service',
      sold: job.work_status === 'finished',
      equipmentOrdered: false
