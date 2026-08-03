#!/usr/bin/env python3
"""Erzeugt psa/autotask/catalog.<lang>.json aus den offiziellen Autotask-Tabellen.

Autotask uebersetzt die Namen der Vorlagen-Variablen je Sprachversion. Welche
Sprache eine Instanz spricht, haengt an ihrer Zone: ww18 = Deutsch,
ww12 = Espanol, alle uebrigen = Englisch. Die vollstaendigen Listen stehen als
XLSX in der jeweiligen Sprachhilfe; dieses Skript zieht sie und macht daraus die
JSON-Kataloge, die die App laedt.

Nur Standardbibliothek, kein Build-Step. Laeuft von Hand, wenn Autotask seine
Tabellen aktualisiert.

    python3 tools/build-psa-catalog.py            # Kataloge neu bauen
    python3 tools/build-psa-catalog.py --check    # curated.json validieren (offline)
"""

import argparse
import json
import re
import sys
import urllib.request
import zipfile
from datetime import date
from io import BytesIO
from pathlib import Path
from xml.etree import ElementTree as ET

REPO_ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = REPO_ROOT / "psa" / "autotask"
CURATED = OUT_DIR / "curated.json"

NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"

SOURCES = {
    "en": "https://psa.datto.com/help/Content/5_LinkedDOCUMENTS/MSDocs/Variables_en.xlsx",
    "de": "https://ww18.autotask.net/help/Content/5_LinkedDOCUMENTS/MSDocs/Variables_de.xlsx",
    "es": "https://ww12.autotask.net/help/Content/5_LinkedDOCUMENTS/MSDocs/Variables_es.xlsx",
}

# Autotask laesst diese Begriffe pro Instanz umbenennen und schreibt sie in der
# Tabelle deshalb als Platzhalter. Wir setzen die dokumentierten Standardwerte
# ein; wer in seiner Instanz umbenannt hat, muss die Tokens von Hand anpassen.
#
# Die englische Tabelle ist voller Platzhalter (159x {Account}, 126x
# {Configuration Item}), die uebersetzten Tabellen haben sie fast durchgaengig
# schon aufgeloest. Die wenigen Reste sind hier belegt: DE "Bundesland/Kanton"
# und "Postleitzahl" stehen woertlich in den Zeilen des Satzes "Diverses"
# ("Initiator - primaere Geschaeftsstelle: Postleitzahl"), "Firma" und "Geraet"
# sind die Praefixe der Saetze "Account" bzw. "Installed Product".
TERMS = {
    "en": {
        "{Account}": "Organization",
        "{Parent Account}": "Parent Organization",
        "{Account Location}": "Organization Location",
        "{Configuration Item}": "Device",
        "{State}": "State",
        "{Zip Code}": "Zip Code",
        "{Business Division}": "Business Division",
        "{Business Subdivision}": "Business Subdivision",
    },
    "de": {
        "{Account}": "Firma",
        "{Configuration Item}": "Gerät",
        "{State}": "Bundesland/Kanton",
        "{Zip Code}": "Postleitzahl",
    },
    "es": {
        "{Account}": "Empresa",
        "{Configuration Item}": "Elemento de configuración",
        # Die ES-Tabelle fuehrt an anderer Stelle die uebersetzten Platzhalter
        # {Estado} und {Código postal} — das sind die spanischen Begriffe.
        "{State}": "Estado",
        "{Zip Code}": "Código postal",
    },
}

# Die spanische Tabelle uebersetzt teilweise den Platzhalter selbst
# ({Código postal}, {Empresa matriz}, {Estado}) — dort ist der Platzhaltertext
# bereits der gesuchte Begriff, die Klammern muessen nur weg.
BARE_PLACEHOLDER = re.compile(r"\{([^}]+)\}")

HEADER_ROW_MARKER = "Variable Set Name"


def read_rows(blob):
    """Liefert (Set-Name, Variablenname) je Datenzeile der ersten Tabelle."""
    zf = zipfile.ZipFile(BytesIO(blob))

    shared = []
    if "xl/sharedStrings.xml" in zf.namelist():
        root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
        for si in root.iter(NS + "si"):
            shared.append("".join(t.text or "" for t in si.iter(NS + "t")))

    sheet = ET.fromstring(zf.read("xl/worksheets/sheet1.xml"))
    effective = None
    out = []

    for row in sheet.iter(NS + "row"):
        cells = {}
        for cell in row.iter(NS + "c"):
            col = "".join(ch for ch in cell.get("r", "") if ch.isalpha())
            kind = cell.get("t")
            value_el = cell.find(NS + "v")
            if kind == "inlineStr":
                value = "".join(t.text or "" for t in cell.iter(NS + "t"))
            elif value_el is None:
                value = ""
            elif kind == "s":
                value = shared[int(value_el.text)]
            else:
                value = value_el.text or ""
            cells[col] = value.strip()

        a, b = cells.get("A", ""), cells.get("B", "")
        if a.startswith("Effective "):
            effective = a[len("Effective "):].strip()
        if not a or not b or a == HEADER_ROW_MARKER:
            continue
        out.append((a, b))

    return out, effective


