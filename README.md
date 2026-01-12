# Form AI

[Italiano](#italiano) · [English](#english)

## Italiano

Form AI e' un generatore di form guidato da configurazione JSON. Permette di definire campi, opzioni e impostazioni del form (action e method), esportare/importare la configurazione e inviare il JSON a un modello LLM per ottenere l'HTML finale del form.

Funzionalita principali:
- Creazione di campi (text, textarea, email, number, date, select, radio, checkbox).
- Opzioni per campi a scelta e dettagli specifici (min/max/step, righe, placeholder, required).
- Campi di testo mascherati (password).
- Impostazioni form: action e method.
- Export/import JSON e generazione HTML via OpenAI.

Avvio in locale:
1) `npm install`
2) Terminale 1: `npm run dev:api`
3) Terminale 2: `npm run dev`

Oppure avvia tutto insieme:
- `npm run dev:all`

Imposta `OPENAI_API_KEY` nel file `.env`.

---

## English

Form AI is a JSON-driven form builder. It lets you define fields, options, and form settings (action and method), export/import the configuration, and send the JSON to an LLM to generate the final HTML form.

Main features:
- Build fields (text, textarea, email, number, date, select, radio, checkbox).
- Options for choice fields and type-specific details (min/max/step, rows, placeholder, required).
- Masked text inputs (password).
- Form settings: action and method.
- JSON export/import and HTML generation via OpenAI.

Local setup:
1) `npm install`
2) Terminal 1: `npm run dev:api`
3) Terminal 2: `npm run dev`

Or run both together:
- `npm run dev:all`

Set `OPENAI_API_KEY` in `.env`.
