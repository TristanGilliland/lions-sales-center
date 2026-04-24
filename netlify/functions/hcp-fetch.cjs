exports.handler = async () => {
  return { statusCode: 200, body: JSON.stringify({ deals: [
    { id: '1', customerName: 'Regan', phone: '555-0001', address: '123 Main', jobType: 'Install', total: 5000 },
    { id: '2', customerName: 'Hunt', phone: '555-0002', address: '456 Oak', jobType: 'Install', total: 7500 },
    { id: '3', customerName: 'Smith', phone: '555-0003', address: '789 Pine', jobType: 'Maintenance', total: 2000 },
    { id: '4', customerName: 'Jones', phone: '555-0004', address: '321 Elm', jobType: 'Service', total: 1500 }
  ]}) };
};
