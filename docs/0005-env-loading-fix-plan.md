# 0005 – Plan: el servidor no lee las variables de entorno

## Diagnóstico

1. **`.env` nunca se carga.** `dotenv` figura en `dependencies`, pero ningún archivo de `src/` lo importa. Node/`tsx` no leen `.env` por sí solos (`npm run dev` ejecuta `tsx watch src/server.ts` sin `--env-file`). Por eso `process.env.PORT`, `DATABASE_URL`, `JWT_*`, etc. llegan `undefined` y se usan los valores por defecto.
2. **Lectura en tiempo de importación.** [src/server.ts](../src/server.ts) lee `PORT` y `DATABASE_TYPE` en constantes de módulo, y `LoginUseCase.ts` y `jwtConfig.ts` leen sus variables al cargar el módulo. Como los imports ESM se evalúan antes que el cuerpo de `server.ts`, aunque se llamase a `dotenv.config()` dentro de `server.ts` llegaría tarde.
3. **`server.ts` no usa `createApp()`.** Tiene `createApp` comentado y monta repositorios `InMemory*` a mano, así que `DATABASE_URL` se ignora aunque se cargara (se imprime pero no activa Prisma). Además `app.listen` se ejecuta antes de montar `/auth` y `/matches`.
4. **`DATABASE_TYPE` no está definida en el diseño.** Existe en `.env`/`.env.example` pero la guía del proyecto usa `DATABASE_URL` para elegir persistencia. Es una variable redundante y confusa.
5. **Faltan en `.env.example`:** `PORT`, `JWT_SECRET` y `DATABASE_URL`.
6. **`src/persistence/prisma.ts` no existe**, pese a que la arquitectura lo describe (cliente perezoso); `src/generated/` solo está en el índice de git.

## Plan

1. Cargar el entorno lo primero, antes de cualquier otro import:
   - Opción recomendada: crear `src/env.ts` con `import "dotenv/config";` e importarlo como **primera línea** de `src/server.ts`.
   - Alternativa: scripts `tsx --env-file=.env watch src/server.ts` (Node ≥ 20) y retirar `dotenv`.
   - No cargarlo en `createApp()` ni en tests (los tests usan `vi.stubEnv`).
2. Restaurar `createApp()` en `server.ts`: `const app = createApp(); app.listen(PORT, ...)`, eliminando el montaje manual de repositorios y routers.
3. Leer `PORT` dentro de `startServer()` (o tras el import de `env.ts`) y mostrar el tipo de repositorio según `Boolean(process.env.DATABASE_URL)`; eliminar `DATABASE_TYPE`. No imprimir `DATABASE_URL` (contiene credenciales).
4. Verificar o recrear `src/persistence/prisma.ts` y los `Prisma*Repository` para que `createApp()` pueda elegirlos; ejecutar `npm run db:generate`.
5. Actualizar `.env.example` con `PORT`, `JWT_SECRET` (≥ 32 bytes, obligatorio en producción) y `DATABASE_URL`; quitar `DATABASE_TYPE`.
6. Añadir los scripts `db:*` mencionados en la guía si faltan en `package.json`.
7. En producción, validar al arrancar que `JWT_SECRET` existe (ya lo hace `resolveSigningKey`).

## Verificación

- `npm run dev` sin `DATABASE_URL`: arranca en memoria; con `DATABASE_URL`: usa PostgreSQL.
- Cambiar `PORT` en `.env` y comprobar que el servidor escucha en ese puerto.
- `curl` a `/auth/...` y `/matches` para confirmar que las rutas responden.
- `npm run build` y, si se solicita, `npm test`.
