# Guía del proyecto

## Arquitectura

- `src/server.ts` es la raíz de composición. `createApp()` conecta los repositorios en memoria, los casos de uso, las rutas y la clave de firma JWT.
- Las reglas de negocio de partidos están en `src/domain/Match/`; los casos de uso de autenticación, en `src/domain/Auth/`. Usa las interfaces de repositorio de `src/persistence/Match/` y `src/persistence/Auth/`; no incluyas lógica de persistencia en los controladores.
- Mantén las declaraciones de rutas en `src/transport/matchesRoutes.ts` y `src/transport/authRoutes.ts`; mapea las solicitudes, respuestas y errores de dominio HTTP en `src/transport/controllers/`.
- La persistencia es únicamente en memoria. No presupongas que existe una base de datos ni sesiones duraderas.
- Los endpoints de autenticación están implementados. Consulta [docs/0002-authentication-design.md](docs/0002-authentication-design.md) para conocer el comportamiento previsto; no presupongas que las rutas de partidos están protegidas por JWT salvo que el middleware de autenticación esté conectado explícitamente a ellas.
- `Player.passwordHash` almacena un hash de contraseña, nunca texto plano. No lo incluyas en las respuestas de la API.
- En producción es obligatorio configurar `JWT_SECRET`; nunca incluyas una clave de firma fija en el código. Las pruebas pueden inyectar `jwtSecret` e `initialUsers` mediante `createApp()`.

## Contrato de la API

- Mantén el comportamiento de la API alineado con [satispadel.openapi.yaml](satispadel.openapi.yaml), las reglas de partidos de [docs/0001-api-design.md](docs/0001-api-design.md) y el diseño de autenticación de [docs/0002-authentication-design.md](docs/0002-authentication-design.md).
- Conserva el formato existente de respuesta de error: `code` y `message`.

## Pruebas y comandos

- Las pruebas usan Vitest y Supertest en `src/tests/`; sigue las pruebas cercanas y utiliza `createApp({ jwtSecret, initialUsers })` para preparar fixtures de autenticación aislados.
- No modifiques `src/tests/` salvo que el usuario lo pida explícitamente. Por lo general, el usuario ejecuta las pruebas manualmente para ahorrar tokens; ejecútalas solo cuando lo solicite o cuando la tarea pida explícitamente usarlas como verificación. Esta preferencia también está registrada en [prompts/0002-prompts-ia.md](prompts/0002-prompts-ia.md).
- Scripts disponibles en `package.json`: `npm test`, `npm run dev` y `npm run build`.
- `npm run build` ejecuta `tsc`, pero este workspace no tiene actualmente un `tsconfig.json`; verifica la configuración del compilador antes de depender de ese script.

## Herramientas de agentes

- Al delegar, usa `.atl/skill-registry.md` solo como índice; indica al agente delegado que lea los archivos `SKILL.md` que correspondan exactamente.
