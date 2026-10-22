---
titel: Agents
status: aktiv
erstellt: 2026-10-18
tags: [agents, subagents, claude-code]
---

# Agents

Subagents, die nur dieses Projekt nutzt. Gehört zu [[projects/musik-app/docs/Projektvision|Projektvision]], Gegenstück zu [[projects/musik-app/docs/Skills|Skills]].
Sie liegen in `.claude/agents/<name>.md` und sind im Repo versioniert.

## Für alle Projekte

Die Agents des Ecosystems (z. B. `dashboard-entwickler`, `dashboard-visualizer`) und die eingebauten Typen
stehen im [[docs/Agents|Agents-Katalog]] (`~/claude-ecosystem/docs/Agents.md`).

## Eigene Agents

| Agent | Seit | Wofür | Werkzeuge | Aufruf |
|---|---|---|---|---|
| `playwright-test-planner` | 2026-10-22 | erkundet eine Ansicht im Browser und schreibt einen Testplan nach `specs/` | Playwright-MCP (`.mcp.json`) | „Plane Tests für die Startseite“, Seed `e2e/seed.spec.ts` |
| `playwright-test-generator` | 2026-10-22 | macht aus einem Testplan Playwright-Tests | Playwright-MCP | mit Plan und Szenario aus `specs/` |
| `playwright-test-healer` | 2026-10-22 | lässt Tests laufen und repariert scheiternde (nicht die App) | Playwright-MCP | „Repariere die e2e-Tests“ |

Die drei Playwright-Agents erzeugt `npx playwright init-agents --loop=claude`, nach einem Update von Playwright neu
erzeugen. Sie brauchen einen Neustart von Claude Code und die Freigabe des MCP-Servers `playwright-test`. Sie bedienen
nur eine Seite: Tests mit Tisch und Handys schreiben wir selbst mit den Bots aus `e2e/hilfen/raum.ts`
([[projects/musik-app/docs/tools/Playwright|Playwright]]). Scheitert ein Test wegen eines echten Fehlers der App, nicht
den Healer den Test ändern lassen, sondern mit `fehler-diagnose` die App reparieren.

## Neuen Agent einführen

Ablauf und Regeln: [[docs/Agents|Agents-Katalog]]. Gilt ein Agent für alle Projekte, gehört er ins Ecosystem.
