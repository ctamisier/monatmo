# AGENTS.md
# Vue 3 + TypeScript + Tailwind + DaisyUI Guidelines

## Goal
Generate clean, maintainable, production-ready code following this project's architecture and conventions.

---

## General Rules
*   **Simplicity First:** Prefer readability and simplicity over clever or over-engineered code.
*   **SOLID Principles:** Enforce strict separation of concerns and single responsibility.
*   **DRY & Clean:** Avoid duplication and do not generate dead or unused code.
*   **Zero Noise:** Avoid unnecessary dependencies and prefer `const` over `let`. Never use `var`.

---

## Tech Stack
This project strictly relies on the following stack. Do not introduce other frameworks or UI libraries:
*   **Framework:** Vue 3 (Composition API with `<script setup lang="ts">`)
*   **Language:** TypeScript (Strict Mode)
*   **Styling & UI:** Tailwind CSS v4 + DaisyUI
*   **State & Routing:** Pinia + Vue Router

---

## Project Structure

| Directory | Responsibility |
| :--- | :--- |
| `src/components/` | Pure UI elements, display, user interaction, props, and emits. |
| `src/composables/` | Reusable logic, forms, local state, and complex calculations. |
| `src/services/` | External API communication (isolated from components). |
| `src/stores/` | Global state management and global business logic. |
| `src/types/` | Shared TypeScript types, definitions, and discriminated unions. |
| `src/utils/` / `constants/` | Pure helper functions and immutable configuration values. |

---

## Vue 3 & Component Architecture

### Component Rules
*   **Single Responsibility:** Keep components small. Split large components into atomic sub-components.
*   **Logic Separation:** Do not mix UI and heavy business logic inside components. Move complex logic to composables.
*   **Data Flow:** Always strongly type props and emits. Provide defaults for props when needed. Never mutate props directly.
*   **Reactivity:** Prefer `computed` properties over unnecessary watchers. Use `watch` exclusively for side effects.

### Architecture Isolation
*   **Composables:** Must start with `use` (e.g., `useAuth`, `useForm`).
*   **Services:** Components must never call APIs directly. All network requests belong in services.
*   **API States:** Every API call must explicitly handle: **Loading**, **Error**, **Empty**, and **Success** states. Never assume requests succeed.

---

## TypeScript Best Practices

### Type Safety & Utilities
*   **No Implicit Any:** Never use `any`. Use `unknown` and narrow types using type guards (`typeof`, `instanceof`, `in`).
*   **Type Declaration:** Prefer `type` over `interface` unless extending third-party library declarations.
*   **Immutability:** Use `as const` for literal types and readonly tuples. Enforce immutability with `Readonly<T>`, `ReadonlyMap`, and `ReadonlySet`.
*   **Precise Typing:** Use `Pick<T, K>`, `Omit<T, K>`, and `Partial<T>` to create focused subsets. Enforce validation without widening using `satisfies`.
*   **State Management:** Use discriminated unions (e.g., tracking status variations) for state and API responses.

### Functions & Async Flow
*   **Explicit Returns:** Always provide explicit return types on exported/public functions. Use `void` for side-effect-only functions.
*   **Async Control:** Use `async/await` exclusively. **Never use `.then()` chains.**
*   **Error Resilience:** Wrap dangerous operations in `try/catch`; never silently swallow exceptions. Log, wrap, or rethrow them as appropriate.

---

## DaisyUI & Tailwind CSS v4 Conventions

Prioritize DaisyUI components and semantic classes before writing custom markup. Use Tailwind utilities exclusively for layout, spacing, and minor tweaks.

### Tailwind v4 Upgrades

| Legacy Syntax (v3) | Tailwind v4 Syntax | Rule / Context |
| :--- | :--- | :--- |
| `bg-gradient-to-b` | `bg-linear-to-b` | Applied to all linear gradient directions (`to-t`, `to-br`, etc.) |
| `!cursor-default` | `cursor-default!` | The `!important` modifier is now a **suffix**, not a prefix. |
| `h-[3px]` / `w-[14px]` | `h-0.75` / `w-3.5` | Prefer built-in fractional spacing over arbitrary brackets. |

### Styling Constraints
*   **Scoping:** Component-specific CSS belongs in a `<style scoped>` block inside the component. Move shared utility classes to `main.css`.
*   **Specificity:** Keep CSS selectors flat. Avoid nesting beyond 2 levels. Prefer class selectors over element tags.
*   **Responsive & Themes:** Use mobile-first design with Tailwind breakpoint prefixes (`sm:`, `md:`, `lg:`). Respect DaisyUI themes and use the `dark:` variant for dark mode support.
*   **Animations:** Use GPU-accelerated properties (`transform`, `opacity`) for animations. Honor accessibility rules using `prefers-reduced-motion`.

---

## Quality Assurance & Performance

*   **Clean Imports:** Keep imports ordered: (1) Vue, (2) External Libraries, (3) Internal Modules, (4) Styles. Remove unused imports instantly.
*   **Clean Naming:** Avoid generic names like `data` or `handler`. Use explicit, descriptive naming conventions.
*   **Accessibility (a11y):** Use semantic HTML, mandatory form labels, alternative text (`alt`), and robust keyboard navigation support.
*   **Optimization:** Lazy-load routes within Vue Router. Prevent unnecessary re-renders by optimizing template reactivity.

---

## AI Generation Checklist
Before providing code, verify the following checklist:
1. Composition API with `<script setup lang="ts">` only.
2. `strict: true` type checking enforced (No `any`, no `var`, no `!`).
3. Business logic and API calls completely isolated from components.
4. Tailwind v4 syntax conventions respected (`bg-linear-*` and `!` suffix).
5. Code output is fully complete, self-contained, and includes all necessary imports.