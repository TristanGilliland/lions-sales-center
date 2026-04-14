import fetch from 'node-fetch';

const HCP_API_BASE = 'https://api.housecallpro.com/v2';
const HCP_API_KEY = process.env.HCP_API_KEY;

exports.handler = async (event) => {
  const { action, data } = JSON.parse(event.body || '{}');

  try {
    switch (action) {
      case 'getEstimates':
        return await getEstimates(data);
      case 'getJobs':
        return await getJobs(data);
      case 'updateEstimate':
        return await updateEstimate(data);
      case 'getCustomer':
        return await getCustomer(data);
      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid action' })
        };
    }
  } catch (error) {
    console.error('HCP API Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function getEstimates(filters = {}) {
  const params = new URLSearchParams();
  if (filters.customerId) params.append('customer_id', filters.customerId);
  if (filters.status) params.append('status', filters.status);
  
  const response = await fetch(`${HCP_API_BASE}/estimates?${params}`, {
    headers: {
      'Authorization': `Token ${HCP_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  return {
    statusCode: 200,
    body: JSON.stringify(data)
  };
}

async function getJobs(filters = {}) {
  const params = new URLSearchParams();
  if (filters.customerId) params.append('customer_id', filters.customerId);
  if (filters.status) params.append('status', filters.status);
  
  const response = await fetch(`${HCP_API_BASE}/jobs?${params}`, {
    headers: {
      'Authorization': `Token ${HCP_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  return {
    statusCode: 200,
    body: JSON.stringify(data)
  };
}

async function updateEstimate(data) {
  const { estimateId, updates } = data;
  
  const response = await fetch(`${HCP_API_BASE}/estimates/${estimateId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Token ${HCP_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  const result = await response.json();
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
}

async function getCustomer(data) {
  const { customerId } = data;
  
  const response = await fetch(`${HCP_API_BASE}/customers/${customerId}`, {
    headers: {
      'Authorization': `Token ${HCP_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  const customer = await response.json();
  return {
    statusCode: 200,
    body: JSON.stringify(customer)
  };
}
