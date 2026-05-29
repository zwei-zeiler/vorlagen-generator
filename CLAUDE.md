# PSA Templates — Projekt-Kontext

Browser-basierter Generator für professionelle E-Mail-Vorlagen in
PSA-Systemen (Autotask, HaloPSA u.a.). Kein Build, kein Framework —
statische Files (`index.html`, `app.js`, `styles.css`).

Sichtbarer Produktname: **erwins enkel — PSA Templates**.

## Heimat / Hosting

| Was | Wo |
|-----|-----|
| **Git-Repo** | `github.com/erwins-enkel/psa-templates` (origin) |
| **Live-Deploy** | Vercel, Team **zweizeiler** — Custom-Domain `https://psa-templates.erwins-enkel.dev` |

> Repo-Owner (`erwins-enkel`) und Vercel-Team (`zweizeiler`) sind bewusst
> unterschiedlich. Frühere Repo-Slugs `zwei-zeiler/vorlagen-generator` und
> `erwins-enkel/vorlagen-generator` forwarden via GitHub-Redirect, sollten
> aber nicht mehr verwendet werden.

## Deploy

- **Auto-Deploy** via Vercel GitHub-Integration: jeder Push auf `main` → Production.
- Deploy-Status prüfen: `gh api repos/erwins-enkel/psa-templates/deployments`
- Kein lokaler Build-Step nötig — statische Files werden direkt ausgeliefert.

## Lokales Testen

Kein Dev-Server-Script. Statisch servieren, z.B.:
`python3 -m http.server <port>` im Projekt-Root, dann `tailscale serve` als HTTPS-Proxy davor.

## Struktur

- `index.html` — UI-Markup (Sidebar-Editor, Preview-/Code-Panel, Toolbars)
- `app.js` — gesamte Logik: Templates, Design-State, HTML-/Text-Generierung, Share-Links
- `styles.css` — Styling
- `psa/autotask.json` — PSA-Variablen-Definitionen (weitere Systeme als eigene JSON ergänzbar)
- `api/share.js` — Vercel Serverless Function für Share-Links (Upstash Redis)
- `vercel.json` — Rewrites (`/s/:id` → Share) + CSP/Security-Header

## Tech-Notizen

- Share-Feature braucht Upstash Redis Env-Vars (`KV_REST_API_URL`/`_TOKEN` o. `UPSTASH_REDIS_REST_*`) in Vercel.
- Output kennt **zwei Formen**: HTML-Code (für Autotask HTML-Feld) und Plain-Text (`generateEmailText`, für Autotask „Nur-Text"-Feld). PSA-`[Variablen]` bleiben in beiden erhalten.

## Konventionen

- Conventional Commits mit Scope (`feat(text):`, `fix(ui):`, …) — siehe globale CLAUDE.md.
- Atomare Commits, ein Commit pro logischer Änderung.
