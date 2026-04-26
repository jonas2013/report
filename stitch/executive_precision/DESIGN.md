---
name: Executive Precision
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#0b1c30'
  on-tertiary-container: '#75859d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  tabular-nums:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  gutter: 20px
  margin: 32px
---

## Brand & Style

This design system is built for high-stakes enterprise environments where information density and clarity are paramount. The brand personality is authoritative, reliable, and invisible—stepping back to let the user's data take center stage. 

The aesthetic follows a **Corporate Modern** approach with a heavy emphasis on **Minimalism**. It prioritizes functional efficiency over decorative flair, using generous whitespace to separate complex data modules and a disciplined mathematical rhythm to instill a sense of order. The emotional response should be one of "controlled focus," reducing the cognitive load for project managers navigating complex gantt charts, resource allocations, and multi-layered dependencies.

## Colors

The palette is anchored by "Slate Deep Blue," providing a stable, institutional foundation. The primary color is reserved for high-level navigation and core brand moments, while a vibrant "Action Blue" serves as the secondary color for interactive elements and primary call-to-actions.

A sophisticated scale of cool grays manages content hierarchy and borders. Status indicators are calibrated for high legibility against white backgrounds, using industry-standard semantic colors to provide instant feedback on project health. Backgrounds utilize off-white tints to reduce eye strain during prolonged use.

## Typography

This design system utilizes **Inter** for its exceptional legibility in data-dense interfaces and its neutral, systematic character. The type scale is strictly controlled to maintain hierarchy in complex views. 

"Body-sm" and "Tabular-nums" are the workhorses of the system, optimized for data tables and dashboard widgets. Uppercase labels with slight tracking are used for section headers to distinguish them from interactive content. Large display sizes are used sparingly, reserved for page titles and high-level reporting metrics.

## Layout & Spacing

The system employs a **Fluid Grid** model with a 12-column structure for main content areas. This allows the interface to scale from tablet views to ultra-wide monitors, which are common in project management offices. 

Spacing follows a strict 4px base unit (the "Step System"). Use `md` (16px) for standard padding within cards and containers, and `lg` (24px) for spacing between major layout modules. Data tables should use condensed vertical padding (8px) to maximize the information visible above the fold without sacrificing readability.

## Elevation & Depth

To maintain a clean, professional aesthetic, this design system uses **Tonal Layers** and **Low-contrast outlines** rather than heavy shadows. 

- **Level 0 (Base):** Background color (`#F8FAFC`).
- **Level 1 (Cards/Surface):** White background with a 1px solid border (`#E2E8F0`). No shadow.
- **Level 2 (Dropdowns/Modals):** White background with a subtle, extra-diffused ambient shadow (Offset: 0, 4px; Blur: 12px; Color: `rgba(15, 23, 42, 0.08)`).
- **Interactive States:** Hovering over a card or list item triggers a subtle background color shift to `#F1F5F9` rather than an elevation lift.

## Shapes

The shape language is **Soft** and disciplined. A 4px (0.25rem) corner radius is the standard for most components, including buttons, input fields, and small cards. This slight rounding softens the "industrial" feel of the enterprise tool while maintaining a serious, structured appearance. Larger containers like modals or main content panels may use up to 8px (0.5rem) to signify their importance in the hierarchy.

## Components

- **Buttons:** Primary buttons use a solid Slate Deep Blue background with white text. Ghost buttons (border-only) are preferred for secondary actions in data tables to prevent visual clutter.
- **Chips & Tags:** Use a "Light Tint" background of the semantic status color with dark text (e.g., Success: light green background, dark green text). Shapes are fully pill-shaped (rounded-full) to distinguish them from buttons.
- **Lists & Tables:** Tables must include a "Zebra Stripe" option for long-form data. Row height is fixed at 40px for standard views and 32px for condensed views. Header cells feature a subtle bottom border and bolded labels.
- **Checkboxes & Radios:** Sharp, 2px rounded corners for checkboxes; standard circles for radios. Both use Action Blue for the active state.
- **Input Fields:** 1px border using a neutral gray. On focus, the border transitions to Action Blue with a 2px outer glow (ring) of the same color at 20% opacity.
- **Cards:** Simple white containers with a 1px Slate-200 border. Titles are always positioned top-left in Headline-md.
- **Gantt Bars:** Utilize the status color palette. Current progress is shown via a darker inner bar or a percentage label.
- **Avatars:** Always circular, with a 2px white border when overlapping in "stacks."