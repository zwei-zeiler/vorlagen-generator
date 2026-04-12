# erwins enkel — PSA Email Vorlagen Generator

> 🌐 **Live:** https://vorlagen-generator.vercel.app

Browser-basierter Template-Generator fuer professionelle E-Mail-Vorlagen in PSA-Systemen (Autotask, HaloPSA u.a.).

## Starten

`index.html` im Browser oeffnen — kein Build, kein Backend, keine Dependencies.

## Features

- Design-System Editor (Farben, Logo, Fonts, Firmendaten, rechtliche Angaben)
- 10 vorkonfigurierte Templates (Ticket-Note, Annahme, Eingangsbestaetigung, Eskalation, Rueckfrage u.v.m.)
- 3 Style-Varianten (Modern Card, Clean Minimal, Corporate Classic)
- Live-Preview (Desktop / Mobile)
- Code-Export mit PSA-Variablen
- JSON Export/Import + localStorage-Persistenz
- Variablen-Picker mit Suchfunktion

## PSA-Unterstuetzung

Variablen-Definitionen liegen unter `psa/`:

```
psa/
  autotask.json    — Autotask PSA Variablen
```

Weitere PSA-Systeme (HaloPSA etc.) koennen als eigene JSON-Datei hinzugefuegt werden.

## Lizenz

MIT

---

Ein Projekt der **Zweizeiler UG**.
