# Apex Fit - Deployment Instructions

## API Authentication Security

All `/api/*` AI routes require a signed-in Firebase user. The client automatically includes the user's Firebase ID token in an `Authorization: Bearer <token>` header, and the server verifies it using `firebase-admin`. `FIREBASE_PROJECT_ID` (or `VITE_FIREBASE_PROJECT_ID`) must be set on Vercel so the server can verify tokens.

---

## Vercel Deployment Guide

1. **Import Repository**
   - Connect your repository to Vercel and import the project.

2. **Framework Preset**
   - Select **Vite** as the framework preset.
   - Build Command: `vite build`
   - Output Directory: `dist`

3. **Environment Variables**
   - In **Project Settings > Environment Variables**, add the following for **Production** and **Preview**:
     - `GEMINI_API_KEY`: Your server-side Google Gemini API key.
     - `FIREBASE_PROJECT_ID`: (or `VITE_FIREBASE_PROJECT_ID`) Your Firebase project ID (required by server to verify auth tokens).
     - `VITE_FIREBASE_API_KEY`: Your Firebase client API key.
     - `VITE_FIREBASE_AUTH_DOMAIN`: Your Firebase Auth domain.
     - `VITE_FIREBASE_PROJECT_ID`: Your Firebase project ID.
     - `VITE_FIREBASE_STORAGE_BUCKET`: Your Firebase storage bucket.
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`: Your Firebase messaging sender ID.
     - `VITE_FIREBASE_APP_ID`: Your Firebase app ID.
     - `VITE_FIREBASE_FIRESTORE_DATABASE_ID`: (Optional) Your custom Firestore database ID if applicable.
   - *Note*: `VITE_*` variables are inlined into client JavaScript at build time. Redeploy your project whenever you change `VITE_*` variables.

4. **Firebase Authorized Domains**
   - In **Firebase Console > Authentication > Settings > Authorized domains**, add your Vercel deployment domain (`your-app.vercel.app`) to allow Google Sign-In and auth redirects.
