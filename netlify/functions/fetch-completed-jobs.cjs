exports.handler = async (event) => {
  try {
    const SHEET_ID = '1uW5mVJwX7X6cYUclC2QBKMNQJh1yOND65JxLY-2MKqk';
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
    
    const res = await fetch(csvUrl);
    if (!res.ok) {
      console.error('Sheet fetch failed:', res.status);
      return { statusCode: 500, body: JSON.stringify({ error: `Failed: ${res.status}` }) };
    }

    const csv = await res.text();
    console.log('CSV first 1000 chars:', csv.substring(0, 1000));
    
    const lines = csv.trim().split('\n');
    console.log('Total lines:', lines.length);
    console.log('Header:', lines[0]);
    if (lines[1]) console.log('Row 1:', lines[1]);

    const deals = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(v => v.trim());
      console.log(`Row ${i} values:`, values);
      
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

    console.log(`Parsed ${deals.length} deals`);
    return { statusCode: 200, body: JSON.stringify({ deals }) };
    
  } catch (error) {
    console.error('Error:', error.message);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
