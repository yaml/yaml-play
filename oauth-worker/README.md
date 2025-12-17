# YAML Playground OAuth Worker

Cloudflare Worker that acts as an OAuth proxy for the YAML Playground GitHub Device Flow authentication.

## Overview

This worker provides two endpoints that proxy GitHub's OAuth Device Flow APIs:
- `/device/code` - Request a device code for user authentication
- `/device/token` - Poll for the access token after user authorization

The worker is deployed on Cloudflare's free tier and handles the GitHub Client ID securely.

## Prerequisites

- Node.js and npm installed
- Cloudflare account (free tier is sufficient)
- GitHub OAuth App created with Device Flow enabled

## Setup Instructions

### 1. Create GitHub OAuth App

1. Go to https://github.com/organizations/yaml/settings/applications (or your personal settings)
2. Click "**New OAuth App**"
3. Fill in:
   - **Application name**: `YAML Playground`
   - **Homepage URL**: `https://play.yaml.com`
   - **Authorization callback URL**: `https://play.yaml.com` (required but not used for device flow)
4. Click "**Register application**"
5. In the OAuth App settings, **enable Device Flow** ✅
6. Copy the **Client ID** (looks like `Iv1.abc123def456`)
   - Note: No Client Secret needed for device flow

### 2. Install Wrangler CLI

```bash
# Install globally (recommended)
npm install -g wrangler

# Or use npx (no install needed)
npx wrangler --version
```

### 3. Authenticate with Cloudflare

```bash
npx wrangler login
```

This will:
1. Open a browser window
2. Ask you to authorize Wrangler
3. Save credentials to `~/.wrangler/config/default.toml`

### 4. Configure Client ID

Edit `wrangler.toml` and replace the placeholder Client ID:

```toml
[vars]
GITHUB_CLIENT_ID = "Iv1.abc123def456"  # Your actual Client ID from step 1
```

### 5. Deploy Worker

```bash
# Install dependencies
npm install

# Deploy to Cloudflare
npx wrangler deploy
```

You'll see output like:
```
Uploaded yaml-play-oauth (1.23 sec)
Published yaml-play-oauth (0.45 sec)
  https://yaml-play-oauth.YOUR_SUBDOMAIN.workers.dev
```

**Important**: Copy the Worker URL shown in the output!

### 6. Update Frontend Configuration

Edit `/frontend/src/lib/sandbox.ts` and update the Worker URL:

```typescript
const OAUTH_PROXY_URL = import.meta.env.PROD
  ? 'https://yaml-play-oauth.YOUR_SUBDOMAIN.workers.dev'  // Your actual URL
  : `${SANDBOX_URL}/oauth`;
```

Edit `/frontend/src/lib/oauth.ts` and update the Client ID:

```typescript
export const GITHUB_CLIENT_ID = 'Iv1.abc123def456';  // Your actual Client ID
```

### 7. Update Sandbox Server (for local development)

Edit `/docker/main/play-sandbox` and add the Client ID at the top:

```python
# GitHub OAuth Client ID
GITHUB_CLIENT_ID = 'Iv1.abc123def456'  # Your actual Client ID
```

Then update the OAuth endpoints to use it:

```python
@app.route('/oauth/device/code', methods=['POST'])
def oauth_device_code():
    response = requests.post(
        'https://github.com/login/device/code',
        data={
            'client_id': GITHUB_CLIENT_ID,
            'scope': 'public_repo'
        },
        # ... rest of code
```

### 8. Rebuild and Test

```bash
# Rebuild Docker container
make docker-build
docker restart yaml-play

# Rebuild frontend
cd frontend && npm run build

# Test locally
npm run dev
```

## Testing

### Test Worker Directly

```bash
curl -X POST https://yaml-play-oauth.YOUR_SUBDOMAIN.workers.dev/device/code
```

Should return JSON with device code from GitHub:
```json
{
  "device_code": "abc123...",
  "user_code": "ABCD-1234",
  "verification_uri": "https://github.com/login/device",
  "expires_in": 900,
  "interval": 5
}
```

### Test in Browser

1. Open the app (locally or production)
2. Click "API Tokens" menu item
3. Click "Sign in with GitHub"
4. Should see a device code displayed
5. Click the GitHub link and enter the code
6. App should automatically detect authorization and sign you in

## Updating

To update the worker after making changes:

```bash
npx wrangler deploy
```

Changes take effect immediately (no cache, instant global deployment).

## Cost

**$0/month** - Cloudflare Workers free tier includes:
- 100,000 requests per day
- OAuth uses ~10-20 requests per user login
- More than sufficient for any realistic usage

## Architecture

### Production Flow
```
Browser → Cloudflare Worker → GitHub OAuth API
```

### Development Flow
```
Browser → Vite Dev Proxy → Local Sandbox Container → GitHub OAuth API
```

## Files

- `wrangler.toml` - Worker configuration and Client ID
- `src/index.js` - Worker code (~60 lines)
- `package.json` - Dependencies (just wrangler CLI)

## Troubleshooting

### "Not Found" error from Worker
- Check that the Worker URL is correct in frontend config
- Verify the worker deployed successfully: `npx wrangler deployments list`

### "Client ID not found" error from GitHub
- Make sure you updated `GITHUB_CLIENT_ID` in `wrangler.toml`
- Redeploy after updating: `npx wrangler deploy`
- Verify Device Flow is enabled in GitHub OAuth App settings

### CORS errors
- Worker includes proper CORS headers (`Access-Control-Allow-Origin: *`)
- Check browser console for specific error messages

### Worker not updating
- Changes are instant - no caching
- Check you're deploying the right worker: `npx wrangler whoami`
- Verify deployment: `npx wrangler tail` to see live logs

## Security Notes

- Client ID is public (safe to embed in code and worker)
- No Client Secret needed or used for device flow
- Worker has no persistent state or secrets
- Tokens are stored in browser localStorage only
- Users can revoke access at https://github.com/settings/applications

## Links

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [GitHub Device Flow Docs](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#device-flow)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
