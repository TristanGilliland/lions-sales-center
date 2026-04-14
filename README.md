# Lions Sales Command Center

Real-time pipeline tracking, deal management, and sales performance monitoring for Lions Heating & Air Conditioning.

## Features

- **Live Pipeline Board**: Kanban-style view of deals across Proposals → Negotiating → Sold → Lost stages
- **Deal Management**: Track customer deals with amount, equipment, and status
- **Sales Rep Dashboard**: View metrics by sales rep with closure rate tracking
- **Quick Actions**: One-click SMS and calling via GHL integration
- **Deal Tracking**: Monitor equipment ordering, commission assignments, and estimate views
- **Data Persistence**: Automatic localStorage sync with Google Sheets logging via Zapier
- **Mobile Responsive**: Full PWA support for mobile field use

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS + custom animations
- **Backend**: Netlify Functions
- **APIs**: HCP (estimates/jobs), GHL (SMS/calling), Zapier (Google Sheets logging)
- **Deployment**: Netlify

## Installation

1. Clone or create this repository:
```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in your credentials:
```bash
cp .env.example .env.local
```

3. Required environment variables:
- `HCP_API_KEY` - Your HCP API key (already configured: 91ad73b30454402488a1b5ed5f3ee211)
- `GHL_TOKEN` - Your GHL Private Integration Token (already configured: pit-f3d8fa43-bd7c-4563-8f26-e89a3ac91955)
- `ZAPIER_WEBHOOK_URL` - Your Zapier webhook URL (for Google Sheets logging)

## Development

Start the development server:
```bash
npm run dev
```

This will:
- Start Vite dev server on http://localhost:5173
- Enable hot module reloading
- Proxy Netlify functions to http://localhost:9000

## Building

Build for production:
```bash
npm run build
```

Output goes to the `dist/` directory for Netlify deployment.

## Deployment

### To Netlify

1. Connect your repository to Netlify
2. Set environment variables in Netlify dashboard:
   - `HCP_API_KEY`
   - `GHL_TOKEN`
   - `ZAPIER_WEBHOOK_URL`
3. Deploy branch: `main`
4. Build command: `npm run build`
5. Publish directory: `dist`

The site will be deployed to a Netlify URL (e.g., `https://lions-sales-center.netlify.app`)

### Environment Variables in Netlify Dashboard

Go to **Site Settings → Build & Deploy → Environment** and add:

```
HCP_API_KEY=91ad73b30454402488a1b5ed5f3ee211
GHL_TOKEN=pit-f3d8fa43-bd7c-4563-8f26-e89a3ac91955
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/[ID]/[KEY]/
```

## Usage

### Login
1. Open the app
2. Select your sales rep profile (Tristan or Sales Rep 1/2)
3. Access your personal pipeline view

### Managing Deals

**Create New Deal**
- Click "New Deal" button
- Fill in customer name, amount, equipment, stage, and commission tech
- Deal appears in appropriate pipeline column

**Update Deal Status**
- Click "Sold" or "Equipment Ordered" toggles on deal cards
- Status updates in real-time and syncs to localStorage
- Changes logged to Google Sheets via Zapier webhook

**Quick Actions**
- **Call**: Initiates GHL calling (requires GHL phone setup)
- **SMS**: Sends SMS via GHL (phone number from HCP contact)

**Detailed View**
- Click any deal card to open full details modal
- Change stage, commission tech, or any metadata
- Delete deals (careful—no undo)

### Filtering & Analytics

- **Filter by Rep**: See all reps or individual rep pipeline
- **Metrics Bar**: Real-time total pipeline value, deals won, and close rate
- **Data syncs to Google Sheets**: Every change logged via Zapier

## API Integration

### HCP (House Call Pro)
Netlify function at `/.netlify/functions/hcp`

Supports:
- `getEstimates(customerId?)` - Fetch estimates
- `getJobs(customerId?)` - Fetch jobs
- `updateEstimate(estimateId, updates)` - Update estimate status
- `getCustomer(customerId)` - Fetch customer details

### GHL (GoHighLevel)
Netlify function at `/.netlify/functions/ghl`

Supports:
- `sendSMS(contactId, message, locationId)` - Send SMS to contact
- `initiateCall(contactId, locationId)` - Start call
- `getContact(contactId, locationId)` - Fetch contact
- `logCall(contactId, duration, notes, outcome)` - Log completed call

### Zapier (Google Sheets Logging)
Netlify function at `/.netlify/functions/sheets`

Supports:
- `logDeal(deal)` - Log single deal to sheet
- `logActivity(activity)` - Log activity (call, SMS, status change)
- `batchLog(deals, activities)` - Batch log multiple items

## Next Steps

### Zapier Google Sheets Setup
1. Go to Zapier.com and create a new Zap
2. Trigger: **Webhooks by Zapier** > Catch Hook
3. Get your webhook URL
4. Action: **Google Sheets** > Create Spreadsheet Row
5. Add to `.env`: `ZAPIER_WEBHOOK_URL=<your_hook_url>`

### HCP Webhook Integration
Once stable, set up HCP webhooks to push estimate views:
1. Go to HCP Settings > API & Integrations
2. Create webhook for: `estimate.viewed`
3. Send to: `<your_netlify_url>/.netlify/functions/estimate-webhook`

### Mobile Optimization
- App is fully responsive and PWA-ready
- Install to home screen for offline access
- Service worker support can be added via `vite-plugin-pwa`

## File Structure

```
.
├── src/
│   ├── App.jsx              # Main component
│   ├── main.jsx             # React entry point
│   └── index.css            # Global styles
├── public/
│   └── manifest.json        # PWA manifest
├── netlify/
│   └── functions/
│       ├── hcp.js           # HCP API wrapper
│       ├── ghl.js           # GHL SMS/calling
│       └── sheets.js        # Google Sheets logging
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── netlify.toml
└── README.md
```

## Troubleshooting

### Deals not saving
- Check browser storage: DevTools → Application → Local Storage
- Clear cache and try again
- Ensure localStorage is enabled

### GHL SMS/Calling not working
- Verify GHL token in environment variables
- Check contact phone numbers in HCP
- Ensure GHL account has phone capabilities enabled

### Google Sheets not receiving logs
- Verify Zapier webhook URL in `.env`
- Test webhook: `curl -X POST <webhook_url> -H "Content-Type: application/json" -d '{"test":"data"}'`
- Check Zapier activity logs for errors

### API errors
- Check HCP API key is correct
- Verify Netlify functions are deployed
- Check function logs: Netlify Dashboard → Functions

## Performance Tips

- **Browser Storage**: Deals stored locally—use for ~100 concurrent deals before syncing
- **Batch Operations**: Use batchLog endpoint for multiple deal updates
- **Caching**: API responses cached locally; hard refresh to clear

## License

Internal Lions Heating & AC tool. All rights reserved.

## Support

Contact Tristan at Lions Heating & AC for issues or feature requests.
