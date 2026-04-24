exports.handler = async (event) => {
  try {
    const HCP_API_KEY = process.env.HCP_API_KEY;
    const HCP_COMPANY_ID = 'd229639d-85d8-44ff-8831-27aa57333f50';
    
    const estimatesRes = await fetch(
      `https://api.housecallpro.com/v2/companies/${HCP_COMPANY_ID}/jobs?work_status=unfinished`,
      { headers: { 'Authorization': `Token ${HCP_API_KEY}` } }
    );
    const estimatesData = await estimatesRes.json();
    const jobs = estimatesData.data || [];

    const deals = await Promise.all(jobs.map(async (job) => {
      let customerInfo = { address: '', phone: '', email: '' };
      
      if (job.customer_id) {
        try {
          const custRes = await fetch(
            `https://api.housecallpro.com/v2/companies/${HCP_COMPANY_ID}/customers/${job.customer_id}`,
            { headers: { 'Authorization': `Token ${HCP_API_KEY}` } }
          );
          const custData = await custRes.json();
          if (custData.data) {
            customerInfo = {
              address: `${custData.data.street || ''} ${custData.data.city || ''} ${custData.data.state || ''}`.trim(),
              phone: custData.data.phone || '',
              email: custData.data.email || ''
            };
          }
        } catch (e) { console.error('Customer fetch error:', e); }
      }

      const lineItems = job.line_items || [];
      let jobTotal = 0;
      lineItems.forEach(item => {
        if (item.item_type === 'line_item') {
          jobTotal += (item.price || 0) * (item.quantity || 1);
        }
      });

      return {
        id: job.id,
        customerName: job.customer_name || 'Unknown',
        address: customerInfo.address,
        phone: customerInfo.phone,
        email: customerInfo.email,
        jobTotalAmount: jobTotal,
        description: job.description || '',
        sold: false,
        stage: 'Open',
        source: 'HCP'
      };
    }));

    return { statusCode: 200, body: JSON.stringify({ deals }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
