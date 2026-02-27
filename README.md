# Social Media Stress Reliever FF

Native Firefox-Erweiterung, die Beiträge/Threads auf Social-Media-Plattformen ausliest, über OpenAI analysieren lässt und einen Antwortentwurf in das Antwortfeld einfügt (ohne Auto-Senden).

## Unterstützte Plattformen (Ziel)

- Facebook
- X / Twitter
- Bluesky
- Mastodon (inkl. viele Instanzen über generische Selektoren)
- LinkedIn

## Features

- Extrahiert möglichst viele Beiträge eines sichtbaren Threads (`maxThreadPosts` konfigurierbar).
- Schickt Thread + Plattform an ein OpenAI Chat-Modell.
- Öffnet wenn möglich automatisch den Reply-Composer und fügt die Antwort ein.
- Sicherheit: **Kein automatischer Versand**.
- Einstellungen:
  - Modellwahl
  - API-Key
  - Voll editierbarer System-Prompt

## Entwicklung / Installation

1. Repo öffnen.
2. In Firefox `about:debugging#/runtime/this-firefox` öffnen.
3. Auf **Temporäres Add-on laden** klicken.
4. `manifest.json` auswählen.

## Hinweis

DOM-Strukturen von Social-Media-Plattformen ändern sich häufig. Die Selektoren in `src/content.js` sind bewusst heuristisch und können je nach UI-Version angepasst werden.
