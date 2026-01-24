# Agentic Coding Guidelines for Nisjongos

This document outlines the development standards, commands, and architectural patterns for the `nisjongos` repository. It is intended for AI agents and developers to ensure consistency and quality.

## 1. Environment & Toolchain

This project uses **Bun** as the runtime, package manager, and bundler.

### Commands
- **Install Dependencies**: `bun install`
- **Development Server**: `bun run dev` (runs with hot reload)
- **Build for Production**: `bun run build` (outputs to `dist/`)
- **Run Tests**: `bun test`
  - To run a specific test file: `bun test <filename>`
  - Note: Tests should be co-located or placed in a `test/` directory with `.test.ts` or `.spec.ts` extensions.
- **Type Checking**: `bun x tsc --noEmit` (verifies type safety without emitting files)

## 2. Code Style & Conventions

### Formatting
- **Indentation**: 2 spaces.
- **Semicolons**: **No semicolons** at the end of statements (ASI).
- **Quotes**: Use **single quotes** (`'`) for strings, except when escaping is needed.
- **Trailing Commas**: Use trailing commas in multi-line objects and arrays.

### Naming Conventions
- **Files**: Use `kebab-case` (e.g., `ticket-solved.ts`, `service-closed.ts`).
- **Variables & Functions**: Use `camelCase` (e.g., `processMessage`, `shutdown`).
- **Constants & Configuration**: Use `UPPER_SNAKE_CASE` (e.g., `NATS_SERVERS`, `DB_HOST`).
- **Classes/Interfaces**: Use `PascalCase`.

### Imports
- Use ES Module syntax (`import`/`export`).
- Use relative paths for local modules (e.g., `import logger from './logger'`).
- Group imports: External libraries first, then internal modules.

### TypeScript
- **Strictness**: Aim for strict typing. Avoid `any` unless absolutely necessary (e.g., in catch blocks).
- **Interfaces**: Define interfaces for data structures, especially NATS messages and DB rows.

## 3. Architecture & Patterns

### Configuration
- **Centralized Config**: All configuration variables must be defined in `src/config.ts`.
- **Environment Variables**: Read from `process.env` with sensible defaults.
- **Pattern**: `export const MY_VAR = process.env.MY_VAR || 'default_value'`

### Logging
- **Library**: Use `pino` via the singleton instance in `src/logger.ts`.
- **Usage**:
  - `logger.info('Message', { context })`
  - `logger.error('Error message', errorObject)`
- **Constraint**: Do not use `console.log` or `console.error`.

### Error Handling
- **Async/Await**: Prefer `async/await` over raw promises.
- **Try/Catch**: Wrap async operations in `try/catch` blocks.
- **Process Exit**: Fatal errors in `main()` should log the error and `process.exit(1)`.

### Database (MySQL)
- **Library**: `mysql2/promise`.
- **Connection**: Use the exported `pool` from `src/database.ts`.
- **Pattern**:
  ```typescript
  const [rows] = await pool.query('SELECT * FROM table WHERE id = ?', [id])
  ```

### NATS / JetStream
- **Library**: `nats`.
- **Consumer**: The app acts as a JetStream consumer.
- **Graceful Shutdown**: Handle `SIGINT`/`SIGTERM` to drain NATS connections before exiting.

## 4. Testing
- **Framework**: Bun's built-in test runner (`bun:test`).
- **Structure**:
  ```typescript
  import { describe, expect, test } from "bun:test";
  import { myFunc } from "./my-file";

  describe("myFunc", () => {
    test("should return expected value", () => {
      expect(myFunc()).toBe(true);
    });
  });
  ```
