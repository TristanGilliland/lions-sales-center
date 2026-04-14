import fetch from 'node-fetch';

const ZAPIER_WEBHOOK_URL = process.env.ZAPIER_WEBHOOK_URL;

/**
 * HCP Webhooks Handler
 * Receives webhook events from HCP and logs them to Google Sheets via Zapier
 * 
 * Supported events:
 * - estimate.viewed - Customer viewed an estimate
 * - estimate.opened - Estimate opened for editing
 * - job.created - New job created
 * - job.scheduled - Job scheduled
 * - job.completed - Job marked complete
 */

exports.handler = async (event) => {
  // Only handle POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const payload = JSON.parse(event.body);
    const { event: eventType, data } = payload;

    console.log(`HCP Webhook: ${eventType}`, data);

    // Route to appropriate handler
    switch (eventType) {
      case 'estimate.viewed':
        return await handleEstimateViewed(data);
      case 'estimate.opened':
        return await handleEstimateOpened(data);
      case 'job.created':
        return await handleJobCreated(data);
      case 'job.scheduled':
        return await handleJobScheduled(data);
      case 'job.completed':
        return await handleJobCompleted(data);
      default:
        console.log(`Unknown event type: ${eventType}`);
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Event logged but not processed' })
        };
    }
  } catch (error) {
    console.error('HCP Webhook Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function handleEstimateViewed(data) {
  /**
   * Event when customer views estimate (typically via email link or portal)
   * HCP payload structure:
   * {
   *   estimate_id: "123",
   *   customer_id: "456",
   *   customer_name: "John Smith",
   *   amount: 5200,
   *   viewed_at: "2025-04-14T14:30:00Z",
   *   viewed_by: "customer" | "staff"
   * }
   */

  const activity = {
    timestamp: new Date().toISOString(),
    type: 'activity_log',
    estimateId: data.estimate_id,
    customerId: data.customer_id,
    customerName: data.customer_name,
    activityType: 'estimate_viewed',
    activity: `Estimate viewed by ${data.viewed_by}`,
    details: `${data.customer_name} viewed estimate #${data.estimate_id} for $${data.amount}`,
    amount: data.amount
  };

  // Log to Zapier (Google Sheets)
  if (ZAPIER_WEBHOOK_URL) {
    try {
      await fetch(ZAPIER_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activity)
      });
    } catch (err) {
      console.error('Zapier logging failed:', err);
      // Don't fail the webhook, just log the error
    }
  }

  // Could also send SMS/email alert to sales rep
  // Example: sendSalesRepAlert(data, 'estimate_viewed');

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, activity: 'estimate_viewed' })
  };
}

async function handleEstimateOpened(data) {
  /**
   * Fired when estimate is opened for editing in HCP or portal
   */
  const activity = {
    timestamp: new Date().toISOString(),
    type: 'activity_log',
    estimateId: data.estimate_id,
    customerId: data.customer_id,
    activityType: 'estimate_opened',
    activity: `Estimate opened for editing`,
    details: `Estimate #${data.estimate_id} was opened`
  };

  if (ZAPIER_WEBHOOK_URL) {
    await fetch(ZAPIER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activity)
    }).catch(err => console.error('Zapier logging failed:', err));
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, activity: 'estimate_opened' })
  };
}

async function handleJobCreated(data) {
  /**
   * New job created in HCP
   * Payload:
   * {
   *   job_id: "789",
   *   customer_id: "456",
   *   customer_name: "John Smith",
   *   job_type: "Service" | "Maintenance" | "Install",
   *   scheduled_start: "2025-04-15T09:00:00Z"
   * }
   */
  const activity = {
    timestamp: new Date().toISOString(),
    type: 'activity_log',
    jobId: data.job_id,
    customerId: data.customer_id,
    customerName: data.customer_name,
    activityType: 'job_created',
    activity: `Job created: ${data.job_type}`,
    details: `New ${data.job_type} job scheduled for ${data.scheduled_start}`
  };

  if (ZAPIER_WEBHOOK_URL) {
    await fetch(ZAPIER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activity)
    }).catch(err => console.error('Zapier logging failed:', err));
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, activity: 'job_created' })
  };
}

async function handleJobScheduled(data) {
  /**
   * Job scheduled/rescheduled
   */
  const activity = {
    timestamp: new Date().toISOString(),
    type: 'activity_log',
    jobId: data.job_id,
    customerId: data.customer_id,
    activityType: 'job_scheduled',
    activity: `Job scheduled`,
    details: `Scheduled for ${data.scheduled_start} with technician ${data.assigned_tech || 'TBD'}`
  };

  if (ZAPIER_WEBHOOK_URL) {
    await fetch(ZAPIER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activity)
    }).catch(err => console.error('Zapier logging failed:', err));
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, activity: 'job_scheduled' })
  };
}

async function handleJobCompleted(data) {
  /**
   * Job completed
   * Payload:
   * {
   *   job_id: "789",
   *   customer_id: "456",
   *   customer_name: "John Smith",
   *   completed_at: "2025-04-15T11:45:00Z",
   *   total_cost: 450,
   *   assigned_techs: ["Ed Pfeiffer"]
   * }
   */
  const activity = {
    timestamp: new Date().toISOString(),
    type: 'activity_log',
    jobId: data.job_id,
    customerId: data.customer_id,
    customerName: data.customer_name,
    activityType: 'job_completed',
    activity: `Job completed`,
    details: `Job completed at ${data.completed_at}, total cost: $${data.total_cost}, techs: ${data.assigned_techs?.join(', ') || 'Unknown'}`
  };

  if (ZAPIER_WEBHOOK_URL) {
    await fetch(ZAPIER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activity)
    }).catch(err => console.error('Zapier logging failed:', err));
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, activity: 'job_completed' })
  };
}

/**
 * Optional: Send SMS/email alert to sales rep
 * Uncomment and implement if you want real-time notifications
 */
/*
async function sendSalesRepAlert(data, eventType) {
  const GHL_TOKEN = process.env.GHL_TOKEN;
  
  let message = '';
  switch (eventType) {
    case 'estimate_viewed':
      message = `🔔 ${data.customer_name} viewed estimate #${data.estimate_id} ($${data.amount})`;
      break;
    // Add other cases...
  }
  
  if (!message) return;
  
  // Send to sales rep via SMS/email (requires GHL contact setup)
  // const response = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${GHL_TOKEN}`,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({
  //     contactId: data.sales_rep_contact_id,
  //     body: message,
  //     type: 'SMS'
  //   })
  // });
}
*/
