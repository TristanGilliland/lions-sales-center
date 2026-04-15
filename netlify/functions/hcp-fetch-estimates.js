import fetch from 'node-fetch';

const HCP_API_KEY = process.env.HCP_API_KEY;
const HCP_BASE_URL = 'https://api.housecallpro.com';

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    console.log('HCP_API_KEY:', HCP_API_KEY ? 'SET' : 'NOT SET');
    
    const url = `${HCP_BASE_URL}/jobs?limit=100`;
    console.log('Fetching from:', url);
    
    const jobsRes = await nodeFetch(url, {
      headers: {
        'Authorization': `Token ${HCP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('HCP Response status:', jobsRes.status);

    if (!jobsRes.ok) {
      const errorText = await jobsRes.text();
      console.error('HCP API error:', jobsRes.status, errorText);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `HCP API error: ${jobsRes.status}` })
      };
    }

    const jobsData = await jobsRes.json();
    const jobs = jobsData.jobs || [];

    console.log('Successfully fetched', jobs.length, 'jobs');

    // Transform HCP jobs to deal format
    const deals = jobs.map(job => ({
      id: `hcp-${job.id}`,
      customerName: job.customer?.name || 'Unknown',
      amount: job.total_amount ? job.total_amount / 100 : 0,
      stage: mapJobStatusToStage(job.work_status || job.status),
      createdDate: new Date(job.created_at).toISOString().split('T')[0],
      salesRep: 'tristan',
      equipment: job.description || 'HVAC Service',
      sold: job.work_status === 'completed',
      equipmentOrdered: false,
      commissionTech: job.assigned_employees?.[0]?.first_name || 'Unassigned',
      estimateViews: 0,
      lastActivity: new Date(job.updated_at).toISOString().split('T')[0],
      source: 'HCP',
      jobId: job.id
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ deals, total: deals.length })
    };
  } catch (error) {
    console.error('Error fetching HCP estimates:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

function mapJobStatusToStage(status) {
  const statusMap = {
    'scheduled': 'Proposals',
    'in_progress': 'Negotiating',
    'completed': 'Sold',
    'invoiced': 'Sold',
    'cancelled': 'Lost',
    'no_show': 'Lost'
  };
  return statusMap[status] || 'Proposals';
}

const HCP_API_KEY = process.env.HCP_API_KEY;
const HCP_COMPANY_ID = 'd229639d-85d8-44ff-8831-27aa57333f50';
const HCP_BASE_URL = 'https://api.housecallpro.com2';

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    // Fetch all jobs from HCP
    const jobsRes = await fetch(`${HCP_BASE_URL}/jobs?limit=100`, {
      headers: {
        'Authorization': `Token ${HCP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!jobsRes.ok) {
      console.error('HCP API error:', jobsRes.status, await jobsRes.text());
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch HCP jobs' })
      };
    }

    const jobsData = await jobsRes.json();
    const jobs = jobsData.jobs || [];

    // Transform HCP jobs to deal format
    const deals = jobs.map(job => ({
      id: `hcp-${job.id}`,
      customerName: job.customer?.name || 'Unknown',
      amount: job.total_amount ? job.total_amount / 100 : 0, // Convert cents to dollars
      stage: mapJobStatusToStage(job.status),
      createdDate: new Date(job.created_at).toISOString().split('T')[0],
      salesRep: 'tristan', // Default to Tristan, can be enhanced
      equipment: job.notes || 'HVAC Service',
      sold: job.status === 'completed' || job.status === 'invoiced',
      equipmentOrdered: false,
      commissionTech: job.assigned_employees?.[0]?.name || 'Unassigned',
      estimateViews: 0,
      lastActivity: new Date(job.updated_at).toISOString().split('T')[0],
      source: 'HCP',
      jobId: job.id,
      customerId: job.customer?.id,
      status: job.status
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ deals, total: deals.length })
    };
  } catch (error) {
    console.error('Error fetching HCP estimates:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

function mapJobStatusToStage(status) {
  const statusMap = {
    'scheduled': 'Proposals',
    'in_progress': 'Negotiating',
    'completed': 'Sold',
    'invoiced': 'Sold',
    'cancelled': 'Lost',
    'no_show': 'Lost',
    'quote': 'Proposals'
  };
  return statusMap[status] || 'Proposals';
}
