# Apex Fit - Progress Analytics Enhancement Plan

A focused plan to enhance the **Progress Analytics** section of **Apex Fit** by adding interactive progress charts and fixing text formatting in the weight log history.

---

## User Scope Directive

> [!IMPORTANT]
> Per user feedback, this update focuses **exclusively on the Progress Analytics section**. No changes will be made to other sections of the application.

---

## 1. Scope & Features

1. **Progress Analytics Charts**:
   - **Body Weight Progression Chart**: Interactive SVG line chart with smooth gradient fill and hover tooltips showing weight (kg) over time.
   - **Daily Calories vs Target Chart**: SVG bar chart displaying logged daily calorie intake versus daily target calories.

2. **Weight Log History Card Fix**:
   - Fix literal `&bull` character rendering in the Weight Log History card by replacing it with a clean typographic separator (`·`) and high-contrast metric layout.

---

## 2. Visual & Technical Details

### Progress Analytics View Layout
```
┌──────────────────────────────────────────────────────────┐
│                   Progress Analytics                     │
│                                                          │
│  [ Current Weight Card ]    [ Total Change Card ]        │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │    Body Weight Progression Chart (SVG Line)        │  │
│  │    • Smooth curve with green gradient fill         │  │
│  │    • Hover points showing date & weight (kg)       │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │    Daily Calories vs Target Chart (SVG Bars)       │  │
│  │    • Compares daily intake vs target calories      │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Weight Log History                                      │
│  • 75.5 kg  ·  Oct 5, 2026  ·  BF: 18%                   │
│  • 76.0 kg  ·  Oct 1, 2026  ·  BF: 18.5%                 │
└──────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

1. **`ProgressView.tsx` Updates**:
   - Fix literal `&bull` rendering issue in Weight Log History list items.
   - Add responsive Body Weight Progression SVG line chart with interactive point hover states.
   - Add Daily Calorie Intake vs Calorie Target SVG chart.

2. **Verification**:
   - Run `compile_applet` and `lint_applet` to confirm build integrity.
