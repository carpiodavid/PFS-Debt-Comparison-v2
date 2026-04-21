# Providence Financial Solutions — Debt Relief Comparison

A client-facing debt-relief comparison dashboard with a one-page PDF close piece.

## Local development

```bash
npm install
npm start
# → http://localhost:3000
```

## Files

```
index.html           # Main dashboard
assets/styles.css    # Design system
assets/app.js        # Calculations, chart, PDF export
server.js            # Express server (static + /api/pdf-log)
railway.toml         # Railway deploy config
package.json
```

## Features

- **Three view modes:** Editorial (default), Analyst, Presenter — switch from topbar.
- **Live bar chart** with metric toggle (Total paid / Monthly / Timeline).
- **One-page landscape PDF** close piece with hero savings number, comparison chart, scenario ribbon, bottom-line copy, and optional rep notes.
- **Debt settlement manual override** preserved — toggle on, double-click the monthly or timeline to edit.
- **Legal Debt Resolution pricing** preserved — tier table through $127,500, then $1,500/mo cap at $130k+.
- **Credit-card amortization** preserved — 1% of balance + interest, $35 floor.
- **PDF export logging** — every export POSTs a JSON line to `logs/pdf-exports.jsonl`.

## Deploying to Railway

1. Push this repo to GitHub.
2. On [railway.app](https://railway.app): **New Project → Deploy from GitHub Repo**.
3. Railway auto-detects Node, runs `npm install`, then `npm start`.
4. **Add a volume** for log persistence: Settings → Volumes → mount at `/app/logs`.
5. **Custom domain:** Settings → Domains → Add your domain → set the CNAME record Railway gives you at your registrar.
6. **Environment variables** (optional):
   - `PORT` — Railway sets this automatically.
   - `LOG_DIR` — override the default `./logs`.

### Health check
`/healthz` returns `{ ok: true, ts }` — Railway uses this to determine readiness.

### Export log format
One JSON object per line in `logs/pdf-exports.jsonl`:
```json
{"ts":"2026-04-20T19:22:00.000Z","ip":"...","ua":"...","client":"Jane Doe","rep":"David","debt":25000,"apr":19.57,"legal":{...},"settlement":{...},"cc":{...}}
```
Tail in production: `railway run -- tail -f logs/pdf-exports.jsonl`.

## Preserved logic

All calculations, pricing tiers, debt settlement defaults + manual override, and the 24-month fixed LDR timeline are preserved from v1. The PDF has been redesigned from a 3-page brief into a single landscape close piece.
