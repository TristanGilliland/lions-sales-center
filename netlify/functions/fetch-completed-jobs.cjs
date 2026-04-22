exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const SHEET_ID = '1Tk4o7S0ql4-FOeGKnMpqac3P_QuuuYITeoeoR-THywM';
    
    // Fetch Google Sheet as CSV
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
    
    const res = await fetch(csvUrl);
    
    if (!res.ok) {
      console.error('Sheet fetch failed:', res.status, res.statusText);
      return { statusCode: 500, body: JSON.stringify({ error: `Sheet fetch failed: ${res.status}` }) };
    }

    const csv = await res.text();
    const lines = csv.trim().split('\n');
    
    if (lines.length < 2) {
      return { statusCode: 200, body: JSON.stringify({ deals: [] }) };
    }

    // Parse rows
    const deals = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(v => v.trim());
      
      if (values.length < 8) continue; // Skip incomplete rows

      const deal = {
        id: `completed-${i}`,
        customerName: values[0] || 'Unknown',
        completedDate: values[1] || '',
        address: values[2] || '',
        phone: values[3] || '',
        email: values[4] || '',
        jobTotalAmount: parseFloat(values[5]) || 0,
        commissionAmount: parseFloat(values[6]) || 0,
        jobTag: values[7] || 'Completed',
        sold: true,
        stage: 'Sold',
        source: 'Completed',
        commissionTech: values[0] ? values[0].split(' ').slice(0, -1).join(' ') : 'Unknown' // Extract tech name
      };
      
      deals.push(deal);
    }

    console.log(`Parsed ${deals.length} completed jobs from sheet`);

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
