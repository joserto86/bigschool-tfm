# Diseño: securización de rutas con JWT

## 1. Objetivo y alcance

Exigir un JWT de acceso válido en todas las rutas de la API, salvo el login, mediante:

1. Actualizar el contrato OpenAPI (`satispadel.openapi.yaml`) para reflejar la seguridad.
2. Implementar un middleware Express que verifique el JWT en cada solicitud protegida.

Fuera de alcance: autorización por roles (`isAdmin`), invalidación inmediata de JWT emitidos, cambios en la emisión de tokens y modificación de `src/tests/`.

## 2. Estado actual

- `bearerAuth` (HTTP Bearer JWT) está definido en `components.securitySchemes` y aplicado como seguridad global (`security: [bearerAuth]`).
- `POST /auth/login` y `POST /auth/refresh` ya declaran `security: []`.
- Las rutas `/matches/**` no declaran respuesta `401` y no están protegidas en código.
- Solo `POST /auth/password` verifica el JWT, dentro de `ChangePasswordUseCase` (con `jwtVerify`, `HS256`, issuer y audience).
- La clave de firma se construye dentro de `createAuthRouter`, por lo que no es accesible desde otros routers.

## 3. Decisión sobre `POST /auth/refresh`

El requisito dice "todas las rutas excepto el login". `/auth/refresh` se mantiene pública: su credencial es el refresh token y, si exigiera un access token válido, no se podría renovar una sesión con el access token caducado. Es el comportamiento ya definido en [0002-authentication-design.md](0002-authentication-design.md).

| Ruta | Acceso |
|---|---|
| `POST /auth/login` | Pública |
| `POST /auth/refresh` | Pública (credencial: refresh token) |
| `POST /auth/password` | JWT |
| `POST /matches`, `GET /matches` | JWT |
| `GET /matches/{matchId}` | JWT |
| `POST /matches/{matchId}/players` | JWT |
| `DELETE /matches/{matchId}/players/{playerId}` | JWT |
| `POST /matches/{matchId}/confirmation` | JWT |

## 4. Cambios en OpenAPI

- Mantener `security: [bearerAuth]` global y `security: []` en `login` y `refresh`.
- Añadir `'401': $ref: '#/components/responses/Unauthorized'` a las seis operaciones de `/matches/**` (`createMatch`, `getMatchesByDateTime`, `getMatch`, `joinMatch`, `leaveMatch`, `confirmOrDeclineMatch`).
- Para que sea explícito y no dependa solo de la herencia global, se puede repetir `security: [bearerAuth: []]` en cada operación protegida. Es opcional.

## 5. Middleware de autenticación

**Ubicación:** `src/transport/middleware/authenticate.ts`, con factory `createAuthenticateMiddleware(signingKey)`.

**Comportamiento:**

1. Lee `Authorization`. Debe ser `Bearer <token>` (esquema sin distinguir mayúsculas). Si falta o está mal formado: `401`.
2. Verifica con `jose.jwtVerify`:
   - `algorithms: ["HS256"]`.
   - `issuer` y `audience` con los mismos valores que usa la emisión (`JWT_ISSUER`, `JWT_AUDIENCE`).
   - Expiración (`exp`) y presencia de `sub`.
3. Si es válido, guarda `req.auth = { playerId: payload.sub }` y llama a `next()`.
4. Cualquier fallo devuelve `401` con `{ "code": "...", "message": "..." }`, el mismo formato y código que `AuthenticationFailedError`. El mensaje es genérico: no distingue expirado, firma inválida o ausente.

**Tipado:** ampliar `Express.Request` con `auth?: { playerId: string }` (declaración en `src/types/`).

**No incluye:** consulta a base de datos por solicitud. Un JWT seguirá siendo válido hasta expirar aunque se cambie la contraseña (limitación ya aceptada en el documento 0002).

## 6. Integración

- **Clave de firma compartida:** extraer la resolución de `JWT_SECRET` (obligatoria en producción, mínimo 32 bytes, clave efímera en desarrollo) de `createAuthRouter` a un módulo único, por ejemplo `src/domain/Auth/signingKey.ts`. `createApp()` la obtiene una vez y la pasa al router de auth y al middleware. Si cada parte generase su propia clave efímera en desarrollo, los tokens no validarían.
- **Issuer y audience:** unificar la lectura de `JWT_ISSUER` y `JWT_AUDIENCE`. Hoy `LoginUseCase` los lee del entorno, pero `ChangePasswordUseCase` usa valores fijos, lo que fallaría si se configuran variables distintas de las de por defecto.
- **Montaje en `src/app.ts`:**
  - `app.use("/matches", authenticate, createMatchesRouter(...))`.
  - En `authRoutes.ts`, `router.post("/password", authenticate, ...)`; `/login` y `/refresh` sin middleware.
  - Se evita un `app.use(authenticate)` global con lista de excepciones, porque una ruta nueva quedaría pública por omisión si se olvida; aquí es explícito por router.
- **`ChangePasswordUseCase`:** deja de verificar el JWT. Su firma pasa de `execute(accessToken, input)` a `execute(playerId, input)`; el controlador toma el `playerId` de `req.auth` y el caso de uso deja de depender de `jose` y de la clave de firma. Así la verificación ocurre una sola vez, en el middleware. Se actualizarán sus llamadas en `AuthController` y `authRoutes.ts`.

## 7. Configuración

Sin variables nuevas. Se usan `JWT_SECRET`, `JWT_ISSUER` y `JWT_AUDIENCE`.

## 8. Impacto en pruebas

Las pruebas que llamen a `ChangePasswordUseCase.execute` con un token deberán pasar un `playerId`. Las pruebas existentes de `/matches` no envían token y dejarán de pasar (recibirán `401`). Habrá que actualizarlas para autenticarse, y añadir casos del middleware: sin cabecera, esquema incorrecto, firma inválida, token expirado, issuer o audience erróneos y token válido. Se hará solo cuando se pida modificar `src/tests/`.

## 9. Riesgos

- Mezcla de claves entre el router de auth y el middleware si no se comparte la clave (ver §6).
- Las rutas de partidos aceptan `playerId` en el cuerpo o la ruta; el middleware autentica pero no comprueba que coincida con `req.auth.playerId`. Es un tema de autorización, fuera de alcance, pero conviene abordarlo después.

## 10. Decisiones cerradas

1. `POST /auth/refresh` permanece pública.
2. `ChangePasswordUseCase` recibe `playerId` desde `req.auth` (opción B, ver §6).
