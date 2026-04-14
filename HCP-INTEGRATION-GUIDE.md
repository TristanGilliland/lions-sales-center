# Sales Command Center — HCP Integration Guide

## Overview

This guide connects the Sales Command Center to **House Call Pro (HCP)** to:
- Pull real estimates from HCP instead of demo data
- Sync customer phone numbers for SMS/calling
- Track when estimates are viewed
- Auto-update when deals are marked as Sold in HCP

---

## What You're Getting

The app already has Netlify functions for HCP API integration:

```
netlify/functions/hcp.js
├── getEstimates()     ← Fetch all open estimates
├── getJobs()          ← Fetch jobs by customer
├── getCustomer()      ← Get phone number & details
└── updateEstimate()   ← Mark estimate as Sold
```

**Your HCP API Key**: `91ad73b30454402488a1b5ed5f3ee211` (already configured in env)

---

## Phase 1: Load Real HCP Estimates (Simple)

### Step 1: Modify App.jsx to Fetch from HCP

In `src/App.jsx`, replace the demo data fetch with real HCP data:

```javascript
// OLD (REMOVE):
useEffect(() => {
  const saved = localStorage.getItem('lionsSalesDeals');
  if (saved) {
    setDeals(JSON.parse(saved));
  } else {
    // Demo data...
  }
}, []);

// NEW (REPLACE WITH):
useEffect(() => {
  const loadDeals = async () => {
    // Try to load from HCP first
    try {
      const response = await fetch('/.netlify/functions/hcp', {
        method: 'POST',
        body: JSON.stringify({
          action: 'getEstimates',
          data: { status: 'open' } // or whatever HCP filter
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Transform HCP format → App format
        const transformed = data.estimates?.map(est => ({
          id: est.id,
          customerName: est.customer?.name || 'Unknown',
          customerId: est.customer_id,
          amount: est.total_amount || 0,
          stage: 'Proposals', // Default stage for fresh estimates
          createdDate: est.created_at?.split('T')[0],
          equipment: est.description || '',
          sold: false,
          equipmentOrdered: false,
          commissionTech: '', // Assign manually or via default
          estimateViews: 0,
          estimateId: est.id,
          lastActivity: new Date().toISOString().split('T')[0],
          notes: ''
        })) || [];
        
        setDeals(transformed);
        return;
      }
    } catch (error) {
      console.log('HCP load failed, using localStorage');
    }
    
    // Fallback to localStorage
    const saved = localStorage.getItem('lionsSalesDeals');
    if (saved) {
      setDeals(JSON.parse(saved));
    }
  };
  
  loadDeals();
}, []);
```

### Step 2: Deploy
```bash
npm run build
git add .
git commit -m "feat: Load real HCP estimates"
git push
```

Netlify auto-deploys. Check your site — estimates from HCP now appear in Proposals column.

---

## Phase 2: Sync Customer Phone Numbers (GHL-Ready)

### Update App to Fetch Phone Numbers

```javascript
// When customer card loads, fetch their phone number:
const fetchCustomerPhone = async (customerId) => {
  try {
    const response = await fetch('/.netlify/functions/hcp', {
      method: 'POST',
      body: JSON.stringify({
        action: 'getCustomer',
        data: { customerId }
      })
    });
    
    if (response.ok) {
      const customer = await response.json();
      return customer.phone_number;
    }
  } catch (error) {
    console.log('Could not fetch phone number');
  }
  return null;
};

// Use it in SMS/Call functions:
const phoneNumber = await fetchCustomerPhone(deal.customerId);
// Pass to GHL: { phone: phoneNumber, message: "..." }
```

---

## Phase 3: Track Estimate Views (Webhooks)

HCP webhooks can notify the Sales Center when a customer views an estimate.

### Enable HCP Webhooks

1. Go to **HCP → Settings → API & Integrations**
2. Click **Webhooks**
3. Create new webhook:
   - **Event**: `estimate.viewed`
   - **URL**: `https://YOUR-SITE.netlify.app/.netlify/functions/estimate-webhook`
   - **Auth**: Use HCP API key
4. Save

### Create the Webhook Handler

Create `netlify/functions/estimate-webhook.js`:

```javascript
exports.handler = async (event) => {
  const payload = JSON.parse(event.body);
  
  // Webhook from HCP when estimate is viewed
  if (payload.event === 'estimate.viewed') {
    const estimateId = payload.data.estimate_id;
    
    // Log activity
    await fetch(process.env.ZAPIER_WEBHOOK_URL, {
      method: 'POST',
      body: JSON.stringify({
        type: 'estimate_viewed',
        estimateId,
        timestamp: new Date().toISOString(),
        customerName: payload.data.customer_name
      })
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  }
  
  return { statusCode: 400 };
};
```

### Update App to Track Views

When estimate is viewed, increment the counter:

