# AGENTS.md
# Vue 3 + TypeScript + Tailwind + DaisyUI Guidelines

## Goal

Generate clean, maintainable, production-ready code following this project's architecture and conventions.

---

# General Rules

- Prefer readability and simplicity.
- Follow SOLID principles.
- Avoid duplication.
- Avoid unnecessary dependencies.
- Do not generate dead code.
- Keep responsibilities separated.
- Prefer `const` over `let`. Never use `var`.

---

# Stack

This project uses:

- Vue 3
- TypeScript
- Composition API
- `<script setup lang="ts">`
- Tailwind CSS v4
- DaisyUI
- Pinia
- Vue Router

Do not introduce other frameworks or UI libraries without approval.

---

# Vue 3

Rules:

- Use Composition API only.
- Never use Options API.
- Always use `<script setup lang="ts">`.
- Use TypeScript everywhere.
- Avoid `any`.
- Prefer `computed` over unnecessary watchers.
- Use watchers only for side effects.

---

# Components

Components must have a single responsibility.

Rules:

- Keep components small.
- Split large components.
- Do not mix UI and business logic.
- Components should mainly handle:
    - Props
    - Events
    - Display
    - User interactions

Move complex logic outside components.

---

# TypeScript

Rules:

- Prefer `type` over `interface`.
- Do not use `interface` unless technically required.
- Never use `any`.
- Prefer `const` over `let`. Never use `var`.
- Use explicit types for public APIs.
- Use TypeScript utility types when appropriate.

Shared types belong in:

src/types/

---

# Props and Emits

Rules:

- Always strongly type props.
- Always strongly type emits.
- Provide defaults when needed.

---

# Composables

Reusable logic must be extracted into composables.

Rules:

- Composables must start with `use`.
- Use them for:
    - Business logic
    - API logic
    - Forms
    - Shared state
    - Complex calculations

Location:

src/composables/

---

# Services

API communication must be isolated.

Rules:

- Components must never call APIs directly.
- Use services for external communication.

Location:

src/services/

---

# Pinia

Use Pinia for global state.

Rules:

- Keep business logic in stores.
- Avoid complex state manipulation inside components.
- Keep stores typed.

Location:

src/stores/

---

# Project Structure

Follow:

src/
├── assets/
├── components/
├── composables/
├── constants/
├── layouts/
├── pages/
├── router/
├── services/
├── stores/
├── types/
└── utils/

---

# DaisyUI + Tailwind v4

This project uses DaisyUI with Tailwind CSS v4.

Documentation:

https://daisyui.com/
https://tailwindcss.com/docs

Rules:

- Prefer DaisyUI components before creating custom UI.
- Use DaisyUI semantic classes.
- Use Tailwind utilities for layout and customization.
- Keep custom CSS minimal.
- Avoid recreating existing DaisyUI components.
- Respect DaisyUI themes.

## Tailwind CSS v4 conventions

- Use `bg-linear-to-b` instead of `bg-gradient-to-b` (and same for all gradient directions: `bg-linear-to-t`, `bg-linear-to-r`, `bg-linear-to-l`, etc.).
- Use `bg-linear-to-br` instead of `bg-gradient-to-br`, etc.
- `!important` modifier syntax is suffix: `cursor-default!` (NOT prefix `!cursor-default`).
- Prefer built-in spacing utilities over arbitrary values: `h-0.75` instead of `h-[3px]`, `h-0.5` instead of `h-[2px]`, `w-3.5` instead of `w-[14px]`, etc.

---

# Styling

Rules:

- Prefer Tailwind and DaisyUI.
- Use scoped styles only when necessary.
- Avoid inline styles. Use CSS classes instead.
- Component-specific CSS classes go in a `<style>` block inside the component, not in `main.css`.
- Shared CSS classes (used in 2+ components) belong in `main.css`.
- Avoid `!important`.

---

# Forms

Separate:

- UI
- Validation
- Business logic
- API calls

Always handle:

- Loading states
- Validation errors
- Server errors
- Success states

---

# API Handling

Every API call must handle:

- Loading state
- Error state
- Empty state
- Success state

Never assume requests succeed.

---

# Error Handling

Rules:

- Handle asynchronous errors.
- Never silently ignore exceptions.

---

# Performance

Rules:

- Prefer computed values.
- Avoid unnecessary watchers.
- Lazy load routes.
- Avoid unnecessary renders.

---

# Naming

Use explicit and descriptive names.

Avoid generic names.

---

# Imports

Keep imports clean.

Order:

1. Vue
2. External libraries
3. Internal modules
4. Styles

Remove unused imports.

---

# Functions

Rules:

- Keep functions small.
- One responsibility per function.
- Extract complex logic.

---

# Constants

Avoid magic numbers and hardcoded values.

Use constants.

---

# Accessibility

Always:

- Use semantic HTML.
- Add labels.
- Provide alt text.
- Support keyboard navigation.

---

# AI Code Generation Rules

When generating code:

- Generate complete files.
- Include imports.
- Respect existing architecture.
- Keep components modular.
- Extract reusable logic.
- Follow project conventions.
- Run `npm run lint` and `npm run build` after changes.

Never:

- Use `any`.
- Use `var` (prefer `const`, then `let`).
- Create giant components.
- Put API calls inside components.
- Duplicate existing logic.
- Add unnecessary dependencies.

---

# Final Checklist

Before completing work:

- Vue 3 Composition API used.
- TypeScript strict.
- `type` preferred over `interface`.
- No `any`.
- `const` preferred over `let`. No `var`.
- Components are modular.
- Business logic extracted.
- API separated.
- DaisyUI used where possible.
- Tailwind preferred.
- No duplicated code.
- Errors handled.
- Lint and build pass (`npm run lint && npm run build`).