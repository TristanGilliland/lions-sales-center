import fetch from 'node-fetch';

const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const GHL_TOKEN = process.env.GHL_TOKEN;
const GHL_VERSION = '2021-07-28';

exports.handler = async (event) => {
  const { action, data } = JSON.parse(event.body || '{}');

  try {
    switch (action) {
      case 'sendSMS':
        return await sendSMS(data);
      case 'initiateCall':
        return await initiateCall(data);
      case 'getContact':
        return await getContact(data);
      case 'logCall':
        return await logCall(data);
      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid action' })
        };
    }
  } catch (error) {
    console.error('GHL API Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function sendSMS(data) {
  const { contactId, message, locationId } = data;

  const response = await fetch(`${GHL_API_BASE}/conversations/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GHL_TOKEN}`,
      'Version': GHL_VERSION,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contactId,
      body: message,
      locationId,
      type: 'SMS'
    })
  });

  const result = await response.json();
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
}

async function initiateCall(data) {
  const { contactId, locationId } = data;

  const response = await fetch(`${GHL_API_BASE}/calls/initiate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GHL_TOKEN}`,
      'Version': GHL_VERSION,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contactId,
      locationId,
      assignedTeamMemberId: data.assignedTeamMemberId
    })
  });

  const result = await response.json();
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
}

async function getContact(data) {
  const { contactId, locationId } = data;

  const response = await fetch(
    `${GHL_API_BASE}/contacts/${contactId}?locationId=${locationId}`,
    {
      headers: {
        'Authorization': `Bearer ${GHL_TOKEN}`,
        'Version': GHL_VERSION
      }
    }
  );

  const contact = await response.json();
  return {
    statusCode: 200,
    body: JSON.stringify(contact)
  };
}

async function logCall(data) {
  const { contactId, duration, notes, outcome, locationId } = data;

  const response = await fetch(`${GHL_API_BASE}/activities/calls`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GHL_TOKEN}`,
      'Version': GHL_VERSION,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contactId,
      locationId,
      duration,
      notes,
      outcome
    })
  });

  const result = await response.json();
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
}
