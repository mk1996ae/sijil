# Sijil — سجل

**The health memory that travels with you.**

A patient-owned health record. Every visit, diagnosis, prescription, lab, symptom log and note is a
**Health Event** on one longitudinal timeline, and every Health Event carries its **provenance** —
which institution it came from, how it arrived, and who verified it.

When a patient grants a clinician access, that clinician gets a **30-second brief** and can ask
questions about the record. Every sentence of every answer cites the Health Event it came from.

Sijil is not an AI doctor. It does not diagnose, prescribe, or tell anyone to start or stop a
medication. It surfaces relevant historical context and says what is worth reviewing with the
treating clinician.

## Demo story

Mohammed Al Noor, 34, lives in Abu Dhabi and is in London on a work trip with headaches on 5 of the
last 7 days. He grants Dr. Emily Carter (London GP) 24-hour scoped access. She reads the brief and
asks *"What happened the last time he had similar symptoms?"* — Sijil surfaces the March 2024
episode, what was done and how he responded, every claim clickable back to its source. The London
visit then syncs back into his timeline.

## Stack

Vite + React + TypeScript, plain CSS with CSS variables. No router, no UI library, no backend, no
database. Deployed to GitHub Pages by GitHub Actions.

## Run it

```bash
npm install
npm run dev      # dev server
npm run build    # type-check + production build
npm run lint
npm run smoke    # engine smoke test: every claim cited, safety language holds, scopes hide data
```

Optional Claude mode (off by default; the grounded engine answers otherwise):

```bash
npm run build && ANTHROPIC_API_KEY=sk-... npm run serve
```

## Layout

| Path | What it is |
|---|---|
| `src/data/` | Data model and the synthetic patient record (E1–E10, incoming E11, lifestyle, sources, scopes) |
| `src/engine/` | Retrieval + grounded answer engine (`askGrounded`), the 30-second brief (`buildBrief`), consent scoping |
| `src/components/`, `src/App.tsx` | The UI built on top of the engine |
| `api/`, `server.mjs` | Optional Claude mode |
| `scripts/smoke.ts` | Engine smoke test |

Synthetic demo data — fictional patient, fictional clinicians and institutions. Not medical advice.
