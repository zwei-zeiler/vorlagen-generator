#!/usr/bin/env python3
"""Prueft die Preset-Dateien offline gegen die Invarianten aus Issue #32.

Wie tools/check-i18n.py ist das hier der einzige automatisierbare Schutz fuer
Regeln, die man einer JSON-Datei nicht ansieht (CONTRIBUTING.md: kein Build,
keine Test-Toolchain):

  1. Genau die IDs aus app.js -> PRESETS liegen unter presets/, eine je Datei.
  2. Nur die vier erlaubten Top-Level-Schluessel; jeder design-Schluessel,
     jede Style-, Vorlagen- und Section-ID existiert wirklich in app.js.
  3. Keine Kopien von Vorlagentext: kein {{platzhalter}}, kein fertiges
     [Satz: Feld]-Token. Als config ist nur notificationType erlaubt.
  4. Keine echten Firmendaten: alle Hosts unter example.com/example.org (die
     Autotask-Zonen-URL ausgenommen), Rufnummern aus dem fuer Film und Funk
     reservierten Block +49 30 23125, keine Erwins-Enkel-Daten.
  5. Kein Preset traegt einen der Platzhalter, gegen die updateSidebarBadges()
     warnt — in *keiner* der beiden Vorlagensprachen. Sonst zeigte die Sidebar
     nach dem Laden weiter "Bitte anpassen" und das Feature verfehlte den Zweck.
  6. autotaskZone gesetzt, autotaskUrl exakt in der von zoneUrlFor() erzeugten
     Form (sonst passt isGeneratedZoneUrl() sie beim Zonenwechsel nicht mehr an),
     templateLang explizit gesetzt.
  7. logoEnabled: false und kein logoUrl — getLogoHtml() schriebe sonst eine
     erfundene URL oder den relativen Default in jede erzeugte Mail.

Die Konstanten kommen aus app.js, damit die Pruefung nicht danebenlaeuft, wenn
dort ein Style, eine Section oder ein Design-Feld dazukommt.

Aufruf:  python3 tools/check-presets.py
Ausgabe: "OK — ..." und Exit 0, sonst eine Liste der Befunde und Exit 1.
"""
import glob
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ERLAUBTE_HOSTS = ('example.com', 'example.org')
ZONEN_HOST_RE = re.compile(r'^[a-z0-9]+\.autotask\.net$')
# Der fuer Film und Funk reservierte Rufnummernblock der Bundesnetzagentur.
TELEFON_PRAEFIX = '+49 30 23125 '
VAR_TOKEN_RE = re.compile(r'\[[^\]]+: [^\]]+\]')
URL_RE = re.compile(r'https?://[^"\s]+')
TELEFON_RE = re.compile(r'\+49[0-9 ]+')
# Die Badge-relevanten Felder aus updateSidebarBadges().
BADGE_TEXT_KEYS = ('company', 'legalCeo', 'legalRegNr')
BADGE_URL_KEYS = ('web', 'legalImprintUrl')


def load_json(*parts):
    with io.open(os.path.join(ROOT, *parts), encoding='utf-8') as fh:
        return json.load(fh)


def block(src, start, pattern):
    """Der Rumpf einer Konstante aus app.js, bis zur schliessenden Zeile."""
    rest = src.split(start, 1)
    if len(rest) != 2:
        raise SystemExit('tools/check-presets.py: %r steht nicht mehr in app.js' % start)
    body = re.split(r'\n  [\]}];', rest[1], maxsplit=1)[0]
    return set(re.findall(pattern, body, re.M))


