/* ============================================
   erwins enkel — PSA Templates
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
    try {
      const resp = await fetch('/i18n/' + lang + '.json');
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      return await resp.json();
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

  // ── Mobile Warning ──
  const mobileWarning = document.getElementById('mobile-warning');
  const mobileWarningDismiss = document.getElementById('mobile-warning-dismiss');
  if (mobileWarningDismiss) {
    mobileWarningDismiss.addEventListener('click', () => {
      mobileWarning.classList.add('dismissed');
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
  const DEFAULT_DESIGN = {
    primaryColor: '#2c3e50',
    textColor: '#333333',
    accentColor: '#888888',
    logoUrl: '',
    logoEnabled: true,
    company: 'Muster GmbH',
    claim: 'Ihr IT-Dienstleister',
    address: 'Musterstraße 1, 10115 Berlin',
    phone: '+49 30 123 456 789',
    web: 'https://www.example.com',
    certs: '',
    font: 'Arial,Helvetica,sans-serif',
    legalCeo: 'Max Mustermann',
    legalCourt: 'AG Berlin-Charlottenburg',
    legalRegNr: 'HRB 12345 B',
    legalVatId: 'DE123456789',
    legalImprintUrl: 'https://www.example.com/impressum/',
    legalPrivacyUrl: 'https://www.example.com/datenschutz/',
    bookingUrl: '',
    bookingText: 'Jetzt Termin buchen',
    bookingActive: false,
    portalUrl: '',
    portalText: 'Kundenportal öffnen',
    autotaskZone: 'ww18',
    // Passend zur Default-Zone vorbelegt. Gespeicherte Stände überschreiben das,
    // eine leer gelassene URL bleibt also leer.
    autotaskUrl: zoneUrlFor(AUTOTASK_ZONES[0]),
    autotaskLinkText: 'In Autotask öffnen',
    // Sprache der Bedienoberfläche. Liegt hier, damit saveToLocalStorage() sie
    // ohne Sonderweg mitschreibt — applyConfig() nimmt sie aber bewusst NICHT
    // aus einer geladenen Nutzlast, siehe dort.
    uiLang: DEFAULT_UI_LANG
  };

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

  // ── Notification Type Defaults ──
  const NOTIFICATION_TYPE_DEFAULTS = {
    queue: {
      subjectPrefix: '[Queue]',
      previewText: 'Neues Ticket in der Queue.',
      intro: 'Ein neues Ticket ist in der Queue eingegangen und wartet auf Zuweisung.\n\nTitel: [Ticket: Titel]\nPriorität: [Ticket: Priorität]\nKunde: [Firma: Name]'
    },
    assigned: {
      subjectPrefix: '[Assigned]',
      previewText: 'Ticket wurde dir zugewiesen.',
      intro: 'Hallo [Mitarbeiter: Vorname],\n\ndir wurde ein Ticket zugewiesen.\n\nTitel: [Ticket: Titel]\nPriorität: [Ticket: Priorität]\nKunde: [Firma: Name]'
    },
    sla: {
      subjectPrefix: '[SLA]',
      previewText: 'SLA-Warnung: Ticket nähert sich Fälligkeit.',
      intro: 'Achtung: Das folgende Ticket nähert sich der SLA-Fälligkeit.\n\nTitel: [Ticket: Titel]\nFälligkeit: [Ticket: Fälligkeitsdatum]\nPriorität: [Ticket: Priorität]'
    }
  };

  function buildNotificationSubject(type) {
    const prefix = NOTIFICATION_TYPE_DEFAULTS[type]?.subjectPrefix || '[Queue]';
    return `${prefix} [Ticket: Nummer]: [Ticket: Titel]`;
  }

  // ── Default Templates ──
  const DEFAULT_TEMPLATES = [
    {
      id: 'ticket-note',
      name: 'Ticket-Note an Kunde',
      audience: 'customer',
      subject: '[Ticket: Notiztitel] / [Ticket: Nummer]',
      sections: {
        previewText: true,
        header: true,
        ticketInfo: true,
        messageBody: true,
        ctaButton: true,
        bookingButton: false,
        kundenportal: false,
        signature: true,
        footer: true,
        legalFooter: true
      },
      config: {
        previewTextVar: '[Ticket: Beschreibung der Notiz]',
        messageBodyVar: '[Ticket: Beschreibung der Notiz]',
        ctaText: 'Ticket im Portal ansehen',
        ctaLink: '[Ticket: Nummer (mit Link)]',
        footerText: 'Diese Nachricht bezieht sich auf Ticket [Ticket: Nummer]. Bitte antworten Sie direkt auf diese E-Mail oder nutzen Sie das Kundenportal.',
        customHeading: '',
        customIntro: '',
        headerColorOverride: ''
      }
    },
    {
      id: 'ticket-accepted',
      name: 'Ticket angenommen',
      audience: 'customer',
      subject: 'Ihr Ticket [Ticket: Nummer] wird bearbeitet',
      sections: {
        previewText: true,
        header: true,
        ticketInfo: true,
        messageBody: true,
        ctaButton: true,
        bookingButton: false,
        kundenportal: false,
        signature: true,
        footer: true,
        legalFooter: true
      },
      config: {
        previewTextVar: 'Ihr Ticket wurde angenommen und wird bearbeitet.',
        messageBodyVar: '',
        ctaText: 'Ticket im Portal ansehen',
        ctaLink: '[Ticket: Nummer (mit Link)]',
        footerText: 'Diese Nachricht bezieht sich auf Ticket [Ticket: Nummer]. Bitte antworten Sie direkt auf diese E-Mail oder nutzen Sie das Kundenportal.',
        customHeading: 'Ihr Ticket wird bearbeitet',
        customIntro: 'Guten Tag [Kontakt: Vorname] [Kontakt: Nachname],\n\nIhr Ticket wurde von unserem Team angenommen und wird nun bearbeitet.\n\nUnser Techniker [Diverses: Initiator - Name] kümmert sich um Ihr Anliegen. Wir melden uns bei Ihnen, sobald wir weitere Informationen haben.',
        headerColorOverride: ''
      }
    },
    {
      id: 'ticket-confirmation',
      name: 'Eingangsbestätigung',
      audience: 'customer',
      subject: 'Eingangsbestätigung: [Ticket: Titel] / [Ticket: Nummer]',
      sections: {
        previewText: true,
        header: true,
        ticketInfo: true,
        messageBody: true,
        ctaButton: true,
        bookingButton: false,
        kundenportal: false,
        signature: false,
        footer: true,
        legalFooter: true
      },
      config: {
        previewTextVar: 'Wir haben Ihre Anfrage erhalten und ein Ticket erstellt.',
        messageBodyVar: '',
        ctaText: 'Ticket im Portal ansehen',
        ctaLink: '[Ticket: Nummer (mit Link)]',
        footerText: 'Diese Nachricht bezieht sich auf Ticket [Ticket: Nummer]. Bitte antworten Sie direkt auf diese E-Mail oder nutzen Sie das Kundenportal.',
        customHeading: 'Wir haben Ihre Anfrage erhalten',
        customIntro: 'Guten Tag [Kontakt: Vorname] [Kontakt: Nachname],\n\nvielen Dank für Ihre Nachricht. Wir haben Ihre Anfrage erhalten und unter der Ticketnummer [Ticket: Nummer] erfasst.\n\nUnser Team wird sich in Kürze mit Ihnen in Verbindung setzen.',
        headerColorOverride: ''
      }
    },
    {
      id: 'ticket-closed',
      name: 'Ticket geschlossen',
      audience: 'customer',
      subject: 'Ihr Ticket [Ticket: Nummer] wurde gelöst',
      sections: {
        previewText: true,
        header: true,
        ticketInfo: true,
        messageBody: true,
        ctaButton: true,
        bookingButton: false,
        kundenportal: false,
        signature: true,
        footer: true,
        legalFooter: true
      },
      config: {
        previewTextVar: 'Ihr Ticket wurde erfolgreich gelöst.',
        messageBodyVar: '',
        ctaText: 'Feedback geben',
        ctaLink: '[Ticket: Nummer (mit Link)]',
        footerText: 'Diese Nachricht bezieht sich auf Ticket [Ticket: Nummer]. Bitte antworten Sie direkt auf diese E-Mail oder nutzen Sie das Kundenportal.',
        customHeading: 'Ihr Ticket wurde gelöst',
        customIntro: 'Guten Tag [Kontakt: Vorname] [Kontakt: Nachname],\n\nIhr Ticket [Ticket: Nummer] wurde bearbeitet und als gelöst markiert.\n\nZusammenfassung: [Ticket: Titel]\n\nLösung:\n[Ticket: Beschreibung der Notiz]\n\nSollte das Problem erneut auftreten oder Sie weitere Fragen haben, können Sie jederzeit auf diese E-Mail antworten oder ein neues Ticket erstellen.\n\nWir freuen uns über Ihr Feedback — nutzen Sie dafür gerne den Button unten.',
        headerColorOverride: ''
      }
    },
    {
      id: 'ticket-escalated',
      name: 'Ticket eskaliert',
      audience: 'customer',
      subject: 'Ihr Ticket [Ticket: Nummer] wurde eskaliert',
      sections: {
        previewText: true,
        header: true,
        ticketInfo: true,
        messageBody: true,
        ctaButton: true,
        bookingButton: false,
        kundenportal: false,
        signature: true,
        footer: true,
        legalFooter: true
      },
      config: {
        previewTextVar: 'Ihr Ticket wurde an einen Spezialisten übergeben.',
        messageBodyVar: '[Ticket: Beschreibung der Notiz]',
        ctaText: 'Ticket im Portal ansehen',
        ctaLink: '[Ticket: Nummer (mit Link)]',
        footerText: 'Diese Nachricht bezieht sich auf Ticket [Ticket: Nummer]. Bitte antworten Sie direkt auf diese E-Mail oder nutzen Sie das Kundenportal.',
        customHeading: 'Ihr Ticket wurde an einen Spezialisten übergeben',
        customIntro: 'Guten Tag [Kontakt: Vorname] [Kontakt: Nachname],\n\num Ihr Anliegen bestmöglich zu lösen, haben wir Ihr Ticket an einen spezialisierten Techniker übergeben.\n\nGrund der Eskalation:',
        headerColorOverride: ''
      }
    },
    {
      id: 'ticket-feedback-request',
      name: 'Rückfrage an Kunde',
      audience: 'customer',
      subject: 'Rückfrage zu Ihrem Ticket [Ticket: Nummer]',
      sections: {
        previewText: true,
        header: true,
        ticketInfo: true,
        messageBody: true,
        ctaButton: true,
        bookingButton: false,
        kundenportal: false,
        signature: true,
        footer: true,
        legalFooter: true
      },
      config: {
        previewTextVar: 'Wir benötigen Ihre Rückmeldung zu Ihrem Ticket.',
        messageBodyVar: '[Ticket: Beschreibung der Notiz]',
        ctaText: 'Jetzt antworten',
        ctaLink: '[Ticket: Nummer (mit Link)]',
        footerText: 'Bitte beachten Sie: Ihr Ticket [Ticket: Nummer] wartet auf Ihre Rückmeldung. Ohne Ihre Antwort können wir die Bearbeitung nicht fortsetzen.',
        customHeading: 'Wir benötigen Ihre Rückmeldung',
        customIntro: 'Guten Tag [Kontakt: Vorname] [Kontakt: Nachname],\n\nzur weiteren Bearbeitung Ihres Tickets benötigen wir eine Rückmeldung von Ihnen.\n\nUnsere Frage:',
        headerColorOverride: ''
      }
    },
    {
      id: 'sla-warning',
      name: 'SLA-Warnung',
      audience: 'customer',
      subject: 'Update zu Ihrem Ticket [Ticket: Nummer]',
      sections: {
        previewText: true,
        header: true,
        ticketInfo: true,
        messageBody: true,
        ctaButton: true,
        bookingButton: false,
        kundenportal: false,
        signature: true,
        footer: true,
        legalFooter: true
      },
      config: {
        previewTextVar: 'Wir arbeiten mit Hochdruck an Ihrem Ticket.',
        messageBodyVar: '',
        ctaText: 'Ticket im Portal ansehen',
        ctaLink: '[Ticket: Nummer (mit Link)]',
        footerText: 'Diese Nachricht bezieht sich auf Ticket [Ticket: Nummer]. Bitte antworten Sie direkt auf diese E-Mail oder nutzen Sie das Kundenportal.',
        customHeading: 'Wir arbeiten mit Hochdruck an Ihrem Ticket',
        customIntro: 'Guten Tag [Kontakt: Vorname] [Kontakt: Nachname],\n\nwir möchten Sie proaktiv über den Stand Ihres Tickets informieren.\n\nIhr Anliegen „[Ticket: Titel]" hat für uns hohe Priorität. Unser Team arbeitet intensiv an einer Lösung und wir haben Ihr Ticket entsprechend priorisiert.\n\nFälligkeitsdatum: [Ticket: Fälligkeitsdatum]\n\nSie können den aktuellen Status jederzeit im Kundenportal einsehen. Wir melden uns umgehend, sobald wir weitere Informationen haben.',
        headerColorOverride: ''
      }
    },
    {
      id: 'ticket-handover',
      name: 'Ticket-Übergabe (intern)',
      audience: 'internal',
      subject: '[Intern] Ticket-Übergabe: [Ticket: Titel] / [Ticket: Nummer]',
      sections: {
        previewText: true,
        header: true,
        ticketInfo: true,
        messageBody: true,
        ctaButton: false,
        bookingButton: false,
        kundenportal: false,
        signature: true,
        footer: true,
        legalFooter: false
      },
      config: {
        previewTextVar: 'Ticket-Übergabe: [Ticket: Titel]',
        messageBodyVar: '[Ticket: Beschreibung der Notiz]',
        ctaText: '',
        ctaLink: '',
        footerText: 'Interne Mitteilung — [Diverses: Ihr Firmenname] | Ticket [Ticket: Nummer]',
        customHeading: 'Ticket-Übergabe',
        customIntro: 'Hallo [Mitarbeiter: Vorname],\n\nfolgendes Ticket wird an dich übergeben.\n\nKunde: [Kontakt: Vorname] [Kontakt: Nachname] ([Firma: Name])\nErstellt am: [Ticket: Erstellungsdatum]\n\nBisherige Bearbeitung:',
        headerColorOverride: '#4a4a4a'
      }
    },
    {
      id: 'ticket-survey',
      name: 'Kundenzufriedenheits-Umfrage',
      audience: 'customer',
      subject: 'Wie war unser Service? Ticket [Ticket: Nummer]',
      sections: {
        previewText: true,
        header: true,
        ticketInfo: true,
        messageBody: true,
        ctaButton: true,
        bookingButton: false,
        kundenportal: false,
        signature: false,
        footer: true,
        legalFooter: true
      },
      config: {
        previewTextVar: 'Wir würden uns über Ihr Feedback freuen.',
        messageBodyVar: '',
        ctaText: 'Bewerten Sie unseren Service',
        ctaLink: '[Ticket: Nummer (mit Link)]',
        footerText: 'Diese Nachricht bezieht sich auf das abgeschlossene Ticket [Ticket: Nummer]. Vielen Dank für Ihr Vertrauen in [Diverses: Ihr Firmenname].',
        customHeading: 'Wie war unser Service?',
        customIntro: 'Guten Tag [Kontakt: Vorname] [Kontakt: Nachname],\n\nIhr Ticket [Ticket: Nummer] „[Ticket: Titel]" wurde kürzlich abgeschlossen.\n\nVielen Dank, dass Sie sich an uns gewandt haben. Ihre Meinung ist uns wichtig — sie hilft uns, unseren Service stetig zu verbessern.\n\nWir würden uns freuen, wenn Sie sich einen kurzen Moment Zeit nehmen, um unseren Service zu bewerten.',
        headerColorOverride: ''
      }
    },
    {
      id: 'ticket-booking',
      name: 'Termin zum Ticket buchen',
      audience: 'customer',
      subject: 'Terminvereinbarung zu Ihrem Ticket [Ticket: Nummer]',
      sections: {
        previewText: true,
        header: true,
        ticketInfo: true,
        messageBody: true,
        ctaButton: false,
        bookingButton: true,
        kundenportal: false,
        signature: true,
        footer: true,
        legalFooter: true
      },
      config: {
        previewTextVar: 'Wir möchten einen Termin mit Ihnen vereinbaren.',
        messageBodyVar: '[Ticket: Beschreibung der Notiz]',
        ctaText: 'Ticket im Portal ansehen',
        ctaLink: '[Ticket: Nummer (mit Link)]',
        footerText: 'Diese Nachricht bezieht sich auf Ticket [Ticket: Nummer]. Bitte antworten Sie direkt auf diese E-Mail oder nutzen Sie das Kundenportal.',
        customHeading: 'Terminvereinbarung zu Ihrem Ticket',
        customIntro: 'Guten Tag [Kontakt: Vorname] [Kontakt: Nachname],\n\nfür die weitere Bearbeitung Ihres Tickets möchten wir einen Termin mit Ihnen vereinbaren.\n\nBitte wählen Sie über den folgenden Link einen für Sie passenden Termin aus — ob Remote-Session oder Vor-Ort-Termin, wir richten uns nach Ihnen.\n\nZusätzliche Hinweise:',
        headerColorOverride: ''
      }
    },
    {
      id: 'internal-notification',
      name: 'Internal Notification',
      audience: 'internal',
      subject: buildNotificationSubject('queue'),
      sections: {
        previewText: true,
        header: false,
        ticketInfo: false,
        messageBody: true,
        ctaButton: true,
        bookingButton: false,
        kundenportal: false,
        signature: false,
        footer: false,
        legalFooter: false
      },
      config: {
        notificationType: 'queue',
        previewTextVar: NOTIFICATION_TYPE_DEFAULTS.queue.previewText,
        messageBodyVar: '',
        ctaText: '',
        ctaLink: '',
        footerText: '',
        customHeading: '[Ticket: Nummer]',
        customIntro: NOTIFICATION_TYPE_DEFAULTS.queue.intro,
        headerColorOverride: ''
      }
    },
    {
      id: 'ticket-feedback-internal',
      name: 'Feedback an Mitarbeiter (intern)',
      audience: 'internal',
      subject: '[Feedback] Ticket [Ticket: Nummer]: [Ticket: Titel]',
      // Die globalen Beispiele zeigen die Arbeitsnotiz des Technikers. Hier
      // trägt dieselbe Variable das Feedback an ihn — sonst liest sich die
      // Vorschau genau falsch herum.
      previewExamples: {
        'ticket.noteTitle': 'Feedback zu deiner Ticket-Bearbeitung',
        'ticket.noteDescription': 'Vielen Dank für deine Arbeit an diesem Ticket. Eine Sache hätte ich noch: Bitte füge künftig immer den IT-Glue-Link mit ein, wenn du etwas dokumentierst — und bei diesem Ticket gerne noch nachträglich. So hat ein Kollege, der in dein Ticket schaut, direkt die passende Dokumentation zur Hand. Und der Kunde sieht, dass zum Wert, den er bekommt, auch die Doku gehört.'
      },
      sections: {
        previewText: true,
        header: true,
        ticketInfo: true,
        iconBadge: true,
        messageBody: true,
        ctaButton: false,
        bookingButton: false,
        kundenportal: false,
        signature: true,
        footer: true,
        legalFooter: false
      },
      config: {
        // Kein fester Prosatext: Überschrift und Einleitung bleiben leer,
        // der Inhalt kommt vollständig aus der Autotask-Formularvorlage.
        previewTextVar: '[Ticket: Notiztitel]',
        messageBodyVar: '[Ticket: Beschreibung der Notiz]',
        badgeGlyph: DEFAULT_BADGE_GLYPH,
        ctaText: '',
        ctaLink: '',
        footerText: 'Interne Mitteilung — [Diverses: Ihr Firmenname] | Ticket [Ticket: Nummer]',
        customHeading: '',
        customIntro: '',
        headerColorOverride: '#4a4a4a'
      }
    }
  ];

  // ── App State ──
  let state = {
    design: { ...DEFAULT_DESIGN },
    templates: JSON.parse(JSON.stringify(DEFAULT_TEMPLATES)),
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
        html += `                  Ticket ${r(tokenFor('ticket.number'))} &nbsp;|&nbsp; Status: ${r(tokenFor('ticket.status'))} &nbsp;|&nbsp; Priorit&auml;t: ${r(tokenFor('ticket.priority'))}\n`;
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
        html += `                  Ticket ${r(tokenFor('ticket.number'))} &nbsp;|&nbsp; Status: ${r(tokenFor('ticket.status'))} &nbsp;|&nbsp; Priorit&auml;t: ${r(tokenFor('ticket.priority'))}\n`;
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
        html += `              ${r(c.ctaText || 'Ticket im Portal ansehen')}\n`;
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
      html += `                  <p style="margin:0 0 10px 0;font-size:13px;color:${d.textColor};">Alle Ihre Tickets und Anfragen auf einen Blick:</p>\n`;
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
      html += `                  <span style="font-size:12px;">Web: <a href="${d.web}" style="color:${d.primaryColor};text-decoration:none;">${getDomain(d.web)}</a></span>\n`;
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
      html += `                  <span style="font-size:12px;">Tel: ${d.phone}</span><br />\n`;
      html += `                  <span style="font-size:12px;">Web: <a href="${d.web}" style="color:${d.primaryColor};text-decoration:none;">${getDomain(d.web)}</a></span><br />\n`;
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

    const line1 = `${d.company} | GF: ${d.legalCeo} | ${d.legalCourt}, ${d.legalRegNr} | USt-IdNr: ${d.legalVatId}`;

    if (style === 'corporate-classic') {
      html += `        <!-- LEGAL FOOTER -->\n`;
      html += `        <tr>\n`;
      html += `          <td style="background-color:#2c2c2c;padding:10px 30px 14px 30px;text-align:center;font-size:10px;color:#aaaaaa;font-family:${font};line-height:1.6;">\n`;
      html += `            ${line1}<br />\n`;
      html += `            <a href="${d.legalImprintUrl}" style="color:#aaaaaa;text-decoration:underline;">Impressum</a> &middot; <a href="${d.legalPrivacyUrl}" style="color:#aaaaaa;text-decoration:underline;">Datenschutz</a>\n`;
      html += `          </td>\n`;
      html += `        </tr>\n\n`;
    } else {
      html += `        <!-- LEGAL FOOTER -->\n`;
      html += `        <tr>\n`;
      html += `          <td style="padding:10px 30px 14px 30px;text-align:center;font-size:10px;color:#aaaaaa;font-family:${font};line-height:1.6;">\n`;
      html += `            ${line1}<br />\n`;
      html += `            <a href="${d.legalImprintUrl}" style="color:#aaaaaa;text-decoration:underline;">Impressum</a> &middot; <a href="${d.legalPrivacyUrl}" style="color:#aaaaaa;text-decoration:underline;">Datenschutz</a>\n`;
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
      const ctaLabel = escapeHtml(d.autotaskLinkText || 'In Autotask \u00f6ffnen');
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
        blocks.push(`${d.autotaskLinkText || 'In Autotask öffnen'}: ${url}`);
      }
    } else {
      if (s.ticketInfo) {
        blocks.push(
          `${r(tokenFor('ticket.title'))}\n` +
          `Ticket ${r(tokenFor('ticket.number'))} | Status: ${r(tokenFor('ticket.status'))} | Priorität: ${r(tokenFor('ticket.priority'))}`
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
        blocks.push(`${d.bookingText || 'Termin buchen'}: ${d.bookingUrl}`);
      }

      if (s.kundenportal && d.portalUrl) {
        blocks.push(`${d.portalText || 'Kundenportal'}: ${d.portalUrl}`);
      }

      if (s.signature) {
        const sig = [r(tokenFor('misc.initiatingResourceName'))];
        const companyLine = d.claim ? `${d.company} · ${d.claim}` : d.company;
        sig.push(companyLine);
        if (d.address) sig.push(d.address);
        if (d.phone) sig.push(`Tel: ${d.phone}`);
        if (d.web) sig.push(`Web: ${d.web}`);
        if (d.certs) sig.push(d.certs);
        blocks.push('--\n' + sig.join('\n'));
      }

      if (s.footer && c.footerText) {
        blocks.push(r(c.footerText));
      }

      if (s.legalFooter && t.audience !== 'internal') {
        const legal = [];
        legal.push(`${d.company} | GF: ${d.legalCeo} | ${d.legalCourt}, ${d.legalRegNr} | USt-IdNr: ${d.legalVatId}`);
        if (d.legalImprintUrl) legal.push(`Impressum: ${d.legalImprintUrl}`);
        if (d.legalPrivacyUrl) legal.push(`Datenschutz: ${d.legalPrivacyUrl}`);
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
  function writeDesignToUI() {
    const d = state.design;
    $('#ds-primary-color').value = d.primaryColor;
    $('#ds-primary-color-text').value = d.primaryColor;
    $('#ds-text-color').value = d.textColor;
    $('#ds-text-color-text').value = d.textColor;
    $('#ds-accent-color').value = d.accentColor;
    $('#ds-accent-color-text').value = d.accentColor;
    $('#ds-logo').value = d.logoUrl;
    $('#ds-company').value = d.company;
    $('#ds-claim').value = d.claim;
    $('#ds-address').value = d.address;
    $('#ds-phone').value = d.phone;
    $('#ds-web').value = d.web;
    $('#ds-certs').value = d.certs;
    $('#ds-font').value = d.font;
    $('#ds-legal-ceo').value = d.legalCeo;
    $('#ds-legal-court').value = d.legalCourt;
    $('#ds-legal-regnr').value = d.legalRegNr;
    $('#ds-legal-vatid').value = d.legalVatId;
    $('#ds-legal-imprint').value = d.legalImprintUrl;
    $('#ds-legal-privacy').value = d.legalPrivacyUrl;
    $('#ds-logo-enabled').checked = d.logoEnabled !== false;
    $('#ds-booking-url').value = d.bookingUrl;
    $('#ds-booking-text').value = d.bookingText;
    $('#ds-booking-active').checked = d.bookingActive;
    $('#ds-portal-url').value = d.portalUrl;
    $('#ds-portal-text').value = d.portalText;
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
    $('#ds-autotask-zone-hint').textContent =
      t('zoneHint', { lang: ZONE_LANG_LABELS[varLang()] });
  }

  function onZoneChange(nextId) {
    const previousLang = varLang();
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

    writeDesignToUI();
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

        const subjectIsDefault = Object.keys(NOTIFICATION_TYPE_DEFAULTS).some(
          t => currentSubject === buildNotificationSubject(t)
        );
        const previewIsDefault = Object.keys(NOTIFICATION_TYPE_DEFAULTS).some(
          t => currentPreview === NOTIFICATION_TYPE_DEFAULTS[t].previewText
        );
        const introIsDefault   = Object.keys(NOTIFICATION_TYPE_DEFAULTS).some(
          t => currentIntro === NOTIFICATION_TYPE_DEFAULTS[t].intro
        );

        c.notificationType = newType;

        if (subjectIsDefault) template.subject    = buildNotificationSubject(newType);
        if (previewIsDefault) c.previewTextVar     = NOTIFICATION_TYPE_DEFAULTS[newType].previewText;
        if (introIsDefault)   c.customIntro        = NOTIFICATION_TYPE_DEFAULTS[newType].intro;

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
    // Schluessel sind die stabilen data-section-Werte aus index.html, nicht der
    // sichtbare Header-Text — der wechselt mit der Oberflaechensprache.
    const checks = {
      designSystem: (d.logoEnabled !== false && !d.logoUrl) || d.company === 'Muster GmbH' || d.web === 'https://www.example.com',
      legal: d.legalCeo === 'Max Mustermann' || d.legalRegNr === 'HRB 12345 B' || d.legalImprintUrl === 'https://www.example.com/impressum/',
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

  // Versionsstand der gespeicherten Reparaturen:
  //   2 — Variablen-Tokens auf die Sprache der Zone normalisiert
  //   3 — Badge-Zeichen von der Glühbirne auf ein BMP-Emoji umgestellt
  const VAR_SCHEMA = 3;

  // ── State Migration (mutates state in-place, returns same reference) ──
  function migrateState(state) {
    if (state.templates) {
      const defaultById = new Map(DEFAULT_TEMPLATES.map(t => [t.id, t]));

      state.templates.forEach(t => {
        const def = defaultById.get(t.id);
        if (def) {
          t.audience = def.audience;
          // Vorschau-Beispiele sind nicht nutzer-editierbar: immer aus den
          // Defaults ziehen, damit gespeicherte Stände sie nachträglich bekommen.
          t.previewExamples = def.previewExamples;
        } else if (!t.audience) {
          t.audience = 'customer';
        }
        if (t.id === 'internal-notification' && t.config && !t.config.notificationType) {
          t.config.notificationType = 'queue';
        }
      });

      const existingIds = new Set(state.templates.map(t => t.id));
      DEFAULT_TEMPLATES.forEach(def => {
        if (!existingIds.has(def.id)) {
          state.templates.push(JSON.parse(JSON.stringify(def)));
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

    state.varSchema = VAR_SCHEMA;

    return state;
  }

  function loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        state.design = { ...DEFAULT_DESIGN, ...parsed.design };
        state.templates = parsed.templates || JSON.parse(JSON.stringify(DEFAULT_TEMPLATES));
        state.activeTemplateId = parsed.activeTemplateId || 'ticket-note';
        state.activeStyle = parsed.activeStyle || 'modern-card';
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
  function applyConfig(data) {
    // Die Oberflächensprache ist eine Einstellung des Lesers, keine Eigenschaft
    // der Konfiguration. Ohne diese Zeile zwänge ein geteilter Link oder ein
    // importiertes JSON dem Empfänger die Sprache des Absenders auf.
    const keepUiLang = state.design.uiLang;
    if (data.design) state.design = { ...DEFAULT_DESIGN, ...data.design, uiLang: keepUiLang };
    if (data.templates) state.templates = data.templates;
    // Der Stand der geladenen Konfiguration zählt, nicht der der laufenden
    // Sitzung — sonst überspringt ein Import in eine bereits migrierte Sitzung
    // die Token-Reparatur.
    state.varSchema = data.varSchema;
    migrateState(state);
    state.activeTemplateId = state.templates[0]?.id || 'ticket-note';
    state.activeStyle = data.activeStyle || 'modern-card';
    applyAudienceStyleLock();
    writeDesignToUI();
    renderStyleTabs();
    renderTemplateTabs();
    renderSectionToggles();
    renderTemplateConfig();
    renderSubjectField();
    onStateChange();
  }

  // ── JSON Import ──
  function importConfig(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        applyConfig(data);
        showToast(t('toast.imported'));
      } catch (err) {
        showToast(t('toast.importFailed'));
        console.error(err);
      }
    };
    reader.readAsText(file);
  }

  // ── Share Link Codec ──
  // Die Konfiguration reist im URL-Fragment, nicht über einen Server: alles hinter
  // '#' wird vom Browser nie gesendet. Kodierung: JSON → gzip → base64url.
  // gzip statt deflate-raw, weil es einheitlicher unterstützt wird — der
  // Größenunterschied liegt bei 0,6 %.
  const SHARE_FRAGMENT_PREFIX = '#c=';

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
        applyConfig(data);
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
    const [curatedResult, localeResult] = await Promise.all([
      fetch('/psa/autotask/curated.json')
        .then(r => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
        .catch(e => { console.error('Could not load PSA variables:', e); return null; }),
      loadLocale(uiLang)
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
    $('#ds-autotask-zone').addEventListener('change', function () {
      onZoneChange(this.value);
    });

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
        state.templates = JSON.parse(JSON.stringify(DEFAULT_TEMPLATES));
        state.activeTemplateId = 'ticket-note';
        state.activeStyle = 'modern-card';
        writeDesignToUI();
        renderStyleTabs();
        renderTemplateTabs();
        renderSectionToggles();
        renderTemplateConfig();
        renderSubjectField();
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
