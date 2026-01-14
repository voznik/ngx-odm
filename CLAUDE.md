# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`@ngx-odm/rxdb` is an Angular 14+ wrapper for RxDB (a realtime database for the web). It provides both NgModule-based and standalone component approaches for integrating RxDB into Angular applications.

**IMPORTANT: Development Focus**
Current development prioritizes:
- **Standalone components** (not NgModules)
- **Zoneless Angular** (using `ɵNoopNgZone`)
- **Signal-based state management** (`@ngrx/signals` with `withCollectionService`)
- **Latest Angular best practices**

When making changes, prefer the standalone/zoneless/signals approach over the legacy NgModule patterns.

## Build & Development Commands

```bash
# Install dependencies
npm install

# Start demo app (NgModule-based - legacy)
npm start                    # or: nx run demo:serve

# Start standalone demo app (PREFERRED for development)
npm run start:standalone     # or: nx run standalone:serve

# Build library
npm run build               # or: nx run rxdb:build --configuration=production

# Run tests
npm test                    # runs rxdb tests with coverage

# Lint
npm run lint:all            # lint affected projects
npm run lint:fix            # fix linting issues

# Format
npm run format              # format files
npm run format:check        # check formatting
```

## Architecture

### Nx Workspace Structure
- `packages/` - Libraries (libsDir)
- `examples/` - Demo applications (appsDir)

### Main Library: `@ngx-odm/rxdb`

The library is organized as secondary entry points under `packages/rxdb/`:

| Entry Point | Purpose |
|------------|---------|
| `@ngx-odm/rxdb` | Main module exports (`NgxRxdbModule`, `provideRxDatabase`, `provideRxCollection`) |
| `@ngx-odm/rxdb/collection` | `RxDBCollectionService` - service for interacting with RxDB collections |
| `@ngx-odm/rxdb/config` | Configuration types and `getRxDatabaseCreator()` helper |
| `@ngx-odm/rxdb/core` | `RxDBService` - manages RxDB database instance |
| `@ngx-odm/rxdb/signals` | `withCollectionService()` - ngrx/signals integration |
| `@ngx-odm/rxdb/prepare` | Collection preparation plugin |
| `@ngx-odm/rxdb/query-params` | URL query params sync plugin |
| `@ngx-odm/rxdb/replication-kinto` | Kinto server replication |
| `@ngx-odm/rxdb/testing` | Test mocks and stubs |
| `@ngx-odm/rxdb/utils` | Shared utilities |

### Key Injection Tokens
- `RXDB` - RxDBService instance
- `RXDB_CONFIG` - Database configuration
- `RXDB_COLLECTION` - Collection service instance
- `RXDB_CONFIG_COLLECTION` - Collection configuration

### Preferred Usage Pattern (Standalone + Zoneless + Signals)

**App config (`main.ts`):**
```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    { provide: NgZone, useClass: ɵNoopNgZone }, // Zoneless
    provideRxDatabase(getRxDatabaseCreator({
      name: 'mydb',
      options: { storageType: 'dexie', plugins: [...] }
    }))
  ]
};
```

**Signal Store with collection service:**
```typescript
export const TodoStore = signalStore(
  { providedIn: 'root' },
  withEntities<Todo>(),
  withCallState(),
  withCollectionService<Todo, FilterType>({
    filter: 'ALL',
    query: {},
    countQuery: { selector: { completed: { $eq: false } } },
  }),
  withComputed(({ entities, countAll }) => ({
    // computed signals
  })),
  withMethods(store => ({
    // methods using store.insert(), store.update(), store.remove(), etc.
  }))
);
```

**Component:**
```typescript
@Component({
  standalone: true,
  providers: [provideRxCollection(collectionConfig), TodoStore],
})
export class TodosComponent {
  readonly store = inject(TodoStore);
}
```

### Legacy NgModule Pattern (for reference only)

```typescript
// App module - initialize database
NgxRxdbModule.forRoot(getRxDatabaseCreator({ name: 'mydb', ... }))

// Feature module - create collection
NgxRxdbModule.forFeature({ name: 'todos', schema: todosSchema, ... })
```

### Initialization Flow
1. `APP_INITIALIZER` calls `RxDBService.initDb()` with database config
2. RxDB plugins are loaded via `loadRxDBPlugins()`
3. Database is created with `createRxDatabase()`
4. Collections are created via `RxDBService.initCollections()` when feature modules/components initialize
5. `RxDBCollectionService` wraps collection with Angular-friendly methods

## Commit Message Format

Follow Angular commit conventions:
```
<type>(<scope>): <subject>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`

Scopes: `rxdb`, `kinto`, `schematics`

## Path Aliases

Key TypeScript path aliases (defined in `tsconfig.base.json`):
- `@ngx-odm/rxdb/*` - library entry points
- `@shared` - shared code in examples (`examples/shared/index.ts`)
- `@package` - library package.json

## Additional Packages

- `packages/streamlit-rxdb-dataframe` - Python/Streamlit component for RxDB (separate build system using Poetry)
