/* ============================================
   erwins enkel — PSA Email Vorlagen Generator
   ============================================ */

(function () {
  'use strict';

  // ── Sponsor / Support Links (easy to change) ──
  const SPONSOR_COFFEE_URL = 'https://buymeacoffee.com/erwins.enkel';
  const SPONSOR_GITHUB_URL = 'https://github.com/sponsors/kai-osthoff';
  const GITHUB_REPO_URL = 'https://github.com/zwei-zeiler/vorlagen-generator';

  // ── Mobile Warning ──
  const mobileWarning = document.getElementById('mobile-warning');
  const mobileWarningDismiss = document.getElementById('mobile-warning-dismiss');
  if (mobileWarningDismiss) {
    mobileWarningDismiss.addEventListener('click', () => {
      mobileWarning.classList.add('dismissed');
    });
  }

  // ── PSA Variables (loaded from psa/<provider>.json) ──
  let psaVars = null;

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
    autotaskUrl: '',
    autotaskLinkText: 'In Autotask öffnen'
  };

  // ── Style Definitions ──
  const STYLES = [
    { id: 'modern-card', name: 'Modern Card' },
    { id: 'clean-minimal', name: 'Clean Minimal' },
    { id: 'corporate-classic', name: 'Corporate Classic' },
    { id: 'internal-minimal', name: 'Internal Minimal' }
  ];

  // ── Notification Type Defaults ──
  const NOTIFICATION_TYPE_DEFAULTS = {
    queue: {
      subjectPrefix: '[Queue]',
      previewText: 'Neues Ticket in der Queue.',
      intro: 'Ein neues Ticket ist in der Queue eingegangen und wartet auf Zuweisung.\n\nTitel: [Ticket: Title]\nPriorität: [Ticket: Priority]\nKunde: [Organization: Organization Name]'
    },
    assigned: {
      subjectPrefix: '[Assigned]',
      previewText: 'Ticket wurde dir zugewiesen.',
      intro: 'Hallo [Resource: First Name],\n\ndir wurde ein Ticket zugewiesen.\n\nTitel: [Ticket: Title]\nPriorität: [Ticket: Priority]\nKunde: [Organization: Organization Name]'
    },
    sla: {
      subjectPrefix: '[SLA]',
      previewText: 'SLA-Warnung: Ticket nähert sich Fälligkeit.',
      intro: 'Achtung: Das folgende Ticket nähert sich der SLA-Fälligkeit.\n\nTitel: [Ticket: Title]\nFälligkeit: [Ticket: Due Date]\nPriorität: [Ticket: Priority]'
    }
  };

  function buildNotificationSubject(type) {
    const prefix = NOTIFICATION_TYPE_DEFAULTS[type]?.subjectPrefix || '[Queue]';
    return `${prefix} [Ticket: Ticket Number]: [Ticket: Title]`;
  }

  // ── Default Templates ──
  const DEFAULT_TEMPLATES = [
    {
      id: 'ticket-note',
      name: 'Ticket-Note an Kunde',
      audience: 'customer',
      subject: '[Ticket: Note Title] / [Ticket: Ticket Number]',
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
        previewTextVar: '[Ticket: Note Description]',
        messageBodyVar: '[Ticket: Note Description]',
        ctaText: 'Ticket im Portal ansehen',
        ctaLink: '[Ticket: Ticket Number (with link)]',
        footerText: 'Diese Nachricht bezieht sich auf Ticket [Ticket: Ticket Number]. Bitte antworten Sie direkt auf diese E-Mail oder nutzen Sie das Kundenportal.',
        customHeading: '',
        customIntro: '',
        headerColorOverride: ''
      }
    },
    {
      id: 'ticket-accepted',
      name: 'Ticket angenommen',
      audience: 'customer',
      subject: 'Ihr Ticket [Ticket: Ticket Number] wird bearbeitet',
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
        ctaLink: '[Ticket: Ticket Number (with link)]',
        footerText: 'Diese Nachricht bezieht sich auf Ticket [Ticket: Ticket Number]. Bitte antworten Sie direkt auf diese E-Mail oder nutzen Sie das Kundenportal.',
        customHeading: 'Ihr Ticket wird bearbeitet',
        customIntro: 'Guten Tag [Contact: First Name] [Contact: Last Name],\n\nIhr Ticket wurde von unserem Team angenommen und wird nun bearbeitet.\n\nUnser Techniker [Miscellaneous: Initiating Resource Name] kümmert sich um Ihr Anliegen. Wir melden uns bei Ihnen, sobald wir weitere Informationen haben.',
        headerColorOverride: ''
      }
    },
    {
      id: 'ticket-confirmation',
      name: 'Eingangsbestätigung',
      audience: 'customer',
      subject: 'Eingangsbestätigung: [Ticket: Title] / [Ticket: Ticket Number]',
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
        ctaLink: '[Ticket: Ticket Number (with link)]',
        footerText: 'Diese Nachricht bezieht sich auf Ticket [Ticket: Ticket Number]. Bitte antworten Sie direkt auf diese E-Mail oder nutzen Sie das Kundenportal.',
        customHeading: 'Wir haben Ihre Anfrage erhalten',
        customIntro: 'Guten Tag [Contact: First Name] [Contact: Last Name],\n\nvielen Dank für Ihre Nachricht. Wir haben Ihre Anfrage erhalten und unter der Ticketnummer [Ticket: Ticket Number] erfasst.\n\nUnser Team wird sich in Kürze mit Ihnen in Verbindung setzen.',
        headerColorOverride: ''
      }
    },
    {
      id: 'ticket-closed',
      name: 'Ticket geschlossen',
      audience: 'customer',
      subject: 'Ihr Ticket [Ticket: Ticket Number] wurde gelöst',
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
        ctaLink: '[Ticket: Ticket Number (with link)]',
        footerText: 'Diese Nachricht bezieht sich auf Ticket [Ticket: Ticket Number]. Bitte antworten Sie direkt auf diese E-Mail oder nutzen Sie das Kundenportal.',
        customHeading: 'Ihr Ticket wurde gelöst',
        customIntro: 'Guten Tag [Contact: First Name] [Contact: Last Name],\n\nIhr Ticket [Ticket: Ticket Number] wurde bearbeitet und als gelöst markiert.\n\nZusammenfassung: [Ticket: Title]\n\nLösung:\n[Ticket: Note Description]\n\nSollte das Problem erneut auftreten oder Sie weitere Fragen haben, können Sie jederzeit auf diese E-Mail antworten oder ein neues Ticket erstellen.\n\nWir freuen uns über Ihr Feedback — nutzen Sie dafür gerne den Button unten.',
        headerColorOverride: ''
      }
    },
    {
      id: 'ticket-escalated',
      name: 'Ticket eskaliert',
      audience: 'customer',
      subject: 'Ihr Ticket [Ticket: Ticket Number] wurde eskaliert',
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
        messageBodyVar: '[Ticket: Note Description]',
        ctaText: 'Ticket im Portal ansehen',
        ctaLink: '[Ticket: Ticket Number (with link)]',
        footerText: 'Diese Nachricht bezieht sich auf Ticket [Ticket: Ticket Number]. Bitte antworten Sie direkt auf diese E-Mail oder nutzen Sie das Kundenportal.',
        customHeading: 'Ihr Ticket wurde an einen Spezialisten übergeben',
        customIntro: 'Guten Tag [Contact: First Name] [Contact: Last Name],\n\num Ihr Anliegen bestmöglich zu lösen, haben wir Ihr Ticket an einen spezialisierten Techniker übergeben.\n\nGrund der Eskalation:',
        headerColorOverride: ''
      }
    },
    {
      id: 'ticket-feedback-request',
      name: 'Rückfrage an Kunde',
      audience: 'customer',
      subject: 'Rückfrage zu Ihrem Ticket [Ticket: Ticket Number]',
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
        messageBodyVar: '[Ticket: Note Description]',
        ctaText: 'Jetzt antworten',
        ctaLink: '[Ticket: Ticket Number (with link)]',
        footerText: 'Bitte beachten Sie: Ihr Ticket [Ticket: Ticket Number] wartet auf Ihre Rückmeldung. Ohne Ihre Antwort können wir die Bearbeitung nicht fortsetzen.',
        customHeading: 'Wir benötigen Ihre Rückmeldung',
        customIntro: 'Guten Tag [Contact: First Name] [Contact: Last Name],\n\nzur weiteren Bearbeitung Ihres Tickets benötigen wir eine Rückmeldung von Ihnen.\n\nUnsere Frage:',
        headerColorOverride: ''
      }
    },
    {
      id: 'sla-warning',
      name: 'SLA-Warnung',
      audience: 'customer',
      subject: 'Update zu Ihrem Ticket [Ticket: Ticket Number]',
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
        ctaLink: '[Ticket: Ticket Number (with link)]',
        footerText: 'Diese Nachricht bezieht sich auf Ticket [Ticket: Ticket Number]. Bitte antworten Sie direkt auf diese E-Mail oder nutzen Sie das Kundenportal.',
        customHeading: 'Wir arbeiten mit Hochdruck an Ihrem Ticket',
        customIntro: 'Guten Tag [Contact: First Name] [Contact: Last Name],\n\nwir möchten Sie proaktiv über den Stand Ihres Tickets informieren.\n\nIhr Anliegen „[Ticket: Title]" hat für uns hohe Priorität. Unser Team arbeitet intensiv an einer Lösung und wir haben Ihr Ticket entsprechend priorisiert.\n\nFälligkeitsdatum: [Ticket: Due Date]\n\nSie können den aktuellen Status jederzeit im Kundenportal einsehen. Wir melden uns umgehend, sobald wir weitere Informationen haben.',
        headerColorOverride: ''
      }
    },
    {
      id: 'ticket-handover',
      name: 'Ticket-Übergabe (intern)',
      audience: 'internal',
      subject: '[Intern] Ticket-Übergabe: [Ticket: Title] / [Ticket: Ticket Number]',
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
        legalFooter: true
      },
      config: {
        previewTextVar: 'Ticket-Übergabe: [Ticket: Title]',
        messageBodyVar: '[Ticket: Note Description]',
        ctaText: '',
        ctaLink: '',
        footerText: 'Interne Mitteilung — [Miscellaneous: Your Company Name] | Ticket [Ticket: Ticket Number]',
        customHeading: 'Ticket-Übergabe',
        customIntro: 'Hallo [Resource: First Name],\n\nfolgendes Ticket wird an dich übergeben.\n\nKunde: [Contact: First Name] [Contact: Last Name] ([Organization: Organization Name])\nErstellt am: [Ticket: Create Date]\n\nBisherige Bearbeitung:',
        headerColorOverride: '#4a4a4a'
      }
    },
    {
      id: 'ticket-survey',
      name: 'Kundenzufriedenheits-Umfrage',
      audience: 'customer',
      subject: 'Wie war unser Service? Ticket [Ticket: Ticket Number]',
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
        ctaLink: '[Ticket: Ticket Number (with link)]',
        footerText: 'Diese Nachricht bezieht sich auf das abgeschlossene Ticket [Ticket: Ticket Number]. Vielen Dank für Ihr Vertrauen in [Miscellaneous: Your Company Name].',
        customHeading: 'Wie war unser Service?',
        customIntro: 'Guten Tag [Contact: First Name] [Contact: Last Name],\n\nIhr Ticket [Ticket: Ticket Number] „[Ticket: Title]" wurde kürzlich abgeschlossen.\n\nVielen Dank, dass Sie sich an uns gewandt haben. Ihre Meinung ist uns wichtig — sie hilft uns, unseren Service stetig zu verbessern.\n\nWir würden uns freuen, wenn Sie sich einen kurzen Moment Zeit nehmen, um unseren Service zu bewerten.',
        headerColorOverride: ''
      }
    },
    {
      id: 'ticket-booking',
      name: 'Termin zum Ticket buchen',
      audience: 'customer',
      subject: 'Terminvereinbarung zu Ihrem Ticket [Ticket: Ticket Number]',
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
        messageBodyVar: '[Ticket: Note Description]',
        ctaText: 'Ticket im Portal ansehen',
        ctaLink: '[Ticket: Ticket Number (with link)]',
        footerText: 'Diese Nachricht bezieht sich auf Ticket [Ticket: Ticket Number]. Bitte antworten Sie direkt auf diese E-Mail oder nutzen Sie das Kundenportal.',
        customHeading: 'Terminvereinbarung zu Ihrem Ticket',
        customIntro: 'Guten Tag [Contact: First Name] [Contact: Last Name],\n\nfür die weitere Bearbeitung Ihres Tickets möchten wir einen Termin mit Ihnen vereinbaren.\n\nBitte wählen Sie über den folgenden Link einen für Sie passenden Termin aus — ob Remote-Session oder Vor-Ort-Termin, wir richten uns nach Ihnen.\n\nZusätzliche Hinweise:',
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
        customHeading: '[Ticket: Ticket Number]',
        customIntro: NOTIFICATION_TYPE_DEFAULTS.queue.intro,
        headerColorOverride: ''
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
  const SECTIONS = [
    { key: 'previewText', label: 'Preview Text', tooltip: 'Der Vorschautext wird in E-Mail-Clients (Outlook, Gmail, Apple Mail) in der Inbox neben dem Betreff angezeigt, bevor die E-Mail geöffnet wird. Er ist im geöffneten Mail unsichtbar.' },
    { key: 'header', label: 'Header Bar' },
    { key: 'ticketInfo', label: 'Ticket Info Bar' },
    { key: 'messageBody', label: 'Message Body' },
    { key: 'ctaButton', label: 'CTA Button' },
    { key: 'bookingButton', label: 'Terminbuchung' },
    { key: 'kundenportal', label: 'Kundenportal' },
    { key: 'signature', label: 'Signatur' },
    { key: 'footer', label: 'Footer' },
    { key: 'legalFooter', label: 'Legal-Footer' }
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

  // ── Build variable lookup map ──
  function buildVarMap() {
    const map = {};
    if (!psaVars) return map;
    for (const cat of psaVars.categories) {
      for (const v of cat.variables) {
        map[v.variable] = v.example;
      }
    }
    return map;
  }

  function replaceVarsWithExamples(text) {
    const map = buildVarMap();
    return text.replace(/\[([^\]]+)\]/g, (match) => {
      return map[match] !== undefined ? map[match] : match;
    });
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
    const r = useExampleData ? replaceVarsWithExamples : (v) => v;
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
        html += `                  ${r('[Ticket: Title]')}\n`;
        html += `                </td>\n`;
        html += `              </tr>\n`;
        html += `              <tr>\n`;
        html += `                <td style="font-size:12px;color:${d.accentColor};padding-top:4px;font-family:${font};">\n`;
        html += `                  Ticket ${r('[Ticket: Ticket Number]')} &nbsp;|&nbsp; Status: ${r('[Ticket: Status]')} &nbsp;|&nbsp; Priorit&auml;t: ${r('[Ticket: Priority]')}\n`;
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
        html += `                  ${r('[Ticket: Title]')}\n`;
        html += `                </td>\n`;
        html += `              </tr>\n`;
        html += `              <tr>\n`;
        html += `                <td style="font-size:12px;color:${d.accentColor};padding-top:4px;font-family:${font};">\n`;
        html += `                  Ticket ${r('[Ticket: Ticket Number]')} &nbsp;|&nbsp; Status: ${r('[Ticket: Status]')} &nbsp;|&nbsp; Priorit&auml;t: ${r('[Ticket: Priority]')}\n`;
        html += `                </td>\n`;
        html += `              </tr>\n`;
        html += `            </table>\n`;
        html += `          </td>\n`;
        html += `        </tr>\n\n`;
      }
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
    const r = useExampleData ? replaceVarsWithExamples : (v) => v;
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
      html += `                  <strong style="font-size:14px;color:${d.textColor};">${r('[Miscellaneous: Initiating Resource Name]')}</strong><br />\n`;
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
      html += `                  <strong style="font-size:14px;color:${d.textColor};">${r('[Miscellaneous: Initiating Resource Name]')}</strong><br />\n`;
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
    const r = useExampleData ? replaceVarsWithExamples : (v) => v;
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
      html += `            <h1 style="margin:0;font-size:22px;font-weight:600;color:#1a1a1a;font-family:${font};">${r('[Ticket: Ticket Number]')}</h1>\n`;
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
      const exampleTicketNum = psaVars ? (buildVarMap()['Ticket: Ticket Number'] || 'T20250401.0042') : 'T20250401.0042';
      const ctaHref = useExampleData
        ? (d.autotaskUrl ? d.autotaskUrl.replace('{id}', exampleTicketNum) : '#')
        : (d.autotaskUrl ? d.autotaskUrl.replace('{id}', '[Ticket: Ticket Number]') : '#');
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
    state.design.autotaskUrl = $('#ds-autotask-url').value;
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
    $('#ds-autotask-url').value = d.autotaskUrl || '';
    $('#ds-autotask-link-text').value = d.autotaskLinkText || '';
  }

  // ── Render Style Tabs ──
  function renderStyleTabs() {
    const container = $('#style-tabs');
    container.innerHTML = '';
    const active = getActiveTemplate();
    const isInternal = active && active.audience === 'internal';
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
          renderTemplateTabs();
          renderSectionToggles();
          renderTemplateConfig();
          renderSubjectField();
          renderPreview();
          renderCodeOutput();
        });
        group.appendChild(btn);
      });
      container.appendChild(group);
    }

    renderGroup('An Kunde', customerTemplates);
    renderGroup('Intern', internalTemplates);
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
      span.textContent = sec.label;
      if (sec.tooltip) {
        const info = document.createElement('span');
        info.className = 'info-tooltip';
        info.textContent = 'i';
        info.title = sec.tooltip;
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
    if (template.id === 'internal-notification' && template.audience === 'internal') {
      const group = document.createElement('div');
      group.className = 'form-group';

      const label = document.createElement('label');
      label.setAttribute('for', 'tpl-notification-type');
      label.textContent = 'Benachrichtigungstyp';

      const select = document.createElement('select');
      select.id = 'tpl-notification-type';

      const options = [
        { value: 'queue',    label: 'Neues Ticket in Queue' },
        { value: 'assigned', label: 'Ticket zugewiesen' },
        { value: 'sla',      label: 'SLA-Warnung' }
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
      { key: 'customHeading', label: 'Überschrift', type: 'text', placeholder: 'z.B. Ihr Ticket wird bearbeitet' },
      { key: 'customIntro', label: 'Einleitungstext', type: 'textarea', placeholder: 'Begrüßung und Einleitung...' },
      { key: 'previewTextVar', label: 'Preview Text (Mail-Vorschau)', type: 'text', placeholder: '[Variable] oder freier Text' },
      { key: 'messageBodyVar', label: 'Nachrichtentext (Variable)', type: 'text', placeholder: 'z.B. [Ticket: Note Description]' },
      ...(!isInternal ? [
        { key: 'ctaText', label: 'CTA Button Text', type: 'text', placeholder: 'Ticket im Portal ansehen' },
        { key: 'ctaLink', label: 'CTA Button Link', type: 'text', placeholder: '[Ticket: Ticket Number (with link)]' },
        { key: 'footerText', label: 'Footer Text', type: 'text', placeholder: 'Fußzeilentext...' },
      ] : []),
      { key: 'headerColorOverride', label: 'Header-Farbe (Override)', type: 'text', placeholder: 'Leer = Design-Hauptfarbe, z.B. #4a4a4a' }
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
      label.textContent = f.label;
      label.style.margin = '0';

      const varBtn = document.createElement('button');
      varBtn.className = 'btn btn-sm btn-insert-var';
      varBtn.textContent = '+Var';
      varBtn.title = 'Variable einfügen';
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
      input.placeholder = f.placeholder;
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
  }

  function closeVarPicker() {
    $('#var-picker-overlay').classList.remove('active');
    varPickerCallback = null;
  }

  function renderVarPickerBody(filter) {
    const body = $('#var-picker-body');
    body.innerHTML = '';
    if (!psaVars) return;

    const lf = filter.toLowerCase();

    for (const cat of psaVars.categories) {
      const matchingVars = cat.variables.filter(v =>
        !lf || v.variable.toLowerCase().includes(lf) || v.description.toLowerCase().includes(lf)
      );
      if (matchingVars.length === 0) continue;

      const catDiv = document.createElement('div');
      catDiv.className = 'var-category';

      const title = document.createElement('div');
      title.className = 'var-category-title';
      title.textContent = cat.name;
      catDiv.appendChild(title);

      for (const v of matchingVars) {
        const item = document.createElement('div');
        item.className = 'var-item';
        item.innerHTML = `<span class="var-item-name">${escapeHtml(v.variable)}</span><span class="var-item-desc">${escapeHtml(v.description)}</span>`;
        item.addEventListener('click', () => {
          if (varPickerCallback) {
            varPickerCallback(v.variable);
          }
          closeVarPicker();
        });
        catDiv.appendChild(item);
      }

      body.appendChild(catDiv);
    }
  }

  // ── Sidebar Warning Badges ──
  function updateSidebarBadges() {
    const d = state.design;
    const activeTemplate = getActiveTemplate();
    const autotaskWarn = (d.autotaskUrl && !d.autotaskUrl.includes('{id}')) ||
      (!d.autotaskUrl && activeTemplate && activeTemplate.audience === 'internal');
    const checks = {
      'Design System': (d.logoEnabled !== false && !d.logoUrl) || d.company === 'Muster GmbH' || d.web === 'https://www.example.com',
      'Rechtliche Angaben': d.legalCeo === 'Max Mustermann' || d.legalRegNr === 'HRB 12345 B' || d.legalImprintUrl === 'https://www.example.com/impressum/',
      'Terminbuchung': false,
      'Kundenportal': false,
      'Autotask': autotaskWarn
    };
    $$('.sidebar-section-header').forEach(header => {
      const label = header.querySelector('span:first-child');
      if (!label) return;
      const name = label.textContent.trim();
      const existing = header.querySelector('.badge-warn');
      if (existing) existing.remove();
      if (checks[name]) {
        const badge = document.createElement('span');
        badge.className = 'badge-warn';
        badge.title = 'Bitte anpassen';
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
  const STORAGE_KEY = 'vorlagen-generator';

  function saveToLocalStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }

  // ── State Migration (mutates state in-place, returns same reference) ──
  function applyAudienceStyleLock() {
    const active = getActiveTemplate();
    if (!active) return;
    if (active.audience === 'internal') {
      state.activeStyle = 'internal-minimal';
    } else if (state.activeStyle === 'internal-minimal') {
      state.activeStyle = 'modern-card';
    }
  }

  function migrateState(state) {
    if (state.templates) {
      state.templates.forEach(t => {
        if (!t.audience) t.audience = 'customer';
        if (t.id === 'internal-notification' && t.config && !t.config.notificationType) {
          t.config.notificationType = 'queue';
        }
      });
    }
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
      design: state.design,
      templates: state.templates,
      activeStyle: state.activeStyle
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-vorlagen-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Konfiguration exportiert');
  }

  // ── Apply Config (shared by import and share link loading) ──
  function applyConfig(data) {
    if (data.design) state.design = { ...DEFAULT_DESIGN, ...data.design };
    if (data.templates) state.templates = data.templates;
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
        showToast('Konfiguration importiert');
      } catch (err) {
        showToast('Fehler beim Import: ungültige JSON-Datei');
        console.error(err);
      }
    };
    reader.readAsText(file);
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
      exportDate: new Date().toISOString(),
      design: state.design,
      templates: state.templates,
      activeStyle: state.activeStyle
    };

    try {
      const resp = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'HTTP ' + resp.status);
      }

      const result = await resp.json();
      stateLoading.style.display = 'none';
      stateSuccess.style.display = '';
      $('#share-url-input').value = result.url;

      const exp = new Date(result.expiresAt);
      const dd = String(exp.getDate()).padStart(2, '0');
      const mm = String(exp.getMonth() + 1).padStart(2, '0');
      const yyyy = exp.getFullYear();
      $('#share-expiry').textContent = 'Gültig bis ' + dd + '.' + mm + '.' + yyyy;

    } catch (err) {
      stateLoading.style.display = 'none';
      stateError.style.display = '';
      const msg = err.message.includes('Rate limit')
        ? 'Zu viele Anfragen. Bitte kurz warten.'
        : 'Link konnte nicht erstellt werden. Bitte erneut versuchen.';
      $('#share-error-msg').textContent = msg;
      console.error('Share link error:', err);
    }
  }

  // ── Load From Share Link ──
  async function loadFromShareLink(shareId) {
    try {
      const resp = await fetch('/api/share/' + encodeURIComponent(shareId));

      if (resp.status === 404) {
        showToast('Dieser Share-Link ist abgelaufen oder ungueltig.');
        window.history.replaceState({}, '', '/');
        return;
      }

      if (!resp.ok) throw new Error('HTTP ' + resp.status);

      const data = await resp.json();
      const accepted = await showConfirmModal();

      if (accepted) {
        applyConfig(data);
        showToast('Konfiguration aus Share-Link geladen');
      }
      window.history.replaceState({}, '', '/');

    } catch (err) {
      showToast('Fehler beim Laden des Share-Links.');
      window.history.replaceState({}, '', '/');
      console.error('Share link load error:', err);
    }
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
      showToast(`${label} kopiert!`);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast(`${label} kopiert!`);
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
    // Load autotask variables
    try {
      const resp = await fetch('/psa/autotask.json');
      psaVars = await resp.json();
    } catch (e) {
      console.error('Could not load PSA variables:', e);
    }

    // Load state from localStorage
    loadFromLocalStorage();

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

    // ── Autotask URL blur validation ──
    $('#ds-autotask-url').addEventListener('blur', function() {
      const result = validateAutotaskUrl(this.value);
      if (result.warn === 'bad-protocol') {
        this.value = '';
        readDesignFromUI();
        onStateChange();
        showToast('Nur http(s) URLs erlaubt — Eingabe verworfen');
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
      copyToClipboard(html, 'HTML-Code');
    });
    $('#btn-copy-code-2').addEventListener('click', () => {
      const template = getActiveTemplate();
      if (!template) return;
      const html = generateEmailHtml(template, state.design, false);
      copyToClipboard(html, 'HTML-Code');
    });
    $('#btn-copy-subject').addEventListener('click', () => {
      const template = getActiveTemplate();
      if (!template) return;
      copyToClipboard(template.subject, 'Betreff');
    });

    // ── Variable picker ──
    $('#btn-vars').addEventListener('click', () => {
      openVarPicker((variable) => {
        copyToClipboard(variable, 'Variable');
      });
    });
    $('#var-picker-close').addEventListener('click', closeVarPicker);
    $('#var-picker-overlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeVarPicker();
    });
    $('#var-search').addEventListener('input', (e) => {
      renderVarPickerBody(e.target.value);
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
        'Zurücksetzen?',
        'Alle Einstellungen werden auf die Standardwerte zurückgesetzt. Ihre aktuelle Konfiguration geht dabei verloren.'
      );
      if (accepted) {
        localStorage.removeItem(STORAGE_KEY);
        state.design = { ...DEFAULT_DESIGN };
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
        showToast('Einstellungen zurückgesetzt');
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
      copyToClipboard(url, 'Link');
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
    const sponsorBtn = $('#btn-sponsor');
    const sponsorMenu = $('#sponsor-dropdown-menu');
    sponsorBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sponsorMenu.classList.toggle('open');
    });
    document.addEventListener('click', () => {
      sponsorMenu.classList.remove('open');
    });
    $('#sponsor-coffee').href = SPONSOR_COFFEE_URL;
    $('#sponsor-github').href = SPONSOR_GITHUB_URL;

    // ── Footer links ──
    $('#footer-brand-link').href = SPONSOR_COFFEE_URL;
    $('#footer-repo-link').href = GITHUB_REPO_URL;

    // ── Share link detection ──
    const shareParam = new URLSearchParams(window.location.search).get('share')
      || (window.location.pathname.match(/^\/s\/(.+)$/) || [])[1];
    if (shareParam) {
      loadFromShareLink(shareParam);
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
