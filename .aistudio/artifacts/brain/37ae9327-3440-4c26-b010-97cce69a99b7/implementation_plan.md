# Apex Fit - AI Fitness & Diet Tracker

Apex Fit is a mobile-first, installable Progressive Web App (PWA) designed for personal fitness and diet tracking. It combines secure Firebase Authentication and Cloud Firestore data persistence with Gemini AI multimodal capabilities for food photo analysis, voice/text food logging, and intelligent fitness coaching.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> - **Firebase Auth & Firestore**: Configured via Firebase integration (`my-app-a3712`). Authentication uses Google Sign-in with secure UID isolation.
> - **AI Integration**: Secure backend proxy (`server.ts`) handles Gemini API calls (`@google/genai`) using environment secrets (`GEMINI_API_KEY`), ensuring keys are never exposed in frontend code.
> - **Data Integrity**: AI food photo and voice/text logging outputs require user review and confirmation before writing permanent records to Firestore.

- **Confirmed Decision 1**: Mobile-first design optimized for thumb navigation with a fixed bottom tab bar (Today, Food, Workout, Progress, AI).
- **Confirmed Decision 2**: Strict separation of database domains (`profiles`, `goals`, `foodLogs`, `workoutPlans`, `workoutSessions`, `progress`, `aiConversations`).

---

## 1. Overview & Core Concept

- **What It Does**: End-to-end fitness and nutrition tracking with AI-assisted food logging (photos, voice, text), workout planning and session logging (sets, reps, weight), progress analytics, and Gemini fitness Q&A.
- **Target Audience / Persona**: Fitness enthusiasts and individuals looking to track calories, macros, workouts, and receive personalized AI coaching.
- **Key Value**: Frictionless food logging via multimodal AI and voice, robust workout tracking, and 100% data ownership secured by Firebase UID.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. Secure Google Sign-In with 24-hour token session persistence.
  2. Onboarding to set profile body metrics and daily calorie/macro goals.
  3. **Today Dashboard**: Real-time calorie and macro progress ring summary, meal breakdown, and quick action triggers.
  4. **Food Tracking**: Manual entry, photo scanning (multimodal Gemini analysis), voice recording (audio transcription & food entity extraction), and review/confirmation before saving.
  5. **Workout Tracking**: Plan builder, exercise logging (weight, reps, sets), rest timers, and active session recorder.
  6. **Progress Tracking**: Weight logs, training volume charts, and personal records.
  7. **AI Assistant**: Multi-turn conversational fitness and diet coach with context-aware data retrieval.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Clean, modern athletic utilitarian (slate/zinc neutrals with vibrant emerald accent and energetic amber warning states).
  - *Color Palette*: 60% neutral light/dark canvas (`bg-slate-50` / `bg-slate-950`), 30% structural cards (`bg-white` / `bg-slate-900`), 10% emerald accent (`bg-emerald-600`).
  - *Typography*: Clean sans-serif sans body with `font-mono tabular-nums` for all metrics, stats, and numbers.
- **Interactive Feedback**: Smooth 150ms transitions, haptic-style active button feedback (`active:scale-[0.98]`), and toast notifications for successful saves.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Secure Backend Gemini Proxy**:
  - *Chosen Approach*: Node.js Express server (`server.ts`) proxying requests to Gemini API (`@google/genai`).
  - *Why*: Protects `GEMINI_API_KEY` from client-side exposure while enabling secure structured JSON generation and prompt validation.
- **Decision 2: Subcollection Domain Separation**:
  - *Chosen Approach*: Separate Firestore subcollections (`users/{uid}/foodLogs`, `users/{uid}/workoutSessions`, etc.).
  - *Why*: Enforces granular Firestore security rules, prevents document size limits, and enables efficient querying.

---

## 4. Technical Architecture & Data Strategy

```
                         ┌──────────────────────┐
                         │      PWA CLIENT      │
                         │ React + TypeScript   │
                         └──────────┬───────────┘
                                    │
                         Firebase Authentication
                                    │
                         ┌──────────▼───────────┐
                         │   Firestore & Auth   │
                         └──────────┬───────────┘
                                    │
                       Secure Backend (`server.ts`)
                                    │
                         ┌──────────▼───────────┐
                         │     Gemini API       │
                         │ (@google/genai SDK)  │
                         └──────────────────────┘
```

- **Data Model & Firestore Collections**:
  - `users/{uid}/profile/main`: User metrics (height, weight, age, activity level).
  - `users/{uid}/goals/main`: Daily targets (calories, protein, carbs, fat).
  - `users/{uid}/foodLogs/{logId}`: Food entries with source (`manual`, `photo`, `voice`, `text`), calories, macros, and confirmation status.
  - `users/{uid}/workoutPlans/{planId}`: Workout templates and exercises.
  - `users/{uid}/workoutSessions/{sessionId}`: Logged workouts with sets, reps, and weights.
  - `users/{uid}/aiConversations/{convId}`: Chat history with Gemini.
- **PWA & Offline Shell**:
  - Web App Manifest (`manifest.json`) and Service Worker for offline app shell caching and installability.
