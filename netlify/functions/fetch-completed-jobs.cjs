exports.handler = async (event) => {
  try {
    const SHEET_ID = '1uW5mVJwX7X6cYUclC2QBKMNQJh1yOND65JxLY-2MKqk';
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
    
    const res = await fetch(csvUrl);
    if (!res.ok) {
      return { statusCode: 500, body: JSON.stringify({ error: `Failed: ${res.status}` }) };
    }

    const csv = await res.text();
    const lines = csv.trim().split('\n');

    const deals = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Parse CSV: remove quotes and split by comma
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      if (values.length < 7) continue;
      
      const deal = {
        id: values[1] || `completed-${i}`,
        customerName: values[0] || 'Unknown',
        completedDate: values[2] || '',
        jobTotalAmount: parseFloat(values[4]) || 0,
        commissionAmount: parseFloat(values[5]) || 0,
        jobTag: values[6] || 'Completed',
        commissionTech: values[3] || 'Unknown',
        sold: true,
        stage: 'Sold',
        source: 'Completed'
      };
      
      deals.push(deal);
    }

    return { statusCode: 200, body: JSON.stringify({ deals }) };
    
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
