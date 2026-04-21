exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const HCP_API_KEY = process.env.HCP_API_KEY;
    const HCP_BASE_URL = 'https://api.housecallpro.com';
    
    // Fetch active/scheduled jobs
    const activeUrl = `${HCP_BASE_URL}/jobs?limit=100`;
    
    // Fetch completed jobs from past 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const completedUrl = `${HCP_BASE_URL}/jobs?work_status=completed&updated_after=${ninetyDaysAgo.toISOString()}&limit=200`;
    
    const headers = {
      'Authorization': `Token ${HCP_API_KEY}`,
      'Content-Type': 'application/json'
    };

    // Fetch both active and completed jobs
    const [activeRes, completedRes] = await Promise.all([
      fetch(activeUrl, { headers }),
      fetch(completedUrl, { headers })
    ]);

    if (!activeRes.ok || !completedRes.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'HCP API error' })
      };
    }

    const activeData = await activeRes.json();
    const completedData = await completedRes.json();
    
    const activeJobs = activeData.jobs || [];
    const completedJobs = completedData.jobs || [];
    
    // Combine both
    const allJobs = [...activeJobs, ...completedJobs];

    const deals = allJobs.map(job => ({
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
