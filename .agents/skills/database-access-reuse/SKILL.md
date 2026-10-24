---
name: database-access-reuse
description: Use whenever implementing, modifying, debugging, or refactoring Express and TypeScript functionality that reads from or writes to a database. Inspect and reuse existing repositories and persistence infrastructure. Never create a new repository or equivalent data-access abstraction without explicit user authorization.
---

# Database Access Reuse — Express + TypeScript

## 1. Objective

Implement database-related functionality by reusing the project's existing persistence infrastructure.

The primary rule is mandatory:

**NEVER create a new repository, repository interface, repository implementation, DAO, or equivalent data-access abstraction unless the user explicitly authorizes its creation.**

A request to implement a feature, endpoint, CRUD operation, service, module, or complete functionality does not constitute authorization to create a repository.

This rule applies to all database-related tasks, including reading, inserting, updating, deleting, filtering, aggregating, and persisting data.

## 2. Inspect before coding

Before modifying code, inspect the actual project structure and `package.json`.

Identify the existing implementation of:

- Express routes and routers.
- Controllers and request handlers.
- Services and business logic.
- Repositories, DAOs, models, and data-access utilities.
- ORM clients, database connections, query builders, and SQL utilities.
- Dependency injection or service initialization, if present.
- DTOs, validation schemas, and TypeScript types.
- Existing migrations and database-related tests.

Search for existing implementations of the target entity, table, query, or business operation.

Read the relevant files and inspect their callers before deciding where to implement the change.

Do not assume that a component is missing merely because it uses an unexpected name or directory structure.

Do not create files before completing this inspection.

## 3. Mandatory reuse priority

Choose the first viable option in this order:

1. Reuse an existing repository or DAO that already provides the required functionality.
2. Extend an existing repository or DAO with the required query or operation.
3. Reuse an existing database service, ORM client, query handler, or established persistence mechanism.
4. Extend an existing, appropriate data-access component without introducing a new abstraction.
5. If no suitable solution exists, explain the limitation and request explicit authorization before creating a new repository or equivalent abstraction.

Choose the smallest maintainable change that satisfies the requested behavior.

Do not introduce a new architecture simply because a different pattern is considered more conventional.



## 4. ORM, database client, and query reuse

Detect and use the database technology already installed and configured in the project.

Examples include Prisma, TypeORM, Sequelize, Drizzle, Knex, Mongoose, database drivers, and direct SQL.

Do not introduce another ORM, database client, connection pool, or persistence framework without explicit authorization.

Reuse the existing:

- Database connection and client.
- Transaction and unit-of-work mechanisms.
- Query conventions and entity mappings.
- Error-handling and logging mechanisms.
- Dependency injection and lifecycle management.
- Database configuration and environment variables.

Do not bypass an existing repository when it enforces business rules, access controls, tenant isolation, auditing, or other required behavior.

Direct database access is acceptable only when consistent with the project's architecture and existing conventions.

## 5. Strict prohibition on unauthorized repositories

Do not create any of the following without explicit user authorization:

- A repository for an entity already handled by an existing repository.
- A new repository interface or implementation for an existing data-access responsibility.
- A duplicate DAO or persistence service.
- A repository that simply delegates operations to another repository.
- A new generic repository abstraction.
- A separate persistence layer that duplicates the current one.
- A new repository because the feature introduces a new endpoint, service, entity, or table.

A new entity, DTO, migration, validation schema, or service is not automatically prohibited. Create such components only when required by the feature and consistent with the existing architecture.

### What counts as explicit authorization?

Valid examples:

- "Create a new repository for this entity."
- "Introduce a separate repository for this module."
- "Create a new persistence abstraction for this feature."

The following are not authorization:

- "Implement this feature."
- "Add CRUD endpoints."
- "Create a new API."
- "Develop this module."
- "Refactor the application."
- "Follow clean architecture."
- "Apply best practices."

If creating a new repository appears necessary, stop before creating it. Explain why the existing infrastructure is insufficient and ask the user for permission.

Do not silently substitute a new repository for an existing one.

## 6. Database correctness and security

Preserve the project's established safeguards:

- Parameterize SQL queries and prevent SQL injection.
- Validate and authorize incoming requests.
- Preserve authentication and tenant or user data isolation.
- Use existing transaction patterns for operations requiring atomicity.
- Preserve referential integrity and existing database constraints.
- Avoid unintended changes to data, schemas, or migrations.
- Handle database errors using established error-handling conventions.
- Avoid logging credentials, secrets, or sensitive database contents.
- Preserve existing pagination, filtering, sorting, and query conventions where applicable.

Do not weaken existing safeguards to simplify implementation.

## 7. Implementation workflow

For each database-related task:

1. Understand the requested behavior and acceptance criteria.
2. Inspect the project structure and relevant source files.
3. Identify the existing data-access component responsible for the affected data.
4. Determine whether the existing component already supports the operation.
5. Reuse it or extend it using the project's conventions.
6. Implement the necessary changes to routes, controllers, services, types, validation, and tests.
7. Check dependency registrations and imports when relevant.
8. Run the relevant tests, type checks, linting, or build commands available in the project.
9. Review the final changes for duplicate repositories or unauthorized persistence abstractions.

Do not claim that a test, build, or validation succeeded unless it was actually executed and passed.

## 8. Scope control

Modify only the files needed to implement the requested functionality.

Do not perform unrelated architectural refactoring, rename existing repositories, reorganize persistence directories, replace the ORM, or introduce additional abstractions without authorization.

Do not create a new file simply because the existing code could theoretically be organized differently.

If the task requires a migration, schema change, or additional database object, follow the existing migration and deployment process. A schema change does not automatically authorize a new repository.

## 9. Completion report

When the implementation is complete, report:

- The functionality implemented.
- The existing repository, DAO, ORM client, or persistence mechanism reused.
- Which existing components were extended.
- Whether any new repository or equivalent abstraction was created.
- Which tests and checks were executed and their actual results.
- Any unresolved limitations or required follow-up actions.

If a new repository was explicitly authorized, identify it and explain why it was needed.

## 10. Final mandatory decision

Before creating a new repository or equivalent persistence abstraction, evaluate:

"Has the user explicitly authorized creating this component?"

- YES: Create it within the authorized scope, following existing conventions.
- NO, but an existing component can satisfy the requirement: Reuse or extend that component.
- NO, and no existing component can satisfy the requirement: Explain the limitation and request authorization.

**Never interpret a feature request as permission to create a repository. Reuse existing persistence infrastructure by default.**