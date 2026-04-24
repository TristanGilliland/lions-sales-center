exports.handler = async (event) => {
  try {
    const API_KEY = process.env.HCP_API_KEY;
    const COMPANY_ID = 'd229639d-85d8-44ff-8831-27aa57333f50';
    
    const res = await fetch(
      `https://api.housecallpro.com/v2/companies/${COMPANY_ID}/jobs?work_status=unfinished&limit=5`,
      { headers: { 'Authorization': `Token ${API_KEY}` } }
    );
    const data = await res.json();
    const jobs = data.data || [];
    
    // Return first job with ALL fields
    const sample = jobs[0];
    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        sample,
        allKeys: sample ? Object.keys(sample) : [],
        jobCount: jobs.length
      }, null, 2) 
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
