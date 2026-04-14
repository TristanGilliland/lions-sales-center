# Sales Command Center — QUICK REFERENCE CARD

## 🚀 FAST DEPLOY (35 minutes)

```bash
# Step 1: Setup (5 min)
cd /mnt/user-data/outputs/
npm install
npm run build

# Step 2: GitHub (5 min)  
git init
git add .
git commit -m "initial"
# Create repo on github.com/new
git remote add origin https://github.com/YOUR_ACCOUNT/lions-sales-center.git
git push -u origin main

# Step 3: Netlify (10 min)
# Go to netlify.com
# Click: Add new site → Import existing project → Select lions-sales-center
# Netlify auto-deploys!
# When done, go to: Site settings → Build & deploy → Environment

# Step 4: Environment Vars (5 min)
# In Netlify dashboard, add:
HCP_API_KEY = 91ad73b30454402488a1b5ed5f3ee211
GHL_TOKEN = pit-f3d8fa43-bd7c-4563-8f26-e89a3ac91955
# Save & redeploy

# Step 5: Test (5 min)
# Open: https://YOUR-SITE.netlify.app
# Login as: Tristan
# Create deal → See it in pipeline
# ✅ DONE!
```

---

## 📋 FILE STRUCTURE

```
outputs/
├── src/
│   ├── App.jsx                  ← Main app (edit for customization)
│   ├── main.jsx
│   └── index.css
├── netlify/functions/
│   ├── hcp.js                   ← HCP API wrapper
│   ├── ghl.js                   ← SMS/calling
│   ├── sheets.js                ← Google Sheets logging
│   └── hcp-webhooks.js          ← Real-time tracking
├── public/manifest.json         ← PWA config
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── netlify.toml
└── README.md

DOCS:
├── DEPLOYMENT-CHECKLIST.md      ← START HERE (35 min)
├── SALES-CENTER-SETUP.md        ← Quick ref
├── ZAPIER-SETUP.md              ← Google Sheets (15 min)
├── HCP-WEBHOOKS-SETUP.md        ← Real-time (10 min)
├── ARCHITECTURE.md              ← System design
├── PROJECT-SUMMARY.md           ← Overview
└── FINAL-SUMMARY.md             ← This guide
```

---

## 🔐 CREDENTIALS (Already have)

```
HCP API Key
91ad73b30454402488a1b5ed5f3ee211

GHL Private Integration Token
pit-f3d8fa43-bd7c-4563-8f26-e89a3ac91955

HCP Company ID (for reference)
d229639d-85d8-44ff-8831-27aa57333f50
```

---

## 🎮 FEATURE SHORTCUTS

| Feature | How To |
|---------|--------|
| Create Deal | Click "New Deal" button |
| Edit Deal | Click deal card |
| Delete Deal | Click "Delete Deal" in detail |
| Mark Sold | Click "Sold" toggle on card |
| Equipment | Click "Ordered" toggle on card |
| View Performance | Click "Performance" tab |
| View Activity | Click "Activity" tab |
| Filter by Rep | Use dropdown "Filter by:" |
| Call/SMS | Hover card, click buttons |

---

## 🛠️ CUSTOMIZATION (Edit src/App.jsx)

### Change Sales Reps (line ~20)
```javascript
const salesReps = [
  { id: 'tristan', name: 'Tristan', role: 'Owner' },
  { id: 'rep1', name: 'Your Sales Rep 1', role: 'Sales Rep' },
  { id: 'rep2', name: 'Your Sales Rep 2', role: 'Sales Rep' },
];
```

### Change Technicians (line ~27)
```javascript
const technicians = [
  'Ed Pfeiffer', 
  'Jake Casmay', 
  // Add/remove names
];
```

### Change Pipeline Stages (line ~33)
```javascript
const stages = ['Proposals', 'Negotiating', 'Sold', 'Lost'];
```

Then:
```bash
git add src/App.jsx
git commit -m "Update reps and techs"
git push origin main
# Netlify auto-deploys!
```

---

## 🎨 STYLING (Tailwind CSS)

Brand Colors (in `tailwind.config.js`):
- Primary Orange: `#E8A020` (accents, buttons)
- Dark: `#1C1C1C` (text, buttons)
- Gray-900: `#111827` (cards)
- Gray-950: `#0a0a0a` (background)

Custom Styles in `src/index.css`:
- Animations: slideInUp, fadeIn, pulse-glow
- Scrollbar: Styled custom
- Fonts: Syne (headers), Inter (body)

---

## 📊 ENVIRONMENT VARIABLES

