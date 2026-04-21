exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const HCP_API_KEY = process.env.HCP_API_KEY;
    const HCP_BASE_URL = 'https://api.housecallpro.com';
    
    // Fetch all jobs (HCP returns up to limit)
    const url = `${HCP_BASE_URL}/jobs?limit=500`;
    
    const jobsRes = await fetch(url, {
      headers: {
        'Authorization': `Token ${HCP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!jobsRes.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'HCP API error' })
      };
    }

    const jobsData = await jobsRes.json();
    const jobs = jobsData.jobs || [];const sethJob = jobs.find(j => j.customer?.first_name === 'Seth');
if (sethJob) {
  console.log('Seth raw:', JSON.stringify(sethJob, null, 2));
}

    const deals = jobs.map(job => ({
      id: `hcp-${job.id}`,
      customerName: job.customer?.first_name + ' ' + job.customer?.last_name || 'Unknown',
      amount: job.total_amount ? Math.round(job.total_amount / 100) : 0,
      stage: job.work_status === 'completed' ? 'Sold' : 'Proposals',
      createdDate: new Date(job.created_at).toISOString().split('T')[0],
      salesRep: 'tristan',
      equipment: job.description || 'HVAC Service',
      sold: job.work_status === 'completed',
      equipmentOrdered: false,
      commissionTech: job.assigned_employees?.[0] ? `${job.assigned_employees[0].first_name} ${job.assigned_employees[0].last_name}` : 'Unassigned',
      estimateViews: 0,
      lastActivity: new Date(job.updated_at).toISOString().split('T')[0],
      source: 'HCP'
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ deals, total: deals.length })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
