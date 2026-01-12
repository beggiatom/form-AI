<template>
  <div class="page">
    <header class="hero">
      <h1>{{ t('heroTitle') }}</h1>
      <p>
        {{ t('heroSubtitle') }}
      </p>
      <div class="language-switch">
        <button
          class="button ghost"
          type="button"
          :aria-pressed="language === 'it'"
          @click="setLanguage('it')"
        >
          Italiano
        </button>
        <button
          class="button ghost"
          type="button"
          :aria-pressed="language === 'en'"
          @click="setLanguage('en')"
        >
          English
        </button>
      </div>
    </header>

    <section class="builder">
      <div class="panel">
        <div class="panel-header">
          <h2>{{ t('configuredFields') }}</h2>
        </div>
        <h3>{{ t('formSettings') }}</h3>
        <div class="field-grid">
          <label>
            {{ t('formAction') }}
            <input v-model="formAction" type="text" :placeholder="t('formActionPlaceholder')" />
          </label>
          <label>
            {{ t('formMethod') }}
            <select v-model="formMethod">
              <option value="post">{{ t('methodPost') }}</option>
              <option value="get">{{ t('methodGet') }}</option>
            </select>
          </label>
        </div>
        <div class="divider"></div>
        <div class="section-header">
          <h3>{{ t('fieldsTitle') }}</h3>
          <button class="button" type="button" @click="addField">
            {{ t('addField') }}
          </button>
        </div>
        <div v-if="fields.length === 0" class="empty-state">
          {{ t('noFields') }}
        </div>
        <div v-else>
          <article v-for="(field, index) in fields" :key="field.id" class="field-card">
            <div class="field-head">
              <h3>{{ t('fieldLabel', { index: index + 1 }) }}</h3>
              <button class="link-danger" type="button" @click="removeField(field.id)">
                {{ t('remove') }}
              </button>
            </div>

            <div class="field-grid">
              <label>
                {{ t('type') }}
                <select v-model="field.type" @change="ensureOptions(field)">
                  <option v-for="type in fieldTypes" :key="type.value" :value="type.value">
                    {{ t(type.label) }}
                  </option>
                </select>
              </label>
              <label>
                {{ t('label') }}
                <input v-model="field.label" type="text" />
              </label>
              <label>
                {{ t('nameKey') }}
                <input v-model="field.name" type="text" />
              </label>
              <label class="toggle">
                <input v-model="field.required" type="checkbox" />
                {{ t('required') }}
              </label>
              <label>
                {{ t('placeholder') }}
                <input v-model="field.placeholder" type="text" />
              </label>
              <label v-if="field.type === 'text'" class="toggle">
                <input v-model="field.masked" type="checkbox" />
                {{ t('masked') }}
              </label>
            </div>

            <div v-if="typeNeedsOptions(field.type)" class="options">
              <strong>{{ t('options') }}</strong>
              <div v-for="(option, optionIndex) in field.options" :key="optionIndex" class="option-row">
                <input v-model="option.label" type="text" :placeholder="t('optionLabel')" />
                <input v-model="option.value" type="text" :placeholder="t('optionValue')" />
                <button type="button" @click="removeOption(field, optionIndex)">
                  {{ t('remove') }}
                </button>
              </div>
              <button class="button ghost" type="button" @click="addOption(field)">
                {{ t('addOption') }}
              </button>
            </div>

            <div v-else-if="field.type === 'number'" class="field-grid">
              <label>
                {{ t('min') }}
                <input v-model="field.min" type="number" />
              </label>
              <label>
                {{ t('max') }}
                <input v-model="field.max" type="number" />
              </label>
              <label>
                {{ t('step') }}
                <input v-model="field.step" type="number" />
              </label>
            </div>

            <div v-else-if="field.type === 'textarea'" class="field-grid">
              <label>
                {{ t('rows') }}
                <input v-model="field.rows" type="number" min="2" />
              </label>
            </div>

            <div v-else-if="field.type === 'date'" class="field-grid">
              <label>
                {{ t('minDate') }}
                <input v-model="field.min" type="date" />
              </label>
              <label>
                {{ t('maxDate') }}
                <input v-model="field.max" type="date" />
              </label>
            </div>
          </article>
        </div>
      </div>

      <div class="panel">
        <h2>{{ t('jsonReady') }}</h2>
        <textarea class="json-output" :value="jsonOutput" readonly></textarea>
        <div class="actions">
          <button class="button secondary" type="button" @click="copyJson">
            {{ copyLabel }}
          </button>
          <button class="button" type="button" @click="downloadJson">
            {{ t('exportJson') }}
          </button>
          <button class="button" type="button" :disabled="isSending" @click="sendToOpenAI">
            {{ isSending ? t('sending') : t('sendToOpenAI') }}
          </button>
        </div>
        <p v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </p>

        <div class="divider"></div>

        <h3>{{ t('llmInstructionsTitle') }}</h3>
        <textarea class="json-output" :value="llmInstructions" readonly></textarea>

        <div class="divider"></div>

        <h3>{{ t('htmlResult') }}</h3>
        <textarea
          class="json-output"
          :value="htmlOutput"
          readonly
          :placeholder="t('htmlPlaceholder')"
        ></textarea>
        <div class="actions">
          <button class="button secondary" type="button" @click="copyHtml" :disabled="!htmlOutput">
            {{ copyHtmlLabel }}
          </button>
        </div>

        <div class="divider"></div>

        <h3>{{ t('importJson') }}</h3>
        <textarea
          v-model="jsonInput"
          class="json-output"
          :placeholder="t('importPlaceholder')"
        ></textarea>
        <div class="actions">
          <button class="button ghost" type="button" @click="loadFromText">
            {{ t('loadFromText') }}
          </button>
          <button class="button ghost" type="button" @click="triggerFilePick">
            {{ t('loadFile') }}
          </button>
          <input ref="fileInput" type="file" accept="application/json" hidden @change="onFileChange" />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const fieldTypes = [
  { value: 'text', label: 'fieldText' },
  { value: 'textarea', label: 'fieldTextarea' },
  { value: 'email', label: 'fieldEmail' },
  { value: 'number', label: 'fieldNumber' },
  { value: 'select', label: 'fieldSelect' },
  { value: 'radio', label: 'fieldRadio' },
  { value: 'checkbox', label: 'fieldCheckbox' },
  { value: 'date', label: 'fieldDate' }
];

