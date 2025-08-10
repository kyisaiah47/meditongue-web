# MediTongue — Offline Medical Translator & Advisor (MVP)

> **Categories:** Best Local Agent, For Humanity  
> **One‑liner:** A fully offline, glossary‑aware medical translator that runs locally on your machine. No cloud required.

## ✨ Features

- **Two‑pane chat** for clinician ↔ patient
- **Medical glossary injection** with term chips for accuracy/transparency
- **EMERGENCY flagging** (e.g., chest pain, difficulty breathing)
- **Local‑only execution** via pluggable backends
  - Dev: **Ollama**
  - Demo: **gpt‑oss‑20B** via **vLLM (OpenAI‑compatible)**
- **Latency + backend badges**, Settings drawer
- **Copy to clipboard**, **phrasebook chips**, language mismatch warning (lightweight)

---

## 🏗 Architecture

```
apps/
  meditongue-web/       # Next.js + Tailwind + shadcn
  meditongue-api/       # Express API, adapters
meditongue-api/
  src/
    adapters/
      ollama.ts         # Ollama local adapter
      openai.ts         # OpenAI-compatible (vLLM) adapter
      index.ts          # interface
    glossary.ts         # glossary loader + matching
    server.ts           # /translate, /health
  data/glossary.json    # small, high-impact medical terms
```

---

## 🚀 Quickstart

### Prereqs

- Node 18+
- pnpm (or npm)
- (Dev path) **Ollama** installed and `ollama pull llama3.1`
- (Demo path) **vLLM** with `gpt-oss-20b` on a GPU box (recommended)

### 1) Web app

```bash
cd meditongue-web
pnpm install
pnpm dev    # http://localhost:3000
```

### 2) API (with Ollama dev backend)

```bash
cd meditongue-api
cp .env.example .env
# default .env:
# MODEL_BACKEND=ollama
# OLLAMA_URL=http://localhost:11434
# OLLAMA_MODEL=llama3.1
pnpm install
pnpm dev    # http://localhost:4000
```

Open the web UI and translate a sentence. You should see term chips + emergency banner when applicable.

---

## 🔁 Switch to gpt‑oss‑20B (vLLM, OpenAI‑compatible)

> Recommended: run **vLLM** on a Linux/NVIDIA GPU machine (local PC with RTX, or cloud). Your Mac can point to it over LAN.

1. Run vLLM:

```bash
python -m vllm.entrypoints.openai.api_server   --model /path/to/gpt-oss-20b   --dtype auto   --port 8000
```

2. Point the API to it (`meditongue-api/.env`):

```env
MODEL_BACKEND=openai
OPENAI_BASE_URL=http://<GPU-HOST>:8000/v1
OPENAI_MODEL=gpt-oss-20b
```

3. Restart the API:

```bash
pnpm dev
```

4. Hit the web UI. The header should show `Backend: openai` and your latency badge.

> **Note:** A 3080 (10GB) may need a **quantized** variant / smaller model. For tight VRAM, use quantized runtimes (exllamav2 / llama.cpp server) and add a corresponding adapter.

---

## ⚙️ `.env` (API)

```env
# One of: ollama | openai
MODEL_BACKEND=ollama

# Ollama mode
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1

# OpenAI-compatible (vLLM) mode
OPENAI_BASE_URL=http://localhost:8000/v1
OPENAI_MODEL=gpt-oss-20b
OPENAI_API_KEY=not-needed

PORT=4000
```

---

## 📚 Glossary format

`meditongue-api/data/glossary.json`

```json
{
	"en->es": [
		{
			"source": "chest pain",
			"target": "dolor torácico",
			"note": "Possible cardiac emergency"
		},
		{
			"source": "shortness of breath",
			"target": "dificultad respiratoria",
			"note": "Assess airway/breathing"
		}
	],
	"es->en": [
		{
			"source": "dolor torácico",
			"target": "chest pain",
			"note": "Possible cardiac emergency"
		}
	]
}
```

Add pairs as needed. The API injects **matched** terms into the prompt and returns them in `terms[]`.

---

## 🛰 API spec

### `POST /translate`

**Req**

```json
{
	"fromLang": "en",
	"toLang": "es",
	"text": "The patient reports sudden chest pain and shortness of breath."
}
```

**Res**

```json
{
	"translated": "El paciente informa dolor torácico repentino y dificultad respiratoria.",
	"terms": [
		{
			"source": "chest pain",
			"target": "dolor torácico",
			"note": "Possible cardiac emergency"
		},
		{
			"source": "shortness of breath",
			"target": "dificultad respiratoria",
			"note": "Assess airway/breathing"
		}
	],
	"flags": ["EMERGENCY"]
}
```

### `GET /health`

```json
{
	"backend": "openai",
	"ok": true,
	"model": "gpt-oss-20b",
	"baseUrl": "http://HOST:8000/v1"
}
```

---

## 🎬 Demo script (≤ 60s)

1. Launch the app; show **Backend** badge (vLLM) and **latency**.
2. Select **English → Arabic**.
3. Type: “I have chest pain and shortness of breath for 15 minutes.”
4. Click **Translate →**.
5. Show:
   - **Translated text**
   - **Term chips** (“chest pain → …”)
   - **EMERGENCY** banner + toast
6. Swap languages; copy translated output; show **phrasebook** chips.
7. Settings drawer → Refresh health, point to “local/remote” base URL.

---

## 🧪 Evaluation (quick & offline)

`meditongue-api/scripts/eval.mjs` (optional)

- Back‑translate 50 sample sentences per pair (`chrF` or char-F1)
- Term coverage: % of glossary hits preserved
- Report latency distribution (p50/p90/p99)

Use `pnpm eval` to print a one‑page markdown report for the README.

---

## 🔒 Safety & disclaimers

- Always display **“Not medical advice”** banner in the UI.
- Emergency triggers elevate a **visual warning** only; no diagnosis claims.
- No data leaves the device; logging is local‑only and disabled by default.

---

## 🧭 Roadmap

- Voice I/O: **whisper.cpp** (STT) + **piper** (TTS)
- Per‑clinic custom glossary import (CSV)
- More language pairs; larger curated medical parallel corpus
- Quantized runtime adapter (exllamav2 / llama.cpp server)
- Packaging: **Tauri** desktop app

---

## 📦 Submission checklist

- [ ] Category selection + 3–5 sentence rationale
- [ ] Public repo (this README + instructions)
- [ ] <3‑minute demo video (screen capture, voiceover)
- [ ] Clear indication of **gpt‑oss** model usage (README + code)
- [ ] Optional fine‑tune or curated corpus notes
- [ ] License file (MIT/Apache‑2.0 recommended)

---

## 🙏 Acknowledgments

- **gpt‑oss** models by OpenAI (+ community feedback)
- Hugging Face model hosting
- vLLM OpenAI‑compatible server
- shadcn/ui, TailwindCSS, Next.js
