

---

## 📝 Project Overview

**English Janala** is a beginner-friendly interactive platform designed to help users learn English vocabulary through categorized lessons. It includes Supabase accounts, lesson progress, a progress dashboard, vocabulary search, quizzes, and spaced revision.

---

## 🌐 Live Site

🔗 [Visit Live Project](https://sanjidtalukder.github.io/English-Janala/)

---

## 🧰 Technologies Used

- **HTML5**
- **CSS3** (Tailwind CSS + DaisyUI)
- **JavaScript**
- **SweetAlert2**
- **Font Awesome**
- **Responsive UI**

---

## ✨ Main Features

  - Supabase email/password account creation and login
  - Login-free demo mode for reviewers
  - Vocabulary Learning with Lesson-wise filtering
  - User-owned vocabulary progress saved in Supabase with Row Level Security
  - Lesson 1 opens after entering the app
  - API integration from Programming Hero OpenAPI
  - Popup Modal with:
  - Word
  - Pronunciation
  - Meaning
  - Example sentence
  - Synonyms
  - Smooth section scroll for FAQ and Lesson
  - obile-friendly design
  - Logout functionality

---

## 📦 External Dependencies

```bash
CDN:
- DaisyUI (Tailwind CSS Components)
- Font Awesome 6.7
- SweetAlert2 (for alert messages)

## 🙋‍♂️ Author

**Sanjid Talukder**  
Junior Web Developer | CSE, Dhaka International University  
GitHub link: https://github.com/sanjidtalukder?tab=repositories

---


## 🎓 Guided By

Inspired & structured under the guidance of Programming Hero

## Run locally with AI-generated practice

The app includes a small Node.js backend. It uses the OpenAI Responses API to generate three English example sentences with Bengali meanings and a four-turn conversation for each word. The API key is read by the backend and is never sent to the browser.

1. Install Node.js 20 or newer.
2. If `.env` does not exist, copy `.env.example` to create it; otherwise add missing settings without overwriting existing keys.
3. Add your OpenAI API key to `OPENAI_API_KEY` in `.env`. Keep `.env` private and do not commit it.
4. Start the app from this project folder with `npm run dev`.
5. Open `http://127.0.0.1:3000`.

Generated lessons use the `gpt-6-luna` model by default. Set `OPENAI_MODEL` in `.env` to choose another compatible model. OpenAI API usage may be billed to your account. Without a key, the vocabulary app still loads, while the new practice section explains that the key needs to be configured.

## Supabase setup

1. Create a Supabase project.
2. Add the Project URL and publishable key to `.env` as `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. If `.env` does not exist, copy `.env.example` first; keep any existing OpenAI key when adding these settings. Legacy `SUPABASE_ANON_KEY` is also supported. Never use a `service_role` or secret key for this app.
3. Open Supabase Dashboard > SQL Editor and run [`supabase/schema.sql`](supabase/schema.sql). Re-run this idempotent schema after app updates; it creates per-user progress, saved vocabulary, activity, and daily goal tables with Row Level Security policies.
4. To let users enter immediately after signing up, open Supabase Dashboard > Authentication > Sign In / Providers > Email and turn **Confirm Email** off. The signup endpoint expects Supabase to return a session and sends the user straight into Lesson 1. If confirmation stays enabled, signup shows a clear setup error instead of asking the user to verify email.
5. Restart `npm run dev` after changing `.env`.

If completing a word reports an RLS error for `word_progress`, run [`supabase/fix-word-progress-rls.sql`](supabase/fix-word-progress-rls.sql) in Supabase Dashboard > SQL Editor while signed in as the project owner. This resets that project-owned table's policies to allow each authenticated user to read and write only their own progress.

The Node backend keeps the Supabase access and refresh tokens in HttpOnly cookies. Lesson 1 opens after login. Completed vocabulary, quiz scores, review schedule, daily goal, and activity streak are stored per authenticated Supabase user. Daily goal defaults to five words.

The DictionaryAPI.dev endpoint looks up one English word at a time. The app uses it for pronunciation, audio, definitions, examples, and related words. Since it does not provide a downloadable/searchable complete word list, the app offers curated topic lessons and lets learners search for and save any individual word in **My Words**. Dictionary results are cached on the Node server for 24 hours; source and license links are shown in word details. Dictionary API/network failures show a retry message, while lesson words that are unavailable are skipped with a notice.

The **Demo হিসেবে দেখুন** button bypasses authentication for reviewers. Demo progress and saved words stay in that browser's local storage and do not write to Supabase.

## Deployment

The app must be served by its Node backend (or a compatible host) because the backend proxies Supabase Auth, reads the private OpenAI key, and serves the app API. GitHub Pages alone cannot run these endpoints. Configure `OPENAI_API_KEY`, `SUPABASE_URL`, and `SUPABASE_PUBLISHABLE_KEY` in the hosting provider's environment settings; do not commit `.env`. Set `NODE_ENV=production` when deployed over HTTPS so auth cookies use the Secure flag.
