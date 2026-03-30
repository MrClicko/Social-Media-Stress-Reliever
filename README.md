# Social Media Stress Reliever FF

Native Firefox-Erweiterung, die Beiträge/Threads auf Social-Media-Plattformen ausliest, über ein LLM analysieren lässt und einen Antwortentwurf in das Antwortfeld einfügt (ohne Auto-Senden).

## Unterstützte Plattformen (Ziel)

- Facebook
- X / Twitter
- Bluesky
- Mastodon (inkl. vieler Instanzen über heuristische Selektoren)
- LinkedIn

## Features

- Extrahiert möglichst viele Beiträge eines sichtbaren Threads (`maxThreadPosts` konfigurierbar).
- Markiert den **Fokusbeitrag** als letzte sichtbare Nachricht für den LLM-Kontext.
- Schickt Thread + Plattform + URL an den gewählten LLM-Provider.
- Öffnet wenn möglich automatisch den Reply-Composer und fügt die Antwort ein.
- Sicherheit: **Kein automatischer Versand**.
- Protokollseite speichert:
  - URL des Posts
  - Generierte Antwort
  - Datum/Uhrzeit

## LLM-Provider (konfigurierbar)

- OpenAI (`gpt-4o` voreingestellt)
- Anthropic (`claude-3-5-sonnet-latest` voreingestellt)
- Google Cloud (`gemini-1.5-pro` voreingestellt)
- Mistral AI (`mistral-large-latest` voreingestellt)
- Lokales LLM mit OpenAI-kompatibler API (z. B. `http://127.0.0.1:1234`)

## Entwicklung / Installation

1. Repo öffnen.
2. In Firefox `about:debugging#/runtime/this-firefox` öffnen.
3. Auf **Temporäres Add-on laden** klicken.
4. `manifest.json` auswählen.

## About

Per Vibe-Coding hergestellt durch Matthias Schüssler, matthias@clickomania.ch

## Hinweis

DOM-Strukturen von Social-Media-Plattformen ändern sich häufig. Die Selektoren in `src/content.js` sind bewusst heuristisch und können je nach UI-Version angepasst werden.
