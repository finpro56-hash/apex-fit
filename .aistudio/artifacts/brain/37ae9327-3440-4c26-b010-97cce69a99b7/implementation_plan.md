# Apex Fit - Navbar Logo Update Plan

A targeted design update to replace the text placeholder icon ("A") in `Navbar.tsx` with the emerald Dumbbell logo container matching `AuthScreen.tsx` and `favicon.svg`.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following design selections incorporate your responses from the interactive clarification step:

- **Navbar Logo Style**: Emerald squircle container (`w-8 h-8 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-950`) with the `<Dumbbell className="w-4 h-4" />` icon.
- **Header Behavior**: Static display in the top header bar without overriding tab state handlers.

---

## 1. Scope & File Updates

1. **`src/components/Navbar.tsx`**:
   - Replace the letter "A" placeholder in the header container with `<Dumbbell className="w-4 h-4" />`.
   - Align styling with the login screen and favicon aesthetic.

2. **Verification**:
   - Run `compile_applet` and `lint_applet` to confirm clean compilation and zero type errors.
