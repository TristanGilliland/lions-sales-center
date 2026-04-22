exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const SHEET_ID = '1Tk4o7S0ql4-FOeGKnMpqac3P_QuuuYITeoeoR-THywM';
    
    // Fetch Google Sheet as CSV
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
    
    const res = await fetch(csvUrl);
    
    if (!res.ok) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch sheet' }) };
    }

    const csv = await res.text();
    const lines = csv.trim().split('\n');
    
    if (lines.length < 2) {
      return { statusCode: 200, body: JSON.stringify({ deals: [] }) };
    }

    // Parse headers
    const headers = lines[0].split(',').map(h => h.trim());
    
    // Parse rows
    const deals = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      const deal = {
        id: `completed-${i}`,
        customerName: values[0] || '',
        completedDate: values[1] || '',
        address: values[2] || '',
        phone: values[3] || '',
        email: values[4] || '',
        jobTotalAmount: parseFloat(values[5]) || 0,
        commissionAmount: parseFloat(values[6]) || 0,
        jobTag: values[7] || '',
        sold: true, // All rows in this sheet are completed jobs
        stage: 'Sold',
        source: 'Completed'
      };
      
      deals.push(deal);
    }

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
