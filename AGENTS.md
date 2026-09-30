# Guía del proyecto

## Arquitectura

- `src/app.ts` es la raíz de composición: `createApp()` conecta los repositorios en memoria y los routers. `src/server.ts` solo arranca el proceso HTTP.
- Las reglas de negocio de partidos están en `src/domain/Match/`; los casos de uso de autenticación, en `src/domain/Auth/`. Usa las interfaces de repositorio de `src/persistence/Match/` y `src/persistence/Auth/`; no incluyas lógica de persistencia en los controladores.
- Define los routers mediante las factories de `src/transport/matchesRoutes.ts` y `src/transport/authRoutes.ts`; estas instancian los casos de uso, el controlador y sus rutas. Mapea las solicitudes, respuestas y errores de dominio a HTTP en `src/transport/controllers/`.
- Los casos de uso lanzan errores de dominio específicos; los controladores los convierten en respuestas HTTP. Mantén este patrón al añadir endpoints y conserva el formato de error `code` y `message`.
- Los repositorios son async. Si `DATABASE_URL` está definida, `createApp()` usa Prisma/PostgreSQL (`src/persistence/**/Prisma*Repository.ts`, cliente perezoso en `src/persistence/prisma.ts`); si no, usa repositorios en memoria. Los tipos de Prisma no salen de `src/persistence/`. Consulta [docs/0003-database-persistence-design.md](docs/0003-database-persistence-design.md).
- Los tipos centrales están en `src/types/player.ts` y `src/types/match.ts`.
- Los endpoints de autenticación están implementados. Consulta [docs/0002-authentication-design.md](docs/0002-authentication-design.md) para conocer el comportamiento previsto; no presupongas que las rutas de partidos están protegidas por JWT salvo que el middleware de autenticación esté conectado explícitamente a ellas.
- `Player.passwordHash` almacena un hash de contraseña, nunca texto plano. No lo incluyas en las respuestas de la API.
- En producción es obligatorio configurar `JWT_SECRET`; nunca incluyas una clave de firma fija en el código.

## Contrato de la API

- Mantén el comportamiento de la API alineado con [satispadel.openapi.yaml](satispadel.openapi.yaml), las reglas de partidos de [docs/0001-api-design.md](docs/0001-api-design.md) y el diseño de autenticación de [docs/0002-authentication-design.md](docs/0002-authentication-design.md).
- Conserva el formato existente de respuesta de error: `code` y `message`.

## Pruebas y comandos

- Las pruebas usan Vitest y Supertest en `src/tests/`; sigue las pruebas cercanas. `createApp()` no recibe opciones: usa `vi.stubEnv("JWT_SECRET", value)` para fijar la clave de pruebas.
- No modifiques `src/tests/` salvo que el usuario lo pida explícitamente. Por lo general, el usuario ejecuta las pruebas manualmente para ahorrar tokens; ejecútalas solo cuando lo solicite o cuando la tarea pida explícitamente usarlas como verificación. Esta preferencia también está registrada en [prompts/0002-prompts-ia.md](prompts/0002-prompts-ia.md).
- Scripts disponibles en `package.json`: `npm test`, `npm run dev`, `npm run build` y `db:up`, `db:down`, `db:generate`, `db:migrate`, `db:deploy`, `db:studio`. Tras clonar, ejecuta `npm run db:generate` (el cliente en `src/generated/` no se versiona).
- `npm run build` ejecuta `tsc` con [tsconfig.json](tsconfig.json): modo estricto, `src/` como raíz y salida en `dist/`.

## Variables de entorno

- `JWT_SECRET` es obligatoria en producción y debe tener al menos 32 bytes. En desarrollo se genera una clave efímera si falta.
- `ACCESS_TOKEN_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN_SECONDS`, `JWT_ISSUER` y `JWT_AUDIENCE` ajustan la emisión de tokens; sus valores por defecto viven en los casos de uso de `src/domain/Auth/`.
- `DATABASE_URL` activa la persistencia en PostgreSQL; `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` y `POSTGRES_PORT` configuran `docker-compose.yml`. Ver `.env.example`.
