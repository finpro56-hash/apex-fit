# Gemini API Key Environment Variable Configuration Plan

Ensure **GEMINI_API_KEY** is strictly managed via `.env` and accessed securely on the backend server (`server.ts`) via `process.env.GEMINI_API_KEY`, completely isolated from client-side code.

---

## 1. Objectives & Scope

- **Environment File Configuration**: Ensure `GEMINI_API_KEY` is defined in `.env` and documented in `.env.example`.
- **Backend Verification (`server.ts`)**: Initialize `GoogleGenAI` strictly using `process.env.GEMINI_API_KEY` (loaded via `dotenv`) with clear logging if missing.
- **Client Isolation**: Verify no Gemini API keys or SDKs are referenced in client React code.

---

## Technical Architecture

```
                 .env file (Server-side ONLY)
                 GEMINI_API_KEY="<api-key>"
                            │
                            ▼
                        server.ts
              process.env.GEMINI_API_KEY
                            │
                            ▼
                    GoogleGenAI SDK
                            │
                            ▼
              Server API Proxy Endpoints
```

---

## Implementation Steps

1. **Update `server.ts`**:
   - Ensure `dotenv.config()` loads `process.env.GEMINI_API_KEY`.
   - Add explicit logging for `process.env.GEMINI_API_KEY` validation.
2. **Verify `.env` & `.env.example`**:
   - Ensure `GEMINI_API_KEY` placeholder is set up in `.env` and `.env.example`.
3. **Verification**:
   - Run `compile_applet` and `lint_applet` to verify compilation.
