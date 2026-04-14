# Zapier Setup Guide — Sales Command Center to Google Sheets

## Overview
This guide walks you through creating a Zapier zap that logs every deal change and activity to a Google Sheet, giving you a persistent audit trail and reporting data.

## What Gets Logged
- Deal creation/updates (customer, amount, stage, sold status)
- Activity log (calls made, SMS sent, status changes)
- Real-time metrics for performance tracking

---

## Step 1: Create Zapier Account & Zap

1. Go to **zapier.com** → Sign up if needed
2. Click **Create** → **New Zap**
3. Name it: `Lions Sales → Google Sheets`

---

## Step 2: Set Up Trigger (Webhook)

**Trigger**: Webhooks by Zapier

1. Search for **"Webhooks by Zapier"**
2. Select **"Catch Raw Hook"**
3. Click **Continue**
4. You'll see a **Webhook URL** like:
   ```
   https://hooks.zapier.com/hooks/catch/13894356/abcdefg/
   ```
5. **Copy this URL** — you'll need it in 2 minutes
6. Click **Continue to next step**

---

## Step 3: Test the Webhook (Optional)

1. Open terminal and test the webhook:
   ```bash
   curl -X POST https://hooks.zapier.com/hooks/catch/13894356/abcdefg/ \
     -H "Content-Type: application/json" \
     -d '{"test":"data", "timestamp":"2025-04-14T21:00:00Z"}'
   ```
2. Back in Zapier, click **Test Trigger**
3. You should see the test data appear
4. Click **Continue**

---

## Step 4: Set Up Action (Google Sheets)

**Action**: Google Sheets → Create Spreadsheet Row

1. Search for **"Google Sheets"**
2. Select **"Create Spreadsheet Row"**
3. **Sign in to Google** (if not already)
4. Grant Zapier permission to access Sheets

---

## Step 5: Create or Select Spreadsheet

1. **Spreadsheet**: 
   - Click **Create new spreadsheet**
   - Name: `Lions Sales Deals`
   - Google Account: Your account
   - Click **Create**

2. A new sheet opens. **Close it and return to Zapier** (Zapier will auto-detect the sheet)

3. **Worksheet**: 
   - Click **Create new worksheet**
   - Name: `Deals`
   - Click **Create**

---

## Step 6: Map Fields to Columns

Zapier will show a form to map webhook data to columns. Set up these columns:

| Column | Type | Maps To |
|--------|------|---------|
| **A** | timestamp | `timestamp` |
| **B** | dealId | `dealId` |
| **C** | customerName | `customerName` |
| **D** | amount | `amount` |
| **E** | stage | `stage` |
| **F** | equipment | `equipment` |
| **G** | salesRep | `salesRep` |
| **H** | sold | `sold` |
| **I** | equipmentOrdered | `equipmentOrdered` |
| **J** | commissionTech | `commissionTech` |
| **K** | type | `type` (deal_log or activity_log) |
| **L** | activity | `activity` (for activity_log) |

**How to set it up in Zapier**:
1. In the "Set up action" section, you'll see fields for Column A, B, C, etc.
2. Click each field and select the corresponding webhook data:
   - Column A (timestamp) → Select `timestamp` from webhook
   - Column B (dealId) → Select `dealId` from webhook
   - And so on...

3. If a field doesn't exist in the webhook, leave it blank (Zapier will skip it)

---

## Step 7: Add Second Worksheet for Activities (Optional)

If you want to track activities separately:

1. After setting up the Deals worksheet, click **+ Add Action**
2. Add another **Google Sheets → Create Spreadsheet Row**
3. Use same spreadsheet, create **Activities** worksheet
4. Map: timestamp, dealId, activityType, activity, details

---

## Step 8: Test & Publish

1. Click **Test Action**
2. Zapier will create a test row in your Google Sheet
3. Go check: **Google Sheets → Lions Sales Deals → Deals tab**
4. You should see one row with test data
5. Back in Zapier: Click **Continue**
6. Click **Publish Zap**

---

## Step 9: Get Webhook URL Into Environment

