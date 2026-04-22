exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const HCP_API_KEY = process.env.HCP_API_KEY;
    const HCP_BASE_URL = 'https://api.housecallpro.com';
    const ZAPIER_WEBHOOK = process.env.ZAPIER_COMPLETED_JOBS_WEBHOOK;

    const payload = JSON.parse(event.body);
    const jobId = payload.job_id || payload.id;

    if (!jobId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No job_id' }) };
    }

    // Fetch full job details from HCP
    const jobRes = await fetch(`${HCP_BASE_URL}/jobs/${jobId}`, {
      headers: { 'Authorization': `Token ${HCP_API_KEY}` }
    });

    if (!jobRes.ok) {
      return { statusCode: 500, body: JSON.stringify({ error: 'HCP fetch failed' }) };
    }

    const jobData = await jobRes.json();
    const job = jobData.job;

    // Fetch line items
    const lineItemsRes = await fetch(`${HCP_BASE_URL}/jobs/${jobId}/line_items`, {
      headers: { 'Authorization': `Token ${HCP_API_KEY}` }
    });

    const lineItemsData = await lineItemsRes.json();
    const lineItems = lineItemsData.line_items || [];

    // Parse line items: separate parts from dispatch/diagnostic
    let partsAmount = 0;
    let dispatchFees = 0;
    let diagnosticTime = 0;
    const lineItemsDetail = [];

    lineItems.forEach(item => {
      const name = (item.name || '').toLowerCase();
      const description = (item.description || '').toLowerCase();
      const amount = item.total_amount ? Math.round(item.total_amount / 100) : 0;

      if (name.includes('dispatch') || description.includes('dispatch')) {
        dispatchFees += amount;
      } else if (name.includes('diagnostic') || description.includes('diagnostic')) {
        diagnosticTime += amount;
      } else {
        partsAmount += amount;
        lineItemsDetail.push(`${item.name}: $${amount}`);
      }
    });

    // Calculate commission: 2% of parts only
    const commissionAmount = Math.round(partsAmount * 0.02);

    // Get tech name
    const techName = job.assigned_employees?.[0]
      ? `${job.assigned_employees[0].first_name} ${job.assigned_employees[0].last_name}`
      : 'Unassigned';

    // Get customer name
    const customerName = job.customer
      ? `${job.customer.first_name} ${job.customer.last_name}`
      : 'Unknown';

    // Prepare data for Google Sheet
    const rowData = {
      job_id: jobId,
      customer_name: customerName,
      tech_name: techName,
      completed_date: new Date().toISOString().split('T')[0],
      job_total_amount: job.total_amount ? Math.round(job.total_amount / 100) : 0,
      dispatch_fees: dispatchFees,
      diagnostic_time: diagnosticTime,
      parts_amount: partsAmount,
      commission_amount: commissionAmount,
      line_items: lineItemsDetail.join('; '),
      description: job.description || ''
    };

    // Send to Zapier webhook to add row to Google Sheet
    if (ZAPIER_WEBHOOK) {
      await fetch(ZAPIER_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rowData)
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, commission: commissionAmount })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