### Netlify Dashboard
1. Site Settings → Build & deploy → Environment
2. Add:

```
HCP_API_KEY = 91ad73b30454402488a1b5ed5f3ee211
GHL_TOKEN = pit-f3d8fa43-bd7c-4563-8f26-e89a3ac91955
ZAPIER_WEBHOOK_URL = https://hooks.zapier.com/...  (optional)
```

3. Save & Redeploy

---

## 🪝 WEBHOOK ENDPOINTS

### For HCP Setup
```
https://YOUR-NETLIFY-SITE.netlify.app/.netlify/functions/hcp-webhooks
```

### For Zapier
```
https://hooks.zapier.com/hooks/catch/YOUR_ID/YOUR_KEY/
```

---

## 🐛 QUICK TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| **Site won't load** | Check Netlify Deploys tab for build errors |
| **Deals not saving** | Check browser Storage (DevTools → Application → Local Storage) |
| **No Google Sheets** | Need Zapier configured (see ZAPIER-SETUP.md) |
| **Functions return 404** | Verify netlify.toml has correct functions dir |
| **Can't push to GitHub** | Check git remote: `git remote -v` |
| **Build fails locally** | Run: `npm install` then `npm run build` |
| **Environment vars not working** | Redeploy site after adding vars in Netlify |

---

## 📖 DOCUMENTATION QUICK LINKS

**Getting Started**
- DEPLOYMENT-CHECKLIST.md (35 min to live)
- FINAL-SUMMARY.md (this quick summary)

**Deep Dives**
- README.md (complete feature reference)
- ARCHITECTURE.md (system design)

**Integrations**
- ZAPIER-SETUP.md (Google Sheets logging)
- HCP-WEBHOOKS-SETUP.md (real-time tracking)

**Customization**
- SALES-CENTER-SETUP.md (how to modify)

---

## ⏱️ TIMELINE

```
MINUTE 0      → Read this card
MINUTE 5      → Read DEPLOYMENT-CHECKLIST.md
MINUTE 10     → Run: npm install
MINUTE 15     → Push to GitHub
MINUTE 25     → Deploy on Netlify
MINUTE 35     → Set env vars
MINUTE 40     → Site is LIVE! ✅

OPTIONAL ADDITIONS:

MINUTE 55     → Zapier Google Sheets (optional)
MINUTE 65     → HCP Webhooks (optional)
```

---

## 🎯 KEY CONCEPTS

**Pipeline Board**: Kanban with 4 stages (visual progress)

**Metrics**: Real-time (pipeline $, won deals, close rate)

**Activity Log**: Timestamps all changes (deal created, status changed)

**Multi-Rep**: Filter by rep to see individual pipelines

**localStorage**: Browser storage (instant, no server)

**Zapier**: Webhook relay to Google Sheets (logging)

**HCP Webhooks**: Real-time events (estimate views, jobs)

---

## 💡 POWER MOVES

### Quick Test
1. Open site
2. Login as Tristan
3. Click "New Deal"
4. Fill: Customer = "Test", Amount = 5000, Stage = "Proposals"
5. Create
6. See it in Proposals column ✅

### Check localStorage
DevTools → Application → Local Storage → lionsSalesDeals

### View Function Logs
Netlify Dashboard → Functions → Click function name

### Test Zapier
```bash
curl -X POST https://your-zapier-webhook \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}'
```

### Reset All Data
DevTools → Application → Local Storage → Delete lionsSalesDeals key

---

## 📞 SUPPORT REFERENCES

All answers in the docs:
- 🚀 How to deploy? → DEPLOYMENT-CHECKLIST.md
- 📚 How to use? → README.md
- 🏗️ How does it work? → ARCHITECTURE.md
- 📊 Google Sheets? → ZAPIER-SETUP.md
- 🔄 Real-time tracking? → HCP-WEBHOOKS-SETUP.md
- 🎨 Customize? → SALES-CENTER-SETUP.md

---

## ✅ FINAL CHECKLIST

Before opening DEPLOYMENT-CHECKLIST.md:

- [ ] Read this card (2 min)
- [ ] Have HCP_API_KEY handy
- [ ] Have GHL_TOKEN handy
- [ ] GitHub account ready
- [ ] Netlify account ready
- [ ] 35 minutes free time

**All set? Open DEPLOYMENT-CHECKLIST.md and go!** 🚀

---

**LIONS SALES COMMAND CENTER**  
Ready to deploy. Built production-grade.  
Follow the checklist. Go live today.  

**#BuildingFutureOfSales**
