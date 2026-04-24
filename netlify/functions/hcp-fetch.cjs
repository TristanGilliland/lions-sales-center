exports.handler = async (event) => {
  try {
    const API_KEY = process.env.HCP_API_KEY;
    const COMPANY_ID = 'd229639d-85d8-44ff-8831-27aa57333f50';

    // Fetch all unfinished jobs
    const jobsUrl = `https://api.housecallpro.com/v2/companies/${COMPANY_ID}/jobs?work_status=unfinished&limit=100`;
    const jobsRes = await fetch(jobsUrl, {
      headers: { 'Authorization': `Token ${API_KEY}` }
    });
    const jobsData = await jobsRes.json();
    const jobs = jobsData.data || [];

    // Enrich each job with customer data
    const deals = await Promise.all(
      jobs.map(async (job) => {
        let customer = { address: '', phone: '', email: '' };
        
        if (job.customer_id) {
          try {
            const custUrl = `https://api.housecallpro.com/v2/companies/${COMPANY_ID}/customers/${job.customer_id}`;
            const custRes = await fetch(custUrl, {
              headers: { 'Authorization': `Token ${API_KEY}` }
            });
            const custData = await custRes.json();
            if (custData.data) {
              customer = {
                address: `${custData.data.street || ''} ${custData.data.city || ''}`.trim(),
                phone: custData.data.phone || '',
                email: custData.data.email || ''
              };
            }
          } catch (e) {
            console.error('Customer fetch error:', e);
          }
        }

        // Calculate total from line items
        let total = 0;
        if (job.line_items && Array.isArray(job.line_items)) {
          job.line_items.forEach(item => {
            if (item.item_type === 'line_item') {
              total += (item.price || 0) * (item.quantity || 1);
            }
          });
        }

        // Extract job type - log raw value for debugging
        const rawType = job.description || '';
        console.log(`Job ${job.id}: description="${rawType}"`);

        return {
          id: job.id,
          customerName: job.customer_name || 'Unknown',
          address: customer.address,
          phone: customer.phone,
          email: customer.email,
          jobType: rawType,
          total: total,
          createdAt: job.created_date || new Date().toISOString(),
          source: 'HCP',
          completed: false
        };
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ deals })
    };
  } catch (error) {
    console.error('HCP fetch error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
