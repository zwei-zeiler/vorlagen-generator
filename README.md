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
- Drei fertige Presets unter `presets/`, ladbar per `?preset=<id>` oder aus der Top-Bar —
  ein Link fuehrt damit auf ein fertiges Ergebnis statt auf den Demo-Stand
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

## Lizenz

[Business Source License 1.1](./LICENSE) © 2026 Erwins Enkel GmbH

PSA Templates ist **source-available, nicht Open Source**. Lesen, aendern,
weitergeben und produktiv nutzen ist frei — auch geschaeftlich und auf einer
eigenen Instanz. Nicht erlaubt ist, das Projekt oder eine abgeleitete Fassung
**Dritten zu einem kommerziellen Zweck bereitzustellen**. Auf den Preis kommt es
dabei nicht an: auch ein kostenloses Angebot ist erfasst, wenn es kommerziellen
Zwecken dient — etwa als Lead-Magnet, im Bundle zu bezahlten Leistungen oder
werbefinanziert. Jede oeffentlich erreichbare Instanz nennt sichtbar die Erwins
Enkel GmbH als Urheberin.

Jede Version wird **vier Jahre nach ihrer Veroeffentlichung** automatisch unter
der [AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html) verfuegbar (ihre
Change Date). Ab dann darf sie jeder auch als Dienst betreiben — dann unter den
Bedingungen der AGPL, die die Offenlegung des geaenderten Quellcodes verlangt.

Fuer abweichende Vereinbarungen: **hallo@erwins-enkel.dev**. Details in
[`LICENSE`](./LICENSE), Zusammenfassung auf
[psa-templates.erwins-enkel.dev/lizenz](https://psa-templates.erwins-enkel.dev/lizenz).

Die Autotask-Variablenkataloge unter `psa/autotask/catalog.*.json` stammen von
Datto/Kaseya und fallen **nicht** unter diese Lizenz — siehe [`NOTICE.md`](./NOTICE.md).

---

Ein Projekt der **[Erwins Enkel GmbH](https://www.erwins-enkel.dev)**.
