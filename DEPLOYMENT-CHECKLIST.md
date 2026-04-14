# Sales Command Center — Deployment & Operations Checklist

✅ Complete | ⏳ In Progress | ❌ Not Started

---

## Phase 1: Launch (This Week)

### Code & GitHub
- [ ] Push to GitHub
  ```bash
  cd /home/claude
  git init && git add . && git commit -m "Initial Sales Command Center"
  git remote add origin https://github.com/YOUR/lions-sales-center.git
  git push -u origin main
  ```

### Netlify Deploy
- [ ] Go to netlify.com → **New site** → **Connect GitHub**
- [ ] Select `lions-sales-center` repo
- [ ] Set Environment Variables:
  ```
  HCP_API_KEY = 91ad73b30454402488a1b5ed5f3ee211
  GHL_TOKEN = pit-f3d8fa43-bd7c-4563-8f26-e89a3ac91955
  ZAPIER_WEBHOOK_URL = (add after Zapier setup)
  ```
- [ ] Trigger deploy
- [ ] Copy live URL (e.g., https://lions-sales.netlify.app)

### Test Locally First
- [ ] Log in as Tristan
- [ ] Create test deal
- [ ] Verify it saves to localStorage
- [ ] Check Call/SMS buttons

### Zapier + Google Sheets
- [ ] Create Google Sheet: **"Lions Sales Log"**
  - Columns: Timestamp | Type | Deal ID | Customer | Amount | Stage | Sold | Sales Rep

- [ ] Create Zapier Zap:
  1. Trigger: Webhooks by Zapier → Catch Raw Hook
  2. Copy webhook URL
  3. Action: Google Sheets → Create Row
  4. Map fields
  5. Publish

- [ ] Add Zapier URL to Netlify env: `ZAPIER_WEBHOOK_URL`

- [ ] Redeploy to activate

- [ ] Test: Create deal → Check Google Sheet (should appear in 15 sec)

---

## Phase 2: Team Access (Week 2)

### Mobile Setup
- [ ] Test on iPhone & Android
- [ ] Install to home screen (PWA)
- [ ] Verify offline access works

### Add Sales Reps
- [ ] Update `src/App.jsx` with rep names
- [ ] Redeploy

### Share with Team
- [ ] Send Netlify URL to sales reps
- [ ] Slack announcement with demo
- [ ] Quick training: login → create deal → check Google Sheet

---

## Phase 3: Real Data (Week 3)

### HCP Integration
- [ ] Update App.jsx to load real HCP estimates
  - Replace demo data with HCP API call
  - Test estimates appear in Proposals

- [ ] Add phone number syncing
  - Fetch from HCP
  - Use for GHL SMS/calling

- [ ] Test: Create HCP estimate → See in app within 1 min

### GHL Live Testing
- [ ] Call button → GHL initiates call
- [ ] SMS button → Message sent via GHL
- [ ] Check GHL activity log

---

## Phase 4: Scale (Week 4+)

### Webhooks (Optional)
- [ ] HCP Webhooks → estimate.viewed
- [ ] GHL Webhooks → call/SMS logged

### Advanced Features
- [ ] Drag-and-drop stage reordering
- [ ] Activity timeline
- [ ] Commission calculations

---

## Daily Operations

**Sales Rep:**
1. Log in (device or desktop)
2. Create/update deals
3. Call/SMS customers
4. All auto-saves

**Admin (Tristan):**
1. Check Google Sheet weekly
2. Review pipeline by rep
3. Monitor close rates
4. Generate commission reports

---

## Support

**Site down?**
- Netlify status: netlify.com/status
- Check build logs

**Deals not saving?**
- Browser Storage: DevTools → Local Storage
- Should show `lionsSalesDeals` key

**Google Sheets not logging?**
- Zapier status: zapier.com
- Test webhook with curl

**SMS/Call broken?**
- Verify GHL_TOKEN in Netlify
- Check GHL account status
- Confirm customer phone numbers in HCP

---

## Success Metrics

✓ All reps logging daily
✓ 100% of deals tracked
✓ 50%+ with SMS/call activity
✓ Weekly review data available
✓ Commission reports accurate

---

**Next: Read SALES-CENTER-SETUP.md for step-by-step** 🚀
