/* ============================================
   Vercel Web Analytics — Bootstrap
   ============================================

   Vercel dokumentiert diesen Schnipsel als *inline* <script> im <head>. Inline
   wäre hier aber teuer: `vercel.json` setzt `script-src 'self'`, ein Inline-Skript
   bräuchte also `'unsafe-inline'` — und das erlaubte jedem eingeschleusten
   <script>-Tag die Ausführung. Für einen Zähler die Content-Security-Policy der
   ganzen Seite aufzuweichen, ist ein schlechter Tausch. Als eigene Datei von
   derselben Origin ist der Bootstrap von `'self'` gedeckt und `vercel.json`
   bleibt unangetastet.

   Die Warteschlange fängt Aufrufe ab, die eintreffen, bevor
   /_vercel/insights/script.js geladen ist; das echte Skript arbeitet sie
   danach ab.

   Beides ist same-origin: `script-src 'self'` deckt das Laden,
   `connect-src 'self'` das Senden der Messwerte an /_vercel/insights/view.
   Es werden keine Cookies gesetzt und keine geräteübergreifenden Kennungen
   gebildet — siehe Abschnitt „Reichweitenmessung" der Datenschutzerklärung.
*/

window.va = window.va || function () {
  (window.vaq = window.vaq || []).push(arguments);
};
