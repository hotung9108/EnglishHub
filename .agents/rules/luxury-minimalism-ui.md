---
name: Luxury Minimalism UI & Academic Design Rules
description: Strict guidelines for Royal Academic / Minimalism Luxury UI, typography, color tokens, zero-alert policy, and interaction robustness for EnglishHub frontend.
---

# Luxury Minimalism & Royal Academic Design Guidelines

All agents, frontend developers, and reviewers working on the EnglishHub platform MUST strictly adhere to these design and interaction principles.

## 1. Color Palette & Prohibited Colors
- **CANVAS & SURFACES**:
  - Primary Canvas: Warm Ivory (`#FAF8F5`, `--eh-canvas`, `--bg-canvas`)
  - Primary Surface: Alabaster White (`#FFFFFF`, `--eh-surface`, `--surface`)
  - Dim / Muted Surface: Warm Cream (`#F4EFE6`, `--eh-surface-dim`, `--surface-dim`)
  - Container / Well: Soft Almond (`#EAE3D7`, `--eh-surface-container`)
- **ACCENT & BRAND**:
  - Royal Sovereign Green: (`#1B4D3E`, `--eh-primary`, `--primary`)
  - Deep Sovereign Hover: (`#133D30`, `--eh-primary-hover`)
  - Subdued Academic Tint: (`#EAF0E8`, `--eh-primary-light`)
- **METALLIC ACCENTS**:
  - Antique Gold: (`#C5A880`, `--eh-gold`, `--primary-gold`)
  - Warm Brass Line: (`#E6DFD5`, `--eh-border`, `--border`)
  - Brushed Brass Focus: (`#C2A882`, `--eh-border-hover`)
- **TEXT & NEUTRALS**:
  - Primary Text: Imperial Charcoal (`#262320`, `--eh-text-primary`, `--text-primary`)
  - Secondary Text: Warm Umber (`#736B63`, `--eh-text-secondary`, `--text-secondary`)
  - Subtle Muted: (`#968E85`)
- **STRICTLY PROHIBITED**:
  - NEVER use generic Tailwind blues or purples: `#2563EB`, `#3B82F6`, `#4F46E5`, `#1D4ED8`, `#6366F1`, `#0EA5E9`, `#0284C7`, `#1E40AF`.
  - NEVER use harsh cold grays (`#64748B`, `#475569`, `#334155`, `#1E293B`, `#0F172A`). Use warm neutrals derived from Warm Umber.
  - NEVER use neon gradients or aggressive drop shadows.

## 2. Typography Rules
- **Display & Headings**: MUST use `Lora` serif font (`--eh-font-serif`, `--font-heading`).
- **Body & Controls**: MUST use `Plus Jakarta Sans` sans-serif font (`--eh-font-sans`, `--font-family`).
- Headings should convey academic dignity: restrained weights (`font-semibold` / `font-bold`), generous letter-spacing, and clear hierarchy (`h1` -> `h4`).

## 3. Zero-Alert & Zero-Confirm Policy
- NEVER use native browser `window.alert()` or `alert()`.
- NEVER use native browser `window.confirm()` or `confirm()`.
- Use the unified `useToast()` hook (`toast.success()`, `toast.error()`, `toast.warning()`, `toast.info()`) for all operation feedback.
- Use the accessible `ConfirmModal` / `Modal` component for dangerous actions (deleting students, archiving classes, resetting data).

## 4. Fresh-State & Anti-Stale Data Rules
- Every mutation (creating a class, assigning homework, submitting answers, grading, updating account status) MUST immediately invalidate stale client state and refresh the relevant data view.
- Users MUST NEVER be forced to press browser refresh (F5) to see their changes reflected.

## 5. Double-Submit & Feedback Guard
- Every interactive submission button MUST implement loading state (`isLoading`, spinner) and disable itself on click during pending network calls.
- Rapid double-clicks must be prevented in the same JavaScript event tick.
