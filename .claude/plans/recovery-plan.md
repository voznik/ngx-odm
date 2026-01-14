# Recovery Plan: Fix Split-Brain Upgrade (Angular 21 / Nx 17)

## Status Analysis
- **Angular**: v21.0.8 (OK)
- **Nx**: Updated to v22.3.3 (Fixed)
- **Linting**: ESLint 9 + TypeScript 5.9 + Angular 21 compatible. `eslint.config.js` updated to use `projectService`. `ban-types` rule removed.
- **Codebase**: ~95 `as any` workarounds still present.

## Objective
Stabilize the codebase by fixing type errors and removing `as any` workarounds, specifically in `packages/rxdb/signals`.

## Phase 3: Clean Up & Type Safety (Next Steps)
*   **Goal:** Remove `as any` workarounds and fix NgRx Signals types.
*   **Action:**
    1.  **Inspect `SignalStoreFeature` type:** Check `node_modules/@ngrx/signals/index.d.ts` (or similar) to see the generic arguments for `SignalStoreFeature`. It likely changed from `{ state, signals, methods, computed }` to `{ state, signals, methods, props }` or similar in v19+.
    2.  **Update `packages/rxdb/signals/src/with-collection-service.ts`:**
        - Update the return type signature of `withCollectionService` to match the new `SignalStoreFeature` definition.
        - This should allow removing many `as any` casts around `patchState(store as any, ...)` because the store type will be correctly inferred.
    3.  **General Cleanup:**
        - Remove `as any` in `packages/rxdb/utils` and `packages/rxdb/core` where possible.
        - Run `npm run build` frequently to verify fixes.

## Phase 4: Verification
*   **Action:**
    1.  `npm run build` (RxDB library).
    2.  `npm run start:standalone` (Verify runtime).
    3.  `npm run lint:all` (Ensure no regressions).