# Gemini Code Assistant Context

This document provides context for the Gemini code assistant to understand the `ngx-odm` project.

## Project Overview

`@ngx-odm/rxdb` is an Angular 14+ wrapper for [RxDB](https://rxdb.info/), a realtime, offline-first database for the web. The project is structured as an [Nx](https://nx.dev) monorepo. It provides both NgModule-based and standalone component approaches for integrating RxDB into Angular applications.

The main library is located in `packages/rxdb`. The repository also includes example applications in the `examples/` directory.

**IMPORTANT: Development Focus**
Current development prioritizes:
- **Standalone components** (not NgModules)
- **Zoneless Angular** (using `ɵNoopNgZone`)
- **Signal-based state management** (`@ngrx/signals` with `withCollectionService`)
- **Latest Angular best practices**

When making changes, prefer the standalone/zoneless/signals approach over the legacy NgModule patterns.

### Key Technologies

*   **Angular:** The project is built with Angular 14+.
*   **RxDB:** The core dependency for providing database functionality.
*   **Nx:** Used for managing the monorepo, including building, testing, and linting.
*   **TypeScript:** The primary language used in the project.
*   **NgRx (Signals):** The standalone example demonstrates usage with NgRx signals for state management.
*   **Zoneless Angular:** The standalone example uses `ɵNoopNgZone`.

## Nx Workspace

This project is an [Nx](https://nx.dev) monorepo. Understanding Nx's core concepts is crucial for working effectively within this codebase.

*   **Project Graph:** Nx creates a dependency graph of all projects in the workspace. This allows it to optimize tasks by only running them on projects affected by a code change. You can visualize this graph by running `nx graph`. If you suspect issues with the graph, you can clear the cache with `npm run clear-cache`.
*   **Projects (`packages/` and `examples/`):** The code is organized into libraries (`packages/` - high priority) and applications (`examples/` - lower priority). Libraries are reusable, and applications are the runnable entry points.
*   **Project Configuration (`project.json`):** Each project has a `project.json` file that defines its metadata and a set of `targets` that can be run on it.
*   **Targets and Executors:** Targets are tasks like `build`, `serve`, `test`, and `lint`. Each target is powered by an "executor," which is the script that performs the task. You can run a target with the command: `nx run <project-name>:<target-name>`.
*   **Code Generation:** Nx has powerful code generation capabilities. Use `nx generate <generator-name>` to scaffold new projects, components, libraries, etc., while adhering to workspace conventions.
*   **Dependency Constraints (Tags):** Projects can be assigned `tags` in their `project.json` files. These tags are used to create rules that enforce architectural boundaries (e.g., preventing a "feature" library from depending on another "feature" library). These rules are defined in the root `eslint.config.mjs` under `@nx/enforce-module-boundaries`.

## Build & Development Commands

The project uses `npm` and `nx` for managing dependencies and running scripts.

### Common Commands

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

# Lint and Format
npm run lint:all            # lint affected projects
npm run lint:fix            # fix linting and formatting issues

# Format
npm run format              # format files
npm run format:check        # check formatting
```
**Note:** If you encounter problems with linting or type-checking, you can try validating a single file first with a more specific command:
```bash
# Type-check a single file without emitting compiled output
npx tsc --noEmit --project tsconfig.base.json packages/rxdb/signals/src/with-collection-service.ts

# Lint a single file
npx eslint packages/rxdb/signals/src/with-collection-service.ts
```

## Architecture

### Nx Workspace Structure
- `packages/` - Libraries (libsDir) - main purpose & priority
- `examples/` - Demo applications (appsDir) - less purpose & priority
- `tools/` - Scripts and configuration for development tools

The `nx.json` file defines the project graph and target dependencies.

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

### Initialization Flow
1. `APP_INITIALIZER` calls `RxDBService.initDb()` with database config
2. RxDB plugins are loaded via `loadRxDBPlugins()`
3. Database is created with `createRxDatabase()`
4. Collections are created via `RxDBService.initCollections()` when feature modules/components initialize
5. `RxDBCollectionService` wraps collection with Angular-friendly methods

## Development Conventions

### Commit Message Format

The project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification, enforced by a `commit-msg` hook.

Follow Angular commit conventions:
```
<type>(<scope>): <subject>
```

- **Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`
- **Scopes**: `rxdb`, `kinto`, `schematics`

### Coding Style

*   **Linting:** The project uses ESLint to enforce a consistent coding style. Linting rules are defined in the root `eslint.config.mjs` and in project-specific configuration files.
*   **Formatting:** Prettier is used via an ESLint plugin, so running `npm run lint:fix` will also format the code.

## Additional Packages

- `packages/streamlit-rxdb-dataframe` - Python/Streamlit component for RxDB (separate build system using Poetry)