const fields = ref([]);
const formAction = ref('');
const formMethod = ref('post');
const jsonInput = ref('');
const language = ref('it');
const copyLabel = ref('Copia JSON');
const copyHtmlLabel = ref('Copia HTML');
const htmlOutput = ref('');
const errorMessage = ref('');
const isSending = ref(false);
const fileInput = ref(null);

const translations = {
  it: {
    heroTitle: 'Costruttore di campi per LLM',
    heroSubtitle:
      "Definisci una struttura JSON con campi incrementali, personalizza ogni tipo e poi esporta il risultato per far generare l'HTML da una IA.",
    configuredFields: 'Campi configurati',
    formSettings: 'Impostazioni form',
    formAction: 'Indirizzo di destinazione (action)',
    formActionPlaceholder: 'https://example.com/invia',
    formMethod: 'Metodo di invio',
    methodPost: 'POST',
    methodGet: 'GET',
    fieldsTitle: 'Campi',
    addField: 'Aggiungi campo',
    noFields: 'Nessun campo configurato. Usa "Aggiungi campo" per iniziare.',
    fieldLabel: ({ index }) => `Campo ${index}`,
    remove: 'Rimuovi',
    type: 'Tipo',
    label: 'Etichetta',
    nameKey: 'Nome chiave',
    required: 'Richiesto',
    placeholder: 'Placeholder',
    masked: 'Mascherato (password)',
    options: 'Opzioni',
    optionLabel: 'Etichetta',
    optionValue: 'Valore',
    addOption: 'Aggiungi opzione',
    min: 'Min',
    max: 'Max',
    step: 'Step',
    rows: 'Righe',
    minDate: 'Data minima',
    maxDate: 'Data massima',
    jsonReady: "JSON pronto per l'IA",
    exportJson: 'Esporta JSON',
    sending: 'Invio...',
    sendToOpenAI: 'Invia a OpenAI',
    llmInstructionsTitle: 'Istruzioni per LLM',
    htmlResult: 'Risultato HTML',
    htmlPlaceholder: "Qui apparira' il codice HTML generato",
    importJson: 'Importa JSON',
    importPlaceholder: 'Incolla qui un JSON salvato in precedenza',
    loadFromText: 'Carica da testo',
    loadFile: 'Carica file',
    fieldText: 'Testo',
    fieldTextarea: 'Area di testo',
    fieldEmail: 'Email',
    fieldNumber: 'Numero',
    fieldSelect: 'Selezione',
    fieldRadio: 'Radio',
    fieldCheckbox: 'Checkbox',
    fieldDate: 'Data',
    copyJson: 'Copia JSON',
    copied: 'Copiato',
    copyError: 'Errore copia',
    copyHtml: 'Copia HTML',
    genericErrorDetails: 'Nessun dettaglio disponibile.',
    jsonInvalid: "JSON non valido: manca 'fields'.",
    jsonInvalidShort: 'JSON non valido.',
    htmlError: 'Errore durante la generazione HTML.',
    llmInstructions: `Genera solo HTML valido, senza markdown o spiegazioni.
Crea un form accessibile e pulito a partire dal JSON fornito.
Distribuisci i campi con una griglia responsiva: 2 colonne su desktop, 1 su mobile.
Usa label associate agli input, placeholder solo se presente.
Usa i tipi corretti (text, email, number, date, textarea, select, radio, checkbox).
Se un campo text ha masked: true, usa type="password".
Per select/radio usa le options fornite.
Applica form.action e form.method se presenti.
Rispetta required, min, max, step, rows quando presenti.
Ritorna solo il markup HTML del form completo.`
  },
  en: {
    heroTitle: 'LLM Field Builder',
    heroSubtitle:
      'Define a JSON structure with incremental fields, customize each type, then export the result to let an AI generate the HTML.',
    configuredFields: 'Configured fields',
    formSettings: 'Form settings',
    formAction: 'Destination URL (action)',
    formActionPlaceholder: 'https://example.com/submit',
    formMethod: 'Submit method',
    methodPost: 'POST',
    methodGet: 'GET',
    fieldsTitle: 'Fields',
    addField: 'Add field',
    noFields: 'No fields configured. Use "Add field" to start.',
    fieldLabel: ({ index }) => `Field ${index}`,
    remove: 'Remove',
    type: 'Type',
    label: 'Label',
    nameKey: 'Key name',
    required: 'Required',
    placeholder: 'Placeholder',
    masked: 'Masked (password)',
    options: 'Options',
    optionLabel: 'Label',
    optionValue: 'Value',
    addOption: 'Add option',
    min: 'Min',
    max: 'Max',
    step: 'Step',
    rows: 'Rows',
    minDate: 'Min date',
    maxDate: 'Max date',
    jsonReady: 'JSON ready for AI',
    exportJson: 'Export JSON',
    sending: 'Sending...',
    sendToOpenAI: 'Send to OpenAI',
    llmInstructionsTitle: 'LLM instructions',
    htmlResult: 'HTML result',
    htmlPlaceholder: 'Generated HTML will appear here',
    importJson: 'Import JSON',
    importPlaceholder: 'Paste a previously saved JSON here',
    loadFromText: 'Load from text',
    loadFile: 'Load file',
    fieldText: 'Text',
    fieldTextarea: 'Textarea',
    fieldEmail: 'Email',
    fieldNumber: 'Number',
    fieldSelect: 'Select',
    fieldRadio: 'Radio',
    fieldCheckbox: 'Checkbox',
    fieldDate: 'Date',
    copyJson: 'Copy JSON',
    copied: 'Copied',
    copyError: 'Copy error',
    copyHtml: 'Copy HTML',
    genericErrorDetails: 'No additional details available.',
    jsonInvalid: "Invalid JSON: missing 'fields'.",
    jsonInvalidShort: 'Invalid JSON.',
    htmlError: 'Error while generating HTML.',
    llmInstructions: `Generate valid HTML only, without markdown or explanations.
Create a clean, accessible form from the provided JSON.
Lay out fields using a responsive grid: 2 columns on desktop, 1 on mobile.
Use labels associated with inputs, placeholders only if provided.
Use the correct types (text, email, number, date, textarea, select, radio, checkbox).
If a text field has masked: true, use type="password".
For select/radio, use the provided options.
Apply form.action and form.method if present.
Respect required, min, max, step, rows when provided.
Return only the full HTML form markup.`
  }
};