def resolve_terms(name, lang, unresolved):
    for placeholder, term in TERMS[lang].items():
        name = name.replace(placeholder, term)

    def strip(match):
        unresolved.add(match.group(0))
        return match.group(1)

    return BARE_PLACEHOLDER.sub(strip, name)


def build_catalog(lang, blob):
    rows, effective = read_rows(blob)
    unresolved = set()

    # Ueber den englischen Set-Namen aus Spalte A gruppieren, nicht ueber das
    # uebersetzte Praefix: Autotask uebersetzt innerhalb eines Satzes nicht
    # immer einheitlich (die ES-Tabelle fuehrt im Ticket-Satz eine Zeile mit
    # Praefix "Oportunidad"). Der Set-Name ist ueber alle Sprachen stabil.
    by_set = {}
    for set_name, variable in rows:
        by_set.setdefault(set_name, []).append(resolve_terms(variable, lang, unresolved))

    if unresolved:
        print(
            f"  Hinweis [{lang}]: Platzhalter ohne Eintrag in TERMS, Klammern "
            f"entfernt: {', '.join(sorted(unresolved))}"
        )

    categories = []
    for set_name in sorted(by_set):
        variables = sorted(set(by_set[set_name]))
        prefixes = [v.split(": ", 1)[0] for v in variables if ": " in v]
        label = max(set(prefixes), key=prefixes.count) if prefixes else set_name
        categories.append({"key": set_name, "name": label, "variables": variables})

    return {
        "lang": lang,
        "generated": date.today().isoformat(),
        "effective": effective,
        "source": SOURCES[lang],
        "categories": categories,
    }


def cmd_build(args):
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for lang, url in SOURCES.items():
        if args.source_dir:
            blob = (Path(args.source_dir) / f"Variables_{lang}.xlsx").read_bytes()
            origin = "lokal"
        else:
            print(f"lade {url}")
            with urllib.request.urlopen(url, timeout=60) as resp:
                blob = resp.read()
            origin = "remote"

        catalog = build_catalog(lang, blob)
        target = OUT_DIR / f"catalog.{lang}.json"
        target.write_text(
            json.dumps(catalog, ensure_ascii=False, indent=1) + "\n", encoding="utf-8"
        )
        count = sum(len(c["variables"]) for c in catalog["categories"])
        print(
            f"  {target.relative_to(REPO_ROOT)}: {count} Variablen in "
            f"{len(catalog['categories'])} Saetzen ({origin}, Stand {catalog['effective']})"
        )

    return 0


def cmd_check(args):
    if not CURATED.exists():
        print(f"FEHLER: {CURATED.relative_to(REPO_ROOT)} fehlt", file=sys.stderr)
        return 2

    curated = json.loads(CURATED.read_text(encoding="utf-8"))
    catalogs = {}
    for lang in SOURCES:
        path = OUT_DIR / f"catalog.{lang}.json"
        if not path.exists():
            print(f"FEHLER: {path.relative_to(REPO_ROOT)} fehlt", file=sys.stderr)
            return 2
        doc = json.loads(path.read_text(encoding="utf-8"))
        catalogs[lang] = {v for c in doc["categories"] for v in c["variables"]}

    missing = []
    seen_keys = set()
    checked = 0

    for category in curated["categories"]:
        for variable in category["variables"]:
            key = variable["key"]
            if key in seen_keys:
                missing.append((key, "-", "doppelter Schluessel"))
            seen_keys.add(key)
            for lang in SOURCES:
                name = variable["name"].get(lang)
                checked += 1
                if not name:
                    missing.append((key, lang, "kein Name hinterlegt"))
                elif name not in catalogs[lang]:
                    missing.append((key, lang, name))

    if missing:
        print(f"{len(missing)} Abweichung(en):", file=sys.stderr)
        for key, lang, detail in missing:
            print(f"  {key} [{lang}]: {detail}", file=sys.stderr)
        return 1

    print(f"OK — {len(seen_keys)} kuratierte Variablen, {checked} Namen geprueft.")
    return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="curated.json gegen die committeten Kataloge pruefen (offline)",
    )
    parser.add_argument(
        "--source-dir",
        help="XLSX aus einem lokalen Verzeichnis lesen statt herunterzuladen",
    )
    args = parser.parse_args()
    return cmd_check(args) if args.check else cmd_build(args)


if __name__ == "__main__":
    sys.exit(main())
