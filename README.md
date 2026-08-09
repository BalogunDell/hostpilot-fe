# HostsLedger Frontend (`hostpilot-fe`)

React + Vite app for HostsLedger. Deploy on **Netlify**. API lives in [`hostpilot`](https://github.com/BalogunDell/hostpilot) on Railway.

## Local setup

```bash
nvm use          # Node 20.19+
npm install
cp .env.example .env
npm run dev
```

- Web: http://localhost:5173  
- Proxies `/api` → `http://localhost:3000` (run the API from the `hostpilot` repo)

## Env

| Variable | Local | Netlify main | Netlify branch / preview |
|----------|--------|--------------|---------------------------|
| `VITE_API_URL` | `/api/v1` | production Railway (UI env) | staging Railway (`netlify.toml`) |

`VITE_API_URL` is baked in at build time. Production uses the Netlify UI value; branch deploys and deploy previews use `https://staypilotserver-staging.up.railway.app/api/v1`.

## Netlify

1. Connect this GitHub repo
2. Build command: `npm run build` (from `netlify.toml`)
3. Publish directory: `dist`
4. Set production `VITE_API_URL` to your production Railway `/api/v1` URL
5. On staging Railway, include `https://*.netlify.app` in `CORS_ORIGINS` so branch/preview sites can call the API
6. On production Railway, set `CORS_ORIGINS` / `CLIENT_URL` to your live app domains
