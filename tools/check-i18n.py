#!/usr/bin/env python3
"""Prueft die Locale-Dateien offline gegen die Invarianten aus Issue #36.

Das Repo hat bewusst keine Test-Toolchain (CONTRIBUTING.md: kein Build,
kein Vitest/ESLint). Diese Pruefung ist deshalb der einzige automatisierbare
Schutz fuer die Regeln, die man den JSON-Dateien nicht ansieht:

  1. de.json und en.json tragen exakt dieselben Schluessel.
  2. Kein Ausgabetext enthaelt ein fertiges [Satz: Feld]-Token — Variablen
     stehen als {{kuratierter.schluessel}} und werden erst beim Materialisieren
     ueber tokenFor() in die Sprache der Autotask-Zone aufgeloest.
  3. Jeder {{...}}-Platzhalter existiert in psa/autotask/curated.json.
  4. Jeder out.*Html-Schluessel ist reines ASCII — dort stehen HTML-Entities
     (Priorit&auml;t:), kein roher Umlaut.
  5. Jede der 12 Vorlagen hat einen Namen, und jede ausser internal-notification
     einen Betreff (deren Betreff kommt aus notify.subjectPattern).

Aufruf:  python3 tools/check-i18n.py
Ausgabe: "OK — ..." und Exit 0, sonst eine Liste der Befunde und Exit 1.
"""
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LANGS = ('de', 'en')

# Namensraeume, deren Text in der erzeugten Mail landet.
OUTPUT_PREFIXES = ('tpl.', 'notify.', 'out.', 'design.')

# intro.b2 erklaert dem Nutzer, wie Tokens je Zone aussehen — die [..: ..]
# darin sind Beispielprosa und bleiben absichtlich stehen.
TOKEN_EXEMPT = {'intro.b2'}

TEMPLATE_IDS = [
    'ticket-note', 'ticket-accepted', 'ticket-confirmation', 'ticket-closed',
    'ticket-escalated', 'ticket-feedback-request', 'sla-warning',
    'ticket-handover', 'ticket-survey', 'ticket-booking',
    'internal-notification', 'ticket-feedback-internal'
]
# Betreff, Vorschautext und Einleitung dieser Vorlage haengen am
# Benachrichtigungstyp und stehen unter notify.*, nicht unter tpl.*.
NO_SUBJECT = {'internal-notification'}

PLACEHOLDER_RE = re.compile(r'\{\{([^}]+)\}\}')
VAR_TOKEN_RE = re.compile(r'\[[^\]]+: [^\]]+\]')


def load_json(*parts):
    with io.open(os.path.join(ROOT, *parts), encoding='utf-8') as fh:
        return json.load(fh)


def curated_keys():
    curated = load_json('psa', 'autotask', 'curated.json')
    return {v['key'] for cat in curated['categories'] for v in cat['variables']}


def main():
    problems = []
    locales = {lang: load_json('i18n', '%s.json' % lang) for lang in LANGS}
    known_vars = curated_keys()

    # 1 — Schluesselgleichheit
    de_keys, en_keys = set(locales['de']), set(locales['en'])
    for missing, where in ((de_keys - en_keys, 'en'), (en_keys - de_keys, 'de')):
        for key in sorted(missing):
            problems.append('fehlt in %s.json: %s' % (where, key))

    for lang, strings in locales.items():
        for key, value in sorted(strings.items()):
            is_output = key.startswith(OUTPUT_PREFIXES)

            # 2 — keine fertigen Tokens in Ausgabetexten
            if key not in TOKEN_EXEMPT:
                found = VAR_TOKEN_RE.search(value)
                if found and is_output:
                    problems.append(
                        '%s.json %s: fertiges Token %s — als {{schluessel}} schreiben'
                        % (lang, key, found.group(0)))

            # 3 — Platzhalter muessen kuratiert sein
            for name in PLACEHOLDER_RE.findall(value):
                if name not in known_vars:
                    problems.append(
                        '%s.json %s: {{%s}} steht nicht in curated.json'
                        % (lang, key, name))

            # 4 — HTML-Schluessel ASCII-rein
            if key.startswith('out.') and key.endswith('Html'):
                if any(ord(ch) > 127 for ch in value):
                    problems.append(
                        '%s.json %s: enthaelt Nicht-ASCII — HTML-Entity verwenden'
                        % (lang, key))

        # 5 — Vollstaendigkeit der Vorlagen
        for tid in TEMPLATE_IDS:
            if 'tpl.%s.name' % tid not in strings:
                problems.append('%s.json: tpl.%s.name fehlt' % (lang, tid))
            if tid not in NO_SUBJECT and 'tpl.%s.subject' % tid not in strings:
                problems.append('%s.json: tpl.%s.subject fehlt' % (lang, tid))

    if problems:
        for problem in problems:
            sys.stderr.write(problem + '\n')
        sys.stderr.write('FEHLER — %d Befunde.\n' % len(problems))
        return 1

    tpl_keys = sum(1 for k in locales['de'] if k.startswith('tpl.'))
    print('OK — %d Schluessel je Sprache, davon %d Vorlagentexte, %d Vorlagen geprueft.'
          % (len(locales['de']), tpl_keys, len(TEMPLATE_IDS)))
    return 0


if __name__ == '__main__':
    sys.exit(main())
