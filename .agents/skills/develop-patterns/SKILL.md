---
name: "develop-patterns"
description: "Use when implementing new features or refactoring existing code. Follow the project's established patterns and conventions for Express, TypeScript, and database access. Avoid introducing new abstractions or patterns without explicit user authorization."
---

## 1. Express and TypeScript implementation rules

Follow the project's existing organization and conventions.

### Routes

- Register new endpoints through the existing router structure.
- Reuse existing middleware, authentication, authorization, and validation mechanisms.
- Do not put database queries directly in route declarations if the project separates routing from business logic.

### Controllers

- Follow the existing controller pattern.
- Handle HTTP requests and responses according to project conventions.
- Delegate business logic and persistence operations to the established components.
- Do not create a new controller or service layer solely to justify introducing another repository.

### Services

- Extend the existing service when the new behavior belongs to its responsibilities.
- Reuse existing service dependencies and data-access methods.
- Avoid duplicating business rules or implementing the same query in multiple services.
- Do not create a service merely to wrap an existing repository call unless the architecture requires it.

### TypeScript

- Reuse existing entity types, DTOs, interfaces, and validation schemas when appropriate.
- Define new types only when the feature requires them.
- Preserve strict typing and existing compiler settings.
- Avoid `any`, unsafe type assertions, and duplicated type definitions when a suitable type already exists.

These are conditional guidelines: if the project follows a different established pattern, preserve that pattern.
