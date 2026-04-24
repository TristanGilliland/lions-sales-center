exports.handler = async (event) => {
  try {
    const SHEET_ID = '1uW5mVJwX7X6cYUclC2QBKMNQJh1yOND65JxLY-2MKqk';
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
    
    const res = await fetch(url);
    const csv = await res.text();
    const lines = csv.trim().split('\n');
    
    const deals = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      if (cols.length < 7) continue;
      
      deals.push({
        id: `completed-${cols[1] || i}`,
        customerName: cols[0],
        total: parseFloat(cols[4]) || 0,
        commission: parseFloat(cols[5]) || 0,
        jobType: cols[6],
        address: cols[7] || '',
        phone: cols[8] || '',
        completedAt: cols[2],
        tech: cols[3],
        source: 'Completed',
        completed: true
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ deals })
    };
  } catch (error) {
    console.error('Completed jobs error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
