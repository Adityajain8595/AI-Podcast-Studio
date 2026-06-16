# 🎙️ AI Podcast Generator

<p align="center">
  <em>Transform any topic into a professional, AI-generated podcast in minutes</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.1-61DAFB.svg?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688.svg?style=for-the-badge&logo=fastapi" alt="FastAPI">
  <img src="https://img.shields.io/badge/LangGraph-0.2-1C3C3C.svg?style=for-the-badge&logo=langchain" alt="LangGraph">
  <img src="https://img.shields.io/badge/Supabase-3ECF8E.svg?style=for-the-badge&logo=supabase" alt="Supabase">
  <img src="https://img.shields.io/badge/Google%20Cloud%20TTS-4285F4.svg?style=for-the-badge&logo=googlecloud" alt="Google Cloud TTS">
</p>

<p align="center">
  <a href="#overview">Overview</a> •
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#api-reference">API</a>
</p>

---

## 📍 Overview {#-overview}

**AI Podcast Generator** is an end-to-end platform that transforms any topic into a professional AI-generated podcast through a multi-agent workflow powered by LangGraph.

The system automatically:
- Researches a topic using web search
- Conducts AI-driven conversations between a Host and Expert
- Generates natural podcast scripts
- Converts scripts into high-quality speech
- Stores podcasts for future playback

### ✨ Key Highlights
- 🎙️ AI-generated podcasts in under 2 minutes
- 🧠 Multi-agent orchestration using LangGraph
- 🔍 Real-time web research with Tavily
- 🔊 Studio-quality audio via Google Cloud TTS
- ☁️ Cloud storage using Supabase
- 📡 Live generation tracking with SSE

