# Lions Sales Command Center — Deployment Guide

## What You're Getting

A fully functional PWA with:
- **Kanban Pipeline Board**: Proposals → Negotiating → Sold → Lost
- **Deal Cards**: Customer name, amount, equipment type, status toggles
- **Quick Actions**: Call & SMS buttons (GHL integrated)
- **Sales Analytics**: Real-time pipeline value, deals won, close rate
- **Data Sync**: Automatic browser storage + Google Sheets logging via Zapier
- **Multi-User**: Login by sales rep with filtered views
- **Mobile Ready**: Responsive design, PWA installable

**Tech**: React + Vite + Tailwind + Netlify Functions + HCP/GHL APIs

---

## Quick Deploy to Netlify

### Step 1: Push Code to GitHub
```bash
# Initialize git (if new repo)
cd /home/claude
git init
git add .
git commit -m "Initial Sales Command Center commit"

# Add to your GitHub repo
git remote add origin https://github.com/YOUR_ACCOUNT/lions-sales-center.git
git push -u origin main
```

### Step 2: Connect to Netlify

1. Go to **netlify.com/drop** and drag the `/dist` folder (after building)
   
   OR connect GitHub repo:
   - Go to **netlify.com/authorize**
   - Click **Connect GitHub**
   - Select `lions-sales-center` repo
   - Accept default build settings (already in `netlify.toml`)

### Step 3: Set Environment Variables

In **Netlify Dashboard → Site Settings → Build & Deploy → Environment**:

```
HCP_API_KEY = 91ad73b30454402488a1b5ed5f3ee211
GHL_TOKEN = pit-f3d8fa43-bd7c-4563-8f26-e89a3ac91955
ZAPIER_WEBHOOK_URL = (see Step 4 below)
```

### Step 4: Set Up Zapier Google Sheets Logging (Optional)

1. Go to **zapier.com** → **Create** → **New Zap**
2. **Trigger**: Webhooks by Zapier → Catch Raw Hook
3. Copy the webhook URL you get (looks like: `https://hooks.zapier.com/hooks/catch/13894356/xxxxx/`)
4. Click **Continue**
5. **Action**: Google Sheets → Create Spreadsheet Row
6. Connect your Google account
7. **Spreadsheet**: Create new or select existing
8. **Worksheet**: Create new (e.g., "Lions Sales Log")
9. **Map Fields**:
   - Column A: `timestamp`
   - Column B: `dealId`
   - Column C: `customerName`
   - Column D: `amount`
   - Column E: `stage`
   - Column F: `sold`
   - Column G: `salesRep`
10. **Test** and **Publish**
11. Add the webhook URL to Netlify environment as `ZAPIER_WEBHOOK_URL`

### Step 5: Deploy

```bash
# Build locally to verify
npm run build

# Deploy to Netlify
# If using GitHub: push to main, Netlify auto-deploys
# If drag-drop: drag the 'dist' folder to Netlify
```

Your site will be live at: `https://[site-name].netlify.app`

---

## Using the Sales Command Center

### Login
- Tristan (Owner) or Sales Rep 1/2
- Data saved to browser storage automatically

### Create Deals
Click **New Deal** → Fill in:
- Customer name
- Amount ($)
- Equipment (AC System, Furnace, etc.)
- Stage (Proposals, Negotiating, Sold, Lost)
- Commission Tech (dropdown of your field techs)

### Manage Pipeline
- **Drag**: (not implemented yet—deals are static)
- **Click toggles**: Sold / Equipment Ordered
- **Click card**: See full deal details & modify anything
- **Call/SMS**: Red/Blue buttons on card hover (fires GHL API)

### Track Metrics
**Top metrics bar shows**:
- **Pipeline Value**: Sum of non-lost deals
- **Deals Won**: Count of sold deals
- **Close Rate**: Percentage (won / total)

### Filter by Rep
Dropdown in header → "All Reps" or individual rep name

---

## Customization

### Change Technician List
Edit `src/App.jsx`, find this section:
```javascript
const technicians = [
  'Ed Pfeiffer', 'Jake Casmay', 'Josh Fazio', 'Greg Janowski', 
  'Scott Deakin', 'Tyler Gilliland', 'Will Egoavil'
];
```
Add/remove names as needed, then redeploy.

### Change Sales Reps
Edit same file, find:
```javascript
const salesReps = [
  { id: 'tristan', name: 'Tristan (Owner)', role: 'Owner' },
  { id: 'rep1', name: 'Sales Rep 1', role: 'Sales Rep' },
  { id: 'rep2', name: 'Sales Rep 2', role: 'Sales Rep' }
];
```

### Add/Remove Stages
Edit:
```javascript
const stages = ['Proposals', 'Negotiating', 'Sold', 'Lost'];
```

### Styling
All CSS in `src/index.css` and Tailwind config at `tailwind.config.js`

Brand colors:
- Primary Orange: `#E8A020`
- Dark: `#1C1C1C`

---

## Features Roadmap

### Phase 2: HCP Integration
- [ ] Fetch real estimates from HCP instead of demo data
- [ ] Pull customer phone numbers for SMS/calling
- [ ] Real-time estimate view notifications via HCP webhooks
- [ ] Auto-sync when estimates marked as "Sold" in HCP

### Phase 3: GHL Full Integration
- [ ] Live SMS thread viewer in deal details
- [ ] Call log synced from GHL phone system
- [ ] Workflow triggers (e.g., SMS when deal moves to "Negotiating")

### Phase 4: Advanced Features
- [ ] Drag-and-drop card reordering between stages
- [ ] Deal notes & activity timeline
- [ ] Sales rep commission calculator
- [ ] Custom fields per deal type
- [ ] Export to PDF / email reports
- [ ] Mobile app push notifications

---

## Troubleshooting

**Deals not saving?**
- Open DevTools (F12) → Application tab → Local Storage
- Should see `lionsSalesDeals` key
- If empty, check browser permissions

**SMS/Call buttons not working?**
- Verify GHL token in Netlify environment variables
- Check GHL account has phone integration enabled
- Ensure contact phone numbers exist in HCP

**Netlify build fails?**
- Check build logs: Netlify Dashboard → Deploys
- Verify `package.json` dependencies installed: `npm install`
- Ensure `node_modules/` and `.env` in `.gitignore`

**Google Sheets not logging data?**
- Test Zapier webhook: `curl -X POST <webhook_url> -d '{"test":"data"}'`
- Check Zapier activity log for errors
- Verify spreadsheet columns match payload keys

---

## File Locations

All code ready to deploy from `/home/claude/`:

```
/home/claude/
├── src/App.jsx              ← Main React component
├── src/main.jsx             ← React entry
├── netlify/functions/       ← Backend APIs
│   ├── hcp.js              ← HCP estimates/jobs
│   ├── ghl.js              ← SMS/calling
│   └── sheets.js           ← Google Sheets logging
├── package.json            ← Dependencies
├── netlify.toml            ← Deploy config
└── README.md               ← Full docs
```

**Next step**: Push to GitHub and connect to Netlify!

Questions? Check `README.md` for detailed docs.
