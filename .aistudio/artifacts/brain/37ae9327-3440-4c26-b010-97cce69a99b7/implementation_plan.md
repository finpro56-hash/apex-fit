# Apex Fit - App Logo & Favicon Branding Integration Plan

An integration plan to set the glowing neon-green dumbbell app logo as the official brand icon across **Apex Fit**, including browser tab favicon, Progressive Web App (PWA) manifest icon, Apple touch icon, and top navigation header branding.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following branding specifications incorporate your selections from the interactive clarification step:

- **Header Navbar Integration**: The new dumbbell logo will be displayed in the top navigation bar next to "Apex Fit" with a **compact 32×32 pixel (`w-8 h-8`) rounded-xl squircle container**.
- **Login Screen**: The login screen will retain its clean, focused layout as confirmed.
- **Web Favicon & Manifest**: The icon will be set as the official favicon (`/icon.png`, `/icon.svg`) and PWA web app manifest icon with theme color `#0d1f1f`.

---

## 1. Scope & Asset Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     App Branding Assets                     │
│                                                             │
│   • public/icon.png (High-Res 512x512 PNG)                  │
│   • public/icon.svg (Crisp Vector SVG Favicon)              │
│   • public/manifest.json (PWA Icon Config + #0d1f1f Theme)  │
│   • index.html (<link rel="icon"> & Apple Touch Icon)       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              Top Navigation Header (Navbar.tsx)             │
│                                                             │
│   [ (🟢 Dumbbell Icon 32x32)  Apex Fit ]   [ Profile 👤 ]   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Technical Details & Component Updates

1. **Favicon & Web Manifest (`index.html` & `public/manifest.json`)**:
   - Update `index.html` `<head>` tags:
     - `<link rel="icon" type="image/png" href="/icon.png" />`
     - `<link rel="icon" type="image/svg+xml" href="/icon.svg" />`
     - `<link rel="apple-touch-icon" href="/icon.png" />`
     - `<meta name="theme-color" content="#0d1f1f" />`
   - Update `public/manifest.json` with icons array (sizes: 192x192, 512x512, any), background_color `#090d16`, and theme_color `#0d1f1f`.

2. **Top Navigation Header (`src/components/Navbar.tsx`)**:
   - Replace the generic Dumbbell lucide icon in the brand zone with the custom brand logo image (`/icon.png` or vector `/icon.svg`).
   - Dimension: `w-8 h-8 rounded-xl object-contain shadow-md shadow-emerald-950/50`.
   - Accessible `alt="Apex Fit Logo"` with graceful fallback.

---

## Implementation Steps

1. **Generate and Save App Icon Assets**:
   - Create `public/icon.svg` and `public/icon.png` replicating the glowing green dumbbell inside the dark teal squircle container.
2. **Update `index.html` and `public/manifest.json`**:
   - Update `<head>` links and PWA manifest icon entries and theme colors.
3. **Update `src/components/Navbar.tsx`**:
   - Render the 32x32 compact brand logo in the top bar header.
4. **Verification**:
   - Run `compile_applet` and `lint_applet` to verify clean build.
