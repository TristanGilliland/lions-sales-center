exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
const SHEET_ID = '1uW5mVJwX7X6cYUclC2QBKMNQJh1yOND65JxLY-2MKqk';
    
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

const deals = [];
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  const values = line.split(',');
  
  const deal = {
    id: values[1]?.trim() || `completed-${i}`,
    customerName: values[0]?.trim() || 'Unknown',
    completedDate: values[2]?.trim() || '',
    jobTotalAmount: parseFloat(values[4]) || 0,
    commissionAmount: parseFloat(values[5]) || 0,
    jobTag: values[6]?.trim() || 'Completed',
    commissionTech: values[3]?.trim() || 'Unknown',
    sold: true,
    stage: 'Sold',
    source: 'Completed'
  };
  
  deals.push(deal);
}      
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
