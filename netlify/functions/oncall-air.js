export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const payload = JSON.parse(event.body);
    const oncallData = payload.event;

    // Transform OnCall Air data to our deal format
    const deal = {
      id: `oncall-${oncallData.consultation.code}`,
      customerName: oncallData.customer.full_name,
      amount: oncallData.option_values.option2_total_investment || 
              oncallData.option_values.option3_total_investment || 
              oncallData.option_values.max_total_investment,
      stage: mapStatus(oncallData.consultation.status),
      createdDate: new Date(oncallData.consultation_timestamps.created_at).toISOString().split('T')[0],
      salesRep: 'oncall-air', // Mark as OnCall Air source
      equipment: oncallData.consultation.description || 'OnCall Air Proposal',
      sold: oncallData.consultation.status === 'accepted',
      equipmentOrdered: false,
      commissionTech: oncallData.assigned_consultant.first_name + ' ' + oncallData.assigned_consultant.last_name,
      estimateViews: (oncallData.option_values.option2_remote_views || 0) + 
                     (oncallData.option_values.option3_remote_views || 0),
      lastActivity: new Date(oncallData.event.ocurred_at).toISOString().split('T')[0],
      source: 'OnCall Air',
      consultationCode: oncallData.consultation.code,
      customerPhone: oncallData.customer.phone,
      customerEmail: oncallData.customer.email,
      summaryUrl: oncallData.consultation.summary_url
    };

    console.log('OnCall Air deal received:', deal);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, deal })
    };
  } catch (error) {
    console.error('OnCall Air webhook error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

function mapStatus(oncallStatus) {
  const statusMap = {
    'presented': 'Proposals',
    'accepted': 'Sold',
    'lost': 'Lost',
    'draft': 'Proposals'
  };
  return statusMap[oncallStatus] || 'Proposals';
}
