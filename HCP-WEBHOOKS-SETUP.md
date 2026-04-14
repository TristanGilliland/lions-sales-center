# HCP Webhook Setup — Real-Time Estimate View Tracking

## What Are HCP Webhooks?

Webhooks let HCP automatically send your app real-time events when things happen:
- Customer views an estimate
- Estimate is opened for editing
- Job is created/scheduled/completed

Instead of checking HCP manually, your app gets instant notifications logged to Google Sheets.

---

## Prerequisites

- [ ] Sales Command Center deployed on Netlify
- [ ] Zapier webhook URL already configured (`ZAPIER_WEBHOOK_URL` env var)
- [ ] HCP Admin access
- [ ] HCP API credentials (you already have: `91ad73b30454402488a1b5ed5f3ee211`)

---

## Step 1: Find Your Webhook Endpoint

Your Sales Command Center's webhook endpoint is:

```
https://YOUR-NETLIFY-SITE.netlify.app/.netlify/functions/hcp-webhooks
```

Example:
```
https://lions-sales-center.netlify.app/.netlify/functions/hcp-webhooks
```

**Save this URL** — you'll need it in Step 2.

---

## Step 2: Set Up Webhooks in HCP

1. Go to **HCP** → **Settings** → **API & Integrations**
2. Look for **Webhooks** or **API Webhooks**
3. Click **Add Webhook** or **Create New Webhook**

### Configure for Estimate Views

**Webhook URL**: 
```
https://lions-sales-center.netlify.app/.netlify/functions/hcp-webhooks
```

**Events to Subscribe To**:
Select the following (check if available):
- ✅ `estimate.viewed` — When customer views estimate
- ✅ `estimate.opened` — When estimate is opened in portal
- ✅ `estimate.sent` — When estimate is sent to customer
- ✅ `job.created` — New job created
- ✅ `job.scheduled` — Job scheduled
- ✅ `job.completed` — Job marked complete

**Request Type**: `POST`

**Headers** (if HCP requires auth):
```
Authorization: Token 91ad73b30454402488a1b5ed5f3ee211
```

### Save & Test

1. HCP will show a **Test** button
2. Click it to send a test webhook
3. Check Netlify function logs (see Step 4)
4. Verify data appears in Google Sheets

---

## Step 3: Verify in Netlify Logs

1. Go to **Netlify Dashboard** → Your site
2. Click **Functions** in the top menu
3. Look for `hcp-webhooks` in the list
4. Click it to see recent invocations
5. You should see logs from HCP events

Example successful log:
```
HCP Webhook: estimate.viewed {
  estimate_id: "12345",
  customer_name: "John Smith",
  amount: 5200,
  viewed_at: "2025-04-14T14:30:00Z"
}
```

---

## Step 4: Verify Data in Google Sheets

Once webhooks fire:

1. Open **Google Sheets** → **Lions Sales Deals**
2. Go to the **Activities** or **Deals** tab
3. Scroll to the bottom
4. You should see new rows with HCP events:

| timestamp | activityType | activity | details |
|-----------|--------------|----------|---------|
| 2025-04-14T14:30:00Z | estimate_viewed | Estimate viewed by customer | John Smith viewed estimate #12345 for $5200 |
| 2025-04-14T15:00:00Z | job_created | Job created: Service | New Service job scheduled for 2025-04-15 |

---

## Step 5: Troubleshooting

### Webhooks Not Firing?

1. **Check HCP webhook settings**:
   - Is the webhook enabled? (toggle switch)
   - Are events selected?
   - Is the URL correct?

2. **Test the endpoint manually**:
   ```bash
   curl -X POST https://lions-sales-center.netlify.app/.netlify/functions/hcp-webhooks \
     -H "Content-Type: application/json" \
     -d '{
       "event": "estimate.viewed",
       "data": {
         "estimate_id": "123",
         "customer_name": "Test Customer",
         "amount": 5000,
         "viewed_at": "2025-04-14T14:30:00Z",
         "viewed_by": "customer"
       }
     }'
   ```