const t = (key, params) => {
  const value = translations[language.value]?.[key];
  if (typeof value === 'function') return value(params || {});
  return value ?? key;
};

const setLanguage = (lang) => {
  language.value = lang;
  copyLabel.value = t('copyJson');
  copyHtmlLabel.value = t('copyHtml');
};

const llmInstructions = computed(() => t('llmInstructions'));

const createId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `field_${Date.now()}_${Math.random().toString(16).slice(2)}`;

const typeNeedsOptions = (type) => ['select', 'radio'].includes(type);

const defaultField = () => ({
  id: createId(),
  type: 'text',
  label: 'Nuovo campo',
  name: '',
  required: false,
  placeholder: '',
  masked: false,
  options: [{ label: 'Opzione 1', value: 'opzione-1' }],
  min: '',
  max: '',
  step: '',
  rows: 3
});

const normalizeField = (raw) => {
  const base = {
    id: raw.id || createId(),
    type: raw.type || 'text',
    label: raw.label || '',
    name: raw.name || '',
    required: Boolean(raw.required),
    placeholder: raw.placeholder || '',
    masked: Boolean(raw.masked),
    options: Array.isArray(raw.options)
      ? raw.options.map((opt) => ({
          label: opt.label || '',
          value: opt.value || ''
        }))
      : [],
    min: raw.min ?? '',
    max: raw.max ?? '',
    step: raw.step ?? '',
    rows: raw.rows ?? 3
  };

  if (typeNeedsOptions(base.type) && base.options.length === 0) {
    base.options.push({ label: 'Opzione 1', value: 'opzione-1' });
  }

  return base;
};

