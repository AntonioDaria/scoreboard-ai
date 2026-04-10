---
description: Frontend TypeScript/React conventions for the Vite/React codebase
globs: ["src/**/*.tsx", "src/**/*.ts"]
---

- **All API calls go through `src/lib/api.ts` only.** Never call `fetch` or any HTTP client directly from a component, hook, or page.
- **All shared types live in `src/lib/types.ts`.** Never define types inline in components or duplicate them across files.
- **Never use `any`.** TypeScript strict mode is on — `any` defeats the type system. Use `unknown` and narrow, or define a proper type.
- **Check shadcn-ui before writing custom components.** If a shadcn-ui primitive exists for what you need, use it. Only write custom UI when there is no suitable primitive.
- **Tailwind classes only — no inline styles.** Never use the `style` prop. If Tailwind cannot express what you need, add a class in the global CSS or extend `tailwind.config.ts`.
- **No unused imports or variables.** Strict mode treats these as errors. Clean them up before committing.
