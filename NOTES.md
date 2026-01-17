# Development Notes

## RxDB v16 Testing Nuances

### Dev-Mode Requirement for Testing

RxDB v16 requires dev-mode to be enabled for `ignoreDuplicate: true` to work:

```typescript
// Add this in beforeAll() of test files
addRxPlugin({
  name: 'test-plugin',
  rxdb: true,
  overwritable: { isDevMode: () => true },
});
```

**Without this:** You'll get DB9 error saying `ignoreDuplicate is only allowed in dev-mode`.

### Database Lifecycle in Tests

**Problem:** RxDB v16 doesn't allow recreating databases with the same name in the same process.

**Solution:**

```typescript
// Use unique database names
beforeAll(async () => {
  dbService = await getMockRxdbService(undefined, true); // true = randomName
});

afterAll(async () => {
  await dbService.destroyDb(); // Cleanup once at the end
});
```

**Don't:** Create/destroy databases in `beforeEach`/`afterEach` - causes DB8/DB9 errors.

## Jest Mock Lifecycle Best Practices

### When Reusing Mocked Resources Across Tests

**Correct Pattern:**

```typescript
beforeAll(async () => {
  // Create collection with spies ONCE
  collection = await getMockRxCollection();
});

beforeEach(() => {
  jest.clearAllMocks(); // Clear call history, KEEP spies
});

afterAll(async () => {
  await cleanup();
  jest.restoreAllMocks(); // Remove spies once at the end
});
```

**Wrong Pattern (causes "received value must be a mock" errors):**

```typescript
afterEach(() => {
  jest.restoreAllMocks(); // ❌ Removes spies, breaks subsequent tests
});
```

**Key Difference:**

- `jest.clearAllMocks()` - Clears call history, keeps spies intact
- `jest.restoreAllMocks()` - Removes spies entirely

## RxDB Data Ordering

RxDB returns documents ordered by indexes (e.g., `createdAt`). In tests:

**Problem:** Document order differs from insertion order.

**Solution:** Either:

1. Use later timestamps for new items: `createdAt: 1546300800200` (not `1546300800000`)
2. Sort both arrays by ID before comparison

## GitHub Actions Cache Strategy

**Optimal cache key pattern:**

```yaml
key: ${{ runner.os }}-node-22-${{ github.ref_name }}-${{ hashFiles('**/package-lock.json') }}
```

Includes:

- OS (Linux/macOS/Windows)
- Node version (prevents npm version conflicts)
- Branch name (isolated per branch)
- Lock file hash (auto-invalidates on dependency changes)

**Critical:** Different Node versions create incompatible lock files:

- Node 22 → npm 10.x
- Node 25 → npm 11.x

**Fix:** Regenerate `package-lock.json` with the same Node version used in CI.

## Bundle Size Impact

Adding RxDB schema validation:

- `wrappedValidateAjvStorage` → Adds ~15-50kb (ajv dependency)
- Consider conditional imports or dev-only validation if size matters

## Angular 21 Error Message Format

Error regex patterns changed:

```typescript
// Old (Angular <21)
expect(() => ...).toThrow(/No provider for/);

// New (Angular 21)
expect(() => ...).toThrow(/No provider/); // More generic
```

New format: `"NG0201: No provider found for \`InjectionToken ...\`"`

## RxDB v16 Constraints

- **Max 16 collections per database** (was unlimited in v15)
- **Stricter duplicate detection** (DB8/DB9 errors)
- **Schema validation enforcement** in dev-mode (DVM1 error if storage not wrapped)
- **Destroyed databases tracked** in memory (can't recreate same name)

---

## TypeScript Inference in SignalStore Features

### Problem: Index Signature Pollution in `SignalStore`

When creating custom `signalStoreFeature`s that involve dynamic keys (like `withCollectionService` which accepts an optional collection name), it's common to use mapped types or index signatures (e.g., `[key: string]: any`) to represent the dynamic state.

However, if a feature returns a type with an index signature, `SignalStore` (via `@ngrx/signals`) may merge this signature with other features. This causes "pollution" where strictly typed signals (e.g., `newTodo: Signal<string>`) are widened to the union of the index signature's values (e.g., `Signal<string | number | Todo[]>`). This breaks type safety and autocomplete in consumers.

### Solution: Conditional Types & Literal Defaults

To resolve this in `withCollectionService`:

1.  **Default to Literal Type:** We changed the generic default for the collection name from `string` to `''` (empty string literal).

    ```typescript
    export function withCollectionService<..., CName extends string = ''>(...)
    ```

    This allows TypeScript to distinguish between a "generic/dynamic" usage (where `CName` is `string`) and the "default/strict" usage (where `CName` is `''`).

2.  **Conditional Return Types:** We explicitly cast the internal parts (`withState`, `withComputed`, `withMethods`) using conditional types:

    ```typescript
    as CName extends '' ? CollectionServiceState<E, F> : NamedCollectionServiceState<E, F, CName>
    ```

    - `CollectionServiceState` (for `''`): Uses **strict keys** (e.g., `filter`, `query`) and **NO index signature**.
    - `NamedCollectionServiceState` (for `string`): Uses **mapped types** (e.g., `[K in CName as ...]`) which inevitably produce an index signature.

    This ensures that in the most common case (single collection, no prefix), the store remains strictly typed without pollution.

3.  **Signal Type Compatibility:**
    - `derivedAsync` (from `ngxtension`) returns `Signal<T | undefined>` by default.
    - Our interfaces expected `Signal<number>`.
    - **Fix:** Added `{ initialValue: 0 }` to `derivedAsync` calls and cast to `Signal<number>` to align implementation with the interface.

4.  **Internal Casting:**
    - Due to the complexity of conditional types, strict internal type checking inside the library was bypassed using `as any` / `unknown` casts (e.g., for `store[callStateKey]`). This prioritizes correct _consumer_ types over strict _internal_ library typing.
