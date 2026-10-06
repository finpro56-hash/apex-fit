# Vercel Serverless Deployment Fix Plan

A focused configuration and export refactoring to ensure AI API endpoints operate seamlessly when hosted on Vercel as a Serverless Express function.

---

## 1. Scope of Work

1. **`vercel.json` Update**:
   Replace contents with standard Serverless Express rewrites and function limits:
   ```json
   {
     "functions": {
       "server.ts": {
         "memory": 1024,
         "maxDuration": 10
       }
     },
     "rewrites": [
       {
         "source": "/api/(.*)",
         "destination": "/server.ts"
       },
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```

2. **`server.ts` Express App Export**:
   - Refactor `server.ts` to instantiate `app = express()` at top-level scope.
   - Attach all middleware (Helmet, Rate Limiter, JSON body parsing) and API routes (`/api/*`).
   - Conditionally mount Vite dev middleware and start local listener when not in Vercel production mode.
   - Export `app` as default (`export default app;`) for Vercel Serverless Function execution.

3. **Preservation**:
   - Keep all routes, security headers, rate limiters, Zod schemas, and frontend components intact.

---

## Technical Architecture

```
Client / Vercel Edge  ───► /api/*  ───► server.ts (export default app)
                      ───► /*      ───► /index.html (Vite SPA)
```

---

## Implementation Steps

1. Update `vercel.json` with `functions` and `rewrites` configuration.
2. Refactor `server.ts` to export `app` as default.
3. Test compilation and linting.
