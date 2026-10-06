# Apex Fit - Logo Favicon Integration Plan

A targeted update to generate and integrate a crisp, vector SVG favicon and PWA app icon for **Apex Fit** that perfectly matches the logo on the login screen (`AuthScreen.tsx`) — featuring a modern dumbbell icon inside an emerald gradient squircle container.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following design choices incorporate your responses from the interactive clarification step:

- **Favicon Visual Style**: Emerald container styling (`bg-emerald-600/20` with `#10b981` / `#059669` accent border and bright `#34d399` dumbbell icon) matching the login screen brand identity.
- **Icon Formats & Linking**: Scalable vector SVG (`public/favicon.svg`) linked in `index.html` with SVG MIME type (`type="image/svg+xml"`), and updated icon references in `public/manifest.json`.

---

## 1. Icon Specifications & Asset Layout

### Visual Design
- **Shape**: Rounded squircle (`rx="16"` in a 64x64 viewbox).
- **Background**: Dark slate canvas `#0f172a` with an inner emerald squircle fill (`#022c22` / `#065f46`) and a crisp `#059669` stroke.
- **Icon Element**: Precision-drawn Dumbbell vector paths in vibrant emerald `#34d399` / `#10b981`.

```
┌──────────────────────────────────────┐
│  ┌────────────────────────────────┐  │
│  │    Emerald Squircle Fill       │  │
│  │   ┌────────────────────────┐   │  │
│  │   │  Dumbbell SVG Icon     │   │  │
│  │   │      (Emerald)         │   │  │
│  │   └────────────────────────┘   │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

---

## 2. Technical Steps

1. **Create `public/favicon.svg`**:
   - Write a standalone vector SVG containing the emerald squircle container and dumbbell icon matching `AuthScreen.tsx`.

2. **Update `index.html`**:
   - Add `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`.
   - Add `<link rel="apple-touch-icon" href="/favicon.svg" />`.

3. **Update `public/manifest.json`**:
   - Point the PWA icon `src` to `/favicon.svg` instead of generic placeholders.

4. **Verification**:
   - Run `compile_applet` and `lint_applet` to confirm build integrity.