const buildJson = () => ({
  version: 1,
  form: {
    action: formAction.value,
    method: formMethod.value || 'post'
  },
  fields: fields.value.map((field) => {
    const base = {
      id: field.id,
      type: field.type,
      label: field.label,
      name: field.name,
      required: field.required
    };

    if (field.placeholder) {
      base.placeholder = field.placeholder;
    }

    if (field.type === 'text' && field.masked) {
      base.masked = true;
    }

    if (field.type === 'textarea') {
      base.rows = Number(field.rows) || 3;
    }

    if (field.type === 'number' || field.type === 'date') {
      if (field.min !== '') base.min = field.min;
      if (field.max !== '') base.max = field.max;
    }

    if (field.type === 'number' && field.step !== '') {
      base.step = field.step;
    }

    if (typeNeedsOptions(field.type)) {
      base.options = field.options
        .filter((opt) => opt.label || opt.value)
        .map((opt) => ({
          label: opt.label,
          value: opt.value
        }));
    }

    return base;
  })
});

const jsonOutput = computed(() => JSON.stringify(buildJson(), null, 2));

const ensureOptions = (field) => {
  if (typeNeedsOptions(field.type) && field.options.length === 0) {
    field.options.push({ label: 'Opzione 1', value: 'opzione-1' });
  }
};

const addField = () => {
  fields.value.push(defaultField());
};

const removeField = (id) => {
  fields.value = fields.value.filter((field) => field.id !== id);
};

const addOption = (field) => {
  field.options.push({
    label: `Opzione ${field.options.length + 1}`,
    value: `opzione-${field.options.length + 1}`
  });
};

const removeOption = (field, optionIndex) => {
  field.options.splice(optionIndex, 1);
};

const copyJson = async () => {
  try {
    await navigator.clipboard.writeText(jsonOutput.value);
    copyLabel.value = t('copied');
    setTimeout(() => {
      copyLabel.value = t('copyJson');
    }, 1200);
  } catch (error) {
    copyLabel.value = t('copyError');
  }
};

const copyHtml = async () => {
  try {
    await navigator.clipboard.writeText(htmlOutput.value);
    copyHtmlLabel.value = t('copied');
    setTimeout(() => {
      copyHtmlLabel.value = t('copyHtml');
    }, 1200);
  } catch (error) {
    copyHtmlLabel.value = t('copyError');
  }
};