3. **Check Netlify logs** for errors:
   - Netlify Dashboard → Functions → hcp-webhooks
   - Look for red errors

4. **Verify Zapier webhook URL** is set:
   - `ZAPIER_WEBHOOK_URL` env var should be configured
   - If missing, webhooks will process but not log to sheets

### Data Not Appearing in Google Sheets?

1. Check the **Activities** tab (not just Deals tab)
2. Refresh the sheet (Ctrl+R)
3. Check Zapier activity log:
   - Go to **zapier.com** → Your Zap
   - Look at recent activity
   - Are there errors?

4. Verify column mapping matches:
   - Columns A-L match the webhook payload
   - See `ZAPIER-SETUP.md` for column names

---

## Advanced: Send SMS Alert on High-Value Estimate Views

If you want instant SMS notification when a high-value estimate is viewed:

In `netlify/functions/hcp-webhooks.js`, uncomment the `sendSalesRepAlert` function and implement:

```javascript
async function sendSalesRepAlert(data, eventType) {
  if (data.amount > 5000) { // Alert for deals over $5k
    // Send SMS via GHL
    const message = `🔔 ${data.customer_name} viewed your $${data.amount} estimate!`;
    // GHL API call here
  }
}
```

Then call it in `handleEstimateViewed`:
```javascript
await sendSalesRepAlert(data, 'estimate_viewed');
```

---

## Webhook Events Reference

### estimate.viewed
Fired when customer views estimate (email link, portal, etc.)

**Payload:**
```json
{
  "estimate_id": "12345",
  "customer_id": "456",
  "customer_name": "John Smith",
  "amount": 5200,
  "viewed_at": "2025-04-14T14:30:00Z",
  "viewed_by": "customer" | "staff"
}
```

### job.created
Fired when new job is created in HCP

**Payload:**
```json
{
  "job_id": "789",
  "customer_id": "456",
  "customer_name": "John Smith",
  "job_type": "Service",
  "scheduled_start": "2025-04-15T09:00:00Z"
}
```

### job.completed
Fired when job is marked complete

**Payload:**
```json
{
  "job_id": "789",
  "customer_id": "456",
  "customer_name": "John Smith",
  "completed_at": "2025-04-15T11:45:00Z",
  "total_cost": 450,
  "assigned_techs": ["Ed Pfeiffer", "Jake Casmay"]
}
```

---

## Testing Checklist

- [ ] Webhook URL configured in HCP settings
- [ ] Webhook events selected (estimate.viewed, job.created, etc.)
- [ ] Manual curl test returns HTTP 200
- [ ] Netlify function logs show webhook events
- [ ] Zapier webhook URL set in environment
- [ ] Test data appears in Google Sheets within 30 seconds
- [ ] HCP events (customer viewing estimate) appear in sheets automatically

---

## One-Minute Reference

| What | Where |
|------|-------|
| Webhook Endpoint | `https://your-netlify-site/.netlify/functions/hcp-webhooks` |
| HCP Settings | HCP Settings → API & Integrations → Webhooks |
| View Logs | Netlify Dashboard → Functions → hcp-webhooks |
| Google Sheets | Lions Sales Deals → Activities/Deals tabs |
| Handler Code | `netlify/functions/hcp-webhooks.js` |

---

## What's Logged Automatically?

Every event is logged to Google Sheets with:
- **timestamp**: When it happened
- **activityType**: What happened (estimate_viewed, job_created, etc.)
- **customerId/Name**: Who it involves
- **details**: Human-readable description
- **amount**: If applicable

Use this data for:
- Sales metrics (who viewed estimates)
- Performance tracking (response time)
- Customer follow-up (who hasn't acted)
- Revenue attribution (who viewed what jobs)

---

Done! Your Sales Command Center now gets real-time HCP data. 🎉

Questions? Check `netlify/functions/hcp-webhooks.js` or see the main `README.md`.
