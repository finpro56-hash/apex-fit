# Apex Fit - Environment Variables & Configuration Refactoring Plan

A secure and clean refactoring of **Apex Fit**'s configuration management to move all API credentials and Firebase client configuration into `.env` and `.env.example`, while strictly isolating backend secrets (`GEMINI_API_KEY`) from client-side bundles and maintaining full compatibility with AI Studio runtime environments.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following configuration patterns incorporate your selections from the interactive clarification step:

- **Firebase Config Initialization**: `src/firebase/config.ts` will load configuration from `import.meta.env.VITE_FIREBASE_*` variables, with a seamless fallback to `firebase-applet-config.json` so the app functions reliably in both local `.env` setups and automated sandbox environments.
- **Firestore Instance Setup**: Initialize the Firestore instance using the designated database configuration without hardcoded sensitive defaults.
- **Git Security**: Verify `.env` is ignored in `.gitignore` (with `!.env.example` preserved).

---

## 1. Overview & Configuration Structure

### Environment Variables Matrix

| Variable Name | Target Scope | Purpose / Source |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Backend (`server.ts`) | Isolated server-side key for GoogleGenAI SDK calls |
| `VITE_FIREBASE_API_KEY` | Frontend (`import.meta.env`) | Firebase Web API Key for client Auth & Firestore |
| `VITE_FIREBASE_AUTH_DOMAIN` | Frontend (`import.meta.env`) | Firebase Auth domain for Google Sign-in popup |
| `VITE_FIREBASE_PROJECT_ID` | Frontend (`import.meta.env`) | Google Cloud Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Frontend (`import.meta.env`) | Firebase Storage Bucket URL |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Frontend (`import.meta.env`) | Cloud Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Frontend (`import.meta.env`) | Firebase Web Application ID |
| `VITE_FIREBASE_FIRESTORE_DATABASE_ID` | Frontend (`import.meta.env`) | Firestore Database ID instance |

---

## 2. Technical Architecture & File Layout

```
┌─────────────────────────────────────────────────────────────┐
│                           .env                              │
│  • GEMINI_API_KEY="..." (Server-side ONLY)                  │
│  • VITE_FIREBASE_API_KEY="..."                              │
│  • VITE_FIREBASE_AUTH_DOMAIN="..."                          │
│  • VITE_FIREBASE_PROJECT_ID="..."                           │
│  • VITE_FIREBASE_STORAGE_BUCKET="..."                       │
│  • VITE_FIREBASE_MESSAGING_SENDER_ID="..."                  │
│  • VITE_FIREBASE_APP_ID="..."                               │
│  • VITE_FIREBASE_FIRESTORE_DATABASE_ID="..."                │
└──────────────────────────────┬──────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│    Backend: server.ts       │ │   Frontend: config.ts       │
│  process.env.GEMINI_API_KEY │ │ import.meta.env.VITE_...    │
│  (Never exposed to client)  │ │ (Safe client Firebase init) │
└─────────────────────────────┘ └─────────────────────────────┘
```

---

## Implementation Steps

1. **Create `.env` & Update `.env.example`**:
   - Populate `.env` with current project Firebase credentials (prefixed with `VITE_FIREBASE_`) and `GEMINI_API_KEY`.
   - Update `.env.example` with clear documentation and placeholders for all variables.

2. **Refactor Firebase Config (`src/firebase/config.ts`)**:
   - Load Firebase configuration using `import.meta.env.VITE_FIREBASE_*`.
   - Provide fallback to `firebase-applet-config.json` when `VITE_` variables are omitted.
   - Cleanly export `app`, `auth`, `db`, and `googleProvider`.

3. **Verify Git Ignore (`.gitignore`)**:
   - Ensure `.env*` and `!.env.example` prevent tracking of actual secrets while keeping the example template in version control.

4. **Verification**:
   - Run `compile_applet` and `lint_applet` to confirm build integrity.