Now that your zap is live, add the webhook URL to Netlify:

**Copy your webhook URL** from Step 2 (looks like `https://hooks.zapier.com/hooks/catch/13894356/abcdefg/`)

### Add to Netlify Environment Variables:

1. Go to **Netlify Dashboard** → Your site
2. **Site Settings** → **Build & Deploy** → **Environment**
3. Click **Add** and set:
   - **Key**: `ZAPIER_WEBHOOK_URL`
   - **Value**: `https://hooks.zapier.com/hooks/catch/13894356/abcdefg/` (your actual URL)
4. **Save**
5. **Redeploy** your site (or just push to main)

---

## Step 10: Test End-to-End

1. Go to your Sales Command Center at **https://your-site.netlify.app**
2. Log in as a sales rep
3. **Create a new deal**:
   - Customer: "Test Customer"
   - Amount: 5000
   - Equipment: "AC System"
   - Stage: "Proposals"
4. Click **Create Deal**

5. Go back to **Google Sheets → Lions Sales Deals → Deals** tab
6. **Refresh the sheet** (Ctrl+R or Cmd+R)
7. You should see a new row with your deal data! 🎉

---

## Troubleshooting

### Webhook not firing?
1. Check Netlify function logs:
   - Go to **Netlify Dashboard** → **Functions**
   - Look for `sheets.js` function
   - Check recent invocations for errors

2. Verify webhook URL is correct in `.env`:
   ```
   ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/13894356/abcdefg/
   ```

3. Test manually:
   ```bash
   curl -X POST https://your-webhook-url/ \
     -H "Content-Type: application/json" \
     -d '{"dealId":"test", "customerName":"Test", "amount":5000}'
   ```

### Data appearing in wrong columns?
1. Check the webhook payload in `netlify/functions/sheets.js`
2. Verify field names match exactly (case-sensitive)
3. In Zapier, re-map the columns to match

### Permission error in Zapier?
1. Go to **Zapier Account** → **Connected Apps**
2. Find **Google Sheets**
3. Click **Disconnect** and re-authenticate
4. Grant all permissions

---

## Advanced: Custom Formulas in Google Sheets

Once data is flowing, add these formulas to track metrics:

### Total Pipeline Value (non-lost deals)
In a cell, add:
```
=SUMIF(E:E,"<>Lost",D:D)
```
(Sums column D (amount) where column E (stage) is not "Lost")

### Closure Rate
```
=COUNTIF(H:H,TRUE) / COUNTA(H:H)
```
(Count of sold deals / total deals)

### Deals Won This Week
```
=COUNTIFS(H:H,TRUE,A:A,">="&TODAY()-7)
```

### Rep Performance
Create a pivot table:
1. Select all data
2. **Data** → **Pivot Table**
3. Rows: `salesRep`
4. Values: 
   - Count of dealId (deal count)
   - Sum of amount (pipeline)
   - Count of sold=TRUE (won count)

---

## What's Next?

Once logging is working:

1. **Create a Dashboard Tab**
   - Add summary metrics at the top
   - Link to formulas above
   - Update daily

2. **Set Up Alerts**
   - In Zapier, add **Gmail** action to email you on high-value deals
   - Example: Alert when amount > $10,000

3. **Export to Reports**
   - Weekly: Download as CSV for sales meetings
   - Monthly: Create charts in Google Sheets

---

## One-Minute Reference

| What | Where |
|------|-------|
| Zapier Webhook URL | Zapier Zap settings (save it!) |
| Netlify Env Variable | `ZAPIER_WEBHOOK_URL` |
| Google Sheet | `Lions Sales Deals` workbook |
| Function | `netlify/functions/sheets.js` |
| Manual Test | `curl -X POST <webhook_url> -d '...'` |
| Logs | Netlify Dashboard → Functions |

---

## Done! 🚀

Your Sales Command Center now logs all deal changes and activities to Google Sheets automatically. Every deal created, every status change, every call/SMS is tracked in one place.

Need help? Check the **troubleshooting** section or review `netlify/functions/sheets.js` for the webhook format.
