## Cursor Cloud specific instructions

**Gobbo Market** is a purely client-side TypeScript browser game (Vite + vanilla DOM/Canvas). There is no backend, database, or Docker dependency.

### Quick reference

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` (Vite, port 5173) |
| Run tests | `npm test` |
| Watch tests | `npm run test:watch` |
| Type-check | `npx tsc --noEmit` |
| Build | `npm run build` |

### Notes

- The project uses `package-lock.json` — always use **npm**, not pnpm/yarn.
- Node 20+ is required (CI uses Node 20).
- `npm run build` runs `tsc && vite build`; the type-check is part of the build, so a clean `tsc` is a good lint proxy (no ESLint configured).
- Tests use **Vitest** with a **jsdom** environment. Canvas-based minigame tests emit harmless `Not implemented: HTMLCanvasElement.prototype.getContext` stderr warnings — these are expected and do not cause test failures.
- One pre-existing test (`ForgeGame > should give low accuracy when meter is far from sweet spot`) fails due to a floating-point precision issue (`3.33e-16` vs `0`). This is not caused by environment setup.
- Game state persists in `localStorage`; to reset during manual testing, clear site data or open an incognito window.
- The dev server should be started with `--host 0.0.0.0` when testing from outside the container: `npm run dev -- --host 0.0.0.0`.
