# Personal AI Reading Companion

A private, in-session reading assistant for user-uploaded book page images. Extract text via OCR, translate to Telugu, listen to audio, and explore summaries & characters.

**Privacy-First Design:**
- No permanent storage of images or text
- Auto-delete after 1 hour session TTL
- No sharing or download functionality
- Process only user-provided content

## Features

- 📷 **Upload Page Images** - Upload up to 15 book pages (JPG/PNG)
- ✂️ **Image Cropping** - Select specific text areas before OCR processing
- 📝 **OCR Text Extraction** - Extract English text using Tesseract
- ✨ **AI Text Correction** - Post-OCR correction used to fix common scanning errors
- 🔤 **Telugu Translation** - Translate while preserving proper nouns
- 🔊 **English Audio** - TTS playback using Piper (no download)
- 📌 **Summaries** - Short (bullets) or medium (paragraphs)
- 👥 **Character Table** - Names, roles, relationships, first appearances

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 15, React, TypeScript, Tailwind CSS, react-image-crop |
| Backend | Python 3.11+, FastAPI |
| OCR | pytesseract + Tesseract-OCR |
| Translation & AI | OpenAI API (GPT-4o-mini) for Correction & Translation |
| TTS | Piper TTS (local, English) |

## Prerequisites

1. **Python 3.11+** - [Download](https://python.org)
2. **Node.js 18+** - [Download](https://nodejs.org)
3. **Tesseract-OCR** - [Install Guide](https://github.com/tesseract-ocr/tesseract)
   - Windows: Download installer from [UB Mannheim](https://github.com/UB-Mannheim/tesseract/wiki)
   - Add to PATH
4. **OpenAI API Key** - [Get one](https://platform.openai.com/api-keys)

## Quick Start

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
.\venv\Scripts\activate
# Activate (Mac/Linux)
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Start server
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

### 3. Open the App

Navigate to **http://localhost:3000**

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/upload-images` | POST | Upload images, OCR extract text |
| `/pages/{session_id}` | GET | Get extracted page texts |
| `/translate` | POST | Translate page to Telugu |
| `/summary` | POST | Generate short/medium summary |
| `/characters` | POST | Extract character table |
| `/tts/english` | POST | Stream English audio |
| `/session/{session_id}` | DELETE | Delete session data |

## Project Structure

```
AI Reading Companion/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── requirements.txt     # Python deps
│   ├── .env.example         # Environment template
│   ├── models/
│   │   └── schemas.py       # Pydantic models
│   └── services/
│       ├── session.py       # Session management
│       ├── ocr.py           # Text extraction
│       ├── translation.py   # EN→TE translation
│       ├── summary.py       # Summarization
│       ├── characters.py    # Character extraction
│       ├── text_correction.py # AI OCR correction
│       └── tts.py           # Text-to-speech
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx     # Main page
    │   │   └── layout.tsx   # Root layout
    │   ├── components/
    │   │   ├── ImageUploader.tsx
    │   │   ├── ImageCropper.tsx
    │   │   ├── ReaderView.tsx
    │   │   ├── TranslationPanel.tsx
    │   │   ├── AudioPlayer.tsx
    │   │   ├── SummaryPanel.tsx
    │   │   └── CharacterTable.tsx
    │   ├── hooks/
    │   │   └── useSession.ts
    │   └── lib/
    │       └── api.ts       # API client
    └── package.json
```

## Privacy Guarantees

- ✅ All processing is in-memory only
- ✅ No database or file persistence
- ✅ Sessions auto-delete after 1 hour
- ✅ No audio download option
- ✅ No export or sharing features
- ✅ No cross-session data reuse

## License

Private use only. Do not redistribute copyrighted book content.
