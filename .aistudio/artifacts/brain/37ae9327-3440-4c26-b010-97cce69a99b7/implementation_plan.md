# Apex Fit - AuthScreen Logo Fix Plan

A targeted fix for `src/components/AuthScreen.tsx` to ensure the login screen logo uses a pure inline React SVG vector icon (`<Dumbbell />`), eliminating all static image fetching and guaranteeing 100% reliable rendering on hosted environments (Cloud Run, Vercel, static previews).

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions incorporate your choices from the interactive clarification step:

- **Inline Vector Rendering**: Use inline Lucide `<Dumbbell className="w-8 h-8 text-emerald-400" />` directly bundled into JavaScript bundle, avoiding broken `<img>` HTTP requests or asset path resolution failures on hosted servers.
- **Container Styling**: Preserve the default emerald container styling (`w-16 h-16 rounded-3xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6 shadow-2xl shadow-emerald-950`).

---

## 1. Targeted Elements & Scope

- **Target Component**: `src/components/AuthScreen.tsx`
- **Target Container**: `div#root:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1)`
- **Target Icon**: `div#root:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > svg:nth-of-type(1)`

---

## Technical Implementation Steps

1. **Update `src/components/AuthScreen.tsx`**:
   - Ensure the logo container renders the inline Lucide `<Dumbbell className="w-8 h-8 text-emerald-400" />` SVG icon.
   - Remove any potential static `<img>` tag or external asset path references.

2. **Verification**:
   - Run `compile_applet` and `lint_applet` to confirm build integrity.
