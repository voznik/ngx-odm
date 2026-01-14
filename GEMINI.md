# Gemini Code Assistant Context

This document provides context for the Gemini code assistant to understand the `ngx-odm` project.

## Project Overview

`@ngx-odm/rxdb` is an Angular wrapper for [RxDB](https://rxdb.info/), a realtime, offline-first database for the web. The project is structured as an [Nx](https://nx.dev) monorepo.

The main library is located in `packages/rxdb`. The repository also includes example applications in the `examples/` directory, which demonstrate both NgModule-based and standalone Angular application usage.

### Key Technologies

*   **Angular:** The project is built with Angular 14+.
*   **RxDB:** The core dependency for providing database functionality.
*   **Nx:** Used for managing the monorepo, including building, testing, and linting.
*   **TypeScript:** The primary language used in the project.
*   **NgRx (Signals):** The standalone example demonstrates usage with NgRx signals for state management.

## Building and Running

The project uses `npm` and `nx` for managing dependencies and running scripts.

### Common Commands

*   **Install dependencies:**
    ```bash
    npm install
    ```

*   **Run the demo application:**
    ```bash
    npm start
    # or
    nx run demo:serve
    ```

*   **Run the standalone example application:**
    ```bash
    npm run start:standalone
    # or
    nx run standalone:serve
    ```

*   **Build the `rxdb` library:**
    ```bash
    npm run build
    # or
    nx run rxdb:build --configuration=production
    ```

*   **Run tests for the `rxdb` library:**
    ```bash
    npm test
    ```

*   **Run linter for affected projects:**
    ```bash
    npm run lint:all
    ```

*   **Format code:**
    ```bash
    nx format:write
    ```

## Development Conventions

### Commit Messages

The project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification. This is enforced by a `commit-msg` hook. Refer to `CONTRIBUTING.md` for details on the commit message format.

### Coding Style

*   **Linting:** The project uses ESLint to enforce a consistent coding style. Linting rules are defined in the root `.eslintrc.json` and in project-specific configuration files.
*   **Formatting:** Prettier is used for code formatting. It is recommended to set up your editor to format on save.

### Monorepo Structure

*   **Libraries:** Reusable libraries are located in the `packages/` directory.
*   **Applications:** Example and demo applications are in the `examples/` directory.
*   **Tools:** Scripts and configuration for development tools are in the `tools/` directory.

The `nx.json` file defines the project graph and target dependencies.