def main():
    src = io.open(os.path.join(ROOT, 'app.js'), encoding='utf-8').read()

    preset_ids = re.findall(
        r"'([^']+)'", re.search(r'const PRESETS = \[([^\]]*)\]', src).group(1))
    design_keys = block(src, 'const DEFAULT_DESIGN = {', r'^\s{4}(\w+):')
    design_keys |= block(src, 'const DESIGN_TEXT_KEYS = [', r"'([^']+)'")
    style_ids = block(src, 'const STYLES = [', r"id: '([^']+)'")
    template_ids = block(src, 'const TEMPLATE_SPECS = [', r"^\s{6}id: '([^']+)'")
    section_keys = block(src, 'const SECTIONS = [', r"key: '([^']+)'")
    notify_types = set(re.findall(
        r"'([^']+)'", re.search(r'const NOTIFICATION_TYPES = \[([^\]]*)\]', src).group(1)))

    default_design = re.search(r'const DEFAULT_DESIGN = \{(.*?)\n  \};', src, re.S).group(1)

    def default_value(key):
        found = re.search(r"^\s{4}%s: '([^']*)'" % key, default_design, re.M)
        return found.group(1) if found else None

    # Die Platzhalter, gegen die updateSidebarBadges() vergleicht: die Texte
    # ueber designTextCandidates() aus beiden Vorlagensprachen, die URLs aus
    # DEFAULT_DESIGN.
    platzhalter = {key: set() for key in BADGE_TEXT_KEYS}
    for lang in ('de', 'en'):
        strings = load_json('i18n', '%s.json' % lang)
        for key in BADGE_TEXT_KEYS:
            if 'design.' + key in strings:
                platzhalter[key].add(strings['design.' + key])
    for key in BADGE_URL_KEYS:
        platzhalter[key] = {default_value(key)}

    problems = []
    gefunden = sorted(os.path.basename(p)[:-5] for p in
                      glob.glob(os.path.join(ROOT, 'presets', '*.json')))
    if sorted(gefunden) != sorted(preset_ids):
        problems.append('presets/: %s, app.js -> PRESETS: %s'
                        % (sorted(gefunden), sorted(preset_ids)))

    for pid in gefunden:
        preset = load_json('presets', '%s.json' % pid)
        wo = 'presets/%s.json' % pid

        unbekannt = set(preset) - {'activeStyle', 'activeTemplateId', 'design',
                                   'templateOverrides'}
        if unbekannt:
            problems.append('%s: unbekannte Schluessel %s' % (wo, sorted(unbekannt)))
        if preset.get('activeStyle') not in style_ids:
            problems.append('%s: activeStyle %r ist kein Style aus app.js'
                            % (wo, preset.get('activeStyle')))
        if preset.get('activeTemplateId') not in template_ids:
            problems.append('%s: activeTemplateId %r ist keine Vorlage aus app.js'
                            % (wo, preset.get('activeTemplateId')))

        design = preset.get('design') or {}
        # uiLang ist eine Einstellung des Lesers; applyConfig() verwirft sie ohnehin.
        fremd = set(design) - (design_keys - {'uiLang'})
        if fremd:
            problems.append('%s: design-Schluessel ohne Entsprechung in app.js: %s'
                            % (wo, sorted(fremd)))

        if not design.get('autotaskZone'):
            problems.append('%s: autotaskZone fehlt' % wo)
        else:
            erwartet = ('https://%s.autotask.net/Mvc/ServiceDesk/'
                        'TicketDetail.mvc?ticketId={id}' % design['autotaskZone'])
            if design.get('autotaskUrl') != erwartet:
                problems.append('%s: autotaskUrl ist nicht die Form der Zone %s '
                                '— isGeneratedZoneUrl() passt sie sonst nicht mehr an'
                                % (wo, design['autotaskZone']))
        if design.get('templateLang') not in ('de', 'en'):
            problems.append('%s: templateLang fehlt oder ist unbekannt (%r)'
                            % (wo, design.get('templateLang')))
        if design.get('logoEnabled') is not False or 'logoUrl' in design:
            problems.append('%s: logoEnabled muss false sein und logoUrl fehlen — '
                            'getLogoHtml() schriebe das Bild sonst in jede Mail' % wo)

        for key, werte in platzhalter.items():
            # Ein weggelassenes Feld erbt den Default bzw. — bei den Textfeldern —
            # den Platzhalter, den applyLocaleDefaults() nachtraegt. Beides laesst
            # das Badge anschlagen, also zaehlt der effektive Wert.
            wert = design.get(key)
            if wert is None:
                wert = default_value(key)
            if wert is None or wert in werte:
                problems.append('%s: %s fehlt oder traegt den Platzhalter %r — '
                                'updateSidebarBadges() warnt dann weiter'
                                % (wo, key, wert))

        for tid in sorted(preset.get('templateOverrides') or {}):
            override = preset['templateOverrides'][tid]
            if tid not in template_ids:
                problems.append('%s: Override fuer unbekannte Vorlage %r' % (wo, tid))
            fremd = set(override) - {'sections', 'config'}
            if fremd:
                problems.append('%s/%s: unbekannte Schluessel %s' % (wo, tid, sorted(fremd)))
            fremd = set(override.get('sections') or {}) - section_keys
            if fremd:
                problems.append('%s/%s: unbekannte Sections %s' % (wo, tid, sorted(fremd)))
            config = override.get('config') or {}
            fremd = set(config) - {'notificationType'}
            if fremd:
                problems.append('%s/%s: nur config.notificationType ist erlaubt, '
                                'gefunden %s' % (wo, tid, sorted(fremd)))
            if 'notificationType' in config and config['notificationType'] not in notify_types:
                problems.append('%s/%s: notificationType %r ist unbekannt'
                                % (wo, tid, config['notificationType']))

        blob = json.dumps(preset, ensure_ascii=False)
        if '{{' in blob:
            problems.append('%s: enthaelt einen {{platzhalter}} — Vorlagentexte '
                            'gehoeren in i18n/*.json' % wo)
        token = VAR_TOKEN_RE.search(blob)
        if token:
            problems.append('%s: enthaelt das fertige Token %s — Presets tragen '
                            'keinen Vorlagentext' % (wo, token.group(0)))
        for wort in ('rwins', 'weizeiler'):
            if wort in blob:
                problems.append('%s: enthaelt %r — Presets tragen keine echten '
                                'Firmendaten' % (wo, wort))
        for url in URL_RE.findall(blob):
            host = url.split('/')[2]
            if ZONEN_HOST_RE.match(host):
                continue
            if not any(host == h or host.endswith('.' + h) for h in ERLAUBTE_HOSTS):
                problems.append('%s: %s liegt nicht unter %s'
                                % (wo, url, '/'.join(ERLAUBTE_HOSTS)))
        for nummer in TELEFON_RE.findall(blob):
            if not nummer.startswith(TELEFON_PRAEFIX):
                problems.append('%s: Rufnummer %r liegt nicht im reservierten Block %r'
                                % (wo, nummer, TELEFON_PRAEFIX.strip()))

    if problems:
        for problem in problems:
            sys.stderr.write(problem + '\n')
        sys.stderr.write('FEHLER — %d Befunde.\n' % len(problems))
        return 1

    print('OK — %d Presets, %d Styles, %d Vorlagen, %d Sections geprueft.'
          % (len(gefunden), len(style_ids), len(template_ids), len(section_keys)))
    return 0


if __name__ == '__main__':
    sys.exit(main())
