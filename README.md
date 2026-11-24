# dashboard

Eine fast leere Rahmenseite. Sie zeigt eine eigene Web-Anwendung in einem Rahmen an.

In diesem Repo stehen weder die Adresse der Anwendung noch ein Zugangscode. Die Adresse hinterlegt man auf jedem Gerät einmal selbst, sie bleibt nur im Browser dieses Geräts. Wer die Seite ohne hinterlegte Adresse öffnet, sieht nur ein Eingabefeld.

Die Quelle der Seite und ihre Prüfung liegen im privaten Repo der Anwendung. Änderungen deshalb dort machen und hierher kopieren, nicht hier allein ändern.

Dieselbe Seite liegt im Hauptordner und in je einem Ordner für jede Seite der Anwendung. Jeder Ordner hat ein eigenes Symbol und einen eigenen Namen für den Startbildschirm. Dazu kommt `sw.js` im Hauptordner, ein Service Worker, der die Seite, ihre Symbole und die manifest-Dateien auf dem Gerät zwischenspeichert. Die Dateien werden aus der Quelle erzeugt, nicht von Hand angelegt.
