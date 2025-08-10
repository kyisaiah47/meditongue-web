# MediTongue

**Offline AI-Powered Medical Translator (MVP)**  
_Not medical advice. For emergency communication assistance only._

---

## 🚀 Overview
MediTongue is an **offline** medical translator that runs entirely on your local machine — no internet required.  
It uses the open-source **gpt-oss-20b** model to translate medical dialogue between languages and detect urgent symptoms like chest pain or severe breathing issues.

Built for **field healthcare**, rural clinics, and low-connectivity environments.

---

## ✨ Features
- **Offline AI translations** — works without internet once the model is downloaded.
- **Emergency flagging** — instantly detects urgent symptoms and alerts the user.
- **Medical term glossary** — highlights and explains key medical terms.
- **Quick-access phrasebook** — preloaded with common emergency phrases.
- **Cross-platform** — runs locally on macOS, Windows, and Linux with Ollama.

---

## 📸 Demo
![Screenshot](docs/demo.png)  
![Emergency Flag](docs/emergency.png)  

---

## 🛠 Built With
- **Frontend:** Next.js, TailwindCSS, shadcn/ui
- **Backend API:** Node.js + Express
- **LLM Runtime:** [Ollama](https://ollama.com/) (local)
- **Model:** [gpt-oss-20b](https://huggingface.co/openai/gpt-oss-20b)  
- **Emergency detection:** Keyword spotting + AI classification

---

## ⚙️ Installation & Local Setup

### 1. Install Ollama
Download & install Ollama from:  
👉 https://ollama.com/download

### 2. Pull the gpt-oss-20b Model
```bash
ollama pull gpt-oss:20b
```

### 3. Clone this repository
```bash
git clone https://github.com/YOUR_USERNAME/meditongue.git
cd meditongue
```

### 4. Install dependencies
```bash
# API
cd meditongue-api
npm install

# Web UI
cd ../meditongue-web
npm install
```

### 5. Start the backend
```bash
cd meditongue-api
export MODEL_BACKEND=ollama
export OLLAMA_MODEL=gpt-oss:20b
npm start
```

### 6. Start Ollama
```bash
ollama serve
```

### 7. Start the frontend
```bash
cd meditongue-web
npm run dev
```

Then open **http://localhost:3000** in your browser.

---

## 📋 Example Prompt
Input (English):  
```
The patient is having chest pain and shortness of breath.
```
Output (Spanish):  
```
Tengo dolor torácico y dificultad respiratoria.
Flags: ["EMERGENCY"]
Terms:
- chest pain → dolor torácico
- shortness of breath → dificultad respiratoria
```

---

## 🧠 How It Works
1. **User Input** → Typed into the UI.
2. **Backend** → Sends text to Ollama with the gpt-oss-20b model.
3. **Translation** → AI translates & checks for emergency keywords.
4. **Glossary** → Matches and highlights medical terms.
5. **Output** → Translation + emergency flags + glossary shown in the UI.

---

## 📜 License
This project is licensed under the [Apache 2.0 License](LICENSE).

---

## 🙌 Acknowledgements
- [gpt-oss-20b](https://huggingface.co/openai/gpt-oss-20b) for the open-source model
- [Ollama](https://ollama.com/) for local LLM runtime
- Hackathon organizers for the challenge

---

## 🔗 Hackathon Submission
This project was submitted for the **For Humanity** and **Best Local Agent** categories.  