```javascript
// In the deal detail modal:
useEffect(() => {
  // Log that this estimate was viewed
  if (selectedDeal?.estimateId) {
    fetch('/.netlify/functions/sheets', {
      method: 'POST',
      body: JSON.stringify({
        action: 'logActivity',
        data: {
          type: 'estimate_viewed',
          dealId: selectedDeal.id,
          customerName: selectedDeal.customerName,
          details: 'Viewed in Sales Center'
        }
      })
    });
  }
}, [selectedDeal?.id]);
```

---

## Phase 4: Push Back to HCP (Two-Way Sync)

When a deal is marked as "Sold" in the Sales Center, update HCP estimate status.

### Update Deal Mutation

```javascript
const updateDeal = (dealId, updates) => {
  const deal = deals.find(d => d.id === dealId);
  
  // Update locally
  setDeals(deals.map(d => d.id === dealId ? { ...d, ...updates } : d));
  
  // If marked as sold, update HCP
  if (updates.sold && !deal.sold) {
    syncToHCP(deal);
  }
};

const syncToHCP = async (deal) => {
  try {
    await fetch('/.netlify/functions/hcp', {
      method: 'POST',
      body: JSON.stringify({
        action: 'updateEstimate',
        data: {
          estimateId: deal.estimateId,
          updates: { status: 'sold' }
        }
      })
    });
    console.log('Synced to HCP');
  } catch (error) {
    console.log('HCP sync failed');
  }
};
```

---

## HCP API Reference

### Get Estimates
```javascript
fetch('/.netlify/functions/hcp', {
  method: 'POST',
  body: JSON.stringify({
    action: 'getEstimates',
    data: {
      customerId: '12345', // optional filter
      status: 'open'       // optional: 'open', 'closed', 'sold'
    }
  })
})
// Returns: { estimates: [...] }
```

### Get Jobs for Customer
```javascript
fetch('/.netlify/functions/hcp', {
  method: 'POST',
  body: JSON.stringify({
    action: 'getJobs',
    data: { customerId: '12345' }
  })
})
// Returns: { jobs: [...] }
```

### Get Customer Details
```javascript
fetch('/.netlify/functions/hcp', {
  method: 'POST',
  body: JSON.stringify({
    action: 'getCustomer',
    data: { customerId: '12345' }
  })
})
// Returns: {
//   id: '12345',
//   name: 'John Smith',
//   phone_number: '215-555-1234',
//   email: 'john@example.com',
//   address: '123 Main St, Philadelphia, PA 19101'
// }
```

### Update Estimate
```javascript
fetch('/.netlify/functions/hcp', {
  method: 'POST',
  body: JSON.stringify({
    action: 'updateEstimate',
    data: {
      estimateId: 'est_12345',
      updates: {
        status: 'sold',
        notes: 'Sold via Sales Command Center'
      }
    }
  })
})
// Returns: { success: true }
```

---

## Testing

### Test HCP Connection
1. Open Sales Command Center
2. Open browser DevTools (F12)
3. Go to Console tab
4. Run:
```javascript
fetch('/.netlify/functions/hcp', {
  method: 'POST',
  body: JSON.stringify({
    action: 'getEstimates',
    data: {}
  })
}).then(r => r.json()).then(d => console.log(d))
```

If you see estimates, HCP is connected. If error, check:
- HCP_API_KEY in Netlify env
- Netlify functions deployed
- HCP account status

### Test Customer Phone Fetch
```javascript
fetch('/.netlify/functions/hcp', {
  method: 'POST',
  body: JSON.stringify({
    action: 'getCustomer',
    data: { customerId: 'cust_001' }
  })
}).then(r => r.json()).then(d => console.log(d.phone_number))
```

---

## Troubleshooting

### "HCP API error: Unauthorized"
- Check `HCP_API_KEY` in Netlify Settings
- Verify key is: `91ad73b30454402488a1b5ed5f3ee211`
- Redeploy: **Netlify** → **Deploys** → **Deploy settings** → **Trigger deploy**

### Estimates not loading
- Check browser console for error messages
- Verify HCP account has open estimates
- Check HCP API status: https://status.housecallpro.com/

### Webhooks not firing
- Confirm webhook URL in HCP is correct
- Check Netlify function logs for incoming requests
- HCP webhooks can take 1-2 minutes to register

---

## Next Steps

1. **This Week**: Deploy Phase 1 (load real estimates)
2. **Week 2**: Add phone number syncing
3. **Week 3**: Set up HCP webhooks for estimate views
4. **Week 4**: Push deal status back to HCP

Each phase builds on the previous — fully optional but creates a complete closed loop.

---

## Support

For HCP API questions:
- **Docs**: https://docs.housecallpro.com/v2/
- **Your HCP Key**: `91ad73b30454402488a1b5ed5f3ee211`
- Check the reference doc at: https://docs.google.com/document/d/1VS7TaMpzUSm7CDhLylLpRK8rXpRRfPQs9-UPdwhzrbY/edit
