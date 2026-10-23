# 📑 English Janala: An Intelligent, Spaced-Repetition & Context-Driven Vocabulary Acquisition Platform

> **A Comprehensive Architectural, Pedagogical, and Technical Specification**  
> *Author:* **Sanjid Talukder** (Department of Computer Science & Engineering, Dhaka International University)  
> *Affiliation:* Project English Janala · ED-Tech Initiative  
> *Live System Demonstration:* [https://english-janala-5fox.onrender.com/](https://english-janala-5fox.onrender.com/)

---

## 🔬 Abstract
Vocabulary acquisition remains one of the most critical bottlenecks in second-language (L2) acquisition, particularly for non-native English learners in Bengali-speaking demographics. Traditional pedagogical paradigms often rely on rote memorization (cramming), which suffers from catastrophic forgetting curves and a lack of authentic communicative context.

**English Janala** (বাংলা: *ইংরেজি জানালা*) introduces a modern, hybrid web-engineered platform designed to bridge the cognitive divide between lexical discovery, multi-sensory retention, and contextual communicative application. By integrating the **Ebbinghaus Spaced Repetition System (SRS)** with dual-source lexical aggregation (Wiktionary REST API + OpenAPIs), contextual Large Language Model (LLM) generation, and multi-tier persistent architecture (Node.js runtime + Supabase PostgreSQL RLS), English Janala presents an adaptive, full-duplex educational web application that delivers high retention rates and an intuitive user experience across mobile, tablet, and desktop viewports.

---

## 🏛️ System Architecture & Engineering

The application is architected around a high-performance, non-blocking asynchronous event loop with strong separation of concerns across the Client Tier, Application Server Tier, Persistence Layer, and External Intelligence APIs.

```
+-----------------------------------------------------------------------------------+
|                                CLIENT TIER (Browser)                             |
|  - HTML5 Semantic Document Structure + CSS3 (Tailwind CSS + DaisyUI)             |
|  - Vanilla ES6+ Client Engine (No heavy frontend bundle overhead)                 |
|  - Mobile-First Adaptive Viewport System (Dynamic Hamburger Collapse Architecture) |
|  - Web Speech API + Native Audio Synthesis Buffer                                 |
+-----------------------------------------------------------------------------------+
                                        |  (Secure HTTP / REST / JSON)
                                        v
+-----------------------------------------------------------------------------------+
|                           APPLICATION SERVER (Node.js)                            |
|  - Zero-Dependency Native Runtime (`node:http`, `node:crypto`, `node:fs`)         |
|  - Cryptographic Session Handling & Secure HttpOnly Token Masking                 |
|  - 24-Hour In-Memory & LRU Lexical Caching Gateway                                |
|  - Reverse-Proxy for Third-Party APIs (Eliminating CORS & Private Key Leakage)   |
+-----------------------------------------------------------------------------------+
        |                                       |                           |
        v                                       v                           v
+-----------------------+   +-------------------------------+   +-----------------------+
|  PERSISTENCE TIER     |   |    AI & CONTEXT ENGINE        |   |   LEXICAL REPOSITORIES|
|  Supabase PostgreSQL  |   |    OpenAI Responses Engine    |   |  Wiktionary REST API  |
|  Row Level Security   |   |   3 Dynamic Context Sentences |   |  Datamuse Synonyms    |
|  PL/pgSQL Trigger Func|   |   4-Turn Conversational Model |   |  Programming Hero API |
+-----------------------+   +-------------------------------+   +-----------------------+
```

---

## 🚀 Key Pedagogical Features & Benefits

### 1. Unified Multilingual Lexical Card Design
* **Dual-Column Cognitive Mapping:** Each vocabulary card isolates **Meaning** (Bengali native contextual translation) on the left and **Phonetic Pronunciation** on the right, eliminating cognitive interference.
* **Audio-First Inclusivity:** When written phonetic representations are sparse, the system dynamically injects an audio synthesis trigger (`🔊 শুনুন`), allowing learners to internalize native cadences.
* **Capitalized Case Normalization:** Ensures consistent typographic hierarchy for improved optical reading flow.

### 2. Spaced Repetition System (SRS) & Adaptive Revision Pipeline
* Designed on the principles of the **Ebbinghaus Forgetting Curve**:
  $$\text{Memory Retention } (R) = e^{-\frac{t}{S}}$$
* Words flagged as *Complete Learning* enter a calculated review queue with expanding temporal horizons ($1 \text{ day} \to 3 \text{ days} \to 7 \text{ days} \to 14 \text{ days} \to 30 \text{ days}$).
* Real-time automated assessment modifies word mastery levels, targeting weak lexical memory nodes before permanent forgetting occurs.

### 3. Contextual Dialogue & Generative AI Practice
* Isolated vocabulary is rarely transferred into spontaneous speech. English Janala overcomes this by triggering on-demand context generation:
  - **Three Contextual Sentences:** Illustrating prepositions, tense variance, and idioms.
  - **Interactive 4-Turn Dialogue:** Demonstrating how the word functions in authentic everyday human discourse.

### 4. Seamless Lexical Fallback & Universal Search
* Integrates a unified search input that queries local curated curriculum modules as well as international lexical databases (Wiktionary & Datamuse).
* **Zero Cognitive Distraction:** External word queries are loaded natively with standard platform indicators, maintaining user immersion without exposing backend source fragmentation.

### 5. Multi-Device Adaptive Responsiveness
* **Mobile-First Layout:** Tailored specifically for smartphones (screen widths $<640\text{px}$) and tablets ($640\text{px} - 1024\text{px}$).
* **3-Line Hamburger Menu System (☰):** Both the primary navigation bar and the multi-tier lesson selectors collapse gracefully into responsive drawer/accordion modules, preserving precious vertical screen space for active learning cards.

---

## 🛠️ Technology Stack & Specifications

| Layer | Technologies & Protocols | Role & Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | HTML5, CSS3, Tailwind CSS, DaisyUI | Semantic UI, ultra-responsive grid, glassmorphism aesthetics |
| **Frontend Engine** | Vanilla ES6+ JavaScript | Zero-framework runtime, high FPS rendering, DOM diffing |
| **Server Engine** | Node.js (Version 20+ LTS) | Lightweight, non-blocking asynchronous REST API gateway |
| **Database Engine** | PostgreSQL via Supabase | Relational data persistence with strict typed schemas |
| **Data Protection** | PostgreSQL Row-Level Security (RLS) | Isolated multi-tenant security ensuring complete user privacy |
| **Authentication** | Supabase Auth + HttpOnly Secure Cookies | CSRF/XSS-hardened stateless and stateful authentication |
| **Intelligence Tier**| OpenAI API (`gpt-4o` / compatible models) | Real-time sentence synthesis & interactive dialogue generation |
| **External Lexicon** | Wiktionary REST API + Datamuse API | Comprehensive global lexical fallback, phonetics, and synonyms |
| **Alert Systems** | SweetAlert2 | User-friendly feedback toasts and error handling modals |

---

## 🗄️ Database Architecture & Schema Specification

The relational architecture ensures strict multi-tenancy where each authenticated user operates within their isolated cryptographic partition.

```sql
-- Core User Schema Architecture Overview
1. word_progress    : Tracks user mastery stage, quiz metrics, review intervals, and timestamps.
2. saved_words      : Enables custom dictionary curation ("My Words") with serialized definitions.
3. study_activity   : Logs daily learning events to drive the real-time streak computation algorithm.
4. user_settings    : Houses learner preferences, individualized daily vocabulary quotas (goals).
```

### Row Level Security (RLS) Paradigm
Every table is secured with declarative SQL policies:
```sql
CREATE POLICY "Users can only manipulate their personal progress" 
ON public.word_progress
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

---

## 🚦 Local Installation & Research Environment Setup

Follow these steps to establish a local research or development node:

### 1. Prerequisites
* **Node.js**: `v20.0.0` or higher
* **npm**: `v10.0.0` or higher
* Active Supabase project credentials
* OpenAI API Key (optional, for real-time practice sentence generation)

### 2. Repository Cloning & Environment Setup
```bash
# Clone the repository
git clone https://github.com/sanjidtalukder/English-Janala.git

# Navigate to project root
cd English-Janala

# Configure environment variables
cp .env.example .env
```

### 3. Environment Variable Configuration (`.env`)
Populate your `.env` file with appropriate API secrets:
```env
PORT=3000
NODE_ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
```

### 4. Database Initialization
1. Navigate to your **Supabase Dashboard > SQL Editor**.
2. Open and execute the declarative script: [`supabase/schema.sql`](supabase/schema.sql).
3. Verify that the tables (`word_progress`, `saved_words`, `study_activity`, `user_settings`) are created with Row Level Security enabled.

### 5. Launch Application
```bash
# Start backend server with automatic live execution
npm run dev

# Access the interface
open http://127.0.0.1:3000
```

> **Evaluation / Reviewer Note:** For instant review without configuring an email server, the interface provides a built-in **"Demo হিসেবে দেখুন" (Demo Mode)** button. Demo sessions operate locally via browser-isolated `localStorage` sandboxing.

---

## 📊 Comparison with Traditional Learning Tools

| Dimension | Conventional Vocabulary Sites | Anki / Pure SRS Flashcards | **English Janala** |
| :--- | :---: | :---: | :---: |
| **Bengali Contextualization** | ❌ Minimal / English-only | ⚠️ User-created only | ✅ **Native Curated Mapping** |
| **Interactive Spaced Review** | ❌ Static list | ✅ Yes | ✅ **Integrated Adaptive SRS** |
| **Automated AI Dialogue** | ❌ No | ❌ No | ✅ **Dynamic 4-Turn Models** |
| **Pronunciation Synthesis** | ⚠️ Often broken | ⚠️ Audio file dependencies | ✅ **Hybrid REST + WebSpeech** |
| **Zero-Installation Footprint** | ✅ Web-based | ❌ Desktop/Mobile App required | ✅ **Fully Responsive Web App** |

---

## 📈 Future Research & Roadmap Directions
* **Voice-Recognition Pronunciation Scoring:** Integration of Web Speech Recognition API to evaluate pronunciation accuracy with phonetic distance metrics (Levenshtein Distance).
* **Offline-First PWA Support:** Service Worker cache caching for core lessons allowing offline access in rural areas with intermittent connectivity.
* **Gamification & Social Quests:** Cooperative vocabulary milestones and peer-to-peer revision battles.

---

## 👨‍💻 Primary Investigator & Author

**Sanjid Talukder**  
*Department of Computer Science & Engineering*  
**Dhaka International University (DIU)**  
* GitHub: [@sanjidtalukder](https://github.com/sanjidtalukder)  
* Repository: [English-Janala](https://github.com/sanjidtalukder/English-Janala)

---

## 📜 License & Acknowledgments
This research project is distributed under the **MIT License**.  
Special acknowledgments to **Programming Hero** for structural inspirations and curriculum scaffolding.
