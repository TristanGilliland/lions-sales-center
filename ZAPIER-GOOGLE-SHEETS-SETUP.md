# Sales Command Center — Zapier Google Sheets Integration

## Overview

This guide sets up automatic logging of all deal activity to a Google Sheet, creating a permanent audit trail and analytics resource.

**What gets logged:**
- New deals created
- Stage changes (Proposals → Negotiating → Sold)
- Equipment orders marked
- Calls & SMS sent
- Deals deleted
- Deal updates

---

## Prerequisites

1. **Google Account** (personal or Lions Heating & AC workspace)
2. **Zapier Account** (free tier works)
3. **Sales Command Center** deployed on Netlify
4. Access to the spreadsheet you want to log to

---

## Step 1: Create Google Sheet

1. Go to **sheets.google.com**
2. Create a new spreadsheet: **"Lions Sales Log"**
3. Set up columns in Sheet1:

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| Timestamp | Type | Deal ID | Customer | Amount | Stage | Sold | Sales Rep |
| 2025-04-14T15:30:00Z | deal_created | 1 | Smith | 5200 | Proposals | FALSE | tristan |

4. Keep the sheet open (you'll need the Sheet ID in Step 3)

---

## Step 2: Create Zapier Webhook (Trigger)

1. Go to **zapier.com** → **Create** → **+ Create New Zap**
2. Search for **"Webhooks by Zapier"**
3. Select **"Catch Raw Hook"** as the trigger
4. Click **Continue**
5. You'll see a unique webhook URL:
   ```
   https://hooks.zapier.com/hooks/catch/[ACCOUNT_ID]/[HOOK_ID]/
   ```
6. **Copy this URL** — you'll add it to Netlify in Step 4
7. Click **Test the Trigger** (optional — skip for now)
8. Click **Continue** to set up the action

---

## Step 3: Set Up Google Sheets Action

1. Search for **"Google Sheets"** as the Action App
2. Select **"Create Spreadsheet Row"**
3. Click **Sign In** and authorize your Google account
4. Choose or create a spreadsheet:
   - **Spreadsheet**: Select "Lions Sales Log" (or create new)
   - **Worksheet**: Select "Sheet1"
5. **Map the Fields** to columns:
   ```
   A (Timestamp)      ← Webhook Timestamp
   B (Type)           ← webhook.type
   C (Deal ID)        ← webhook.dealId
   D (Customer)       ← webhook.customerName
   E (Amount)         ← webhook.amount
   F (Stage)          ← webhook.stage
   G (Sold)           ← webhook.sold
   H (Sales Rep)      ← webhook.salesRep
   ```
6. **Test** this step
7. Click **Finish** to publish the Zap

---

## Step 4: Add Webhook URL to Netlify

1. Go to **netlify.com** → **Your Site** → **Site Settings**
2. Go to **Build & Deploy** → **Environment**
3. Add new environment variable:
   ```
   Key:   ZAPIER_WEBHOOK_URL
   Value: https://hooks.zapier.com/hooks/catch/[YOUR_ACCOUNT_ID]/[YOUR_HOOK_ID]/
   ```
4. Click **Save**
5. Trigger a **manual deploy** in Netlify (Forces new build with env vars)

---

## Step 5: Test the Integration

### From the App:
1. Log into Sales Command Center
2. Create a new deal
3. Check the Zapier Zap activity log (should show a successful webhook catch)
4. Check your Google Sheet (should have a new row)

### Manual Test (curl):
```bash
curl -X POST https://hooks.zapier.com/hooks/catch/[YOUR_HOOK_ID]/ \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2025-04-14T15:30:00Z",
    "type": "deal_created",
    "dealId": "test_123",
    "customerName": "Test Customer",
    "amount": 5000,
    "stage": "Proposals",
    "sold": false,
    "salesRep": "tristan"
  }'
```

Expected result: New row appears in Google Sheet within 15 seconds

---

## Advanced: Multi-Worksheet Setup

For better organization, create multiple sheets in one spreadsheet:

### Sheet1: Deals
```
Timestamp | Deal ID | Customer | Amount | Stage | Sold | Commission Tech | Sales Rep
```

### Sheet2: Activities
```
Timestamp | Deal ID | Customer | Activity Type | Details | Sales Rep | Time
```

### Sheet3: Analytics
Use formulas to calculate:
- Total revenue by stage
- Close rate by sales rep
- Equipment order tracking
- Activity frequency

**Update the Zap:**
1. Edit the Zap (Zapier.com → Your Zap)
2. Modify the Action to route deals to Sheet1, activities to Sheet2
3. Use **conditional logic** in Zapier:
   - If `type` = "deal_*" → Sheet1
   - If `type` = "activity_*" → Sheet2

---

## Troubleshooting

### Google Sheet not receiving data

**Check 1: Webhook URL**
- Verify `ZAPIER_WEBHOOK_URL` is set in Netlify (no typos)
- URL should end with `/`

**Check 2: Zapier Zap Status**
- Go to Zapier dashboard
- Check the specific Zap
- Look at Activity log for errors
- Error messages will tell you what's wrong

**Check 3: Google Sheets Permissions**
- Make sure the Google account has edit access to the sheet
- Try creating a row manually in the sheet
- Check that column names match

**Check 4: Column Mapping**
- Edit the Zap action
- Verify each column is mapped correctly
- Make sure webhook payloads include those fields

### Webhook not firing from Sales Command Center

**Check 1: Environment Variable Deployment**
- Go to Netlify → Deploy log
- Verify `ZAPIER_WEBHOOK_URL` appears in build log
- If missing, go to **Site Settings** → **Build & Deploy** → **Environment** and re-add it
- Trigger a manual redeploy

**Check 2: Netlify Function Logs**
- Go to Netlify → **Functions**
- Click `sheets.js`
- Check the logs for errors
- Look for failed fetch calls

**Check 3: Browser Console**
- Open Sales Command Center
- Press F12 → Console tab
- Create a deal
- Look for any error messages

---

## Sheet Maintenance

### Auto-cleanup Old Data
1. In Google Sheets, go to **Data** → **Create a filter**
2. Filter by date (remove rows older than 90 days monthly)

### Monthly Archives
1. At the end of each month:
   - **Duplicate** the sheet as archive (e.g., "April 2025")
   - Delete old data from Sheet1
   - Keeps current month fast + historical records

### Summary Sheet (Analytics)
Create a new sheet called "Summary" with formulas:

```
Total Pipeline (Open)
=SUMIF(Sheet1!F:F,"Proposals",Sheet1!E:E) + SUMIF(Sheet1!F:F,"Negotiating",Sheet1!E:E)

Total Won
=COUNTIF(Sheet1!G:G,TRUE)

Close Rate
=COUNTIF(Sheet1!G:G,TRUE) / COUNTA(Sheet1!C:C)

Revenue by Rep
=SUMIF(Sheet1!H:H,"tristan",Sheet1!E:E)
```

---

## Next: Two-Way Sync

**Phase 2**: Set up reverse sync so updates in Google Sheets pull back to the Sales Center.

For now, Google Sheets is **read-only** (data flows app → sheet).

To enable two-way:
1. Create a Zapier Zap listening to Sheet changes
2. Trigger webhook to Netlify function
3. Update deal in localStorage
4. Push updated deal to app via WebSocket (optional)

---

## Summary

| Step | Time | Action |
|------|------|--------|
| 1 | 5 min | Create Google Sheet with columns |
| 2 | 5 min | Create Zapier webhook (Catch Raw Hook) |
| 3 | 5 min | Create Zapier Google Sheets action |
| 4 | 2 min | Add `ZAPIER_WEBHOOK_URL` to Netlify |
| 5 | 5 min | Test by creating a deal |

**Total: ~20 minutes**

Once set up, every deal activity is automatically logged. No further action needed.

---

## Contact

If Zapier webhook URL gets leaked or compromised:
1. Go to **Zapier.com** → Your Zap → **Settings**
2. Click **"Disconnect"** on the webhook trigger
3. Create a new one (generates new URL)
4. Update Netlify env variable

Done!