const downloadJson = () => {
  const blob = new Blob([jsonOutput.value], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'form-config.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const sendToOpenAI = async () => {
  isSending.value = true;
  errorMessage.value = '';
  try {
    const response = await fetch('/api/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        temperature: 0.2,
        messages: [
          { role: 'system', content: llmInstructions.value },
          {
            role: 'user',
            content: `JSON:\n${jsonOutput.value}`
          }
        ]
      })
    });

    const rawText = await response.text();
    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status} ${response.statusText}: ${rawText || 'empty response'}`
      );
    }

    let data = {};
    if (rawText) {
      try {
        data = JSON.parse(rawText);
      } catch (parseError) {
        throw new Error(`Risposta non JSON: ${rawText}`);
      }
    }
    const message = data.choices?.[0]?.message?.content?.trim();
    if (!message) {
      throw new Error('Risposta vuota dall\'LLM.');
    }
    htmlOutput.value = message;
  } catch (error) {
    console.error(error);
    const details =
      error?.message && error.message.trim().length
        ? error.message
        : t('genericErrorDetails');
    errorMessage.value = `${t('htmlError')}\n${details}`;
    alert(errorMessage.value);
  } finally {
    isSending.value = false;
  }
};

const loadFromText = () => {
  try {
    const parsed = JSON.parse(jsonInput.value);
    if (!parsed.fields || !Array.isArray(parsed.fields)) {
      alert(t('jsonInvalid'));
      return;
    }
    formAction.value = parsed.form?.action ?? '';
    formMethod.value = parsed.form?.method === 'get' ? 'get' : 'post';
    fields.value = parsed.fields.map(normalizeField);
  } catch (error) {
    alert(t('jsonInvalidShort'));
  }
};

const triggerFilePick = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

const onFileChange = (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    jsonInput.value = reader.result;
    loadFromText();
  };
  reader.readAsText(file);
};
</script>

<style>
:root {
  color-scheme: light;
  --bg: #f6f4ef;
  --panel: #ffffff;
  --ink: #1b1b1b;
  --muted: #5d5d5d;
  --line: #e6e2d9;
  --accent: #2d6a4f;
  --accent-soft: #d8f3dc;
  --danger: #b02e0c;
  --shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  --radius: 18px;
  --mono: "SFMono-Regular", "IBM Plex Mono", "Consolas", monospace;
  --body: "Space Grotesk", "Fira Sans", "Trebuchet MS", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: var(--body);
  color: var(--ink);
  background:
    radial-gradient(circle at top, rgba(216, 243, 220, 0.7), transparent 55%),
    radial-gradient(circle at 10% 20%, rgba(255, 234, 167, 0.6), transparent 50%),
    var(--bg);
  min-height: 100vh;
}

.page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
  display: grid;
  gap: 2rem;
}

.hero {
  display: grid;
  gap: 0.75rem;
}

.language-switch {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.hero h1 {
  font-size: clamp(2rem, 3vw, 2.8rem);
  margin: 0;
  letter-spacing: -0.02em;
}

.hero p {
  margin: 0;
  color: var(--muted);
  max-width: 680px;
}

.builder {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
  gap: 1.5rem;
}

.panel {
  background: var(--panel);
  border-radius: var(--radius);
  padding: 1.5rem;
  box-shadow: var(--shadow);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

h2,
h3 {
  margin: 0;
}

h3 {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--muted);
}

.button {
  background: var(--accent);
  color: #fff;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 999px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.button:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(45, 106, 79, 0.2);
}

.button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.button.secondary {
  background: #f0f0f0;
  color: var(--ink);
}

.button.ghost {
  background: transparent;
  color: var(--ink);
  border: 1px solid var(--line);
}

.link-danger {
  background: transparent;
  color: var(--danger);
  border: none;
  cursor: pointer;
  font-weight: 600;
}

.field-card {
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 1rem 1.2rem 1.2rem;
  display: grid;
  gap: 1rem;
}

.field-card + .field-card {
  margin-top: 1rem;
}

.field-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.85rem;
}

label {
  display: grid;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: var(--muted);
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 0.55rem 0.7rem;
  font-size: 0.95rem;
  font-family: var(--body);
  background: #fff;
  color: var(--ink);
}

textarea {
  resize: vertical;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.65rem;
}

.options {
  display: grid;
  gap: 0.75rem;
}

.option-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  gap: 0.6rem;
  align-items: center;
}

.option-row button {
  border: none;
  background: #f6f4ef;
  padding: 0.35rem 0.6rem;
  border-radius: 8px;
  cursor: pointer;
}

.error-message {
  margin: 0.75rem 0 0;
  padding: 0.75rem;
  border-radius: 12px;
  background: #fbe9e6;
  color: var(--danger);
  font-size: 0.9rem;
  white-space: pre-wrap;
}

.json-output {
  width: 100%;
  min-height: 240px;
  font-family: var(--mono);
  font-size: 0.85rem;
  background: #fbfbf9;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 0.75rem;
}

.divider {
  height: 1px;
  background: var(--line);
  margin: 1.5rem 0;
}

.empty-state {
  border: 1px dashed var(--line);
  border-radius: 16px;
  padding: 1.5rem;
  color: var(--muted);
  text-align: center;
}

@media (max-width: 900px) {
  .builder {
    grid-template-columns: 1fr;
  }
}
</style>
