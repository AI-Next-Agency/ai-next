# FORM_SUBMISSIONS KV Namespace Setup

## Option 1: OAuth Authentication (Recommended)

The command requires Cloudflare OAuth authentication:

```bash
cd /Users/nihat/DevS/ai-next/workers
wrangler kv namespace create FORM_SUBMISSIONS
```

When prompted:
1. Click the browser link that opens automatically
2. Log in with your Cloudflare account
3. Authorize the requested permissions
4. The namespace will be created automatically

After creation, copy the namespace ID and update `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "FORM_SUBMISSIONS"
id = "YOUR_NAMESPACE_ID_HERE"  # Replace this
```

## Option 2: API Token Authentication (Alternative)

If OAuth doesn't work, use API credentials:

1. Get your Cloudflare Account ID and API Token from: https://dash.cloudflare.com/profile/api-tokens
   - Create a token with these scopes: `Workers KV:Edit`
   - Copy the Account ID from the dashboard

2. Set environment variables:
```bash
export CLOUDFLARE_API_TOKEN="your_api_token_here"
export CLOUDFLARE_ACCOUNT_ID="your_account_id_here"
```

3. Run the command:
```bash
wrangler kv namespace create FORM_SUBMISSIONS
```

## Manual Creation via API

If both methods fail, create the namespace directly via REST API:

```bash
curl -X POST "https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/storage/kv/namespaces" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"FORM_SUBMISSIONS"}'
```

Response will include the namespace ID to paste in `wrangler.toml`.

## Status
- Wrangler CLI v4.85.0: ✅ Installed
- Command syntax: ✅ Verified (v2 format: `wrangler kv namespace create`)
- Authentication: ⏳ Requires Cloudflare account credentials
