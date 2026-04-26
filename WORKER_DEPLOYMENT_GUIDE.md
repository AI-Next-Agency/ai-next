# Cloudflare Worker Deployment Guide

## Overview
The `workers/form-submission.js` file contains a secure Cloudflare Worker that:
1. Receives form submissions from the assessment form
2. Validates and sanitizes input data
3. Triggers GitHub Actions via the repository_dispatch API
4. Manages rate limiting (5-minute window per IP)
5. Implements CORS security

---

## Prerequisites

- Cloudflare account with Workers enabled
- GitHub repository: `AI-Next-Agency/ai-next`
- GitHub Personal Access Token stored as Cloudflare Secret: `GITHUB_TOKEN`
- Cloudflare KV namespace for rate limiting: `FORM_SUBMISSIONS`

---

## Step 1: Create Cloudflare KV Namespace

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers** → **KV**
3. Click **Create namespace**
4. Name it: `FORM_SUBMISSIONS`
5. Copy the namespace ID (you'll need it in Step 3)

---

## Step 2: Store GitHub Token in Cloudflare Secrets

1. In Cloudflare Dashboard, go to **Workers** → **Settings**
2. Click **Environment Variables**
3. Add new secret:
   - **Name**: `GITHUB_TOKEN`
   - **Value**: Your GitHub Personal Access Token (with `repo` scope)
4. Click **Encrypt** and **Save**

---

## Step 3: Deploy the Worker

### Option A: Using Wrangler CLI (Recommended)

```bash
# Install wrangler
npm install -g wrangler

# Navigate to repo root
cd /Users/nihat/DevS/ai-next

# Login to Cloudflare
wrangler login

# Create wrangler.toml (if doesn't exist)
cat > wrangler.toml << 'EOF'
name = "form-submission"
type = "javascript"
account_id = "YOUR_ACCOUNT_ID"  # From Cloudflare dashboard
workers_dev = true

[env.production]
routes = [
  { pattern = "form-submission.inflownetwork.com/*", zone_id = "YOUR_ZONE_ID" }
]

[[kv_namespaces]]
binding = "FORM_SUBMISSIONS"
id = "YOUR_NAMESPACE_ID"
preview_id = "YOUR_NAMESPACE_ID"

[[env.production.kv_namespaces]]
binding = "FORM_SUBMISSIONS"
id = "YOUR_NAMESPACE_ID"
EOF

# Update with your actual IDs, then deploy
wrangler deploy --env production
```

### Option B: Using Cloudflare Dashboard (Manual)

1. In Cloudflare Dashboard → **Workers**
2. Click **Create a Service**
3. Name it: `form-submission`
4. In the editor, paste the contents of `workers/form-submission.js`
5. Click **Save and Deploy**
6. Copy the worker URL (should be like `form-submission.YOUR_ACCOUNT.workers.dev`)

---

## Step 4: Configure Custom Domain (Optional)

To use `form-submission.inflownetwork.com`:

1. In Cloudflare Dashboard → **Workers** → **form-submission**
2. Click **Settings** → **Routes**
3. Add new route:
   - **Pattern**: `form-submission.inflownetwork.com/*`
   - **Zone**: Select `inflownetwork.com`
4. Save

---

## Step 5: Link KV Namespace to Worker

1. In Worker settings → **Bindings**
2. Click **Add binding**
3. Create KV namespace binding:
   - **Variable name**: `FORM_SUBMISSIONS`
   - **KV namespace**: Select the one created in Step 1
4. Save

---

## Step 6: Update Form Endpoint

In `projects/inflow-network/3-FORM_INDEX.html`, ensure the Worker URL matches:

```javascript
const workerUrl = 'https://form-submission.inflownetwork.com';
```

Replace with your actual worker URL if using `workers.dev` domain:

```javascript
const workerUrl = 'https://form-submission.YOUR_ACCOUNT.workers.dev';
```

---

## Step 7: Test the Submission

1. Open the assessment form: `https://ai-next-agency.github.io/ai-next/projects/inflow-network/`
2. Fill out all fields (name, email, department, role, all 11 questions)
3. Click **Submit Assessment**
4. You should see: "Your assessment has been submitted successfully"
5. Check GitHub: A new response should appear in `projects/inflow-network/responses/` within seconds

---

## Security Checklist

- ✅ CORS restricted to: `https://ai-next-agency.github.io` and `https://inflownetwork.com`
- ✅ GitHub token stored in Cloudflare Secrets (not exposed)
- ✅ Input validation on all required fields
- ✅ Email format validation
- ✅ String length limits (name 100, email 255, dept/role 100)
- ✅ Rate limiting: 5 minutes per IP via KV storage
- ✅ CORS headers properly configured in response

---

## Troubleshooting

### "403 CORS policy violation"
- Verify the form is being served from `ai-next-agency.github.io` or `inflownetwork.com`
- Check Worker's `allowedOrigins` array matches your domain

### "429 Too many submissions"
- Rate limit is 5 minutes per IP
- Wait 5 minutes before submitting again
- Change IP address (different network) to test immediately

### "GitHub API error: 401"
- Check `GITHUB_TOKEN` is correctly stored in Cloudflare Secrets
- Ensure token has `repo` scope permissions
- Token may be expired; generate a new one

### "500 Failed to submit assessment"
- Check Cloudflare Worker logs in Dashboard → **Workers** → **form-submission** → **Logs**
- Verify GitHub API is accessible
- Check repository exists and token has access to it

---

## Monitoring & Debugging

### View Worker Logs
```bash
wrangler tail form-submission --env production
```

### Check KV Storage
```bash
wrangler kv:key list form-submission.FORM_SUBMISSIONS
```

### Manual Test with curl
```bash
curl -X POST https://form-submission.inflownetwork.com \
  -H "Content-Type: application/json" \
  -H "Origin: https://ai-next-agency.github.io" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "department": "Sales",
    "role": "Manager",
    "questions": [...],
    "aiMaturityScore": 3.2,
    "maturityLevel": "Developing"
  }'
```

---

## File Structure After Deployment

```
ai-next/
├── workers/
│   └── form-submission.js          ← Worker code
├── .github/workflows/
│   └── process-inflow-assessment.yml ← GitHub Actions workflow
├── projects/inflow-network/
│   ├── 3-FORM_INDEX.html           ← Updated with Worker endpoint
│   ├── responses/                   ← Auto-created response files
│   └── INFLOW_NETWORK_ASSESSMENT_RESULTS.md ← Auto-generated summary
└── wrangler.toml                   ← Cloudflare Worker config
```

---

## Next Steps

1. Deploy the Worker to Cloudflare
2. Update the Worker URL in the form (if not using the default)
3. Test form submission end-to-end
4. Monitor responses appearing in GitHub
5. Review auto-generated assessment results in the markdown summary

---

**Status**: Ready to deploy  
**Last Updated**: 2026-04-24  
**Version**: 1.0
