# erwins enkel — PSA Templates

> 🌐 **Live:** https://psa-templates.erwins-enkel.dev

Browser-basierter Template-Generator fuer professionelle E-Mail-Vorlagen in Autotask.

## Starten

`index.html` im Browser oeffnen — kein Build, kein Backend, keine Dependencies.

## Features

- Design-System Editor (Farben, Logo, Fonts, Firmendaten, rechtliche Angaben)
- 12 vorkonfigurierte Templates (Ticket-Note, Annahme, Eingangsbestaetigung, Eskalation, Rueckfrage u.v.m.)
- 4 Style-Varianten (Modern Card, Clean Minimal, Corporate Classic, Internal Minimal)
- Autotask-Zonen: Variablennamen entstehen sprachrichtig zur gewaehlten Zone
  (`ww18` deutsch, `ww12` spanisch, uebrige englisch) und werden beim Zonenwechsel uebersetzt
- Live-Preview (Desktop / Mobile)
- Code-Export mit PSA-Variablen — als HTML **und** als Plain-Text fuer das
  Autotask-Feld „Nur Text"
- Share-Links ohne Backend: die Konfiguration reist komprimiert im URL-Fragment
- JSON Export/Import + localStorage-Persistenz
- Variablen-Picker mit Suchfunktion

## PSA-Unterstuetzung

Unterstuetzt wird Autotask. Die Variablen-Definitionen liegen unter `psa/`:

```
psa/
  autotask/
    curated.json          — ~50 gebraeuchliche Variablen mit Namen in de/en/es,
                            zugleich die Uebersetzungstabelle beim Zonenwechsel
    catalog.de.json       — generierter Vollkatalog (1.458 Variablen je Sprache),
    catalog.en.json         wird erst beim Oeffnen des Variablen-Pickers geladen
    catalog.es.json
```

Die Kataloge erzeugt `tools/build-psa-catalog.py` aus den offiziellen Autotask-Tabellen;
`--check` validiert `curated.json` offline dagegen. Von Hand werden sie nicht gepflegt.

Weitere PSA-Systeme koennen grundsaetzlich als eigene JSON-Datei ergaenzt werden — heute
ist keines davon umgesetzt.

---

Ein Projekt der **[Erwins Enkel GmbH](https://www.erwins-enkel.dev)**.
