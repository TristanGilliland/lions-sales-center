#!/bin/bash
# Sales Command Center - GitHub Setup Script

# Initialize git repo (if not already)
cd /home/claude

# Configure git (use your GitHub account details)
git config user.name "Tristan Lions"
git config user.email "tristan@lionsheatingac.com"

# Initialize repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "feat: Initial Sales Command Center PWA with pipeline, HCP/GHL integration, and Zapier logging"

# Create .env.local with your actual credentials
cat > .env.local << 'EOF'
HCP_API_KEY=91ad73b30454402488a1b5ed5f3ee211
GHL_TOKEN=pit-f3d8fa43-bd7c-4563-8f26-e89a3ac91955
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/[GET_FROM_ZAPIER]/
EOF

echo "✅ Git initialized"
echo "✅ .env.local created"
echo ""
echo "Next steps:"
echo "1. Create repo on GitHub: https://github.com/new"
echo "2. Name it: lions-sales-center"
echo "3. Run these commands:"
echo ""
echo "   git remote add origin https://github.com/YOUR_USERNAME/lions-sales-center.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
