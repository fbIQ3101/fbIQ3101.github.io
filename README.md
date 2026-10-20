# Mein Blog – Anleitung

Moderner, responsiver Blog mit Owner- und Viewer-Anmeldung.
Reines HTML, CSS und JavaScript. Läuft kostenlos auf **GitHub Pages**.

## Dateien

```
index.html          Einstiegsseite
css/style.css       Design (hell/dunkel, Animationen, responsiv)
js/config.js        Owner-Zugang & Grundeinstellungen  ← hier anpassen
js/app.js           Anwendungslogik
data/blog-data.js   Alle Beiträge & Kommentare, die Besucher sehen
```

## 1. Auf GitHub Pages veröffentlichen

1. Auf github.com ein neues **öffentliches** Repository anlegen, z. B. `mein-blog`.
2. *Add file → Upload files*: den **Inhalt** des Ordners hochladen (index.html muss im Hauptverzeichnis liegen). Dann *Commit changes* klicken.
3. *Settings → Pages*: unter „Branch“ `main` und `/ (root)` wählen und dann *Save* klicken.
4. Nach 1–2 Minuten ist der Blog unter `https://DEIN-NAME.github.io/mein-blog/` erreichbar.

## 2. Owner-Zugang

Standard-Zugang: **admin** / **Blog2026!**. Ändere das Passwort sofort:

1. Als Owner anmelden, dann *Dashboard → Einstellungen & Daten → Passwort ändern*.
2. Die erzeugte Zeile kopieren und in `js/config.js` bei `OWNER_PASSWORD_SHA256` einsetzen.
3. Die geänderte `config.js` ins Repository hochladen.

Den Benutzernamen änderst du in `js/config.js` bei `OWNER_USERNAME`.

## 3. Beiträge für alle sichtbar machen (wichtig!)

GitHub Pages kann nur Dateien ausliefern und hat keine Datenbank. Deshalb gilt:

- Alles, was du im Dashboard schreibst, wird **zuerst nur in deinem Browser** gespeichert.
- Damit alle Besucher es sehen, gehst du auf *Dashboard → Einstellungen & Daten → blog-data.js herunterladen*. Mit dieser Datei ersetzt du `data/blog-data.js` im Repository und klickst auf *Commit*.
- Das Dashboard erinnert dich mit einem blauen Hinweis, solange du nicht exportiert hast.

**Bilder:** Hochgeladene Bilder werden verkleinert direkt in die Daten eingebettet. Bei vielen Bildern lieber einen Ordner `images/` im Repository anlegen und im Editor die Adresse eintragen, z. B. `images/urlaub.jpg`.

## 4. Grenzen dieser Lösung (bitte lesen)

- **Kommentare** von Viewern werden nur im Browser der jeweiligen Person gespeichert. Andere Besucher sehen sie nicht. Wenn du selbst im eigenen Browser kommentierst oder löschst und dann exportierst, wird das übernommen.
- **Sicherheit:** Die Anmeldung läuft vollständig im Browser. Das Passwort steht nur als gesalzener Hash im Code, aber technisch versierte Personen können den Code einsehen. Das reicht, um Besucher fernzuhalten, ist aber kein Schutz wie bei einem echten Server. Bearbeiten kann trotzdem nur, wer Zugriff auf dein GitHub-Repository hat: Ohne Commit ändert sich für Besucher nichts.
- Verwende ein langes, einzigartiges Passwort.

Für gemeinsame Kommentare und eine echte Anmeldung kann man später einen kostenlosen Dienst wie **Supabase** oder **Firebase** anbinden.

## 5. Lokal testen

```
python3 -m http.server 8000
```
Danach `http://localhost:8000` öffnen.

## Formatierung im Editor

| Eingabe | Ergebnis |
|---|---|
| `## Überschrift` | Überschrift |
| `**fett**`, `*kursiv*` | **fett**, *kursiv* |
| `- Punkt` / `1. Punkt` | Liste |
| `> Zitat` | Zitat |
| `[Text](https://…)` | Link |
| `![Beschriftung](bild.jpg)` | Bild |
| `---` | Trennlinie |

Tastenkürzel: Strg/Cmd + S speichert einen Entwurf, Strg/Cmd + B macht Text fett, Strg/Cmd + I kursiv.
