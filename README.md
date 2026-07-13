# StayPilot Frontend (`hostpilot-fe`)

React + Vite app for StayPilot. Deploy on **Netlify**. API lives in [`hostpilot`](https://github.com/BalogunDell/hostpilot) on Railway.

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

| Variable | Local | Netlify |
|----------|--------|---------|
| `VITE_API_URL` | `/api/v1` | `https://<your-railway-app>.up.railway.app/api/v1` |

Set `VITE_API_URL` in Netlify **before** the first production build (it is baked in at build time).

## Netlify

1. Connect this GitHub repo
2. Build command: `npm run build` (from `netlify.toml`)
3. Publish directory: `dist`
4. Set `VITE_API_URL` to your Railway API `/api/v1` URL
5. On Railway, set `CORS_ORIGINS` (and `CLIENT_URL`) to your Netlify URL
