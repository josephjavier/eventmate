# Phase 1 — Deferred Items

Items discovered during Phase 1 execution that are out of scope for the current plan but should be addressed in future plans.

| Item | Discovered In | Severity | Planned Resolution |
|------|--------------|----------|--------------------|
| `@react-email/components@1.0.12` is deprecated; all sub-packages marked "no longer supported" on npm | 01-01 (Task 2 install) | Medium | Plans 01-05 or 01-06 (email wave) must replace with `react-email@6+` and update all import paths |
| Vitest `--legacy-peer-deps` needed due to shadcn@4 (@babel/core@7) vs @vitejs/plugin-react@6 (@babel/core@^8.0.0-rc.4) conflict | 01-01 (Task 3 install) | Low | Will self-resolve when shadcn CLI updates or when @vitejs/plugin-react drops @babel/core@8 rc dependency |
