# Diseño de autenticación de usuarios

## 1. Objetivo y alcance

Incorporar autenticación para usuarios existentes mediante email y contraseña, con estos casos de uso:

- Iniciar sesión y obtener un JWT de acceso y un refresh token.
- Cambiar la contraseña de un usuario autenticado.
- Renovar el JWT de acceso mediante un refresh token válido.

Este documento propone el diseño y los endpoints; no define registro de usuarios, recuperación de contraseña ni autorización por roles.

## 2. Dependencia propuesta

Se propone [`jose`](https://github.com/panva/jose), una implementación mantenida de los estándares JOSE para Node.js y TypeScript. Permite firmar y verificar JWT y es compatible con el backend Express existente.

La librería cubre la parte criptográfica del JWT, no la gestión completa de usuarios o sesiones. La aplicación seguirá siendo responsable de verificar contraseñas, administrar y revocar refresh tokens y aplicar las reglas de autenticación. No se recomienda tratar un refresh token como un JWT de larga duración: se propone que sea opaco y revocable en servidor.

## 3. Modelo de tokens y seguridad

- **JWT de acceso:** duración corta y configurable (por ejemplo, 15 minutos). Incluye `sub` con el identificador del usuario (`Player.id`) y las claims temporales y de emisor/audiencia necesarias. Se envía como `Authorization: Bearer <token>`.
- **Refresh token:** valor aleatorio opaco, de mayor duración configurable. El servidor guarda únicamente su hash, asociado al usuario, vencimiento y estado de revocación.
- **Rotación:** cada renovación consume el refresh token presentado y emite uno nuevo. Si se presenta un token ya consumido, se revoca su familia de tokens para limitar la reutilización.
- **Contraseñas:** verificar y almacenar hashes de contraseña, nunca texto plano; no devolver la contraseña ni su hash en respuestas.
- **Cambio de contraseña:** revocar los refresh tokens activos del usuario. Los JWT de acceso ya emitidos seguirán siendo válidos hasta expirar; si se necesita invalidación inmediata, el middleware deberá comprobar una versión de credenciales/sesión contra el servidor.
- **JWT:** verificar firma, algoritmo permitido, emisor, audiencia y expiración. Mantener las claves fuera del código fuente y de las respuestas de la API.

La entidad `Player` existente ya contiene `id` y `email`, que permiten identificar la cuenta. La persistencia actual del proyecto es en memoria; los refresh tokens necesitarán almacenamiento con soporte de expiración, revocación y actualización atómica para que la rotación sea segura.

## 4. Endpoints propuestos

### Iniciar sesión

```http
POST /auth/login
```

Autenticación con email y contraseña. No requiere JWT.

#### Solicitud

```json
{
  "email": "jugador@example.com",
  "password": "contraseña"
}
```

#### Respuesta `200 OK`

```json
{
  "accessToken": "<jwt>",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "refreshToken": "<token-opaco>",
  "refreshTokenExpiresAt": "2026-10-27T12:00:00Z"
}
```

Credenciales incorrectas: `401 Unauthorized`, con el mismo mensaje genérico para email inexistente o contraseña incorrecta.

### Cambiar contraseña

```http
POST /auth/password
Authorization: Bearer <access-token>
```

Requiere un access token válido. El usuario se obtiene del `sub` del token, no de un identificador recibido en el cuerpo.

#### Solicitud de cambio

```json
{
  "currentPassword": "contraseña-actual",
  "newPassword": "contraseña-nueva"
}
```

Respuesta `204 No Content` si se cambia correctamente. Usar `400 Bad Request` para datos o política de contraseña inválidos y `401 Unauthorized` para token inválido o contraseña actual incorrecta. Al completar el cambio se revocan los refresh tokens activos del usuario.

### Renovar access token

```http
POST /auth/refresh
```

No requiere access token; el refresh token es la credencial de esta operación. Un refresh token válido y no consumido se rota y devuelve un nuevo par de tokens con el mismo formato que el login.

#### Solicitud de renovación

```json
{
  "refreshToken": "<token-opaco>"
}
```

Token ausente, expirado, revocado o reutilizado: `401 Unauthorized`. La operación debe consumir el token anterior y guardar el nuevo de forma atómica.

## 5. Integración con OpenAPI

La especificación existente ya define `bearerAuth` como HTTP Bearer JWT a nivel global. Aplicar esa seguridad a `POST /auth/password`; declarar explícitamente `security: []` en `POST /auth/login` y `POST /auth/refresh`, ya que ambos se autentican con credenciales propias de la operación.

Usar el esquema de error común existente para las respuestas `400` y `401`.

## 6. Referencias

- Documentación y código de `jose`: <https://github.com/panva/jose>
- Consideraciones de seguridad de `jose`, incluidas las responsabilidades que corresponden a la aplicación: <https://github.com/panva/jose/blob/main/SECURITY.md>
