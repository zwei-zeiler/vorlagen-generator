# PSA Templates — Projekt-Kontext

Browser-basierter Generator für professionelle E-Mail-Vorlagen in Autotask.
Kein Build, kein Framework — statische Files (`index.html`, `app.js`, `styles.css`).

Sichtbarer Produktname: **erwins enkel — PSA Templates**.

## Heimat / Hosting

| Was | Wo |
|-----|-----|
| **Betreiberin** | **Erwins Enkel GmbH**, Wiesbaden — `https://www.erwins-enkel.dev` |
| **Git-Repo** | `github.com/erwins-enkel/psa-templates` (origin) |
| **Live-Deploy** | Vercel, Team **zweizeiler** — Custom-Domain `https://psa-templates.erwins-enkel.dev` |

> `zweizeiler` ist nur noch ein Vercel-Team-Slug, **keine Firmierung** — die frühere
> Zweizeiler UG taucht im Produkt nicht mehr auf. Der Slug bleibt, weil ein Rename
> Deploy-URLs bricht. Frühere Repo-Slugs `zwei-zeiler/vorlagen-generator` und
> `erwins-enkel/vorlagen-generator` forwarden via GitHub-Redirect, sollten
> aber nicht mehr verwendet werden.

> **`impressum.html` und `datenschutz.html` spiegeln die Angaben von
> `https://www.erwins-enkel.dev/impressum`.** Ändern sich dort Anschrift,
> Geschäftsführung oder Registerdaten, hier nachziehen. HRB und USt-ID liegen von den
> Behörden noch nicht vor; `impressum.html` benennt deshalb den Gründungsstand
> („Eintragung ist beantragt", USt-IdNr. „bisher nicht erteilt") statt Platzhaltern.
> Sobald beide Nummern vorliegen, hier **und** auf der Firmenseite eintragen — Issue #27.
> Keine Steuernummer aufnehmen (keine Pflichtangabe nach § 5 DDG).

> **Die Projektkarte auf `https://www.erwins-enkel.dev` liegt in einem anderen Repo:**
> `erwins-enkel/enkels-web` → `components/landing/projects.tsx` (Array `projects`,
> Eintrag `name: "PSA Templates"`). Sie darf kein „Open Source" behaupten, solange
> dieses Repo privat ist und keine `LICENSE` hat — ohne Lizenz ist der Code auch bei
> öffentlicher Sichtbarkeit „alle Rechte vorbehalten". Ändert sich Lizenz oder
> Sichtbarkeit, dort nachziehen.

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
- `psa/autotask/curated.json` — ~50 gebräuchliche Variablen mit Namen in `de`/`en`/`es`,
  deutscher Beschreibung und Beispielwert. Zugleich die Übersetzungstabelle beim Zonenwechsel.
- `psa/autotask/catalog.{de,en,es}.json` — Vollkatalog (1.458 Variablen je Sprache),
  generiert, nicht von Hand pflegen. Wird erst beim Öffnen des Variablen-Pickers geladen.
- `presets/*.json` — drei fertige Konfigurationen, ladbar über `?preset=<id>` und über das
  Menü in der Top-Bar. Sie enthalten **nur das Delta** zu den Defaults (Style,
  Landing-Vorlage, Design-Werte, Section-Schalter, `config.notificationType`) und
  **keinen Vorlagentext** — der käme aus `i18n/*.json` und veraltete sonst bei jeder
  Textänderung. Namen und Beschreibungen stehen unter `preset.<id>.*` in den
  Locale-Dateien, die Allowlist ist `PRESETS` in `app.js`.
  `python3 tools/check-presets.py` prüft die Invarianten offline.
- `tools/build-psa-catalog.py` — erzeugt die Kataloge aus den offiziellen Autotask-Tabellen;
  `--check` validiert `curated.json` dagegen (offline)
- `vercel.json` — CSP/Security-Header

## Tech-Notizen

- **Share-Links kommen ohne Backend aus.** Die Konfiguration steckt gzip-komprimiert und
  base64url-kodiert im URL-Fragment (`/#c=…`); alles hinter `#` sendet der Browser nie an
  den Server. Es gibt daher keine Serverless Function, keine Datenbank und keine Env-Vars.
  Codec: `encodeShareFragment`/`decodeShareFragment` in `app.js`. Das Dekodieren ist auf
  256 KiB dekomprimierte Größe begrenzt — ein Fragment ist manipulierbar, und ohne Grenze
  wäre eine gzip-Bombe möglich. gzip statt `deflate-raw` wegen einheitlicherer
  Browser-Unterstützung (Größenunterschied 0,6 %).
