/* Service Worker der Rahmenseite, seit v566 (24.11.2026). Paket 1 von „Schnelle App (Sofortbild)“.
   Er liegt im Hauptordner (…/dashboard/sw.js) und gilt für alle Ordner darunter (aufgaben/, einkauf/, konten/ …).
   Aufgabe: Die Rahmenseite soll beim Antippen ohne Netz in Millisekunden da sein. Dafür legt er die Seite, die manifest-Dateien
   und die Symbole in den Zwischenspeicher des Geräts und antwortet von dort. Gleichzeitig holt er im Hintergrund die aktuelle
   Fassung bei GitHub und legt sie für den nächsten Start ab („stale while revalidate“).
   Alle Ordner haben dieselbe index.html (verteilen.js kopiert sie), deshalb liegt die Seite nur einmal im Speicher.
   Das Dashboard selbst (Google) fasst er nie an: Er antwortet nur auf Anfragen an die eigene Adresse unterhalb seines Ordners.
   STAND setzt pruefung/rahmen/verteilen.js beim Verteilen (Prüfsumme über Seite und diese Datei). Ändert sich etwas, hat der
   Zwischenspeicher einen neuen Namen, der alte wird beim Wechsel gelöscht. Quelle ist rahmen/sw.js im privaten Repo. */
'use strict';
var STAND = '7d807cfdf81e';
var SPEICHER = 'rahmen-' + STAND;
var BASIS = new URL('./', self.location).pathname;          // etwa /dashboard/
var SEITE = new URL('./', self.location).href;               // unter diesem Schlüssel liegt die eine index.html

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(SPEICHER)
    .then(function (c) { return c.addAll([SEITE, SEITE + 'manifest.webmanifest', SEITE + 'icon-192.png', SEITE + 'icon-512.png']); })
    .catch(function () { /* fehlt eine Datei, füllt sich der Speicher beim Benutzen */ })
    .then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys()
    .then(function (namen) { return Promise.all(namen.filter(function (n) { return n.indexOf('rahmen-') === 0 && n !== SPEICHER; }).map(function (n) { return caches.delete(n); })); })
    .then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var anfrage = e.request;
  if (anfrage.method !== 'GET') return;
  var url = new URL(anfrage.url);
  if (url.origin !== self.location.origin || url.pathname.indexOf(BASIS) !== 0) return;
  if (/\/sw\.js$/.test(url.pathname)) return;
  var istSeite = anfrage.mode === 'navigate';
  // Nur Ordneradressen (…/einkauf/) und index.html. Alles andere (etwa …/einkauf ohne Schrägstrich) geht ungefiltert ans Netz.
  if (istSeite && !/\/(index\.html)?$/.test(url.pathname)) return;
  if (!istSeite && !/\.(webmanifest|png)$/.test(url.pathname)) return;
  var schluessel = istSeite ? SEITE : url.origin + url.pathname;
  /* Notausgang seit v575: Mit ?frisch=1 in der Adresse kommt die Seite immer frisch von GitHub, am Zwischenspeicher dieses Geräts
     und an dem des Browsers vorbei, und ersetzt die gemerkte Fassung. Gedacht für den Fall, dass eine alte Fassung hängt.
     Der Knopf „Rahmenseite neu holen“ in der Hilfeleiste der Rahmenseite nimmt denselben Weg. */
  var notausgang = istSeite && /[?&]frisch=/.test(url.search);
  /* Seit v575 wird beim Nachsehen immer bei GitHub nachgefragt (no-cache), nicht mehr der Zwischenspeicher des Browsers geglaubt
     (GitHub erlaubt ihm zehn Minuten). So liegt eine neue Fassung sicher nach dem ersten Start bereit und ist beim zweiten da.
     Leitet GitHub um, wird die Anfrage unverändert durchgereicht, eine umgeleitete Antwort darf nicht für einen Seitenaufruf stehen. */
  var holen = function () {
    return fetch(anfrage.url, { cache: notausgang ? 'reload' : 'no-cache', credentials: 'same-origin' })
      .then(function (antwort) { return antwort && antwort.redirected ? fetch(anfrage) : antwort; });
  };
  e.respondWith(caches.open(SPEICHER).then(function (c) {
    return (notausgang ? Promise.resolve(undefined) : c.match(schluessel)).then(function (alt) {
      var frisch = holen().then(function (antwort) {
        if (antwort && antwort.ok && antwort.type === 'basic' && !antwort.redirected) c.put(schluessel, antwort.clone()).catch(function () {});
        return antwort;
      });
      if (alt) { e.waitUntil(frisch.catch(function () {})); return alt; }
      return frisch;
    });
  }).catch(function () {
    // Klemmt der Zwischenspeicher selbst (Speicher voll, Browser räumt gerade auf), geht die Anfrage wie ohne Worker ans Netz.
    return fetch(anfrage);
  }));
});
