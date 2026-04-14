import fetch from 'node-fetch';

const ZAPIER_WEBHOOK_URL = process.env.ZAPIER_WEBHOOK_URL;

exports.handler = async (event) => {
  const { action, data } = JSON.parse(event.body || '{}');

  try {
    switch (action) {
      case 'logDeal':
        return await logDeal(data);
      case 'logActivity':
        return await logActivity(data);
      case 'batchLog':
        return await batchLog(data);
      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid action' })
        };
    }
  } catch (error) {
    console.error('Zapier webhook error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function logDeal(data) {
  const payload = {
    timestamp: new Date().toISOString(),
    type: 'deal_log',
    dealId: data.id,
    customerName: data.customerName,
    amount: data.amount,
    stage: data.stage,
    equipment: data.equipment,
    salesRep: data.salesRep,
    sold: data.sold,
    equipmentOrdered: data.equipmentOrdered,
    commissionTech: data.commissionTech,
    createdDate: data.createdDate,
    lastActivity: data.lastActivity
  };

  if (!ZAPIER_WEBHOOK_URL) {
    // Log to console if webhook not configured
    console.log('Deal logged:', payload);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Logged locally (webhook not configured)' })
    };
  }

  const response = await fetch(ZAPIER_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
}

async function logActivity(data) {
  const payload = {
    timestamp: new Date().toISOString(),
    type: 'activity_log',
    dealId: data.dealId,
    activity: data.activity,
    details: data.details,
    activityType: data.activityType // 'call', 'sms', 'status_change', 'note'
  };

  if (!ZAPIER_WEBHOOK_URL) {
    console.log('Activity logged:', payload);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Logged locally (webhook not configured)' })
    };
  }

  const response = await fetch(ZAPIER_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
}

async function batchLog(data) {
  const { deals, activities } = data;

  const payloads = [
    ...(deals || []).map(deal => ({
      timestamp: new Date().toISOString(),
      type: 'deal_log',
      ...deal
    })),
    ...(activities || []).map(activity => ({
      timestamp: new Date().toISOString(),
      type: 'activity_log',
      ...activity
    }))
  ];

  if (!ZAPIER_WEBHOOK_URL) {
    console.log('Batch logged:', payloads);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Logged locally (webhook not configured)' })
    };
  }

  // Send each payload to webhook
  const results = await Promise.all(
    payloads.map(payload =>
      fetch(ZAPIER_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
    )
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, count: payloads.length })
  };
}