- Output kennt **zwei Formen**: HTML-Code (für Autotask HTML-Feld) und Plain-Text (`generateEmailText`, für Autotask „Nur-Text"-Feld). PSA-`[Variablen]` bleiben in beiden erhalten.
- **Zeichen im Output müssen in der BMP liegen** (U+0000–U+FFFF). Auf dem Weg in die
  Autotask-Vorlage werden UTF-16-Surrogatpaare zerlegt und jede Hälfte durch `?` ersetzt:
  die Glühbirne 💡 (U+1F4A1) kam beim Empfänger als `??` an, Umlaute und der Gedankenstrich
  (U+2014) liefen sauber durch. Deshalb ist das Badge-Zeichen ⚡ (U+26A1) — BMP und trotzdem
  farbiges Emoji. Kein Emoji ab U+10000 in Defaults oder Vorlagentexten verwenden.
- **Variablennamen sind sprachabhängig.** Autotask übersetzt sie je Sprachversion, und die
  Sprache hängt an der Zone: `ww18` = Deutsch, `ww12` = Español, alle übrigen Englisch.
  `[Ticket: Titel]` löst in einer englischen Instanz nicht auf und umgekehrt. Die Zone steht
  in `design.autotaskZone` (Default `ww18`); Tokens im Code entstehen ausschließlich über
  `tokenFor('<kuratierter Schlüssel>')`, nie als Literal.
- **Drei Sprachachsen, bewusst getrennt.** Sie dürfen alle drei auseinanderfallen:

  | Achse | State | Quelle | Wirkt auf |
  |---|---|---|---|
  | Oberflächensprache | `design.uiLang` | `?lang=` → Stand → `navigator` | Sidebar, Buttons, Toasts |
  | Vorlagensprache | `design.templateLang` | Umschalter, sonst aus der Zone | Prosa der erzeugten Mail |
  | Variablensprache | abgeleitet | `zoneById(design.autotaskZone).lang` | die `[…]`-Tokens |

  Eine englische Vorlage in einer deutschen Zone erzeugt englischen Fließtext mit **deutschen**
  Variablennamen — das ist kein Fehler, sondern der Zweck der Trennung. `design.templateLang`
  ist `null`, solange die Sprache der Zone folgt; spanische Zonen fallen auf Englisch zurück,
  weil es keine spanischen Vorlagentexte gibt.
- **Vorlagentexte stehen ausschließlich in `i18n/{de,en}.json`**, nicht in `app.js`. Dort liegt
  unter `TEMPLATE_SPECS` nur noch die Struktur (Sections, Farben, Audience). Variablen stehen in
  den Locale-Texten als `{{kuratierter.schlüssel}}` und werden erst beim Materialisieren über
  `tokenFor()` zum Token der Zonensprache — ein fertiges `[Satz: Feld]` gehört in keine
  Locale-Datei. Auch die Wortmarken der erzeugten Mail (`Status:`, `GF:`, `Impressum` …) liegen
  dort unter `out.*` und folgen der **Vorlagen**sprache, nicht der Oberfläche: sie landen beim
  Empfänger. `python3 tools/check-i18n.py` prüft diese Regeln offline.

## Konventionen

- Conventional Commits mit Scope (`feat(text):`, `fix(ui):`, …) — siehe globale CLAUDE.md.
- Atomare Commits, ein Commit pro logischer Änderung.
- Branch → PR → **Squash-Merge** auf `main`. Details in `CONTRIBUTING.md`.
- **release-please** schneidet Versionen/CHANGELOG automatisch aus den Commits
  (Config: `release-please-config.json`, Manifest: `.release-please-manifest.json`).
  Version lebt in `package.json` (`release-type: node`). Nicht manuell taggen.
- **dependabot** (`.github/dependabot.yml`) hält npm- + GitHub-Actions-Deps wöchentlich aktuell.

> Bewusste Abgrenzung zum `sveltekit-template`-Standard: kein Build, kein
> Prettier/ESLint/Husky/Vitest. Nur architektur-neutrale Prozess-Guidelines
> wurden übernommen.
