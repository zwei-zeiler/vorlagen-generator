/* ============================================
   erwins enkel — PSA Templates
   Copyright (c) 2026 Erwins Enkel GmbH
   Business Source License 1.1 — siehe LICENSE.
   Source-available, nicht Open Source: kommerzielle
   Bereitstellung an Dritte braucht eine Vereinbarung,
   hallo@erwins-enkel.dev
   ============================================ */

(function () {
  'use strict';

  // ── Sponsor / Support Links (easy to change) ──
  const SPONSOR_GITHUB_URL = 'https://github.com/sponsors/kai-osthoff';
  const COMPANY_URL = 'https://www.erwins-enkel.dev';

  // ── Oberflächensprache ──
  // NICHT zu verwechseln mit der Variablensprache: die hängt an
  // design.autotaskZone und wird von varLang() bedient. Beide Achsen sind
  // unabhängig — eine englische Oberfläche darf eine deutsche Autotask-Instanz
  // bedienen und umgekehrt.
  const UI_LANGS = ['de', 'en'];
  const DEFAULT_UI_LANG = 'de';
  let strings = {};

  // Geladene Bundles je Sprache. Oberflächen- und Vorlagensprache dürfen
  // auseinanderfallen; sind sie gleich, spart der Cache den zweiten Abruf.
  const locales = Object.create(null);

  function normalizeUiLang(lang) {
    return UI_LANGS.includes(lang) ? lang : DEFAULT_UI_LANG;
  }

  // Reihenfolge: ?lang= → gespeicherter Stand → navigator.language → Default.
  // Der gespeicherte Stand wird hier roh gelesen, weil die Locale feststehen
  // muss, bevor loadFromLocalStorage() läuft — sonst holt init() erst die
  // falsche Datei und danach noch einmal die richtige.
  function detectUiLang() {
    const fromQuery = new URLSearchParams(window.location.search).get('lang');
    if (UI_LANGS.includes(fromQuery)) return fromQuery;
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const savedLang = saved && saved.design && saved.design.uiLang;
      if (UI_LANGS.includes(savedLang)) return savedLang;
    } catch {
      // Ein kaputter Stand darf die Sprachwahl nicht sprengen.
    }
    const nav = (navigator.language || '').toLowerCase();
    if (nav.startsWith('de')) return 'de';
    if (nav) return 'en';
    return DEFAULT_UI_LANG;
  }

  async function loadLocale(lang) {
    if (locales[lang]) return locales[lang];
    try {
      const resp = await fetch('/i18n/' + lang + '.json');
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      locales[lang] = await resp.json();
      return locales[lang];
    } catch (e) {
      console.warn('Could not load locale ' + lang + ':', e);
      return null;
    }
  }

  // Fällt auf den Schlüssel selbst zurück statt auf einen leeren String — eine
  // fehlende Übersetzung soll auffallen, nicht verschwinden.
  function t(key, params) {
    let out = Object.prototype.hasOwnProperty.call(strings, key) ? strings[key] : key;
    if (params) {
      for (const p of Object.keys(params)) {
        out = out.split('{' + p + '}').join(params[p]);
      }
    }
    return out;
  }

  // ── Vorlagensprache ──
  // Dritte Achse neben Oberflächen- und Variablensprache: die Sprache der
  // erzeugten E-Mail-Texte. Eine englische Vorlage in einer deutschen
  // Autotask-Zone muss englischen Fließtext mit *deutschen* Variablennamen
  // erzeugen — Prosa und Tokens folgen verschiedenen Sprachen.
  const TEMPLATE_LANGS = ['de', 'en'];

  function normalizeTemplateLang(lang) {
    return TEMPLATE_LANGS.includes(lang) ? lang : null;
  }

  async function ensureTemplateLocale(lang) {
    return !!(await loadLocale(lang));
  }

  function ttIn(key, lang) {
    const bundle = locales[lang];
    return bundle && Object.prototype.hasOwnProperty.call(bundle, key) ? bundle[key] : '';
  }

  // Anders als t() fällt tt() auf '' zurück statt auf den Schlüssel. Eine
  // fehlende Übersetzung in der Sidebar ist ein Schönheitsfehler; in einer
  // Kundenmail stünde sonst wörtlich „tpl.ticket-note.subject" beim Empfänger.
  function tt(key, params) {
    let out = ttIn(key, templateLang());
    if (params) {
      for (const p of Object.keys(params)) {
        out = out.split('{' + p + '}').join(params[p]);
      }
    }
    return out;
  }

  function applyStaticTranslations() {
    for (const el of $$('[data-i18n]')) el.textContent = t(el.dataset.i18n);
    for (const el of $$('[data-i18n-placeholder]')) el.placeholder = t(el.dataset.i18nPlaceholder);
    for (const el of $$('[data-i18n-title]')) el.title = t(el.dataset.i18nTitle);

    document.documentElement.lang = t('meta.htmlLang');
    document.title = t('meta.title');
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.content = t('meta.description');
    const ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) ogLocale.content = t('meta.ogLocale');

    for (const btn of $$('#lang-switch button')) {
      btn.classList.toggle('active', btn.dataset.uiLang === state.design.uiLang);
    }
  }

  // Alles, was Text aus t() erzeugt, statt ihn im Markup stehen zu haben.
  function rerenderTranslatedUi() {
    applyStaticTranslations();
    renderZoneOptions();
    $('#ds-autotask-zone').value = state.design.autotaskZone;
    updateZoneHint();
    renderTemplateTabs();
    renderSectionToggles();
    renderTemplateConfig();
    // Nur der Hinweistext wechselt mit der Oberflaechensprache — die
    // Vorlagensprache selbst bleibt, wo sie steht.
    updateTemplateLangSwitch();
    updateSidebarBadges();
  }

  async function setUiLang(lang) {
    const next = normalizeUiLang(lang);
    if (next === state.design.uiLang) return;
    const loaded = await loadLocale(next);
    if (!loaded) return;
    strings = loaded;
    state.design.uiLang = next;
    rerenderTranslatedUi();
    saveToLocalStorage();
  }

  // Die Konfiguration reist im URL-Fragment, nicht über einen Server: alles
  // hinter '#' wird vom Browser nie gesendet. Kodierung: JSON → gzip →
  // base64url; der Codec steht weiter unten.
  const SHARE_FRAGMENT_PREFIX = '#c=';

  // ── Mobile Warning ──
  const mobileWarning = document.getElementById('mobile-warning');
  const mobileWarningDismiss = document.getElementById('mobile-warning-dismiss');
  if (mobileWarningDismiss) {
    mobileWarningDismiss.addEventListener('click', () => {
      mobileWarning.classList.add('dismissed');
    });
  }

  // ── Intro-Karte beim Erstbesuch ──
  // Läuft bewusst hier und nicht in init(): init() beginnt mit einem fetch,
  // und die Karte soll stehen, bevor das Netzwerk geantwortet hat.
  //
  // Eigener localStorage-Schlüssel statt eines Feldes im State. Drei Gründe,
  // alle im Code belegt: loadFromLocalStorage() übernimmt keine unbekannten
  // Top-Level-Felder, exportConfig() und der Share-Codec bauen aus einer festen
  // Feldliste (ein Flag in design wanderte sonst mit jedem geteilten Link mit),
  // und das Zurücksetzen löscht STORAGE_KEY komplett — die Erklärkarte käme
  // dann bei jedem Reset zurück, obwohl der Dialog nur das Zurücksetzen der
  // Einstellungen verspricht.
  const INTRO_KEY = 'psa-templates-intro-seen';

  function introSuppressed() {
    // Wer über einen geteilten Link oder ein Preset kommt, will das Ergebnis
    // sehen und keine Erklärung. Das Fragment ist seit dem Wegfall des Backends
    // die einzige Share-Form — ?share= und /s/:id gibt es nicht mehr.
    if (window.location.hash.startsWith(SHARE_FRAGMENT_PREFIX)) return true;
    if (new URLSearchParams(window.location.search).has('preset')) return true;
    try {
      return localStorage.getItem(INTRO_KEY) === '1';
    } catch {
      // Kein localStorage (privater Modus, blockierte Speicherung): dann lieber
      // einmal zu viel erklären als eine Ausnahme werfen.
      return false;
    }
  }

  const introCard = document.getElementById('intro-card');
  if (introCard && !introSuppressed()) {
    introCard.classList.add('visible');
    const dismissIntro = () => {
      introCard.classList.remove('visible');
      try {
        localStorage.setItem(INTRO_KEY, '1');
      } catch {
        // Nicht speicherbar heißt: erscheint beim nächsten Besuch erneut.
        // Kein Grund, das Schließen scheitern zu lassen.
      }
    };
    document.getElementById('intro-card-dismiss').addEventListener('click', dismissIntro);
    document.addEventListener('keydown', function onIntroEscape(e) {
      if (e.key === 'Escape' && introCard.classList.contains('visible')) {
        dismissIntro();
        document.removeEventListener('keydown', onIntroEscape);
      }
    });
  }

  // ── Autotask-Zonen ──
  // Autotask übersetzt die Namen der Vorlagen-Variablen je Sprachversion, und
  // welche Sprache eine Instanz spricht, hängt an ihrer Zone: ww18 = Deutsch,
  // ww12 = Español, alle übrigen = Englisch. Eine Vorlage mit englischen Tokens
  // löst in einer deutschen Instanz nicht auf — die Variable steht dann im
  // Klartext in der Mail beim Kunden.
  // Quelle: psa.datto.com/help/DeveloperHelp/Content/APIs/General/API_Zones.htm
  // Die Regionsbezeichnung steht in den Locale-Dateien unter zone.<id>; hier
  // nur id und lang. lang steuert varLang() und damit die Variablennamen —
  // es hat nichts mit der Oberflächensprache zu tun.
  const AUTOTASK_ZONES = [
    { id: 'ww18', lang: 'de' },
    { id: 'prde', lang: 'de' },
    { id: 'ww3', lang: 'en' },
    { id: 'ww14', lang: 'en' },
    { id: 'ww22', lang: 'en' },
    { id: 'ww5', lang: 'en' },
    { id: 'ww15', lang: 'en' },
    { id: 'ww24', lang: 'en' },
    { id: 'ww25', lang: 'en' },
    { id: 'ww4', lang: 'en' },
    { id: 'ww16', lang: 'en' },
    { id: 'ww28', lang: 'en' },
    { id: 'ww6', lang: 'en' },
    { id: 'ww26', lang: 'en' },
    { id: 'ww29', lang: 'en' },
    { id: 'ww19', lang: 'en' },
    { id: 'ww1', lang: 'en' },
    { id: 'ww2', lang: 'en' },
    { id: 'ww11', lang: 'en' },
    { id: 'ww17', lang: 'en' },
    { id: 'ww12', lang: 'es' },
    { id: 'pres', lang: 'es' }
  ];

  const ZONE_LANG_LABELS = { de: 'Deutsch', en: 'English', es: 'Español' };

  function zoneById(id) {
    return AUTOTASK_ZONES.find(z => z.id === id) || AUTOTASK_ZONES[0];
  }

  // Spanische Zonen fallen auf Englisch zurück: spanische Vorlagentexte gibt
  // es nicht. Abgeleitet wird über .lang, nicht über Zonen-IDs — ww18 und prde
  // sind deutsch, ww12 und pres spanisch.
  function defaultTemplateLangForZone(zoneId) {
    return zoneById(zoneId).lang === 'de' ? 'de' : 'en';
  }

  // Die einzige Stelle, die entscheidet, welche Vorlagensprache eine Nutzlast
  // trägt — benutzt von detectTemplateLang(), migrateState() und darüber auch
  // von applyConfig(), damit die drei nicht auseinanderlaufen können.
  function resolveTemplateLangFor(design, varSchema) {
    const explicit = normalizeTemplateLang(design && design.templateLang);
    if (explicit) return explicit;
    // Jeder Stand vor VAR_SCHEMA 4 trägt deutsche Texte, unabhängig von seiner
    // Zone. Ihn über die Zone aufzulösen tauschte gespeicherte deutsche Texte
    // gegen englische Defaults. Die 4 steht bewusst als Literal: sie bezeichnet
    // genau diesen Migrationsschritt, nicht den jeweils aktuellen Stand.
    if ((varSchema || 0) < 4) return 'de';
    return defaultTemplateLangForZone(design && design.autotaskZone);
  }

  function templateLang() {
    return normalizeTemplateLang(state.design.templateLang) ||
      defaultTemplateLangForZone(state.design.autotaskZone);
  }

  // Roh-Vorablesen wie detectUiLang(), damit init() das Bundle im selben
  // Promise.all holen kann. Reine Optimierung: trifft es daneben, holt
  // applyLocaleDefaults() das richtige nach.
  function detectTemplateLang() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && saved.design) return resolveTemplateLangFor(saved.design, saved.varSchema);
    } catch {
      // Ein kaputter Stand darf die Sprachwahl nicht sprengen.
    }
    return defaultTemplateLangForZone(DEFAULT_DESIGN.autotaskZone);
  }

  function zoneUrlFor(zone) {
    return 'https://' + zone.id + '.autotask.net/Mvc/ServiceDesk/TicketDetail.mvc?ticketId={id}';
  }

  // Nur eine URL, die exakt aus einer Zone erzeugt wurde, darf beim Zonenwechsel
  // überschrieben werden — eine handgebaute bleibt dem Nutzer erhalten.
  function isGeneratedZoneUrl(url) {
    const trimmed = (url || '').trim();
    return AUTOTASK_ZONES.some(z => zoneUrlFor(z) === trimmed);
  }

  // ── PSA-Variablen ──
  // curated.json trägt die ~50 gebräuchlichen Variablen mit ihren Namen in allen
  // drei Sprachen und ist damit zugleich die Übersetzungstabelle. Die vollen
  // Kataloge (1.458 Variablen je Sprache) werden erst bei Bedarf nachgeladen.
  let curatedVars = null;
  const catalogs = Object.create(null);

  // Autotask-Variablen haben immer die Form [Satz: Feld]. Der Doppelpunkt grenzt
  // sie von Betreff-Präfixen wie [Queue] oder [Intern] ab, die keine Variablen
  // sind und beim Umschalten nicht angefasst werden dürfen.
  const VAR_TOKEN_RE = /\[([^\]]+)\]/g;

  function isVarToken(inner) {
    return inner.includes(': ');
  }

  // ── Confirm Modal cancel hook ──
  let _cancelModal = function () {};

  // ── Default Design System ──
  // Nur sprachneutrale Felder. Die zehn Platzhalter-Texte (Firmenname, Anschrift,
  // Rechtsangaben, Buttontexte) hängen an der Vorlagensprache und stehen in den
  // Locale-Dateien unter design.* — applyLocaleDefaults() setzt sie ein.
  const DEFAULT_DESIGN = {
    primaryColor: '#2c3e50',
    textColor: '#333333',
    accentColor: '#888888',
    logoUrl: '',
    logoEnabled: true,
    phone: '+49 30 123 456 789',
    web: 'https://www.example.com',
    certs: '',
    font: 'Arial,Helvetica,sans-serif',
    legalImprintUrl: 'https://www.example.com/impressum/',
    legalPrivacyUrl: 'https://www.example.com/datenschutz/',
    bookingUrl: '',
    bookingActive: false,
    portalUrl: '',
    autotaskZone: 'ww18',
    // Passend zur Default-Zone vorbelegt. Gespeicherte Stände überschreiben das,
    // eine leer gelassene URL bleibt also leer.
    autotaskUrl: zoneUrlFor(AUTOTASK_ZONES[0]),
    // Sprache der Bedienoberfläche. Liegt hier, damit saveToLocalStorage() sie
    // ohne Sonderweg mitschreibt — applyConfig() nimmt sie aber bewusst NICHT
    // aus einer geladenen Nutzlast, siehe dort.
    uiLang: DEFAULT_UI_LANG,
    // null heißt „folgt der Zone". Der Umschalter setzt hier eine feste Sprache;
    // ab dann bleibt sie auch über einen Zonenwechsel hinweg stehen.
    templateLang: null
  };

  const DESIGN_TEXT_KEYS = [
    'company', 'claim', 'address', 'legalCeo', 'legalCourt', 'legalRegNr',
    'legalVatId', 'bookingText', 'portalText', 'autotaskLinkText'
  ];

  function designTextDefaults(lang) {
    const out = {};
    for (const key of DESIGN_TEXT_KEYS) out[key] = ttIn('design.' + key, lang);
    return out;
  }

  // ── Style Definitions ──
  const STYLES = [
    { id: 'modern-card', name: 'Modern Card' },
    { id: 'clean-minimal', name: 'Clean Minimal' },
    { id: 'corporate-classic', name: 'Corporate Classic' },
    { id: 'internal-minimal', name: 'Internal Minimal' }
  ];

  // ── Icon Badge ──
  // Unicode statt SVG: eingebettetes <svg> rendert nur Apple Mail,
  // Outlook (Word-Engine) und Gmail zeigen nichts.
  //
  // Das Zeichen muss innerhalb der BMP liegen (U+0000–U+FFFF). Auf dem Weg in
  // die Autotask-Vorlage werden UTF-16-Surrogatpaare zerlegt und jede Hälfte
  // durch „?" ersetzt — die frühere Glühbirne U+1F4A1 kam beim Empfänger als
  // „??" an, während Umlaute und der Gedankenstrich U+2014 sauber durchliefen.
  // ⚡ U+26A1 ist BMP und hat von Haus aus Emoji-Darstellung.
  const DEFAULT_BADGE_GLYPH = '⚡';
  const LEGACY_BADGE_GLYPH = '\u{1F4A1}';

  // ── Notification Types ──
  // Betreff, Vorschautext und Einleitung der Vorlage internal-notification
  // hängen am Typ, nicht an der Vorlage — sie stehen unter notify.* in den
  // Locale-Dateien.
  const NOTIFICATION_TYPES = ['queue', 'assigned', 'sla'];

  function notificationType(type) {
    return NOTIFICATION_TYPES.includes(type) ? type : 'queue';
  }

  // ── Materialisierung ──
  // Locale-Texte tragen Variablen als {{kuratierter.schlüssel}}. Erst hier
  // entsteht daraus der Token der Zonensprache — deshalb darf in keiner
  // Locale-Datei ein fertiges [Satz: Feld] stehen.
  const TOKEN_PLACEHOLDER_RE = /\{\{([^}]+)\}\}/g;

  function materializeTokens(text, tokenLang) {
    // Unbekannter Schlüssel bleibt als {{…}} sichtbar stehen, statt still zu
    // verschwinden — in der Vorschau fällt das sofort auf.
    return String(text || '').replace(TOKEN_PLACEHOLDER_RE, (whole, key) =>
      curatedList().some(v => v.key === key) ? tokenIn(key, tokenLang) : whole);
  }

  function notificationDefaults(type, tplLang, tokenLang) {
    const lang = tplLang || templateLang();
    const tok = tokenLang || varLang();
    const nt = notificationType(type);
    return {
      subjectPrefix: ttIn('notify.' + nt + '.subjectPrefix', lang),
      previewText: materializeTokens(ttIn('notify.' + nt + '.previewText', lang), tok),
      intro: materializeTokens(ttIn('notify.' + nt + '.intro', lang), tok)
    };
  }

  function buildNotificationSubject(type, tplLang, tokenLang) {
    const lang = tplLang || templateLang();
    const tok = tokenLang || varLang();
    const pattern = ttIn('notify.subjectPattern', lang);
    const prefix = ttIn('notify.' + notificationType(type) + '.subjectPrefix', lang);
    return materializeTokens(pattern.split('{prefix}').join(prefix), tok);
  }

  // ── Template Structure ──
  // Nur Struktur: alle Texte liegen unter tpl.<id>.* in den Locale-Dateien und
  // kommen über defaultTemplates() dazu.
  const TEMPLATE_TEXT_FIELDS = [
    'previewTextVar', 'messageBodyVar', 'ctaText', 'ctaLink', 'footerText',
    'customHeading', 'customIntro'
  ];

  // Vorlagen mit eigenen Vorschau-Beispielen: die globalen Beispiele aus
  // curated.json passen dort nicht. Nicht nutzer-editierbar.
  const PREVIEW_EXAMPLE_KEYS = {
    'ticket-feedback-internal': ['ticket.noteTitle', 'ticket.noteDescription']
  };

  const TEMPLATE_SPECS = [
    {
      id: 'ticket-note',
      audience: 'customer',
      sections: {
        previewText: true, header: true, ticketInfo: true, messageBody: true,
        ctaButton: true, bookingButton: false, kundenportal: false,
        signature: true, footer: true, legalFooter: true
      }
    },
    {
      id: 'ticket-accepted',
      audience: 'customer',
      sections: {
        previewText: true, header: true, ticketInfo: true, messageBody: true,
        ctaButton: true, bookingButton: false, kundenportal: false,
        signature: true, footer: true, legalFooter: true
      }
    },
    {
      id: 'ticket-confirmation',
      audience: 'customer',
      sections: {
        previewText: true, header: true, ticketInfo: true, messageBody: true,
        ctaButton: true, bookingButton: false, kundenportal: false,
        signature: false, footer: true, legalFooter: true
      }
    },
    {
      id: 'ticket-closed',
      audience: 'customer',
      sections: {
        previewText: true, header: true, ticketInfo: true, messageBody: true,
        ctaButton: true, bookingButton: false, kundenportal: false,
        signature: true, footer: true, legalFooter: true
      }
    },
    {
      id: 'ticket-escalated',
      audience: 'customer',
      sections: {
        previewText: true, header: true, ticketInfo: true, messageBody: true,
        ctaButton: true, bookingButton: false, kundenportal: false,
        signature: true, footer: true, legalFooter: true
      }
    },
    {
      id: 'ticket-feedback-request',
      audience: 'customer',
      sections: {
        previewText: true, header: true, ticketInfo: true, messageBody: true,
        ctaButton: true, bookingButton: false, kundenportal: false,
        signature: true, footer: true, legalFooter: true
      }
    },
    {
      id: 'sla-warning',
      audience: 'customer',
      sections: {
        previewText: true, header: true, ticketInfo: true, messageBody: true,
        ctaButton: true, bookingButton: false, kundenportal: false,
        signature: true, footer: true, legalFooter: true
      }
    },
    {
      id: 'ticket-handover',
      audience: 'internal',
      headerColorOverride: '#4a4a4a',
      sections: {
        previewText: true, header: true, ticketInfo: true, messageBody: true,
        ctaButton: false, bookingButton: false, kundenportal: false,
        signature: true, footer: true, legalFooter: false
      }
    },
    {
      id: 'ticket-survey',
      audience: 'customer',
      sections: {
        previewText: true, header: true, ticketInfo: true, messageBody: true,
        ctaButton: true, bookingButton: false, kundenportal: false,
        signature: false, footer: true, legalFooter: true
      }
    },
    {
      id: 'ticket-booking',
      audience: 'customer',
      sections: {
        previewText: true, header: true, ticketInfo: true, messageBody: true,
        ctaButton: false, bookingButton: true, kundenportal: false,
        signature: true, footer: true, legalFooter: true
      }
    },
    {
      id: 'internal-notification',
      audience: 'internal',
      notificationType: 'queue',
      sections: {
        previewText: true, header: false, ticketInfo: false, messageBody: true,
        ctaButton: true, bookingButton: false, kundenportal: false,
        signature: false, footer: false, legalFooter: false
      }
    },
    {
      id: 'ticket-feedback-internal',
      audience: 'internal',
      headerColorOverride: '#4a4a4a',
      badgeGlyph: DEFAULT_BADGE_GLYPH,
      sections: {
        previewText: true, header: true, ticketInfo: true, iconBadge: true,
        messageBody: true, ctaButton: false, bookingButton: false,
        kundenportal: false, signature: true, footer: true, legalFooter: false
      }
    }
  ];

  const SPEC_BY_ID = new Map(TEMPLATE_SPECS.map(spec => [spec.id, spec]));

  function previewExamplesFor(id, lang) {
    const keys = PREVIEW_EXAMPLE_KEYS[id];
    if (!keys) return undefined;
    const examples = {};
    for (const key of keys) {
      examples[key] = ttIn('tpl.' + id + '.previewExample.' + key, lang);
    }
    return examples;
  }

  // Baut die 12 Vorlagen aus Struktur + Locale. Gibt null zurück, wenn das
  // Bundle der Vorlagensprache fehlt: zwölf Vorlagen aus lauter leeren Feldern
  // landeten sonst in localStorage und überlebten den Netzwerkfehler.
  function defaultTemplates(tplLang, tokenLang) {
    const lang = tplLang || templateLang();
    const tok = tokenLang || varLang();
    if (!locales[lang]) return null;

    return TEMPLATE_SPECS.map(spec => {
      const text = (field) => materializeTokens(ttIn('tpl.' + spec.id + '.' + field, lang), tok);

      const config = {};
      for (const field of TEMPLATE_TEXT_FIELDS) config[field] = text(field);
      config.headerColorOverride = spec.headerColorOverride || '';
      if (spec.badgeGlyph) config.badgeGlyph = spec.badgeGlyph;

      let subject = text('subject');
      if (spec.notificationType) {
        const defaults = notificationDefaults(spec.notificationType, lang, tok);
        config.notificationType = spec.notificationType;
        config.previewTextVar = defaults.previewText;
        config.customIntro = defaults.intro;
        subject = buildNotificationSubject(spec.notificationType, lang, tok);
      }

      return {
        id: spec.id,
        name: ttIn('tpl.' + spec.id + '.name', lang),
        audience: spec.audience,
        subject: subject,
        previewExamples: previewExamplesFor(spec.id, lang),
        sections: { ...spec.sections },
        config: config
      };
    });
  }

  // ── Default-Erkennung ──
  // Beim Sprachwechsel und beim Wechsel des Benachrichtigungstyps darf nur
  // überschrieben werden, was noch einen bekannten Default trägt. Verglichen
  // wird gegen alle Kombinationen aus Vorlagen- und Zonensprache: ein Stand
  // kann in einer anderen Zone angelegt worden sein, und retokenizeTemplates()
  // lässt Tokens stehen, die es nicht kennt.
  const TOKEN_LANGS = ['de', 'en', 'es'];

  function forEachLangPair(fn) {
    for (const tplLang of TEMPLATE_LANGS) {
      if (!locales[tplLang]) continue;
      for (const tokenLang of TOKEN_LANGS) fn(tplLang, tokenLang);
    }
  }

  function addCandidate(bucket, field, value) {
    if (!bucket[field]) bucket[field] = new Set();
    bucket[field].add(value);
  }

  function isDefaultNotificationValue(field, value) {
    let found = false;
    forEachLangPair((tplLang, tokenLang) => {
      if (found) return;
      for (const type of NOTIFICATION_TYPES) {
        const candidate = field === 'subject'
          ? buildNotificationSubject(type, tplLang, tokenLang)
          : notificationDefaults(type, tplLang, tokenLang)[field];
        if (candidate === value) found = true;
      }
    });
    return found;
  }

  // id → { feld → Set bekannter Default-Werte }
  function defaultTemplateCandidates() {
    const byId = new Map();
    forEachLangPair((tplLang, tokenLang) => {
      const defaults = defaultTemplates(tplLang, tokenLang);
      if (!defaults) return;
      for (const def of defaults) {
        let bucket = byId.get(def.id);
        if (!bucket) {
          bucket = Object.create(null);
          byId.set(def.id, bucket);
        }
        addCandidate(bucket, 'name', def.name);
        addCandidate(bucket, 'subject', def.subject);
        for (const field of TEMPLATE_TEXT_FIELDS) {
          addCandidate(bucket, field, def.config[field]);
        }
        // Die Benachrichtigungsvorlage kennt drei Ausprägungen; defaultTemplates()
        // liefert nur die aktive.
        if (def.config.notificationType) {
          for (const type of NOTIFICATION_TYPES) {
            const notify = notificationDefaults(type, tplLang, tokenLang);
            addCandidate(bucket, 'subject', buildNotificationSubject(type, tplLang, tokenLang));
            addCandidate(bucket, 'previewTextVar', notify.previewText);
            addCandidate(bucket, 'customIntro', notify.intro);
          }
        }
      }
    });
    return byId;
  }

  // feld → Set bekannter Platzhalterwerte über alle Vorlagensprachen
  function designTextCandidates() {
    const bucket = Object.create(null);
    for (const lang of TEMPLATE_LANGS) {
      if (!locales[lang]) continue;
      const texts = designTextDefaults(lang);
      for (const key of DESIGN_TEXT_KEYS) addCandidate(bucket, key, texts[key]);
    }
    return bucket;
  }

  // Versionsstand der gespeicherten Reparaturen:
  //   2 — Variablen-Tokens auf die Sprache der Zone normalisiert
  //   3 — Badge-Zeichen von der Glühbirne auf ein BMP-Emoji umgestellt
  //   4 — Vorlagensprache eingeführt
  const VAR_SCHEMA = 4;

  // ── App State ──
  let state = {
    design: { ...DEFAULT_DESIGN },
    // Leer, weil die Vorlagen aus den Locale-Dateien entstehen und die noch
    // nicht geladen sind. applyLocaleDefaults() füllt sie in init().
    templates: [],
    // Eine frische Sitzung ist per Definition auf dem aktuellen Stand. Ohne das
    // exportierten Export und Share-Link varSchema: undefined, und der Empfänger
    // ließe alle Migrationen erneut über eine bereits aktuelle Konfiguration laufen.
    varSchema: VAR_SCHEMA,
    activeTemplateId: 'ticket-note',
    activeStyle: 'modern-card'
  };

  // ── Section Definitions ──
  // key ist Teil des gespeicherten States und darf sich nicht ändern; die
  // Beschriftung kommt zur Laufzeit aus der Locale.
  const SECTIONS = [
    { key: 'previewText', hasTooltip: true },
    { key: 'header' },
    { key: 'ticketInfo' },
    { key: 'iconBadge' },
    { key: 'messageBody' },
    { key: 'ctaButton' },
    { key: 'bookingButton' },
    { key: 'kundenportal' },
    { key: 'signature' },
    { key: 'footer' },
    { key: 'legalFooter' }
  ];

  // ── Helpers ──
  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return document.querySelectorAll(sel); }

  function getActiveTemplate() {
    return state.templates.find(t => t.id === state.activeTemplateId);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function showToast(msg) {
    const toast = $('#toast');
    toast.textContent = msg;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 2500);
  }

  function validateAutotaskUrl(url) {
    if (!url || !url.trim()) return { ok: true, sanitized: '', warn: null };
    const trimmed = url.trim();
    if (!/^https?:\/\//i.test(trimmed)) return { ok: false, sanitized: '', warn: 'bad-protocol' };
    if (!trimmed.includes('{id}')) return { ok: true, sanitized: trimmed, warn: 'missing-id' };
    return { ok: true, sanitized: trimmed, warn: null };
  }

  function getLogoHtml(design, width, tagStyle) {
    if (design.logoEnabled === false) return '';
    const src = design.logoUrl || '/logo-default.svg';
    return `<img src="${src}" width="${width}" alt="${design.company}" style="${tagStyle || 'display:block;'}" />`;
  }

  // ── Variablen-Auflösung ──
  function getZone() {
    return zoneById(state.design.autotaskZone);
  }

  function varLang() {
    return getZone().lang;
  }

  function curatedList() {
    if (!curatedVars) return [];
    return curatedVars.categories.reduce((all, cat) => all.concat(cat.variables), []);
  }

  function tokenIn(key, lang) {
    const v = curatedList().find(x => x.key === key);
    // Der Fallback ist bewusst auffällig: ohne curated.json ist die Ausgabe
    // ohnehin unbrauchbar, dann soll man es sehen statt eine leere Stelle.
    return v && v.name[lang] ? '[' + v.name[lang] + ']' : '[' + key + ']';
  }

  function tokenFor(key) {
    return tokenIn(key, varLang());
  }

  function exampleFor(key) {
    const v = curatedList().find(x => x.key === key);
    return v ? v.example : '';
  }

  // ── Build variable lookup map ──
  function buildVarMap() {
    const map = {};
    const lang = varLang();
    for (const v of curatedList()) {
      if (v.name[lang]) map['[' + v.name[lang] + ']'] = v.example;
    }
    return map;
  }

  async function ensureCatalog(lang) {
    if (catalogs[lang]) return catalogs[lang];
    try {
      const resp = await fetch('/psa/autotask/catalog.' + lang + '.json');
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      catalogs[lang] = await resp.json();
      return catalogs[lang];
    } catch (e) {
      console.error('Could not load PSA catalog:', e);
      return null;
    }
  }

  // overrides: vorlagenspezifische Beispielwerte für die Vorschau, adressiert
  // über den kuratierten Schlüssel. Nötig, weil dieselbe Variable je nach
  // Vorlage etwas anderes trägt — die Notizbeschreibung ist mal die Arbeitsnotiz,
  // mal das Feedback an den Bearbeiter. Der Schlüssel statt des Tokens, damit die
  // Überschreibung einen Sprachwechsel überlebt.
  function replaceVarsWithExamples(text, overrides) {
    const map = buildVarMap();
    if (overrides) {
      for (const key of Object.keys(overrides)) {
        map[tokenFor(key)] = overrides[key];
      }
    }
    return text.replace(VAR_TOKEN_RE, (match) => (
      map[match] !== undefined ? map[match] : match
    ));
  }

  // ── Tokens sprachweise umschreiben ──
  function buildTranslationMap(fromLang, toLang) {
    const map = {};
    for (const v of curatedList()) {
      const from = v.name[fromLang];
      const to = v.name[toLang];
      if (from && to && from !== to) map['[' + from + ']'] = '[' + to + ']';
    }
    return map;
  }

  // Läuft über alle Strings einer Struktur und ersetzt ausschließlich exakte
  // Treffer aus map — keine Muster, keine Teilstrings. stats zählt mit, was
  // ersetzt wurde und welche Variablen-Tokens unbekannt geblieben sind.
  function replaceTokensDeep(node, map, known, stats) {
    if (typeof node === 'string') {
      return node.replace(VAR_TOKEN_RE, (match, inner) => {
        if (map[match] !== undefined) {
          if (stats) stats.replaced++;
          return map[match];
        }
        if (stats && isVarToken(inner) && known && !known.has(match)) {
          stats.unknown.add(match);
        }
        return match;
      });
    }
    if (Array.isArray(node)) {
      return node.map(item => replaceTokensDeep(item, map, known, stats));
    }
    if (node && typeof node === 'object') {
      for (const key of Object.keys(node)) {
        node[key] = replaceTokensDeep(node[key], map, known, stats);
      }
      return node;
    }
    return node;
  }

  function retokenizeTemplates(fromLang, toLang) {
    const map = buildTranslationMap(fromLang, toLang);
    const known = new Set(
      curatedList().map(v => v.name[fromLang]).filter(Boolean).map(n => '[' + n + ']')
    );
    const stats = { replaced: 0, unknown: new Set() };
    state.templates = replaceTokensDeep(state.templates, map, known, stats);
    return { replaced: stats.replaced, unknown: stats.unknown.size };
  }

  // ── Extract domain from URL ──
  function getDomain(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, 'www.');
    } catch {
      return url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    }
  }

  // ── Generate Email HTML — shared content sections ──
  function generateContentRows(template, design, useExampleData, style) {
    const d = design;
    const t = template;
    const s = t.sections;
    const c = t.config;
    const r = useExampleData ? (v) => replaceVarsWithExamples(v, template.previewExamples) : (v) => v;
    const font = d.font;
    let html = '';

    // Ticket Info Bar
    if (s.ticketInfo) {
      if (style === 'clean-minimal') {
        html += `        <!-- TICKET INFO BAR -->\n`;
        html += `        <tr>\n`;
        html += `          <td style="padding:14px 30px 14px 30px;">\n`;
        html += `            <table width="100%" cellpadding="0" cellspacing="0" border="0">\n`;
        html += `              <tr>\n`;
        html += `                <td style="font-size:16px;color:${d.textColor};font-weight:bold;font-family:${font};">\n`;
        html += `                  ${r(tokenFor('ticket.title'))}\n`;
        html += `                </td>\n`;
        html += `              </tr>\n`;
        html += `              <tr>\n`;
        html += `                <td style="font-size:12px;color:${d.accentColor};padding-top:4px;font-family:${font};">\n`;
        html += `                  Ticket ${r(tokenFor('ticket.number'))} &nbsp;|&nbsp; ${tt('out.status')} ${r(tokenFor('ticket.status'))} &nbsp;|&nbsp; ${tt('out.priorityHtml')} ${r(tokenFor('ticket.priority'))}\n`;
        html += `                </td>\n`;
        html += `              </tr>\n`;
        html += `            </table>\n`;
        html += `          </td>\n`;
        html += `        </tr>\n`;
        html += `        <tr><td style="padding:0 30px;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid #e0e0e0;"></td></tr></table></td></tr>\n\n`;
      } else {
        html += `        <!-- TICKET INFO BAR -->\n`;
        html += `        <tr>\n`;
        html += `          <td style="background-color:#f9f9f9;padding:14px 30px;border-bottom:1px solid #e8e8e8;">\n`;
        html += `            <table width="100%" cellpadding="0" cellspacing="0" border="0">\n`;
        html += `              <tr>\n`;
        html += `                <td style="font-size:16px;color:${d.textColor};font-weight:bold;font-family:${font};">\n`;
        html += `                  ${r(tokenFor('ticket.title'))}\n`;
        html += `                </td>\n`;
        html += `              </tr>\n`;
        html += `              <tr>\n`;
        html += `                <td style="font-size:12px;color:${d.accentColor};padding-top:4px;font-family:${font};">\n`;
        html += `                  Ticket ${r(tokenFor('ticket.number'))} &nbsp;|&nbsp; ${tt('out.status')} ${r(tokenFor('ticket.status'))} &nbsp;|&nbsp; ${tt('out.priorityHtml')} ${r(tokenFor('ticket.priority'))}\n`;
        html += `                </td>\n`;
        html += `              </tr>\n`;
        html += `            </table>\n`;
        html += `          </td>\n`;
        html += `        </tr>\n\n`;
      }
    }

    // Icon Badge
    // Tabelle statt div und line-height als Zellhöhe, damit die Word-Engine
    // das Badge zentriert. border-radius ignoriert Outlook — dort ein Quadrat.
    if (s.iconBadge) {
      const glyph = escapeHtml(c.badgeGlyph || DEFAULT_BADGE_GLYPH);
      const emojiFont = `'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif`;
      html += `        <!-- ICON BADGE -->\n`;
      html += `        <tr>\n`;
      html += `          <td style="padding:28px 30px 0 30px;" align="center">\n`;
      html += `            <table cellpadding="0" cellspacing="0" border="0">\n`;
      html += `              <tr>\n`;
      html += `                <td width="56" height="56" align="center" valign="middle" style="width:56px;height:56px;background-color:#f4f4f4;border:1px solid #e8e8e8;border-radius:28px;font-size:28px;line-height:56px;mso-line-height-rule:exactly;font-family:${emojiFont};">${glyph}</td>\n`;
      html += `              </tr>\n`;
      html += `            </table>\n`;
      html += `          </td>\n`;
      html += `        </tr>\n\n`;
    }

    // Message Body
    if (s.messageBody) {
      html += `        <!-- MESSAGE BODY -->\n`;
      html += `        <tr>\n`;
      html += `          <td style="padding:28px 30px;font-size:14px;color:${d.textColor};line-height:1.6;font-family:${font};">\n`;

      if (c.customHeading) {
        html += `            <p style="font-size:18px;font-weight:bold;color:${d.textColor};margin:0 0 16px 0;">${r(c.customHeading)}</p>\n`;
      }
      if (c.customIntro) {
        const introLines = r(c.customIntro).split('\n');
        for (const line of introLines) {
          if (line.trim() === '') {
            html += `            <br />\n`;
          } else {
            html += `            ${line}<br />\n`;
          }
        }
      }
      if (c.messageBodyVar) {
        if (c.customIntro) html += `            <br />\n`;
        html += `            ${r(c.messageBodyVar)}\n`;
      }

      html += `          </td>\n`;
      html += `        </tr>\n\n`;
    }

    // CTA Button
    if (s.ctaButton) {
      html += `        <!-- CTA BUTTON -->\n`;
      html += `        <tr>\n`;
      html += `          <td style="padding:0 30px 28px 30px;" align="center">\n`;
      html += `            <table cellpadding="0" cellspacing="0" border="0">\n`;
      html += `              <tr>\n`;
      html += `                <td style="background-color:${d.primaryColor};border-radius:4px;padding:12px 28px;">\n`;
      const href = useExampleData ? '#' : c.ctaLink;
      html += `                  <a href="${href}" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;font-family:${font};display:inline-block;">\n`;
      html += `                    ${r(c.ctaText)}\n`;
      html += `                  </a>\n`;
      html += `                </td>\n`;
      html += `              </tr>\n`;
      html += `            </table>\n`;
      html += `          </td>\n`;
      html += `        </tr>\n\n`;
    }

    // Booking Button
    if (s.bookingButton && d.bookingUrl) {
      const bookingHref = useExampleData ? '#' : d.bookingUrl;
      const isPrimary = !s.ctaButton;
      html += `        <!-- BOOKING BUTTON -->\n`;
      html += `        <tr>\n`;
      html += `          <td style="padding:0 30px ${isPrimary ? '12px' : '28px'} 30px;" align="center">\n`;
      html += `            <table cellpadding="0" cellspacing="0" border="0">\n`;
      html += `              <tr>\n`;
      if (isPrimary) {
        html += `                <td style="background-color:${d.primaryColor};border-radius:4px;padding:12px 28px;">\n`;
        html += `                  <a href="${bookingHref}" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;font-family:${font};display:inline-block;">\n`;
      } else {
        html += `                <td style="border:2px solid ${d.primaryColor};border-radius:4px;padding:10px 24px;">\n`;
        html += `                  <a href="${bookingHref}" style="color:${d.primaryColor};text-decoration:none;font-size:14px;font-weight:bold;font-family:${font};display:inline-block;">\n`;
      }
      html += `                    ${escapeHtml(d.bookingText)}\n`;
      html += `                  </a>\n`;
      html += `                </td>\n`;
      html += `              </tr>\n`;
      html += `            </table>\n`;
      html += `          </td>\n`;
      html += `        </tr>\n`;
      // Secondary portal link when booking is the primary action
      if (isPrimary && c.ctaLink) {
        const portalHref = useExampleData ? '#' : c.ctaLink;
        html += `        <tr>\n`;
        html += `          <td style="padding:4px 30px 28px 30px;" align="center">\n`;
        html += `            <a href="${portalHref}" style="color:${d.accentColor};text-decoration:underline;font-size:12px;font-family:${font};">\n`;
        html += `              ${r(c.ctaText || tt('out.ctaFallback'))}\n`;
        html += `            </a>\n`;
        html += `          </td>\n`;
        html += `        </tr>\n`;
      }
      html += `\n`;
    }

    // Kundenportal
    if (s.kundenportal && d.portalUrl) {
      const portalHref = useExampleData ? '#' : d.portalUrl;
      html += `        <!-- KUNDENPORTAL -->\n`;
      html += `        <tr>\n`;
      html += `          <td style="padding:0 30px 28px 30px;">\n`;
      html += `            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9f9f9;border-radius:4px;">\n`;
      html += `              <tr>\n`;
      html += `                <td style="padding:16px 20px;text-align:center;font-family:${font};">\n`;
      html += `                  <p style="margin:0 0 10px 0;font-size:13px;color:${d.textColor};">${tt('out.portalIntro')}</p>\n`;
      html += `                  <a href="${portalHref}" style="color:${d.primaryColor};text-decoration:none;font-size:14px;font-weight:bold;font-family:${font};">\n`;
      html += `                    ${escapeHtml(d.portalText)}&nbsp;&rarr;\n`;
      html += `                  </a>\n`;
      html += `                </td>\n`;
      html += `              </tr>\n`;
      html += `            </table>\n`;
      html += `          </td>\n`;
      html += `        </tr>\n\n`;
    }

    return html;
  }

  // ── Generate signature HTML ──
  function generateSignatureHtml(template, design, useExampleData, style) {
    const d = design;
    const s = template.sections;
    const r = useExampleData ? (v) => replaceVarsWithExamples(v, template.previewExamples) : (v) => v;
    const font = d.font;
    let html = '';

    if (!s.signature) return html;

    if (style === 'clean-minimal') {
      // Clean Minimal: simple line + compact signature
      html += `        <!-- DIVIDER -->\n`;
      html += `        <tr>\n`;
      html += `          <td style="padding:0 30px;">\n`;
      html += `            <table width="100%" cellpadding="0" cellspacing="0" border="0">\n`;
      html += `              <tr><td style="border-top:1px solid #e0e0e0;"></td></tr>\n`;
      html += `            </table>\n`;
      html += `          </td>\n`;
      html += `        </tr>\n\n`;
      html += `        <!-- SIGNATURE -->\n`;
      html += `        <tr>\n`;
      html += `          <td style="padding:20px 30px 24px 30px;">\n`;
      html += `            <table cellpadding="0" cellspacing="0" border="0" style="font-family:${font};font-size:13px;color:${d.textColor};line-height:1.5;">\n`;
      html += `              <tr>\n`;
      html += `                <td style="vertical-align:top;">\n`;
      html += `                  <strong style="font-size:14px;color:${d.textColor};">${r(tokenFor('misc.initiatingResourceName'))}</strong><br />\n`;
      html += `                  <span style="font-size:13px;color:${d.primaryColor};">${d.company}</span> &middot; <span style="font-size:11px;color:${d.accentColor};font-style:italic;">${d.claim}</span><br />\n`;
      html += `                  <span style="font-size:12px;">${d.address} &middot; ${d.phone}</span><br />\n`;
      html += `                  <span style="font-size:12px;">${tt('out.web')} <a href="${d.web}" style="color:${d.primaryColor};text-decoration:none;">${getDomain(d.web)}</a></span>\n`;
      html += `                </td>\n`;
      html += `              </tr>\n`;
      html += `            </table>\n`;
      html += `          </td>\n`;
      html += `        </tr>\n\n`;
    } else {
      // Modern Card & Corporate Classic: logo with accent border
      html += `        <!-- DIVIDER -->\n`;
      html += `        <tr>\n`;
      html += `          <td style="padding:0 30px;">\n`;
      html += `            <table width="100%" cellpadding="0" cellspacing="0" border="0">\n`;
      html += `              <tr><td style="border-top:1px solid #e8e8e8;"></td></tr>\n`;
      html += `            </table>\n`;
      html += `          </td>\n`;
      html += `        </tr>\n\n`;
      html += `        <!-- SIGNATURE -->\n`;
      html += `        <tr>\n`;
      html += `          <td style="padding:24px 30px 28px 30px;">\n`;
      html += `            <table cellpadding="0" cellspacing="0" border="0" style="font-family:${font};font-size:13px;color:${d.textColor};line-height:1.4;">\n`;
      html += `              <tr>\n`;
      html += `                <td style="padding-right:15px;border-right:2px solid ${d.primaryColor};vertical-align:top;">\n`;
      html += `                  ${getLogoHtml(d, 120)}\n`;
      html += `                </td>\n`;
      html += `                <td style="padding-left:15px;vertical-align:top;">\n`;
      html += `                  <strong style="font-size:14px;color:${d.textColor};">${r(tokenFor('misc.initiatingResourceName'))}</strong><br />\n`;
      html += `                  <strong style="font-size:13px;color:${d.primaryColor};">${d.company}</strong><br />\n`;
      html += `                  <span style="font-size:11px;color:${d.accentColor};font-style:italic;">${d.claim}</span><br />\n`;
      html += `                  <br />\n`;
      html += `                  <span style="font-size:12px;">${d.address}</span><br />\n`;
      html += `                  <span style="font-size:12px;">${tt('out.tel')} ${d.phone}</span><br />\n`;
      html += `                  <span style="font-size:12px;">${tt('out.web')} <a href="${d.web}" style="color:${d.primaryColor};text-decoration:none;">${getDomain(d.web)}</a></span><br />\n`;
      html += `                  <br />\n`;
      html += `                  <span style="font-size:10px;color:${d.accentColor};">${d.certs}</span>\n`;
      html += `                </td>\n`;
      html += `              </tr>\n`;
      html += `            </table>\n`;
      html += `          </td>\n`;
      html += `        </tr>\n\n`;
    }

    return html;
  }

  // ── Generate Legal Footer HTML ──
  function generateLegalFooterHtml(template, design, style) {
    if (template.audience === 'internal') return '';
    const s = template.sections;
    if (!s.legalFooter) return '';

    const d = design;
    const font = d.font;
    let html = '';

    const line1 = `${d.company} | ${tt('out.ceo')} ${d.legalCeo} | ${d.legalCourt}, ${d.legalRegNr} | ${tt('out.vatId')} ${d.legalVatId}`;

    if (style === 'corporate-classic') {
      html += `        <!-- LEGAL FOOTER -->\n`;
      html += `        <tr>\n`;
      html += `          <td style="background-color:#2c2c2c;padding:10px 30px 14px 30px;text-align:center;font-size:10px;color:#aaaaaa;font-family:${font};line-height:1.6;">\n`;
      html += `            ${line1}<br />\n`;
      html += `            <a href="${d.legalImprintUrl}" style="color:#aaaaaa;text-decoration:underline;">${tt('out.imprint')}</a> &middot; <a href="${d.legalPrivacyUrl}" style="color:#aaaaaa;text-decoration:underline;">${tt('out.privacy')}</a>\n`;
      html += `          </td>\n`;
      html += `        </tr>\n\n`;
    } else {
      html += `        <!-- LEGAL FOOTER -->\n`;
      html += `        <tr>\n`;
      html += `          <td style="padding:10px 30px 14px 30px;text-align:center;font-size:10px;color:#aaaaaa;font-family:${font};line-height:1.6;">\n`;
      html += `            ${line1}<br />\n`;
      html += `            <a href="${d.legalImprintUrl}" style="color:#aaaaaa;text-decoration:underline;">${tt('out.imprint')}</a> &middot; <a href="${d.legalPrivacyUrl}" style="color:#aaaaaa;text-decoration:underline;">${tt('out.privacy')}</a>\n`;
      html += `          </td>\n`;
      html += `        </tr>\n\n`;
    }

    return html;
  }

  // ── Generate Email HTML ──
  function generateEmailHtml(template, design, useExampleData) {
    const style = state.activeStyle;
    const d = design;
    const t = template;
    const s = t.sections;
    const c = t.config;
    const r = useExampleData ? (v) => replaceVarsWithExamples(v, template.previewExamples) : (v) => v;
    const font = d.font;
    const headerColor = c.headerColorOverride || d.primaryColor;

    let html = '';

    // Preview Text (same for all styles)
    if (s.previewText) {
      html += `<div style="display:none;font-size:1px;color:#f4f4f4;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">\n  ${r(c.previewTextVar)}\n</div>\n\n`;
    }

    // ── Style: Modern Card ──
    if (style === 'modern-card') {
      html += `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f4;padding:20px 0;">\n  <tr>\n    <td align="center">\n      <table width="620" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:4px;overflow:hidden;font-family:${font};">\n\n`;

      // Header
      if (s.header) {
        html += `        <!-- HEADER BAR -->\n`;
        html += `        <tr>\n`;
        html += `          <td style="background-color:${headerColor};padding:16px 30px;">\n`;
        html += `            <table width="100%" cellpadding="0" cellspacing="0" border="0">\n`;
        html += `              <tr>\n`;
        html += `                <td style="vertical-align:middle;">\n`;
        html += `                  ${getLogoHtml(d, 130)}\n`;
        html += `                </td>\n`;
        html += `                <td align="right" style="vertical-align:middle;color:#ffffff;font-size:13px;font-family:${font};">\n`;
        html += `                  ${d.company}\n`;
        html += `                </td>\n`;
        html += `              </tr>\n`;
        html += `            </table>\n`;
        html += `          </td>\n`;
        html += `        </tr>\n\n`;
      }

      html += generateContentRows(template, design, useExampleData, style);
      html += generateSignatureHtml(template, design, useExampleData, style);

      // Footer
      if (s.footer) {
        html += `        <!-- FOOTER -->\n`;
        html += `        <tr>\n`;
        html += `          <td style="background-color:#f4f4f4;padding:14px 30px;text-align:center;font-size:11px;color:#aaaaaa;font-family:${font};border-top:1px solid #e8e8e8;">\n`;
        html += `            ${r(c.footerText)}\n`;
        html += `          </td>\n`;
        html += `        </tr>\n\n`;
      }

      html += generateLegalFooterHtml(template, design, style);
      html += `      </table>\n    </td>\n  </tr>\n</table>`;
    }

    // ── Style: Clean Minimal ──
    else if (style === 'clean-minimal') {
      html += `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:20px 0;">\n  <tr>\n    <td align="center">\n      <table width="620" cellpadding="0" cellspacing="0" border="0" style="font-family:${font};">\n\n`;

      // Header: logo + company, then subtle line
      if (s.header) {
        html += `        <!-- HEADER -->\n`;
        html += `        <tr>\n`;
        html += `          <td style="padding:20px 30px 16px 30px;">\n`;
        html += `            <table width="100%" cellpadding="0" cellspacing="0" border="0">\n`;
        html += `              <tr>\n`;
        html += `                <td style="vertical-align:middle;">\n`;
        html += `                  ${getLogoHtml(d, 120)}\n`;
        html += `                </td>\n`;
        html += `                <td align="right" style="vertical-align:middle;color:${d.accentColor};font-size:12px;font-family:${font};">\n`;
        html += `                  ${d.company}\n`;
        html += `                </td>\n`;
        html += `              </tr>\n`;
        html += `            </table>\n`;
        html += `          </td>\n`;
        html += `        </tr>\n`;
        html += `        <tr>\n`;
        html += `          <td style="padding:0 30px;">\n`;
        html += `            <table width="100%" cellpadding="0" cellspacing="0" border="0">\n`;
        html += `              <tr><td style="border-top:1px solid #e0e0e0;"></td></tr>\n`;
        html += `            </table>\n`;
        html += `          </td>\n`;
        html += `        </tr>\n\n`;
      }

      html += generateContentRows(template, design, useExampleData, style);
      html += generateSignatureHtml(template, design, useExampleData, style);

      // Footer: no background, just subtle text
      if (s.footer) {
        html += `        <!-- FOOTER -->\n`;
        html += `        <tr>\n`;
        html += `          <td style="padding:0 30px;">\n`;
        html += `            <table width="100%" cellpadding="0" cellspacing="0" border="0">\n`;
        html += `              <tr><td style="border-top:1px solid #e0e0e0;"></td></tr>\n`;
        html += `            </table>\n`;
        html += `          </td>\n`;
        html += `        </tr>\n`;
        html += `        <tr>\n`;
        html += `          <td style="padding:14px 30px;text-align:center;font-size:11px;color:#aaaaaa;font-family:${font};">\n`;
        html += `            ${r(c.footerText)}\n`;
        html += `          </td>\n`;
        html += `        </tr>\n\n`;
      }

      html += generateLegalFooterHtml(template, design, style);
      html += `      </table>\n    </td>\n  </tr>\n</table>`;
    }

    // ── Style: Corporate Classic ──
    else if (style === 'corporate-classic') {
      html += `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f4;padding:20px 0;">\n  <tr>\n    <td align="center">\n      <table width="620" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;overflow:hidden;font-family:${font};">\n\n`;

      // 4px colored top border
      if (s.header) {
        html += `        <!-- TOP BORDER -->\n`;
        html += `        <tr>\n`;
        html += `          <td style="background-color:${headerColor};height:4px;font-size:0;line-height:0;">&nbsp;</td>\n`;
        html += `        </tr>\n\n`;

        // Centered logo + claim
        html += `        <!-- HEADER -->\n`;
        html += `        <tr>\n`;
        html += `          <td align="center" style="padding:28px 30px 8px 30px;">\n`;
        html += `            ${getLogoHtml(d, 160)}\n`;
        html += `          </td>\n`;
        html += `        </tr>\n`;
        html += `        <tr>\n`;
        html += `          <td align="center" style="padding:4px 30px 20px 30px;font-size:12px;color:${d.accentColor};font-style:italic;font-family:${font};">\n`;
        html += `            ${d.claim}\n`;
        html += `          </td>\n`;
        html += `        </tr>\n`;
        html += `        <tr>\n`;
        html += `          <td style="padding:0 30px;">\n`;
        html += `            <table width="100%" cellpadding="0" cellspacing="0" border="0">\n`;
        html += `              <tr><td style="border-top:1px solid #e8e8e8;"></td></tr>\n`;
        html += `            </table>\n`;
        html += `          </td>\n`;
        html += `        </tr>\n\n`;
      }

      html += generateContentRows(template, design, useExampleData, style);
      html += generateSignatureHtml(template, design, useExampleData, style);

      // Footer: darker, more formal
      if (s.footer) {
        html += `        <!-- FOOTER -->\n`;
        html += `        <tr>\n`;
        html += `          <td style="background-color:#2c2c2c;padding:16px 30px;text-align:center;font-size:11px;color:#cccccc;font-family:${font};">\n`;
        html += `            ${r(c.footerText)}\n`;
        html += `          </td>\n`;
        html += `        </tr>\n\n`;
      }

      html += generateLegalFooterHtml(template, design, style);
      html += `      </table>\n    </td>\n  </tr>\n</table>`;
    }

    // ── Style: Internal Minimal ──
    else if (style === 'internal-minimal') {
      html += `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0f0f0;padding:20px 0;">\n  <tr>\n    <td align="center">\n      <table width="620" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border:1px solid #e0e0e0;border-radius:4px;overflow:hidden;font-family:${font};">\n\n`;

      // Preview text row (small gray text above heading)
      if (s.previewText && c.previewTextVar) {
        html += `        <!-- PREVIEW TEXT ROW -->\n`;
        html += `        <tr>\n`;
        html += `          <td style="padding:16px 30px 0 30px;font-size:11px;color:#666666;font-family:${font};">\n`;
        html += `            ${r(c.previewTextVar)}\n`;
        html += `          </td>\n`;
        html += `        </tr>\n\n`;
      }

      // Compact heading: ticket number as H1
      html += `        <!-- HEADING -->\n`;
      html += `        <tr>\n`;
      html += `          <td style="padding:24px 30px 8px 30px;">\n`;
      html += `            <h1 style="margin:0;font-size:22px;font-weight:600;color:#1a1a1a;font-family:${font};">${r(tokenFor('ticket.number'))}</h1>\n`;
      html += `          </td>\n`;
      html += `        </tr>\n\n`;

      // Message body (custom intro + messageBodyVar)
      if (s.messageBody) {
        html += `        <!-- MESSAGE BODY -->\n`;
        html += `        <tr>\n`;
        html += `          <td style="padding:12px 30px 24px 30px;font-size:14px;color:#333333;line-height:1.6;font-family:${font};">\n`;
        if (c.customIntro) {
          const introLines = r(c.customIntro).split('\n');
          for (const line of introLines) {
            if (line.trim() === '') {
              html += `            <br />\n`;
            } else {
              html += `            ${line}<br />\n`;
            }
          }
        }
        if (c.messageBodyVar) {
          if (c.customIntro) html += `            <br />\n`;
          html += `            ${r(c.messageBodyVar)}\n`;
        }
        html += `          </td>\n`;
        html += `        </tr>\n\n`;
      }

      // Single Autotask CTA button
      // {id} landet im URL-Parameter ticketId, und der will die interne
      // Ticket-ID — nicht die angezeigte Ticketnummer.
      const ctaTicketId = useExampleData ? exampleFor('ticket.id') : tokenFor('ticket.id');
      const ctaHref = escapeHtml(d.autotaskUrl ? d.autotaskUrl.replace('{id}', ctaTicketId) : '#');
      const ctaLabel = escapeHtml(d.autotaskLinkText || tt('out.autotaskLinkFallback'));
      html += `        <!-- AUTOTASK CTA -->\n`;
      html += `        <tr>\n`;
      html += `          <td style="padding:0 30px 28px 30px;" align="center">\n`;
      html += `            <table cellpadding="0" cellspacing="0" border="0">\n`;
      html += `              <tr>\n`;
      html += `                <td style="background-color:#2c2c2c;border-radius:4px;">\n`;
      html += `                  <a href="${ctaHref}" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;font-family:${font};padding:12px 28px;display:inline-block;">${ctaLabel}</a>\n`;
      html += `                </td>\n`;
      html += `              </tr>\n`;
      html += `            </table>\n`;
      html += `          </td>\n`;
      html += `        </tr>\n\n`;

      html += `      </table>\n    </td>\n  </tr>\n</table>`;
    }

    return html;
  }

  // ── Generate Plain-Text version (for Autotask "Nur-Text" field) ──
  // Mirrors the structure of generateEmailHtml but strips all styling and
  // collapses whitespace, so paste into a plain-text editor stays clean.
  function generateEmailText(template, design, useExampleData) {
    const style = state.activeStyle;
    const d = design;
    const t = template;
    const s = t.sections;
    const c = t.config;
    const r = useExampleData ? (v) => replaceVarsWithExamples(v, template.previewExamples) : (v) => v;

    const blocks = [];

    if (style === 'internal-minimal') {
      // Heading is always the ticket number for this style
      blocks.push(r(tokenFor('ticket.number')));
      if (s.messageBody) {
        if (c.customIntro) blocks.push(r(c.customIntro));
        if (c.messageBodyVar) blocks.push(r(c.messageBodyVar));
      }
      if (d.autotaskUrl) {
        const url = d.autotaskUrl.replace(
          '{id}',
          useExampleData ? exampleFor('ticket.id') : tokenFor('ticket.id')
        );
        blocks.push(`${d.autotaskLinkText || tt('out.autotaskLinkFallback')}: ${url}`);
      }
    } else {
      if (s.ticketInfo) {
        blocks.push(
          `${r(tokenFor('ticket.title'))}\n` +
          `Ticket ${r(tokenFor('ticket.number'))} | ${tt('out.status')} ${r(tokenFor('ticket.status'))} | ${tt('out.priority')} ${r(tokenFor('ticket.priority'))}`
        );
      }

      if (s.iconBadge) {
        blocks.push(c.badgeGlyph || DEFAULT_BADGE_GLYPH);
      }

      if (s.messageBody) {
        if (c.customHeading) blocks.push(r(c.customHeading));
        if (c.customIntro) blocks.push(r(c.customIntro));
        if (c.messageBodyVar) blocks.push(r(c.messageBodyVar));
      }

      if (s.ctaButton && c.ctaText) {
        const link = c.ctaLink ? r(c.ctaLink) : '';
        blocks.push(link ? `${r(c.ctaText)}: ${link}` : r(c.ctaText));
      }

      if (s.bookingButton && d.bookingUrl) {
        blocks.push(`${d.bookingText || tt('out.bookingFallback')}: ${d.bookingUrl}`);
      }

      if (s.kundenportal && d.portalUrl) {
        blocks.push(`${d.portalText || tt('out.portalFallback')}: ${d.portalUrl}`);
      }

      if (s.signature) {
        const sig = [r(tokenFor('misc.initiatingResourceName'))];
        const companyLine = d.claim ? `${d.company} · ${d.claim}` : d.company;
        sig.push(companyLine);
        if (d.address) sig.push(d.address);
        if (d.phone) sig.push(`${tt('out.tel')} ${d.phone}`);
        if (d.web) sig.push(`${tt('out.web')} ${d.web}`);
        if (d.certs) sig.push(d.certs);
        blocks.push('--\n' + sig.join('\n'));
      }

      if (s.footer && c.footerText) {
        blocks.push(r(c.footerText));
      }

      if (s.legalFooter && t.audience !== 'internal') {
        const legal = [];
        legal.push(`${d.company} | ${tt('out.ceo')} ${d.legalCeo} | ${d.legalCourt}, ${d.legalRegNr} | ${tt('out.vatId')} ${d.legalVatId}`);
        if (d.legalImprintUrl) legal.push(`${tt('out.imprint')}: ${d.legalImprintUrl}`);
        if (d.legalPrivacyUrl) legal.push(`${tt('out.privacy')}: ${d.legalPrivacyUrl}`);
        blocks.push(legal.join('\n'));
      }
    }

    return blocks
      .map(b => b == null ? '' : String(b).trim())
      .filter(Boolean)
      .join('\n\n');
  }

  // ── Render Preview ──
  function renderPreview() {
    const template = getActiveTemplate();
    if (!template) return;
    const html = generateEmailHtml(template, state.design, true);
    $('#preview-frame').innerHTML = html;
  }

  // ── Render Code Output ──
  function renderCodeOutput() {
    const template = getActiveTemplate();
    if (!template) return;
    const html = generateEmailHtml(template, state.design, false);
    $('#code-output-pre').textContent = html;
  }

  // ── Read Design from UI ──
  function readDesignFromUI() {
    state.design.primaryColor = $('#ds-primary-color').value;
    state.design.textColor = $('#ds-text-color').value;
    state.design.accentColor = $('#ds-accent-color').value;
    state.design.logoUrl = $('#ds-logo').value;
    state.design.company = $('#ds-company').value;
    state.design.claim = $('#ds-claim').value;
    state.design.address = $('#ds-address').value;
    state.design.phone = $('#ds-phone').value;
    state.design.web = $('#ds-web').value;
    state.design.certs = $('#ds-certs').value;
    state.design.font = $('#ds-font').value;
    state.design.legalCeo = $('#ds-legal-ceo').value;
    state.design.legalCourt = $('#ds-legal-court').value;
    state.design.legalRegNr = $('#ds-legal-regnr').value;
    state.design.legalVatId = $('#ds-legal-vatid').value;
    state.design.legalImprintUrl = $('#ds-legal-imprint').value;
    state.design.legalPrivacyUrl = $('#ds-legal-privacy').value;
    state.design.logoEnabled = $('#ds-logo-enabled').checked;
    state.design.bookingUrl = $('#ds-booking-url').value;
    state.design.bookingText = $('#ds-booking-text').value;
    state.design.bookingActive = $('#ds-booking-active').checked;
    state.design.portalUrl = $('#ds-portal-url').value;
    state.design.portalText = $('#ds-portal-text').value;
    const rawUrl = $('#ds-autotask-url').value.trim();
    state.design.autotaskUrl = (!rawUrl || /^https?:\/\//i.test(rawUrl)) ? rawUrl : '';
    state.design.autotaskLinkText = $('#ds-autotask-link-text').value;
  }

  // ── Write Design to UI ──
  // Die zehn Platzhalter-Texte kommen aus der Locale und koennen fehlen, wenn
  // deren Abruf scheitert — dann bleibt das Feld leer statt "undefined" zu zeigen.
  function writeDesignToUI() {
    const d = state.design;
    $('#ds-primary-color').value = d.primaryColor;
    $('#ds-primary-color-text').value = d.primaryColor;
    $('#ds-text-color').value = d.textColor;
    $('#ds-text-color-text').value = d.textColor;
    $('#ds-accent-color').value = d.accentColor;
    $('#ds-accent-color-text').value = d.accentColor;
    $('#ds-logo').value = d.logoUrl;
    $('#ds-company').value = d.company || '';
    $('#ds-claim').value = d.claim || '';
    $('#ds-address').value = d.address || '';
    $('#ds-phone').value = d.phone;
    $('#ds-web').value = d.web;
    $('#ds-certs').value = d.certs;
    $('#ds-font').value = d.font;
    $('#ds-legal-ceo').value = d.legalCeo || '';
    $('#ds-legal-court').value = d.legalCourt || '';
    $('#ds-legal-regnr').value = d.legalRegNr || '';
    $('#ds-legal-vatid').value = d.legalVatId || '';
    $('#ds-legal-imprint').value = d.legalImprintUrl;
    $('#ds-legal-privacy').value = d.legalPrivacyUrl;
    $('#ds-logo-enabled').checked = d.logoEnabled !== false;
    $('#ds-booking-url').value = d.bookingUrl;
    $('#ds-booking-text').value = d.bookingText || '';
    $('#ds-booking-active').checked = d.bookingActive;
    $('#ds-portal-url').value = d.portalUrl;
    $('#ds-portal-text').value = d.portalText || '';
    $('#ds-autotask-zone').value = getZone().id;
    $('#ds-autotask-url').value = d.autotaskUrl || '';
    $('#ds-autotask-link-text').value = d.autotaskLinkText || '';
    updateZoneHint();
  }

  // ── Autotask-Zone ──
  function renderZoneOptions() {
    const select = $('#ds-autotask-zone');
    select.innerHTML = '';
    for (const lang of Object.keys(ZONE_LANG_LABELS)) {
      const zones = AUTOTASK_ZONES.filter(z => z.lang === lang);
      if (!zones.length) continue;
      const group = document.createElement('optgroup');
      group.label = ZONE_LANG_LABELS[lang];
      for (const zone of zones) {
        const option = document.createElement('option');
        option.value = zone.id;
        // Der Zonen-Code ist neutral, nur die Regionsbezeichnung wird übersetzt.
        option.textContent = zone.id + ' — ' + t('zone.' + zone.id);
        group.appendChild(option);
      }
      select.appendChild(group);
    }
  }

  function updateZoneHint() {
    // Spanische Zonen bekommen englische Vorlagentexte — das soll dastehen,
    // damit ein ES-Nutzer den Rückfall nicht für einen Fehler hält.
    const fallback = varLang() === 'es' ? t('zoneHint.esFallback') : '';
    $('#ds-autotask-zone-hint').textContent =
      t('zoneHint', { lang: ZONE_LANG_LABELS[varLang()] }) + fallback;
  }

  async function onZoneChange(nextId) {
    const previousLang = varLang();
    const previousTemplateLang = templateLang();
    const previousUrl = state.design.autotaskUrl;
    state.design.autotaskZone = zoneById(nextId).id;

    if (!previousUrl || isGeneratedZoneUrl(previousUrl)) {
      state.design.autotaskUrl = zoneUrlFor(getZone());
    }

    const nextLang = varLang();
    let result = null;
    if (nextLang !== previousLang) {
      result = retokenizeTemplates(previousLang, nextLang);
      // Der Katalog der neuen Sprache nur, wenn ueberhaupt schon einer geholt
      // wurde — sonst holt ihn der Picker beim naechsten Oeffnen.
      if (Object.keys(catalogs).length) ensureCatalog(nextLang);
    }

    // Nur wenn die Vorlagensprache der Zone folgt: eine bewusst gewählte
    // bleibt stehen. Erst nach dem Retokenisieren, damit die Default-Erkennung
    // auf Tokens der neuen Zonensprache trifft.
    const nextTemplateLang = templateLang();
    if (nextTemplateLang !== previousTemplateLang) {
      await setTemplateLang(nextTemplateLang, { from: previousTemplateLang });
    }

    writeDesignToUI();
    renderTemplateTabs();
    renderTemplateConfig();
    renderSubjectField();
    onStateChange();

    if (result) {
      const langLabel = ZONE_LANG_LABELS[nextLang];
      showToast(result.unknown
        ? t('toast.retokenizedUnknown', { count: result.replaced, lang: langLabel, unknown: result.unknown })
        : t('toast.retokenized', { count: result.replaced, lang: langLabel }));
    }
  }

  // ── Vorlagensprache umschalten ──
  function updateTemplateLangSwitch() {
    const active = templateLang();
    for (const btn of $$('#template-lang-switch button')) {
      btn.classList.toggle('active', btn.dataset.templateLang === active);
    }
    const explicit = !!normalizeTemplateLang(state.design.templateLang);
    $('#template-lang-hint').textContent =
      t(explicit ? 'templateLang.hintExplicit' : 'templateLang.hintZone',
        { lang: ZONE_LANG_LABELS[active] });
  }

  // Schreibt nur Felder um, die noch einen bekannten Default tragen — von Hand
  // geänderter Text bleibt stehen. `from` gibt die Ausgangssprache vor, weil
  // onZoneChange die Zone bereits umgestellt hat und templateLang() dort schon
  // die neue Sprache liefert.
  async function setTemplateLang(lang, options) {
    const opts = options || {};
    const next = normalizeTemplateLang(lang);
    if (!next) return false;
    const previous = opts.from || templateLang();

    if (!(await ensureTemplateLocale(next))) {
      showToast(t('toast.templateLocaleFailed'));
      return false;
    }
    // Auch die Ausgangssprache, denn verglichen wird gegen die Defaults beider
    // Sprachen: sonst verlöre ein in DE angelegter Stand nach dem Wechsel seine
    // Default-Erkennung und behielte deutschen Text.
    await ensureTemplateLocale(previous);

    if (next !== previous) {
      const templateCandidates = defaultTemplateCandidates();
      const designCandidates = designTextCandidates();
      const keep = state.design.templateLang;
      // Die Materialisierung liest templateLang(), muss also schon die
      // Zielsprache sehen.
      state.design.templateLang = next;
      rewriteDefaultTexts(templateCandidates, designCandidates);
      state.design.templateLang = opts.explicit ? next : keep;
    } else if (opts.explicit) {
      state.design.templateLang = next;
    }

    updateTemplateLangSwitch();
    return true;
  }

  function rewriteDefaultTexts(templateCandidates, designCandidates) {
    const defaults = defaultTemplates();
    if (!defaults) return;
    const defaultById = new Map(defaults.map(def => [def.id, def]));

    for (const tpl of state.templates) {
      const def = defaultById.get(tpl.id);
      const candidates = templateCandidates.get(tpl.id);
      if (!def || !candidates) continue;

      // Erst prüfen, dann schreiben: sonst sieht die zweite Prüfung den bereits
      // ersetzten Wert.
      const wasDefault = {};
      wasDefault.name = !!(candidates.name && candidates.name.has(tpl.name));
      wasDefault.subject = !!(candidates.subject && candidates.subject.has(tpl.subject));
      for (const field of TEMPLATE_TEXT_FIELDS) {
        wasDefault[field] = !!(candidates[field] && candidates[field].has(tpl.config[field]));
      }

      // Die Benachrichtigungsvorlage behält ihren Typ; Betreff, Vorschautext und
      // Einleitung kommen deshalb aus dessen Defaults, nicht aus denen von queue.
      const notify = tpl.config.notificationType
        ? notificationDefaults(tpl.config.notificationType)
        : null;

      if (wasDefault.name) tpl.name = def.name;
      if (wasDefault.subject) {
        tpl.subject = notify
          ? buildNotificationSubject(tpl.config.notificationType)
          : def.subject;
      }
      for (const field of TEMPLATE_TEXT_FIELDS) {
        if (!wasDefault[field]) continue;
        if (notify && field === 'previewTextVar') tpl.config[field] = notify.previewText;
        else if (notify && field === 'customIntro') tpl.config[field] = notify.intro;
        else tpl.config[field] = def.config[field];
      }
      tpl.previewExamples = def.previewExamples;
    }

    const texts = designTextDefaults(templateLang());
    for (const key of DESIGN_TEXT_KEYS) {
      if (designCandidates[key] && designCandidates[key].has(state.design[key])) {
        state.design[key] = texts[key];
      }
    }
  }

  // ── Render Style Tabs ──
  function renderStyleTabs() {
    const container = $('#style-tabs');
    container.innerHTML = '';
    const active = getActiveTemplate();
    const isInternal = active && active.id === 'internal-notification';
    for (const s of STYLES) {
      const btn = document.createElement('button');
      btn.className = 'template-tab' + (s.id === state.activeStyle ? ' active' : '');
      btn.textContent = s.name;
      const shouldDisable = (isInternal && s.id !== 'internal-minimal') ||
                            (!isInternal && s.id === 'internal-minimal');
      if (shouldDisable) {
        btn.disabled = true;
      } else {
        btn.addEventListener('click', () => {
          state.activeStyle = s.id;
          renderStyleTabs();
          onStateChange();
        });
      }
      container.appendChild(btn);
    }
  }

  // ── Render Template Tabs ──
  function renderTemplateTabs() {
    const container = $('#template-tabs');
    container.innerHTML = '';

    const customerTemplates = state.templates.filter(t => t.audience !== 'internal');
    const internalTemplates = state.templates.filter(t => t.audience === 'internal');

    function renderGroup(label, templates) {
      if (templates.length === 0) return;
      const heading = document.createElement('div');
      heading.className = 'template-group-heading';
      heading.textContent = label;
      container.appendChild(heading);

      const group = document.createElement('div');
      group.className = 'template-group';
      templates.forEach(t => {
        const btn = document.createElement('button');
        btn.className = 'template-tab' + (t.id === state.activeTemplateId ? ' active' : '');
        btn.textContent = t.name;
        btn.addEventListener('click', () => {
          state.activeTemplateId = t.id;
          applyAudienceStyleLock();
          renderStyleTabs();
          renderTemplateTabs();
          renderSectionToggles();
          renderTemplateConfig();
          renderSubjectField();
          onStateChange();
        });
        group.appendChild(btn);
      });
      container.appendChild(group);
    }

    renderGroup(t('tabs.customer'), customerTemplates);
    renderGroup(t('tabs.internal'), internalTemplates);
  }

  // ── Render Section Toggles ──
  function renderSectionToggles() {
    const container = $('#section-toggles-content');
    container.innerHTML = '';
    const template = getActiveTemplate();
    if (!template) return;

    for (const sec of SECTIONS) {
      const div = document.createElement('div');
      div.className = 'section-toggle';

      const span = document.createElement('span');
      span.textContent = t('section.' + sec.key);
      if (sec.hasTooltip) {
        const info = document.createElement('span');
        info.className = 'info-tooltip';
        info.textContent = 'i';
        info.title = t('section.' + sec.key + '.tooltip');
        span.appendChild(info);
      }

      const toggle = document.createElement('label');
      toggle.className = 'toggle';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = template.sections[sec.key];
      input.addEventListener('change', () => {
        template.sections[sec.key] = input.checked;
        onStateChange();
      });
      const slider = document.createElement('span');
      slider.className = 'toggle-slider';
      toggle.appendChild(input);
      toggle.appendChild(slider);

      div.appendChild(span);
      div.appendChild(toggle);
      container.appendChild(div);
    }
  }

  // ── Render Template Config ──
  function renderTemplateConfig() {
    const container = $('#template-config-content');
    container.innerHTML = '';
    const template = getActiveTemplate();
    if (!template) return;
    const c = template.config;

    // ── Notification-Type dropdown (internal-notification only) ──
    if (template.audience === 'internal' && c.notificationType !== undefined) {
      const group = document.createElement('div');
      group.className = 'form-group';

      const label = document.createElement('label');
      label.setAttribute('for', 'tpl-notification-type');
      label.textContent = t('notify.label');

      const select = document.createElement('select');
      select.id = 'tpl-notification-type';

      const options = [
        { value: 'queue',    label: t('notify.queue') },
        { value: 'assigned', label: t('notify.assigned') },
        { value: 'sla',      label: t('notify.sla') }
      ];
      for (const opt of options) {
        const el = document.createElement('option');
        el.value = opt.value;
        el.textContent = opt.label;
        if (opt.value === (c.notificationType || 'queue')) el.selected = true;
        select.appendChild(el);
      }

      select.addEventListener('change', () => {
        const newType = select.value;

        // Reverse-lookup: check if each field still holds a known default value.
        // If yes, it's safe to overwrite. If the user customised it, preserve.
        const currentSubject = template.subject;
        const currentPreview = c.previewTextVar;
        const currentIntro   = c.customIntro;

        const subjectIsDefault = isDefaultNotificationValue('subject', currentSubject);
        const previewIsDefault = isDefaultNotificationValue('previewText', currentPreview);
        const introIsDefault   = isDefaultNotificationValue('intro', currentIntro);

        c.notificationType = newType;

        // Ohne Sprachargumente: aktive Vorlagen- und Zonensprache. Vorher
        // standen hier deutsche Token-Literale, die eine englische Autotask-
        // Instanz nicht auflöst.
        const defaults = notificationDefaults(newType);
        if (subjectIsDefault) template.subject = buildNotificationSubject(newType);
        if (previewIsDefault) c.previewTextVar = defaults.previewText;
        if (introIsDefault)   c.customIntro    = defaults.intro;

        renderSubjectField();
        renderTemplateConfig();
        onStateChange();
      });

      group.appendChild(label);
      group.appendChild(select);
      container.appendChild(group);
    }

    // ── Standard config fields ──
    // For internal-audience templates, hide fields overridden by design
    // (ctaLink/ctaText come from design.autotaskUrl/autotaskLinkText; footerText is unused).
    const isInternal = template.audience === 'internal';

    const fields = [
      { key: 'customHeading', type: 'text' },
      { key: 'customIntro', type: 'textarea' },
      { key: 'previewTextVar', type: 'text' },
      { key: 'messageBodyVar', type: 'text', placeholder: t('tmpl.messageBodyVar.placeholder', { token: tokenFor('ticket.noteDescription') }) },
      ...(!isInternal ? [
        { key: 'ctaText', type: 'text' },
        { key: 'ctaLink', type: 'text', placeholder: tokenFor('ticket.numberWithLink') },
        { key: 'footerText', type: 'text' },
      ] : []),
      { key: 'badgeGlyph', type: 'text', placeholder: t('tmpl.badgeGlyph.placeholder', { glyph: DEFAULT_BADGE_GLYPH }) },
      { key: 'headerColorOverride', type: 'text' }
    ];

    for (const f of fields) {
      const group = document.createElement('div');
      group.className = 'template-config-group';

      const labelRow = document.createElement('div');
      labelRow.style.display = 'flex';
      labelRow.style.justifyContent = 'space-between';
      labelRow.style.alignItems = 'center';
      labelRow.style.marginBottom = '4px';

      const label = document.createElement('label');
      label.textContent = t('tmpl.' + f.key);
      label.style.margin = '0';

      const varBtn = document.createElement('button');
      varBtn.className = 'btn btn-sm btn-insert-var';
      varBtn.textContent = t('btn.insertVar');
      varBtn.title = t('btn.insertVar.title');
      varBtn.dataset.configKey = f.key;
      varBtn.addEventListener('click', () => {
        openVarPicker((variable) => {
          const input = group.querySelector('input, textarea');
          insertAtCursor(input, variable);
          c[f.key] = input.value;
          onStateChange();
        });
      });

      labelRow.appendChild(label);
      labelRow.appendChild(varBtn);

      let input;
      if (f.type === 'textarea') {
        input = document.createElement('textarea');
        input.rows = 4;
      } else {
        input = document.createElement('input');
        input.type = 'text';
      }
      input.placeholder = f.placeholder !== undefined ? f.placeholder : t('tmpl.' + f.key + '.placeholder');
      input.value = c[f.key] || '';
      input.addEventListener('input', () => {
        c[f.key] = input.value;
        onStateChange();
      });

      group.appendChild(labelRow);
      group.appendChild(input);
      container.appendChild(group);
    }
  }

  // ── Render Subject ──
  function renderSubjectField() {
    const template = getActiveTemplate();
    if (!template) return;
    $('#template-subject').value = template.subject;
  }

  // ── Insert text at cursor position ──
  function insertAtCursor(input, text) {
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const val = input.value;
    input.value = val.substring(0, start) + text + val.substring(end);
    input.selectionStart = input.selectionEnd = start + text.length;
    input.focus();
  }

  // ── Variable Picker ──
  let varPickerCallback = null;

  function openVarPicker(callback) {
    varPickerCallback = callback;
    renderVarPickerBody('');
    $('#var-picker-overlay').classList.add('active');
    $('#var-search').value = '';
    $('#var-search').focus();
    // Der volle Katalog wird erst hier geholt und dann nachgerendert; die
    // kuratierte Auswahl steht sofort.
    ensureCatalog(varLang()).then(catalog => {
      if (catalog && $('#var-picker-overlay').classList.contains('active')) {
        renderVarPickerBody($('#var-search').value);
      }
    });
  }

  function closeVarPicker() {
    $('#var-picker-overlay').classList.remove('active');
    varPickerCallback = null;
  }

  function varPickerGroupHtml(title, categories) {
    let html = `<div class="var-section-title">${escapeHtml(title)}</div>`;
    for (const cat of categories) {
      html += `<div class="var-category"><div class="var-category-title">${escapeHtml(cat.name)}</div>`;
      for (const item of cat.items) {
        html += `<div class="var-item">` +
          `<span class="var-item-name">${escapeHtml(item.token)}</span>` +
          `<span class="var-item-desc">${escapeHtml(item.description)}</span></div>`;
      }
      html += `</div>`;
    }
    return html;
  }

  function renderVarPickerBody(filter) {
    const body = $('#var-picker-body');
    const lf = (filter || '').toLowerCase();
    const lang = varLang();
    const matches = (name, desc) =>
      !lf || name.toLowerCase().includes(lf) || (desc && desc.toLowerCase().includes(lf));

    // Namen der kuratierten Variablen, damit sie im Katalogteil nicht doppelt
    // auftauchen — unabhaengig vom Filter gesammelt.
    const curatedNames = new Set();
    const curatedGroups = [];

    for (const cat of (curatedVars ? curatedVars.categories : [])) {
      const items = [];
      for (const v of cat.variables) {
        const name = v.name[lang];
        if (!name) continue;
        curatedNames.add(name);
        if (matches(name, v.description)) {
          items.push({ token: '[' + name + ']', description: v.description });
        }
      }
      if (items.length) curatedGroups.push({ name: cat.name, items });
    }

    const catalog = catalogs[lang];
    const catalogGroups = [];

    for (const cat of (catalog ? catalog.categories : [])) {
      const items = cat.variables
        .filter(name => !curatedNames.has(name) && matches(name, ''))
        .map(name => ({ token: '[' + name + ']', description: '' }));
      if (items.length) catalogGroups.push({ name: cat.name, items });
    }

    let html = '';
    if (curatedGroups.length) html += varPickerGroupHtml(t('picker.common'), curatedGroups);
    if (catalogGroups.length) {
      html += varPickerGroupHtml(
        t('picker.all', { lang: ZONE_LANG_LABELS[lang] }),
        catalogGroups
      );
    }
    if (!html) html = '<div class="var-empty">' + escapeHtml(t('picker.empty')) + '</div>';
    body.innerHTML = html;
  }

  // ── Sidebar Warning Badges ──
  function updateSidebarBadges() {
    const d = state.design;
    const activeTemplate = getActiveTemplate();
    const autotaskWarn = (d.autotaskUrl && !d.autotaskUrl.includes('{id}')) ||
      (!d.autotaskUrl && activeTemplate && activeTemplate.audience === 'internal');
    // Gegen die Platzhalter-Defaults *beider* Vorlagensprachen, nicht gegen
    // String-Literale — sonst verschwindet die Warnung beim Umschalten auf EN.
    const placeholders = designTextCandidates();
    const isPlaceholder = (key) => !!(placeholders[key] && placeholders[key].has(d[key]));
    // Schluessel sind die stabilen data-section-Werte aus index.html, nicht der
    // sichtbare Header-Text — der wechselt mit der Oberflaechensprache.
    const checks = {
      designSystem: (d.logoEnabled !== false && !d.logoUrl) || isPlaceholder('company') || d.web === DEFAULT_DESIGN.web,
      legal: isPlaceholder('legalCeo') || isPlaceholder('legalRegNr') || d.legalImprintUrl === DEFAULT_DESIGN.legalImprintUrl,
      booking: false,
      portal: false,
      autotask: autotaskWarn
    };
    $$('.sidebar-section-header').forEach(header => {
      const label = header.querySelector('span:first-child');
      if (!label) return;
      const section = header.dataset.section;
      const existing = header.querySelector('.badge-warn');
      if (existing) existing.remove();
      if (section && checks[section]) {
        const badge = document.createElement('span');
        badge.className = 'badge-warn';
        badge.title = t('badge.needsAttention');
        label.appendChild(badge);
      }
    });
  }

  // ── State Change Handler ──
  function onStateChange() {
    renderPreview();
    renderCodeOutput();
    saveToLocalStorage();
    updateSidebarBadges();
  }

  // ── LocalStorage ──
  const STORAGE_KEY = 'psa-templates';

  function saveToLocalStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }

  // ── Audience Style Lock ──
  function applyAudienceStyleLock() {
    const active = getActiveTemplate();
    if (!active) return;
    if (active.id === 'internal-notification') {
      state.activeStyle = 'internal-minimal';
    } else if (state.activeStyle === 'internal-minimal') {
      state.activeStyle = 'modern-card';
    }
  }

  // Tokens aus Ständen von vor der Zonen-Auswahl. Ein Teil davon war englisch,
  // ein Teil existierte in gar keiner Sprache ([Ticket: Ticket Number],
  // [Resource: Email], [Organization: Organization Name] …) — beides lässt
  // Autotask unaufgelöst in der Mail stehen. Einmalig repariert, siehe
  // VAR_SCHEMA.
  const LEGACY_TOKENS = {
    '[Attachment: Attachment File/Folder/URL (with link)]': 'attachment.fileWithLink',
    '[Attachment: Attachment Name (with link)]': 'attachment.nameWithLink',
    '[Contact: Email Address]': 'contact.emailAddress',
    '[Contact: First Name]': 'contact.firstName',
    '[Contact: Last Name]': 'contact.lastName',
    '[Contact: Phone]': 'contact.phone',
    '[Contract: Contract Name]': 'contract.name',
    '[Contract: Contract Number]': 'contract.id',
    '[Contract: End Date]': 'contract.endDate',
    '[Contract: Start Date]': 'contract.startDate',
    '[Device: Device Name]': 'device.referenceName',
    '[Device: Device Type]': 'device.deviceType',
    '[Device: Product Name]': 'device.product',
    '[Device: Serial Number]': 'device.serialNumber',
    '[Miscellaneous: Current Date]': 'misc.currentDate',
    '[Miscellaneous: Initiating Resource Email]': 'misc.initiatingResourceEmail',
    '[Miscellaneous: Initiating Resource Name]': 'misc.initiatingResourceName',
    '[Miscellaneous: Initiating Resource Phone]': 'misc.initiatingResourceOfficePhone',
    '[Miscellaneous: Initiating Resource Title]': 'misc.initiatingResourceTitle',
    '[Miscellaneous: Primary Logo]': 'misc.primaryLogo',
    '[Miscellaneous: Your Company Name]': 'misc.yourCompanyName',
    '[Organization: Address 1]': 'organization.address1',
    '[Organization: City]': 'organization.city',
    '[Organization: Organization Name]': 'organization.name',
    '[Organization: Phone]': 'organization.phone',
    '[Organization: Postal Code]': 'organization.zipCode',
    '[Organization: Web]': 'organization.web',
    '[Resource: Email]': 'resource.emailAddress',
    '[Resource: First Name]': 'resource.firstName',
    '[Resource: Last Name]': 'resource.lastName',
    '[Resource: Phone]': 'resource.officePhone',
    '[Resource: Title]': 'resource.title',
    '[Ticket Time Entry: Hours Worked]': 'timeEntry.hoursWorked',
    '[Ticket Time Entry: Start Date/Time]': 'timeEntry.startDateTime',
    '[Ticket Time Entry: Summary Notes]': 'timeEntry.summaryNotes',
    '[Ticket: Create Date]': 'ticket.createDate',
    '[Ticket: Description]': 'ticket.description',
    '[Ticket: Due Date]': 'ticket.dueDate',
    '[Ticket: Note Description]': 'ticket.noteDescription',
    '[Ticket: Note Title]': 'ticket.noteTitle',
    '[Ticket: Priority]': 'ticket.priority',
    '[Ticket: Queue]': 'ticket.queue',
    '[Ticket: Status]': 'ticket.status',
    '[Ticket: Ticket Number (with link)]': 'ticket.numberWithLink',
    '[Ticket: Ticket Number]': 'ticket.number',
    '[Ticket: Title]': 'ticket.title',
    '[Your Local Organization: Address]': 'yourCompany.address',
    '[Your Local Organization: Organization Name]': 'yourCompany.name',
    '[Your Local Organization: Phone]': 'yourCompany.phone'
  };

  // ── State Migration (mutates state in-place, returns same reference) ──
  // Bewusst synchron und locale-frei: der schema<4-Block legt erst fest, welche
  // Vorlagensprache ein Stand trägt. Alles, was diese Sprache *braucht* — die
  // Vorlagentexte selbst und die Vorschau-Beispiele — macht danach
  // applyLocaleDefaults(), wenn die Sprache feststeht.
  function migrateState(state) {
    if (state.templates) {
      state.templates.forEach(t => {
        const spec = SPEC_BY_ID.get(t.id);
        if (spec) {
          t.audience = spec.audience;
        } else if (!t.audience) {
          t.audience = 'customer';
        }
        if (t.id === 'internal-notification' && t.config && !t.config.notificationType) {
          t.config.notificationType = 'queue';
        }
      });
    }

    if (state.design) {
      // Unbekannte Zone-IDs (alter Export, Tippfehler im Import) auf den Default
      // normalisieren, damit gespeicherter Stand und UI nicht auseinanderlaufen.
      state.design.autotaskZone = zoneById(state.design.autotaskZone).id;
      // Dasselbe für die Oberflächensprache: ein Stand von vor der
      // Zweisprachigkeit hat gar kein uiLang, ein manipulierter einen ungültigen.
      state.design.uiLang = normalizeUiLang(state.design.uiLang);
    }

    const schema = state.varSchema || 0;

    if (schema < 2) {
      const lang = zoneById(state.design && state.design.autotaskZone).lang;
      const repair = {};
      for (const legacy of Object.keys(LEGACY_TOKENS)) {
        const token = tokenIn(LEGACY_TOKENS[legacy], lang);
        if (token !== legacy) repair[legacy] = token;
      }
      if (state.templates) state.templates = replaceTokensDeep(state.templates, repair);
    }

    if (schema < 3 && state.templates) {
      // Die Glühbirne steckt in gespeicherten Ständen als eigener Wert im
      // Template-Config und würde den neuen Default sonst nie sehen. Selbst
      // eingetragene andere Zeichen bleiben unangetastet.
      state.templates.forEach(t => {
        if (t.config && t.config.badgeGlyph === LEGACY_BADGE_GLYPH) {
          t.config.badgeGlyph = DEFAULT_BADGE_GLYPH;
        }
      });
    }

    if (schema < 4 && state.design && !normalizeTemplateLang(state.design.templateLang)) {
      // Jeder Stand von vor der Vorlagensprache trägt deutsche Texte — auch auf
      // einer englischen Zone. Ihn an 'de' zu heften ist die einzige
      // verlustfreie Wahl; über die Zone aufgelöst tauschte er seine
      // gespeicherten Texte gegen englische Defaults.
      state.design.templateLang = resolveTemplateLangFor(state.design, schema);
    }

    state.varSchema = VAR_SCHEMA;

    return state;
  }

  // Setzt alles, was die Vorlagensprache braucht — läuft deshalb immer NACH
  // migrateState(), das die Sprache erst festlegt.
  async function applyLocaleDefaults() {
    const lang = templateLang();
    if (!(await ensureTemplateLocale(lang))) {
      showToast(t('toast.templateLocaleFailed'));
      return false;
    }

    const texts = designTextDefaults(lang);
    for (const key of DESIGN_TEXT_KEYS) {
      if (state.design[key] === undefined) state.design[key] = texts[key];
    }

    const defaults = defaultTemplates(lang);
    if (!defaults) return false;
    if (!Array.isArray(state.templates)) state.templates = [];

    const existingIds = new Set(state.templates.map(t => t.id));
    for (const def of defaults) {
      if (!existingIds.has(def.id)) state.templates.push(JSON.parse(JSON.stringify(def)));
    }
    // Vorschau-Beispiele sind nicht nutzer-editierbar: immer aus den Defaults
    // ziehen, damit gespeicherte Stände sie in der aktiven Sprache bekommen.
    const defaultById = new Map(defaults.map(def => [def.id, def]));
    for (const t of state.templates) {
      const def = defaultById.get(t.id);
      if (def) t.previewExamples = def.previewExamples;
    }
    return true;
  }

  function loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        state.design = { ...DEFAULT_DESIGN, ...parsed.design };
        state.templates = parsed.templates || [];
        state.activeTemplateId = parsed.activeTemplateId || 'ticket-note';
        state.activeStyle = parsed.activeStyle || 'modern-card';
        // Der gespeicherte Stand entscheidet, welche Migrationen laufen. Ohne
        // diese Zeile sähe migrateState() immer Schema 0 und heftete jeden
        // Stand an 'de', auch einen, der bewusst der Zone folgen soll.
        state.varSchema = parsed.varSchema;
        migrateState(state);
        applyAudienceStyleLock();
        return true;
      }
    } catch (e) {
      console.warn('Could not load from localStorage:', e);
    }
    return false;
  }

  // ── JSON Export ──
  // ── ZIP-Writer (store-only) ──
  // Kompressionsmethode 0, von Hand gebaut. Jede fertige Bibliothek bräuchte
  // einen Bundler (widerspricht der No-Build-Vorgabe) oder ein CDN — und
  // script-src 'self' in vercel.json ließe ein CDN-Skript ohnehin nicht zu.
  // Ein store-only-Archiv ist für Text ohnehin kaum größer als ein gepacktes,
  // und jedes Betriebssystem öffnet es ohne Zusatzwerkzeug.

  let crcTable = null;
  function crc32(bytes) {
    if (!crcTable) {
      crcTable = new Uint32Array(256);
      for (let i = 0; i < 256; i++) {
        let c = i;
        // IEEE-Polynom, reflektiert.
        for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        crcTable[i] = c >>> 0;
      }
    }
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) {
      crc = crcTable[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  // entries: [{ name, text }] — name ist ein reiner ASCII-Pfad, siehe
  // buildTemplateArchive(). Rückgabe: Blob mit MIME application/zip.
  function makeStoreZip(entries) {
    const encoder = new TextEncoder();
    const files = entries.map(e => ({
      nameBytes: encoder.encode(e.name),
      data: encoder.encode(e.text)
    }));

    const LOCAL_HEADER = 30;
    const CENTRAL_HEADER = 46;
    const EOCD = 22;
    let localSize = 0;
    let centralSize = 0;
    for (const f of files) {
      localSize += LOCAL_HEADER + f.nameBytes.length + f.data.length;
      centralSize += CENTRAL_HEADER + f.nameBytes.length;
    }

    const out = new Uint8Array(localSize + centralSize + EOCD);
    const view = new DataView(out.buffer);
    let offset = 0;
    const offsets = [];

    for (const f of files) {
      offsets.push(offset);
      const crc = crc32(f.data);
      view.setUint32(offset, 0x04034B50, true);      // Local File Header
      view.setUint16(offset + 4, 20, true);          // benötigte Version
      // Bit 11: Dateiname ist UTF-8. Die Namen sind zwar ASCII, aber das Flag
      // zu setzen kostet nichts und macht die Zusage explizit.
      view.setUint16(offset + 6, 0x0800, true);
      view.setUint16(offset + 8, 0, true);           // Methode 0 = store
      view.setUint16(offset + 10, 0, true);          // Uhrzeit
      view.setUint16(offset + 12, 0x0021, true);     // Datum: 1980-01-01
      view.setUint32(offset + 14, crc, true);
      view.setUint32(offset + 18, f.data.length, true); // komprimiert …
      view.setUint32(offset + 22, f.data.length, true); // … und unkomprimiert, bei Methode 0 gleich
      view.setUint16(offset + 26, f.nameBytes.length, true);
      view.setUint16(offset + 28, 0, true);          // kein Extra-Feld
      offset += LOCAL_HEADER;
      out.set(f.nameBytes, offset); offset += f.nameBytes.length;
      out.set(f.data, offset); offset += f.data.length;
      f.crc = crc;
    }

    const centralStart = offset;
    files.forEach((f, i) => {
      view.setUint32(offset, 0x02014B50, true);      // Central Directory
      view.setUint16(offset + 4, 20, true);          // erzeugende Version
      view.setUint16(offset + 6, 20, true);          // benötigte Version
      view.setUint16(offset + 8, 0x0800, true);
      view.setUint16(offset + 10, 0, true);
      view.setUint16(offset + 12, 0, true);
      view.setUint16(offset + 14, 0x0021, true);
      view.setUint32(offset + 16, f.crc, true);
      view.setUint32(offset + 20, f.data.length, true);
      view.setUint32(offset + 24, f.data.length, true);
      view.setUint16(offset + 28, f.nameBytes.length, true);
      view.setUint16(offset + 30, 0, true);          // Extra
      view.setUint16(offset + 32, 0, true);          // Kommentar
      view.setUint16(offset + 34, 0, true);          // Datenträger
      view.setUint16(offset + 36, 0, true);          // interne Attribute
      view.setUint32(offset + 38, 0, true);          // externe Attribute
      view.setUint32(offset + 42, offsets[i], true); // Offset des Local Headers
      offset += CENTRAL_HEADER;
      out.set(f.nameBytes, offset); offset += f.nameBytes.length;
    });

    view.setUint32(offset, 0x06054B50, true);        // End of Central Directory
    view.setUint16(offset + 4, 0, true);
    view.setUint16(offset + 6, 0, true);
    view.setUint16(offset + 8, files.length, true);
    view.setUint16(offset + 10, files.length, true);
    view.setUint32(offset + 12, offset - centralStart, true);
    view.setUint32(offset + 16, centralStart, true);
    view.setUint16(offset + 20, 0, true);            // Archiv-Kommentar

    return new Blob([out], { type: 'application/zip' });
  }

  // ── Bulk-Export aller Vorlagen ──
  function exportAllTemplates() {
    readDesignFromUI();

    // generateEmailHtml() und generateEmailText() lesen den Style nicht aus
    // einem Parameter, sondern aus state.activeStyle. Ohne die Umschaltung je
    // Vorlage käme internal-notification im Kundenlayout heraus — oder, wenn
    // gerade der interne Stil aktiv ist, alle Kundenvorlagen im internen.
    // Die Regel ist dieselbe wie in applyAudienceStyleLock().
    const previousStyle = state.activeStyle;
    const entries = [];
    const index = [];

    for (const template of state.templates) {
      state.activeStyle = template.id === 'internal-notification'
        ? 'internal-minimal'
        : (previousStyle === 'internal-minimal' ? 'modern-card' : previousStyle);

      // useExampleData bleibt false, wie bei den Kopier-Buttons: im Export
      // sollen die [Ticket: …]-Tokens stehen, nicht die Beispielwerte.
      entries.push({ name: template.id + '/betreff.txt', text: template.subject || '' });
      entries.push({ name: template.id + '/mail.html', text: generateEmailHtml(template, state.design, false) });
      entries.push({ name: template.id + '/mail.txt', text: generateEmailText(template, state.design, false) });
      index.push('  ' + template.id + '  —  ' + (template.name || template.id));
    }

    state.activeStyle = previousStyle;

    const zone = getZone();
    entries.unshift({
      name: 'README.txt',
      text: [
        t('zip.readmeTitle'), '',
        t('zip.readmeIntro'), '',
        '  ' + t('zip.readmeSubject'),
        '  ' + t('zip.readmeHtml'),
        '  ' + t('zip.readmeText'), '',
        t('zip.readmeNote', { zone: zone.id, lang: ZONE_LANG_LABELS[zone.lang] }),
        // Der Rahmentext folgt der Oberflächensprache, der Inhalt der Ordner der
        // Vorlagensprache — deshalb steht sie hier ausdrücklich dabei.
        t('zip.readmeTemplateLang', { lang: ZONE_LANG_LABELS[templateLang()] }), '',
        t('zip.readmeIndex'), '',
        index.join('\n'), ''
      ].join('\n')
    });

    const blob = makeStoreZip(entries);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = t('export.zipFilename', { date: new Date().toISOString().slice(0, 10) }) + '.zip';
    a.click();
    URL.revokeObjectURL(url);
    showToast(t('toast.exportedAll', { count: state.templates.length }));
  }

  function exportConfig() {
    readDesignFromUI();
    const data = {
      version: 1,
      exportDate: new Date().toISOString(),
      varSchema: state.varSchema,
      design: state.design,
      templates: state.templates,
      activeStyle: state.activeStyle
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = t('export.filename', { date: new Date().toISOString().slice(0, 10) }) + '.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast(t('toast.exported'));
  }

  // ── Apply Config (shared by import and share link loading) ──
  async function applyConfig(data) {
    // Die Oberflächensprache ist eine Einstellung des Lesers, keine Eigenschaft
    // der Konfiguration. Ohne diese Zeile zwänge ein geteilter Link oder ein
    // importiertes JSON dem Empfänger die Sprache des Absenders auf.
    // Die Vorlagensprache dagegen gehört zur Konfiguration — sie bestimmt, in
    // welcher Sprache die Vorlagen verfasst sind, und reist im design-Objekt mit.
    const keepUiLang = state.design.uiLang;
    if (data.design) state.design = { ...DEFAULT_DESIGN, ...data.design, uiLang: keepUiLang };
    if (data.templates) state.templates = data.templates;
    // Der Stand der geladenen Konfiguration zählt, nicht der der laufenden
    // Sitzung — sonst überspringt ein Import in eine bereits migrierte Sitzung
    // die Token-Reparatur.
    state.varSchema = data.varSchema;
    migrateState(state);
    // Erst jetzt steht die Vorlagensprache der Nutzlast fest.
    await applyLocaleDefaults();
    state.activeTemplateId = state.templates[0]?.id || 'ticket-note';
    state.activeStyle = data.activeStyle || 'modern-card';
    applyAudienceStyleLock();
    writeDesignToUI();
    renderStyleTabs();
    renderTemplateTabs();
    renderSectionToggles();
    renderTemplateConfig();
    renderSubjectField();
    updateTemplateLangSwitch();
    onStateChange();
  }

  // ── JSON Import ──
  function importConfig(file) {
    const reader = new FileReader();
    // async, weil applyConfig() die Vorlagentexte nachlädt — ohne await liefe
    // der Toast vor der Migration und ein Reject entkäme dem catch.
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        await applyConfig(data);
        showToast(t('toast.imported'));
      } catch (err) {
        showToast(t('toast.importFailed'));
        console.error(err);
      }
    };
    reader.readAsText(file);
  }

  // ── Share Link Codec ──
  // SHARE_FRAGMENT_PREFIX steht oben bei den Konstanten, weil die Intro-Karte
  // sie beim Start auswertet — dort wäre sie hier noch nicht initialisiert.
  //
  // Ein Fragment ist beliebig manipulierbar. Ohne Obergrenze könnte eine gzip-Bombe
  // den Tab lahmlegen; der reale Worst Case (alle Vorlagen angepasst) liegt bei 12,8 KB.
  const SHARE_MAX_DECOMPRESSED_BYTES = 256 * 1024;

  function bytesToBase64Url(bytes) {
    // Blockweise, weil String.fromCharCode(...bytes) bei großen Arrays den Stack sprengt.
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function base64UrlToBytes(str) {
    if (!/^[A-Za-z0-9_-]+$/.test(str)) throw new Error('Ungültige base64url-Daten');
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const rest = b64.length % 4;
    if (rest === 1) throw new Error('Ungültige base64url-Länge');
    const bin = atob(b64 + '='.repeat(rest ? 4 - rest : 0));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  async function encodeShareFragment(config) {
    const raw = new TextEncoder().encode(JSON.stringify(config));
    const stream = new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'));
    return bytesToBase64Url(new Uint8Array(await new Response(stream).arrayBuffer()));
  }

  async function decodeShareFragment(encoded) {
    const stream = new Blob([base64UrlToBytes(encoded)]).stream()
      .pipeThrough(new DecompressionStream('gzip'));

    // Gestreamt gelesen und mitgezählt, damit die Obergrenze greift, bevor der
    // Inhalt vollständig im Speicher liegt. new Response(stream).text() wäre hier
    // unbrauchbar — es puffert alles und macht die Grenze wirkungslos.
    const reader = stream.getReader();
    const chunks = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > SHARE_MAX_DECOMPRESSED_BYTES) {
        await reader.cancel();
        throw new Error('Fragment überschreitet die zulässige Größe');
      }
      chunks.push(value);
    }

    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }

    // Der abgelöste Endpunkt wies Payloads ohne version/design ab — geprüft wird
    // weiterhin, nur eben hier. Ohne die Typprüfung auf templates würde
    // applyConfig() den State halb überschreiben und dann mittendrin scheitern.
    const config = JSON.parse(new TextDecoder().decode(bytes));
    const valid =
      config && typeof config === 'object' && !Array.isArray(config) &&
      config.version && config.design && typeof config.design === 'object' &&
      (config.templates === undefined || Array.isArray(config.templates));
    if (!valid) throw new Error('Fragment enthält keine gültige Konfiguration');
    return config;
  }

  // ── Create Share Link ──
  async function createShareLink() {
    const popover = $('#share-popover');
    const stateLoading = $('#share-state-loading');
    const stateSuccess = $('#share-state-success');
    const stateError = $('#share-state-error');

    popover.classList.add('open');
    stateLoading.style.display = '';
    stateSuccess.style.display = 'none';
    stateError.style.display = 'none';

    readDesignFromUI();
    const payload = {
      version: 1,
      varSchema: state.varSchema,
      design: state.design,
      templates: state.templates,
      activeStyle: state.activeStyle
    };

    try {
      const encoded = await encodeShareFragment(payload);
      stateLoading.style.display = 'none';
      stateSuccess.style.display = '';
      $('#share-url-input').value =
        window.location.origin + '/' + SHARE_FRAGMENT_PREFIX + encoded;
      $('#share-hint').textContent = t('share.hint');

    } catch (err) {
      stateLoading.style.display = 'none';
      stateError.style.display = '';
      $('#share-error-msg').textContent =
        'Link konnte nicht erstellt werden. Bitte erneut versuchen.';
      console.error('Share link error:', err);
    }
  }

  // ── Load From Share Link ──
  async function loadFromShareFragment(encoded) {
    try {
      const data = await decodeShareFragment(encoded);
      const accepted = await showConfirmModal();

      if (accepted) {
        await applyConfig(data);
        showToast(t('toast.shareLoaded'));
      }
    } catch (err) {
      showToast(t('toast.shareInvalid'));
      console.error('Share link load error:', err);
    }
    window.history.replaceState({}, '', '/');
  }

  // ── Show Confirm Modal ──
  function showConfirmModal(title, message) {
    return new Promise((resolve) => {
      const overlay = $('#confirm-modal-overlay');
      if (title) overlay.querySelector('h3').textContent = title;
      if (message) overlay.querySelector('p').textContent = message;
      overlay.classList.add('active');

      function cleanup() {
        overlay.classList.remove('active');
        $('#confirm-modal-accept').removeEventListener('click', onAccept);
        $('#confirm-modal-cancel').removeEventListener('click', onCancel);
        _cancelModal = function () {};
      }

      function onAccept() { cleanup(); resolve(true); }
      function onCancel() { cleanup(); resolve(false); }

      _cancelModal = () => { cleanup(); resolve(false); };

      $('#confirm-modal-accept').addEventListener('click', onAccept);
      $('#confirm-modal-cancel').addEventListener('click', onCancel);

      overlay.addEventListener('click', function handler(e) {
        if (e.target === overlay) {
          overlay.removeEventListener('click', handler);
          cleanup();
          resolve(false);
        }
      });
    });
  }

  // ── Copy to Clipboard ──
  async function copyToClipboard(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(t('toast.copied', { label }));
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast(t('toast.copied', { label }));
    }
  }

  // ── Sync color inputs ──
  function syncColorInputs(colorId, textId) {
    const color = $(colorId);
    const text = $(textId);
    color.addEventListener('input', () => {
      text.value = color.value;
      readDesignFromUI();
      onStateChange();
    });
    text.addEventListener('input', () => {
      if (/^#[0-9a-fA-F]{6}$/.test(text.value)) {
        color.value = text.value;
      }
      readDesignFromUI();
      onStateChange();
    });
  }

  // ── Accordion Initialization ──
  function initAccordions() {
    $$('.sidebar-section-header').forEach(header => {
      header.addEventListener('click', () => {
        header.closest('.sidebar-section').classList.toggle('collapsed');
      });
    });
  }

  // ── Initialize ──
  async function init() {
    // Beide Abrufe parallel: die Locale braucht keine Variablen und umgekehrt.
    // curated.json muss vor loadFromLocalStorage stehen, weil die Reparatur
    // alter Stände die Übersetzungstabelle braucht; die Locale muss stehen,
    // bevor irgendeine Render-Funktion das erste Mal Text erzeugt.
    const uiLang = detectUiLang();
    // Die Vorlagensprache wird roh vorgelesen, damit ihr Bundle im selben
    // Promise.all mitkommt. Trifft die Vorbelegung daneben, holt
    // applyLocaleDefaults() das richtige nach — hier geht es nur um den Abruf.
    const guessedTemplateLang = detectTemplateLang();
    const [curatedResult, localeResult] = await Promise.all([
      fetch('/psa/autotask/curated.json')
        .then(r => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
        .catch(e => { console.error('Could not load PSA variables:', e); return null; }),
      loadLocale(uiLang),
      // Nur wenn sie sich unterscheiden: sonst liefen zwei Abrufe derselben
      // Datei parallel, weil der Cache erst nach dem ersten gefüllt ist.
      guessedTemplateLang === uiLang ? null : loadLocale(guessedTemplateLang)
    ]);

    curatedVars = curatedResult;
    // Ohne Locale bleiben die deutschen Texte aus dem Markup stehen — lesbar,
    // statt einer Seite voller Schlüsselnamen.
    strings = localeResult || {};
    if (!curatedVars) showToast(t('toast.varsFailed'));

    // Zonen-Dropdown befüllen, bevor writeDesignToUI die Auswahl setzt
    renderZoneOptions();

    // Load state from localStorage
    loadFromLocalStorage();

    // Vorlagen und Platzhalter-Firmendaten in der jetzt feststehenden
    // Vorlagensprache. Erst hier, weil tokenFor() curated.json braucht.
    await applyLocaleDefaults();
    applyAudienceStyleLock();

    // Die erkannte Sprache gewinnt gegen den gespeicherten Stand: nur so wirkt
    // ?lang= auf einem Gerät, das bereits eine andere Wahl gespeichert hat.
    state.design.uiLang = localeResult ? uiLang : DEFAULT_UI_LANG;
    applyStaticTranslations();

    // Write design to UI
    writeDesignToUI();

    // Render all UI components
    renderStyleTabs();
    renderTemplateTabs();
    renderSectionToggles();
    renderTemplateConfig();
    renderSubjectField();
    updateTemplateLangSwitch();

    // Initial render
    renderPreview();
    renderCodeOutput();

    // Initialize accordions and badges
    initAccordions();
    updateSidebarBadges();

    // ── Design System Event Listeners ──
    syncColorInputs('#ds-primary-color', '#ds-primary-color-text');
    syncColorInputs('#ds-text-color', '#ds-text-color-text');
    syncColorInputs('#ds-accent-color', '#ds-accent-color-text');

    const designInputs = [
      '#ds-logo', '#ds-company', '#ds-claim', '#ds-address',
      '#ds-phone', '#ds-web', '#ds-certs', '#ds-font',
      '#ds-legal-ceo', '#ds-legal-court', '#ds-legal-regnr',
      '#ds-legal-vatid', '#ds-legal-imprint', '#ds-legal-privacy',
      '#ds-booking-url', '#ds-booking-text',
      '#ds-portal-url', '#ds-portal-text',
      '#ds-autotask-url', '#ds-autotask-link-text'
    ];
    for (const sel of designInputs) {
      $(sel).addEventListener('input', () => {
        readDesignFromUI();
        onStateChange();
      });
      $(sel).addEventListener('change', () => {
        readDesignFromUI();
        onStateChange();
      });
    }

    // ── Autotask Zone ──
    $('#ds-autotask-zone').addEventListener('change', async function () {
      await onZoneChange(this.value);
    });

    // ── Vorlagensprache ──
    for (const btn of $$('#template-lang-switch button')) {
      btn.addEventListener('click', async () => {
        const previous = templateLang();
        const ok = await setTemplateLang(btn.dataset.templateLang, { explicit: true });
        if (!ok) return;
        writeDesignToUI();
        renderTemplateTabs();
        renderTemplateConfig();
        renderSubjectField();
        onStateChange();
        if (templateLang() !== previous) {
          showToast(t('toast.templateLangSwitched', { lang: ZONE_LANG_LABELS[templateLang()] }));
        }
      });
    }

    // ── Autotask URL blur validation ──
    $('#ds-autotask-url').addEventListener('blur', function() {
      const result = validateAutotaskUrl(this.value);
      if (result.warn === 'bad-protocol') {
        this.value = '';
        readDesignFromUI();
        onStateChange();
        showToast(t('toast.badProtocol'));
      }
      updateSidebarBadges();
    });

    // ── Logo / Booking active toggles ──
    $('#ds-logo-enabled').addEventListener('change', () => {
      readDesignFromUI();
      onStateChange();
    });
    $('#ds-booking-active').addEventListener('change', () => {
      readDesignFromUI();
      onStateChange();
    });

    // ── Subject field ──
    $('#template-subject').addEventListener('input', () => {
      const t = getActiveTemplate();
      if (t) t.subject = $('#template-subject').value;
      onStateChange();
    });
    document.querySelector('.subject-row .btn-insert-var').addEventListener('click', () => {
      openVarPicker((variable) => {
        const input = $('#template-subject');
        insertAtCursor(input, variable);
        const t = getActiveTemplate();
        if (t) t.subject = input.value;
        onStateChange();
      });
    });

    // ── Device toggle ──
    $$('.device-toggle button').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.device-toggle button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (btn.dataset.device === 'mobile') {
          $('#preview-frame').classList.add('mobile');
        } else {
          $('#preview-frame').classList.remove('mobile');
        }
      });
    });

    // ── Code view toggle ──
    $('#btn-show-code').addEventListener('click', () => {
      renderCodeOutput();
      $('#preview-panel').classList.add('hidden');
      $('#code-panel').classList.add('active');
    });
    $('#btn-show-preview').addEventListener('click', () => {
      $('#code-panel').classList.remove('active');
      $('#preview-panel').classList.remove('hidden');
    });

    // ── Copy buttons ──
    $('#btn-copy-code').addEventListener('click', () => {
      const template = getActiveTemplate();
      if (!template) return;
      const html = generateEmailHtml(template, state.design, false);
      copyToClipboard(html, t('copy.html'));
    });
    $('#btn-copy-code-2').addEventListener('click', () => {
      const template = getActiveTemplate();
      if (!template) return;
      const html = generateEmailHtml(template, state.design, false);
      copyToClipboard(html, t('copy.html'));
    });
    const copyTextHandler = () => {
      const template = getActiveTemplate();
      if (!template) return;
      const text = generateEmailText(template, state.design, false);
      copyToClipboard(text, t('copy.text'));
    };
    $('#btn-copy-text').addEventListener('click', copyTextHandler);
    $('#btn-copy-text-2').addEventListener('click', copyTextHandler);
    $('#btn-copy-subject').addEventListener('click', () => {
      const template = getActiveTemplate();
      if (!template) return;
      copyToClipboard(template.subject, t('copy.subject'));
    });

    // ── Variable picker ──
    $('#btn-vars').addEventListener('click', () => {
      openVarPicker((variable) => {
        copyToClipboard(variable, t('copy.variable'));
      });
    });
    $('#var-picker-close').addEventListener('click', closeVarPicker);
    $('#var-picker-overlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeVarPicker();
    });
    $('#var-search').addEventListener('input', (e) => {
      renderVarPickerBody(e.target.value);
    });
    // Delegiert statt ein Listener je Eintrag — der Katalog bringt ueber 1.400.
    $('#var-picker-body').addEventListener('click', (e) => {
      const item = e.target.closest('.var-item');
      if (!item) return;
      if (varPickerCallback) varPickerCallback(item.querySelector('.var-item-name').textContent);
      closeVarPicker();
    });

    // ── Export / Import ──
    $('#btn-export').addEventListener('click', exportConfig);
    $('#btn-export-all').addEventListener('click', exportAllTemplates);
    $('#btn-import').addEventListener('click', () => {
      $('#import-file').click();
    });
    $('#import-file').addEventListener('change', (e) => {
      if (e.target.files[0]) {
        importConfig(e.target.files[0]);
        e.target.value = '';
      }
    });

    // ── Reset ──
    $('#btn-reset').addEventListener('click', async () => {
      const accepted = await showConfirmModal(
        t('modal.resetTitle'),
        t('modal.resetText')
      );
      if (accepted) {
        localStorage.removeItem(STORAGE_KEY);
        // Die Oberflächensprache überlebt das Zurücksetzen: der Dialog
        // verspricht, die Konfiguration zurückzusetzen — nicht, die Seite
        // unter der Hand auf eine andere Sprache zu stellen.
        const keepUiLang = state.design.uiLang;
        state.design = { ...DEFAULT_DESIGN, uiLang: keepUiLang };
        // templateLang faellt auf null zurueck — die Vorlagensprache folgt
        // wieder der Zone, die hier ebenfalls auf den Default zurueckgeht.
        state.templates = [];
        await applyLocaleDefaults();
        state.activeTemplateId = 'ticket-note';
        state.activeStyle = 'modern-card';
        writeDesignToUI();
        renderStyleTabs();
        renderTemplateTabs();
        renderSectionToggles();
        renderTemplateConfig();
        renderSubjectField();
        updateTemplateLangSwitch();
        onStateChange();
        showToast(t('toast.reset'));
      }
    });

    // ── Share ──
    $('#btn-share').addEventListener('click', (e) => {
      e.stopPropagation();
      createShareLink();
    });
    $('#share-popover-close').addEventListener('click', () => {
      $('#share-popover').classList.remove('open');
    });
    $('#btn-copy-share-url').addEventListener('click', () => {
      const url = $('#share-url-input').value;
      copyToClipboard(url, t('copy.link'));
    });
    $('#btn-share-retry').addEventListener('click', () => {
      createShareLink();
    });
    document.addEventListener('click', (e) => {
      const popover = $('#share-popover');
      const wrapper = $('#share-popover-wrapper');
      if (popover.classList.contains('open') && !wrapper.contains(e.target)) {
        popover.classList.remove('open');
      }
    });

    // ── Sponsor dropdown ──
    $('#btn-sponsor').href = SPONSOR_GITHUB_URL;

    // ── Sprachumschalter ──
    for (const btn of $$('#lang-switch button')) {
      btn.addEventListener('click', () => setUiLang(btn.dataset.uiLang));
    }

    // ── Footer links ──
    $('#footer-brand-link').href = COMPANY_URL;

    // ── Share link detection ──
    if (window.location.hash.startsWith(SHARE_FRAGMENT_PREFIX)) {
      loadFromShareFragment(window.location.hash.slice(SHARE_FRAGMENT_PREFIX.length));
    }

    // ── Keyboard shortcuts ──
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeVarPicker();
        $('#share-popover').classList.remove('open');
        _cancelModal();
      }
    });
  }

  // Boot
  init();
})();
