# Angular 21 Upgrade Plan for ngx-odm

## Overview
Upgrade from Angular 17.0.8 to Angular 21.x with Nx 21.x support.

**IMPORTANT**: Cannot skip versions. Must use "Fast Chaining" method:
> "You can't run `ng update` to update Angular applications more than one major version at a time."
> — [Angular Update Guide] - instead of web we prepared offline verion - See `UPDATE_GUIDE_ANGULAR.md` in repo root for the complete official Angular migration guide (v17→v21).

Each step runs migration schematics that auto-fix breaking changes. Skipping loses these fixes.


## Current State
| Package | Current | Target |
|---------|---------|--------|
| Angular | 17.0.8 | 21.x |
| Nx | 17.2.7 | 21.x |
| TypeScript | 5.2.2 | 5.9+ |
| @ngrx/signals | 17.0.1 | 21.x |
| jest-preset-angular | 13.1.4 | 17.x+ |
| zone.js | 0.14.2 | 0.15+ |
| ESLint | 8.56.0 | 9.x |
| @angular-eslint/* | ~17.0.0 | 19.x+ |
| @typescript-eslint/* | 6.15.0 | 8.x+ |
| Node.js | (check current) | 20.11.1+ (v21 requires this) |

## User Decisions
- **Demo app**: Keep as NgModule example (upgrade version only)
- **Test runner**: Keep Jest (not migrate to Vitest)
- **Signal Forms**: Evaluate later, not part of this upgrade
- **Tests**: SKIP during upgrade - create separate plan for test fixes

---

## Pre-flight Checks

Before starting, verify environment:

```bash
# Check Node.js version (need 18.19.0+ for v18, then 20.11.1+ for v20)
node --version

# Create upgrade branch
git checkout -b feat/angular-21-upgrade

# Ensure clean working tree
git status
```

---

## Phase 1: Combined Nx + Angular Upgrade (17 → 21) - "Fast Chaining"

**Strategy**: `nx migrate @nx/angular@XX` upgrades BOTH Nx and Angular together.
Migrate → Fix Build → Commit for each version. No deploy needed between steps.

### Step 1.1: v17 → v18 (Control Flow Update)
```bash
npx nx migrate @nx/angular@18
npx nx migrate --run-migrations
npm install
npm run build && npm run lint:all  # Verify
git add -A && git commit -m "chore: upgrade to Angular/Nx 18"
```
**Key changes** (from official guide):
- Update TypeScript to 5.4+
- Replace `async` with `waitForAsync` from `@angular/core`
- Import `StateKey`/`TransferState` from `@angular/core` (not platform-browser)
- Node.js v18.19.0+ required
- Update NgRx to v18

### Step 1.2: v18 → v19 (Standalone Default)
```bash
npx nx migrate @nx/angular@19
npx nx migrate --run-migrations
npm install
npm run build && npm run lint:all  # Verify
git add -A && git commit -m "chore: upgrade to Angular/Nx 19"
```
**Key changes**:
- Components/directives/pipes are **standalone by default** (add `standalone: false` for NgModule ones)
- Remove `this.` prefix from template reference variables
- Upgrade TypeScript to 5.5+
- Rename `ExperimentalPendingTasks` → `PendingTasks`
- Update NgRx to v19

### Step 1.3: v19 → v20 (Signal Maturity)
```bash
npx nx migrate @nx/angular@20
npx nx migrate --run-migrations
npm install
npm run build && npm run lint:all  # Verify
git add -A && git commit -m "chore: upgrade to Angular/Nx 20"
```
**Key changes**:
- Rename `afterRender` → `afterEveryRender`
- Replace `TestBed.flushEffects()` → `TestBed.tick()`
- Rename `provideExperimentalZonelessChangeDetection` → `provideZonelessChangeDetection`
- Replace `TestBed.get()` → `TestBed.inject()`
- Remove `InjectFlags` enum usage
- Upgrade TypeScript to 5.8+
- **Node.js 20.11.1+ required** (not v18, not v22.0-v22.10)
- `@nrwl/*` packages officially dropped → must use `@nx/*`
- Update NgRx to v20

### Step 1.4: v20 → v21 (Zoneless Era)
```bash
npx nx migrate @nx/angular@21
npx nx migrate --run-migrations
npm install
npm run build && npm run lint:all  # Verify
git add -A && git commit -m "chore: upgrade to Angular/Nx 21"
```
**Key changes**:
- Zone-based apps must add `provideZoneChangeDetection()` to root providers
- Remove `interpolation` property from @Component (only `{{}}` supported)
- Remove `moduleId` property from @Component
- `ApplicationConfig` import from `@angular/core` (not platform-browser)
- `lastSuccessfulNavigation` is now a signal (call as function)
- Host binding type checking enabled by default
- Upgrade TypeScript to 5.9+
- Update NgRx to v21

---

## Phase 2: ESLint 9 Flat Config Migration

**Current state:**
- ESLint 8.56.0 with `.eslintrc.json` files (legacy format)
- Uses `@nrwl/nx/enforce-module-boundaries` (deprecated)
- 6 eslintrc files across the monorepo

**Files to migrate:**
- `.eslintrc.json` (root)
- `examples/demo/.eslintrc.json`
- `examples/standalone/.eslintrc.json`
- `packages/rxdb/.eslintrc.json`
- `packages/streamlit-rxdb-dataframe/rxdb_dataframe/frontend/.eslintrc.json`
- `tools/.eslintrc.json`

### Step 2.1: Run Nx ESLint migration
Nx provides a migration to convert to flat config:
```bash
npx nx g @nx/eslint:convert-to-flat-config
```

### Step 2.2: Update rule references
Replace deprecated `@nrwl/*` with `@nx/*`:
```diff
- "@nrwl/nx/enforce-module-boundaries": 0
+ "@nx/enforce-module-boundaries": 0
```

### Step 2.3: Update ESLint packages
```json
{
  "eslint": "^9.x",
  "@typescript-eslint/eslint-plugin": "^8.x",
  "@typescript-eslint/parser": "^8.x",
  "@angular-eslint/eslint-plugin": "^19.x",
  "@angular-eslint/eslint-plugin-template": "^19.x",
  "@angular-eslint/template-parser": "^19.x"
}
```

### Step 2.4: Resulting flat config structure
Each `.eslintrc.json` becomes `eslint.config.js`:
```javascript
const nx = require('@nx/eslint-plugin');
module.exports = [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/angular'],
  // Custom rules...
];
```

---

## Phase 3: Breaking Changes to Address

### 3.1 TypeScript Config
**File**: `tsconfig.base.json`
- Remove `"ignoreDeprecations": "5.0"` (line 22)
- TypeScript 5.9+ is required

### 3.2 Angular 21 Breaking Changes

**Zoneless default**: Already using `ɵNoopNgZone` in standalone app - compatible.

**Server bootstrapping** (if SSR used):
- `bootstrapApplication()` requires `BootstrapContext` parameter
- Migration schematic handles this automatically

**Router changes**:
- `lastSuccessfulNavigation` is now a signal (call as function)

**Compiler-CLI**:
- Host binding type checking enabled by default
- Add `"typeCheckHostBindings": false` to `angularCompilerOptions` if issues arise

**Removed APIs**:
- `NgModuleFactory` removed - use `NgModule` instead
- `ApplicationConfig` removed from `@angular/platform-browser` - import from `@angular/core`
- `moduleId` and `interpolation` component metadata removed

### 3.3 NgRx/Signals Updates
**File**: `packages/rxdb/signals/src/with-collection-service.ts`

**Deep import issues** (lines 20-21):
```typescript
import { SignalStoreFeatureResult } from '@ngrx/signals/src/signal-store-models';
import { StateSignal } from '@ngrx/signals/src/state-signal';
```
These internal imports may break. Check if public API alternatives exist in @ngrx/signals 21.

Breaking changes in @ngrx/signals 19+:
- `computed` property renamed to `props` in `SignalStoreFeatureResult`

**Not affected** (verified):
- `rxMethod` is commented out, so `unsubscribe()` → `destroy()` doesn't apply
- `withEffects` is not used, so rename to `withEventHandlers` doesn't apply

### 3.4 Testing Updates (DEFERRED)
**OUT OF SCOPE for this upgrade.** Create separate plan for test fixes.

Testing packages to update (in future plan):
- `jest-preset-angular` → 17.x+
- Test setup files may need Angular 21-specific changes

Files affected (for future reference):
- `packages/rxdb/jest.config.ts`
- `examples/demo/jest.config.ts`
- `examples/standalone/jest.config.ts`
- `jest.config.ts` (root)

---

## Phase 4: Library-Specific Updates

### 4.1 ng-packagr
Update to version compatible with Angular 21 (handled by nx migrate).

**Files affected**:
- `packages/rxdb/ng-package.json`
- All secondary entry point `ng-package.json` files

### 4.2 RxDB Compatibility
Check rxdb version compatibility with new build tools. Current: `^15.9.1`

---

## Phase 5: Run Angular Migrations

After version updates, run available Angular migrations:

```bash
# Convert NgClass/NgStyle to class/style bindings
ng generate @angular/core:ng-class-style-migration

# Update RouterTestingModule to provideLocationMocks
ng generate @angular/core:router-testing-module-migration

# Signal inputs migration (optional, for library)
ng generate @angular/core:signal-input-migration

# Signal queries migration (optional)
ng generate @angular/core:signal-queries-migration
```

---

## Phase 6: Post-Upgrade Tasks

### 6.1 Update CLAUDE.md
Add note about fetching docs from GitHub repos instead of websites for efficiency:
- Angular docs: `https://raw.githubusercontent.com/angular/angular/main/...`
- Nx docs: `https://raw.githubusercontent.com/nrwl/nx/master/docs/...`
- NgRx docs: `https://raw.githubusercontent.com/ngrx/platform/main/...`

### 6.2 Update README.md
- Update Angular version requirement (14+ → 17+ or appropriate minimum)
- Update any version-specific documentation

### 6.3 Update package.json peer dependencies
**File**: `packages/rxdb/package.json`

---

## Critical Files to Modify

| File | Changes |
|------|---------|
| `package.json` | All dependency versions |
| `tsconfig.base.json` | Remove `ignoreDeprecations`, update compiler options |
| `nx.json` | May need updates for new Nx features |
| `packages/rxdb/signals/src/with-collection-service.ts` | NgRx deep imports, breaking changes |
| `packages/rxdb/package.json` | Peer dependencies |
| `.eslintrc.json` → `eslint.config.js` | Convert to flat config (6 files) |
| `CLAUDE.md` | Add GitHub docs fetching note |

---

## Verification

### Build
```bash
npm run build                    # Library builds
npm run build:demo              # Demo app builds
npm run start:standalone        # Standalone app serves
```

### Lint
```bash
npm run lint:all                # No linting errors
```

### Tests (SKIPPED)
Tests are OUT OF SCOPE for this upgrade. Create separate plan after upgrade completes.
```bash
# DO NOT RUN during upgrade:
# npm test
```

### Manual Testing
1. Start standalone app: `npm run start:standalone`
2. Verify app loads without console errors
3. Verify CRUD operations work (add/edit/delete todo)
4. Verify signals/store integration works (filtering, sorting)
5. Verify zoneless change detection triggers UI updates

---

## Failure Handling Strategy

**Expectation**: Failures WILL occur. This is a 4-major-version upgrade. Plan for iterative resolution, not rollback.

### Before Starting
```bash
git checkout -b feat/angular-21-upgrade
```
Commit after each successful step to create restore points.

### Common Failure Types & Resolution

#### 1. Dependency Conflicts (npm install fails)
**Symptoms**: Peer dependency warnings, ERESOLVE errors
**Resolution**:
1. Read the conflict message carefully - identify which packages conflict
2. Check if `--legacy-peer-deps` is acceptable (temporary, not permanent solution)
3. Search for compatible version combinations on npm/GitHub
4. Update specific package versions in package.json to resolve
5. If RxDB conflicts: check rxdb compatibility matrix at https://rxdb.info/

**Example fix**:
```bash
# If @ngrx/signals@21 conflicts with @angular/core@21
npm install @ngrx/signals@21 --legacy-peer-deps
# Then manually verify versions align
```

#### 2. TypeScript/Build Errors
**Symptoms**: `ng build` or `nx build` fails with TS errors
**Resolution**:
1. Read the FULL error message including file path and line number
2. Common causes:
   - Removed APIs → find replacement in migration guide
   - Type changes → update type annotations
   - Import path changes → update imports
3. For Angular API changes, check: https://angular.dev/update-guide
4. For NgRx changes, check: https://ngrx.io/guide/migration

**Example fixes**:
```typescript
// ApplicationConfig moved
- import { ApplicationConfig } from '@angular/platform-browser';
+ import { ApplicationConfig } from '@angular/core';

// Signal-based APIs now require function call
- router.lastSuccessfulNavigation
+ router.lastSuccessfulNavigation()
```

#### 3. Test Failures (OUT OF SCOPE)
**DO NOT attempt to fix tests during upgrade.**
If tests run accidentally and fail, ignore and continue.
Test fixes will be handled in a separate plan after the upgrade.

#### 4. Lint Errors After ESLint Migration
**Symptoms**: `npm run lint:all` fails with rule errors
**Resolution**:
1. Distinguish between:
   - Config errors (rule doesn't exist) → update eslint.config.js
   - Code violations (new stricter rules) → either fix code OR disable rule
2. For deprecated rules, check ESLint 9 migration: https://eslint.org/docs/latest/use/migrate-to-9.0.0
3. Temporarily disable blocking rules to continue, fix later:
```javascript
// In eslint.config.js
{ rules: { 'problematic-rule': 'off' } }
```

#### 5. Runtime Errors (App loads but crashes)
**Symptoms**: Browser console errors, white screen
**Resolution**:
1. Check browser DevTools console for specific error
2. Common causes:
   - Zoneless change detection issues → ensure signals trigger properly
   - Router changes → check route configurations
   - DI changes → verify providers are correctly set up
3. Use Angular DevTools browser extension to inspect component tree

### Step-by-Step Recovery Protocol

When a step fails:

```
1. STOP - Don't panic, don't immediately revert

2. ANALYZE the error
   - What is the exact error message?
   - Which file/line is causing it?
   - Is this a known Angular/Nx/NgRx breaking change?

3. SEARCH for solutions
   - Check the GitHub changelogs fetched during planning
   - Search error message in issues: github.com/{repo}/issues

4. ATTEMPT fix
   - Apply minimal fix to unblock
   - Document what was changed and why

5. VERIFY fix
   - Re-run the failing command
   - If still failing, iterate back to step 2

6. COMMIT if fixed
   - git add . && git commit -m "fix: resolve [error] during Angular 21 upgrade"

7. CONTINUE to next step
```

### When to Actually Rollback

Only rollback if:
- Fundamental incompatibility discovered (e.g., RxDB doesn't support Angular 21 at all)
- More than 3 hours spent on single blocking issue with no progress
- User explicitly requests it

Rollback to last commit, NOT to beginning:
```bash
git log --oneline -10  # Find last good commit
git reset --hard <commit-hash>
npm install
```

### Checkpoint Commits

After each successful step, commit:
```bash
git add -A && git commit -m "chore: upgrade step N complete - [description]"
```

Suggested commit points:
- [ ] After v17→v18 upgrade (Nx + Angular combined)
- [ ] After v18→v19 upgrade
- [ ] After v19→v20 upgrade
- [ ] After v20→v21 upgrade
- [ ] After ESLint migration
- [ ] After NgRx/signals deep import fixes
- [ ] After all lints pass
- [ ] After manual testing passes (app works)

**Note**: Tests are OUT OF SCOPE - don't block on test failures.