> **Live Demo:** [Try it here](https://ai-podcast-studio-e6ne.onrender.com/)

---

## 👾 Features {#features}

### 🧠 Intelligent Content Generation
- Multi-agent LangGraph workflow
- Real-time web research integration
- Dynamic conversational AI Host
- Context-aware Expert responses
- Structured topic planning & interviews execution.

### 🎙️ Professional Audio Production
- Google Cloud neural voices
- SSML-based speech enhancement
- English & Hindi support
- Gender-specific voices
- Precise word-level timestamps

### 🔄 Real-Time Experience
- Server-Sent Events (SSE)
- Live progress tracking
- Synchronized captions
- Audio waveform visualization

### 💾 Content Management
- Supabase cloud storage
- Podcast history dashboard
- Download and playback support
- Credit management system

### 🎨 Modern UI
- Glassmorphism design
- Dark mode support
- Responsive layout
- Smooth animations via Framer Motion

---

## 🏗️ Architecture {#architecture}

### Backend Stack
| Technology | Purpose |
|------------|---------|
| FastAPI | REST API |
| LangGraph | Multi-agent orchestration |
| LangChain + Groq | LLM inference |
| Google Cloud TTS | Speech synthesis |
| Supabase | Auth, DB & Storage |
| Tavily | Web search |

### Frontend Stack
| Technology | Purpose |
|------------|---------|
| React 19 | UI Framework |
| Vite | Build Tool |
| Tailwind CSS | Styling |
| Framer Motion | Animations |
| EventSource API | SSE Client |
| Web Audio API | Waveforms |

### System Flow

```text
User Topic
    ↓
Planning Agent
    ↓
Research Agent (Tavily)
    ↓
Interview Agent
    ↓
Script Generation
    ↓
Google Cloud TTS
    ↓
MP3 Generation
    ↓
Supabase Storage
    ↓
Frontend Playback
```

---

## 🔄 Podcast Generation Workflow

1. **Planning Phase**
   - Extract keywords
   - Generate subtopics

2. **Research Phase**
   - Fetch factual information
   - Enrich context via Tavily

3. **Interview Phase**
   - Host asks questions
   - Expert responds intelligently

4. **Script Assembly**
   - Build conversational podcast script

5. **TTS Synthesis**
   - Convert script into natural speech

6. **Storage**
   - Save metadata and audio to Supabase

---
 
## 🚀 Getting Started {#getting-started}

### ☑️ Prerequisites

- Python 3.10+
- Node.js 18+
- Google Cloud account
- Supabase project
- Groq API Key
- Tavily API Key

---

## ⚙️ Installation

### 1. Clone Repository

```bash
git clone <https://github.com/Adityajain8595/AI-Podcast-Studio>
cd AI-Podcast-Studio
```

### 2. Backend Setup

```bash
cd backend

python -m venv venv

# Linux / macOS
source venv/bin/activate

# Windows
venv\Scripts\activate

pip install -r requirements.txt
```

### 3. Configure Backend Environment

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SECRET_KEY=your_supabase_secret_key
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json
GCP_PROJECT_ID=project_gcp_id
GROQ_API_KEY=your_groq_api_key
TAVILY_API_KEY=your_tavily_api_key
```

### 4. Frontend Setup

```bash
cd ../frontend
npm install
```

Create:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BACKEND_URL=https://ai-podcast-studio-iirs.onrender.com/
```

---

## 🎯 Running the Application

### Start Backend

```bash
cd backend
uvicorn app:app --reload
```

### Start Frontend

```bash
cd frontend
npm run dev
```

### Access URLs

| Service | URL |
|---------|-----|
| Frontend | `https://ai-podcast-studio-e6ne.onrender.com/` |
| Backend | `https://ai-podcast-studio-iirs.onrender.com/` |
| API Docs | `https://ai-podcast-studio-iirs.onrender.com/docs` |

---

## 💻 Usage Guide

1. Sign in using Email or Google
2. Enter a topic
3. Click **Generate Podcast**
4. Track live generation progress
5. Listen with captions
6. Manage podcasts from dashboard

---

## 📁 Project Structure

```text
podcast-generator/
│
├── backend/
│   ├── app.py
│   ├── podcast_workflow.py
│   ├── tts_utils.py
│   ├── supabase_client.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── components/
│   │   └── assets/
│   ├── public/
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── .env
├── .gitignore
└── README.md
```

---

## 🛠️ Technology Deep Dive

### 🧠 LangGraph Agent Architecture

#### Planning Agent
- Extracts keywords
- Generates subtopics
- Uses structured output

#### Interview Agent
- Host Agent asks questions
- Expert Agent answers
- Research Agent provides facts

#### Script Assembly
- Converts dialogue to podcast format
- Injects SSML tags
- Adds intro and outro

---

## 🎙️ TTS Pipeline

```text
Script
   ↓
Dialogue Parsing
   ↓
SSML Generation
   ↓
Google Cloud TTS
   ↓
MP3 Assembly
   ↓
Timestamp Generation
```

### Features
- Conversational pauses
- Neural voice selection
- Segment stitching
- Caption synchronization

---

## 📊 API Reference {#api-reference}

### Authentication
All endpoints except `/health` require a Bearer token.

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/generate-podcast` | Start podcast generation |
| GET | `/stream-progress/{job_id}` | Live SSE updates |
| GET | `/user/credits` | Fetch credits |
| GET | `/user/podcasts` | List podcasts |
| GET | `/user/podcasts/{job_id}` | Podcast details |
| DELETE | `/user/podcasts/{job_id}` | Delete podcast |

---

## 💳 Credit System

| Feature | Value |
|---------|-------|
| Daily Limit | 3 Podcasts |
| Cost | 1 Credit |
| Reset | Midnight UTC |
| Refund | On Failure |

---

## ☁️ Supabase Setup

### User Credits Table

```sql
CREATE TABLE user_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  daily_credits_used INT DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Podcasts Table

```sql
CREATE TABLE podcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  job_id UUID UNIQUE,
  topic TEXT,
  language VARCHAR(10),
  script TEXT,
  audio_url TEXT,
  timestamps JSONB,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Storage Bucket

```text
Bucket Name: podcast-bucket
Public Access: Enabled
```

---

## 🖼️ Screenshots

> Screenshots coming soon.

---

### Guidelines

- Follow project conventions
- Write tests
- Update documentation
- Keep APIs documented

---

<p align="center">

> Made by [Aditya Jain](https://github.com/Adityajain8595)

</p>

<p align="center">
  <a href="https://github.com/Adityajain8595/AI-Podcast-Studio">⭐ Star on GitHub</a>
  &nbsp;•&nbsp;
  <a href="https://ai-podcast-studio-e6ne.onrender.com/">🌐 Live Demo</a>
</p>