# Guía para trabajar en este repositorio

## Comandos

- `npm run build`: compila `src/` con TypeScript en modo estricto y genera `dist/`.
- `npm test`: ejecuta toda la suite Vitest.
- `npm test -- src/tests/authentication.test.ts`: ejecuta un archivo de pruebas.
- `npm test -- src/tests/authentication.test.ts -t "requires an authenticated user"`: ejecuta un caso por nombre.
- `npm run dev`: inicia el servidor en modo watch.
- `npm run db:generate`: genera el cliente Prisma; ejecútalo después de clonar o cambiar el esquema.
- `npm run db:up` / `npm run db:down`: inicia / detiene PostgreSQL con Docker Compose.

No hay un script de lint definido en `package.json`.

## Arquitectura

- `src/app.ts` es la raíz de composición: `createApp()` conecta repositorios y routers. Usa repositorios en memoria por defecto; `src/server.ts` carga dotenv e inicia la aplicación con persistencia PostgreSQL.
- Los casos de uso y reglas de negocio viven en `src/domain/` (partidos, autenticación, jugadores y administración). Las interfaces y adaptadores de persistencia están en `src/infrastructure/persistence/`; el esquema y las migraciones Prisma están en `src/infrastructure/database/prisma/`.
- Las factories de `src/infrastructure/transport/routes/` conectan casos de uso y controladores. Los controladores traducen solicitudes y errores de dominio a HTTP; los repositorios implementan acceso asíncrono a datos.
- `src/middleware/` contiene autenticación JWT y autorización administrativa. La protección se determina por el middleware conectado en `src/app.ts`; no asumas que una ruta está protegida sin comprobar ese cableado.
- Los tipos compartidos de jugadores y partidos están en `src/types/`. El contrato externo está en `satispadel.openapi.yaml`; las reglas y diseños más detallados están en `docs/0001-api-design.md`, `docs/0002-authentication-design.md` y `docs/0006-persistence.md`.
- La integración MCP de PostgreSQL para VS Code está en `.vscode/mcp.json`; sus herramientas SQL están limitadas a solo lectura en `.vscode/dbhub.toml`. Para no exponer otras variables de `.env`, copia `.vscode/dbhub.env.example` a `.vscode/dbhub.env` y define allí solo `DATABASE_URL`; ese archivo local está ignorado por Git.

## Convenciones del proyecto

- Mantén la lógica de negocio en casos de uso y el acceso a datos detrás de interfaces de repositorio; no introduzcas persistencia en controladores.
- Los casos de uso representan fallos con errores de dominio específicos y los controladores los convierten al formato HTTP existente `{ code, message }`. Conserva ese formato y alinea rutas, payloads y respuestas con `satispadel.openapi.yaml`.
- Para operaciones del usuario autenticado, deriva su identidad de `req.auth` establecido por el middleware, no de un identificador proporcionado por el cliente. Verifica siempre el middleware asociado a cada router en `src/app.ts`.
- `Player.passwordHash` nunca debe incluirse en respuestas. En producción `JWT_SECRET` es obligatorio y debe tener al menos 32 bytes; en desarrollo se puede generar una clave efímera.
- Las pruebas de API usan Vitest y Supertest con una aplicación nueva de `createApp()` por caso y repositorios en memoria. Para fijar el secreto JWT, usa `vi.stubEnv("JWT_SECRET", value)` y restaura el entorno al terminar. Sigue [.agents/skills/pruebas-vitest/SKILL.md](.agents/skills/pruebas-vitest/SKILL.md); no modifiques ni ejecutes pruebas salvo que la solicitud lo pida expresamente.
- Las rutas actuales y los adaptadores están bajo `src/infrastructure/`; al seguir documentación antigua, confirma los nombres y ubicaciones en el código antes de reutilizar una referencia.

## Skills del proyecto

Antes de implementar una funcionalidad, refactorizar o cambiar código, consulta y aplica la skill pertinente de `.agents/skills/`. Si las herramientas de la sesión permiten cargar skills, cárgalas antes de empezar; si no, lee su `SKILL.md`. Combina varias cuando el cambio abarque más de un área:

- [develop-patterns](.agents/skills/develop-patterns/SKILL.md): nuevas funcionalidades y refactorizaciones; sigue los patrones existentes de Express, TypeScript y acceso a datos.
- [database-access-reuse](.agents/skills/database-access-reuse/SKILL.md): cualquier cambio que lea o escriba datos; reutiliza la infraestructura de persistencia y no crees repositorios nuevos sin autorización.
- [revision-contrato-openapi](.agents/skills/revision-contrato-openapi/SKILL.md): endpoints, controladores, casos de uso o esquemas HTTP; comprueba la implementación contra el contrato OpenAPI.
- [pruebas-vitest](.agents/skills/pruebas-vitest/SKILL.md): al escribir, modificar o revisar pruebas de API en `src/tests/`. Respeta la política anterior para cambios y ejecución de pruebas.
- [supabase-postgres-best-practices](.agents/skills/supabase-postgres-best-practices/SKILL.md): cambios en PostgreSQL, como esquemas, migraciones, SQL, índices o diagnóstico de rendimiento.
- [supabase](.agents/skills/supabase/SKILL.md): solo cuando el cambio involucre productos, librerías o servicios de Supabase.
