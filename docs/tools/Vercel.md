---
titel: Vercel
status: aktiv
erstellt: 2026-10-21
tags: [tools, vercel, deployment, hosting]
---

# Vercel

Teil der [[projects/musik-app/docs/tools/Tools Übersicht|Tools Übersicht]]. Plan: [[2026-10-20-deployment]],
Begründung im [[0001-stack|ADR 0001]].

## Was ist das?

Ein Hosting-Dienst der Firma hinter Next.js. Vercel holt den Code von GitHub, baut ihn (`npm run build`) und stellt
die App unter einer HTTPS-Adresse ins Internet. Server-Routen wie `/api/erscheinungsjahr` laufen dort als
**Vercel Functions**, kleine Server-Programme, die nur bei einer Anfrage starten.

## Wofür nutzen wir es?

Damit die Handys der Mitspieler die App erreichen. `127.0.0.1` kennt nur der Laptop selbst, und Spotify verlangt
außerhalb von `127.0.0.1` HTTPS. Die feste Adresse ist `https://musik-bingo.vercel.app`.

## Wichtige Begriffe

- **Deployment:** eine gebaute Fassung der App unter einer eigenen Adresse.
- **Production:** die Fassung aus `main`, erreichbar unter `musik-bingo.vercel.app`. Jeder Merge in `main` erneuert sie.
- **Preview (Vorschau):** eigenes Deployment je PR, Adresse im Kommentar des Vercel-Bots am PR.
- **Nebenadressen:** Jedes Deployment hat zusätzlich eine Adresse wie `musik-bingo-<hash>-….vercel.app`, auch das
  von Production (unter „Visit“ und in der Deployment-Liste).
- **Umgebungsvariable:** Wert, den Vercel beim Bauen einsetzt, getrennt nach Umgebung (Production, Preview,
  Development).
- **Deployment Protection:** Vercel-Anmeldung vor Vorschauen und Nebenadressen. `musik-bingo.vercel.app` ist offen.

## Wie haben wir es eingerichtet?

Mit der Git-Verbindung im Browser, ohne Vercel-CLI (2026-10-20, PR #22):

1. vercel.com → mit GitHub anmelden → „Add New… → Project“ → Repo `musik-app` importieren, Name `musik-bingo`.
2. Settings → Environment Variables: `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` **nur für Production**. Vorschauen haben deshalb
   keine Client-ID und zeigen nur die Demo, weil Spotify nur genau eingetragene Redirect-URIs annimmt.
3. Node-Version: Vercel liest sie aus `"engines": { "node": "24.x" }` in `package.json`, die CI ebenso
   (`node-version-file: package.json`).

Kein Client-Secret und kein anderer Schlüssel bei Vercel (ADR 0003, `REVIEW.md`).

## Typischer Ablauf

1. Branch pushen, PR öffnen → Vercel baut eine Vorschau, der PR bekommt einen Vercel-Check und einen Kommentar mit
   der Adresse.
2. PR mergen → Vercel baut `main` neu, `musik-bingo.vercel.app` zeigt nach etwa einer Minute den neuen Stand.

## Alle bisher benutzten Befehle

```bash
# HTTP-Status der Production abfragen (200 = Seite ist da)
/usr/bin/curl -s -o /dev/null -w "%{http_code}\n" https://musik-bingo.vercel.app

# Checks eines PRs, darunter der Vercel-Check
gh pr checks <nr>
```

Die Startseite entsteht erst im Browser. Ob der Knopf „Mit Spotify anmelden“ aktiv ist, zeigt nur der Browser, nicht
das HTML aus `curl`.

## Grenzen

- **Umgebungsvariablen gelten erst ab dem nächsten Build.** `NEXT_PUBLIC_*` steckt fest im gebauten Code, nach einer
  Änderung also Deployments → „Redeploy“.
- **Anmeldung bei Spotify nur über `musik-bingo.vercel.app`.** Auf einer Nebenadresse von Production hat die App zwar
  die Client-ID, Spotify lehnt die Redirect-URI aber ab.
- **Vercel Functions teilen sich IP-Adressen.** MusicBrainz begrenzt je IP, beim Vorbereiten können also mehr
  „beschäftigt“ kommen als lokal.
- **`localStorage` gilt je Adresse:** Token und vorbereitete Playlists von `127.0.0.1` fehlen unter der Vercel-Adresse.

## Fehler, die uns passiert sind

- **Umgebung einer Variable ließ sich nicht ändern** (2026-10-20). Ursache: Die Oberfläche bot für die bestehende
  Variable keine Einschränkung auf eine Umgebung an. Lösung: löschen, neu anlegen mit nur „Production“, „Redeploy“.
- **`curl` gibt `000` aus, mit `-sS` dazu `curl: (77) error adding trust anchors from file:
  /opt/anaconda3/ssl/cacert.pem`** (2026-10-20 und 2026-10-21). Ursache: Die Shell nimmt das `curl` aus Anaconda,
  das seine Zertifikate nicht lesen kann. Lösung: `/usr/bin/curl` von macOS oder `--cacert /etc/ssl/cert.pem`.
