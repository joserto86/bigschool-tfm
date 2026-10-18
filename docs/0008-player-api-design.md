# Diseño de API REST — Gestión de jugadores

## 1. Objetivo y alcance

Definir las necesidades y los endpoints para crear, consultar, actualizar, eliminar, activar e inactivar jugadores de un club privado de pádel.

## 2. Modelo de jugador

| Campo | Descripción |
| --- | --- |
| `playerId` | Identificador único generado por la API. |
| `name` | Nombre del jugador. |
| `email` | Correo electrónico único; se normaliza eliminando espacios y convirtiéndolo a minúsculas. |
| `password` | Contraseña recibida al crear la cuenta. Se almacena únicamente como hash y nunca se devuelve. |
| `phone` | Teléfono del jugador. |
| `active` | Estado del jugador: `true` (activo) o `false` (inactivo). |
| `isAdmin` | Administrador `true` o `false`. |
| `createdAt` | Fecha de creación, generada por el servidor. |
| `updatedAt` | Fecha de última actualización, generada por el servidor. |

La respuesta de la API no incluye la contraseña ni su hash. La contraseña se proporciona en texto plano únicamente en solicitudes protegidas por HTTPS; el servidor la valida y almacena su hash. Los cambios de contraseña posteriores siguen el flujo definido en [0002-authentication-design.md](./0002-authentication-design.md).

## 3. Autorización y permisos

Todas las operaciones de gestión requieren autenticación. El servidor obtiene la identidad del jugador autenticado del token y comprueba el rol antes de permitir la operación; no debe confiar en un `playerId` enviado por el cliente para determinar la identidad propia.

| Operación | Jugador | Administrador (`isAdmin: true`) |
| --- | --- | --- |
| Crear jugadores | No permitido | Puede crear cualquier jugador. |
| Listar o consultar jugadores | Sólo puede consultar su propia información. | Puede listar y consultar cualquier jugador. |
| Actualizar jugadores | Sólo puede actualizar su propia información, excepto el estado activo/inactivo y el rol de administrador. | Puede actualizar cualquier jugador. |
| Eliminar jugadores | No permitido. | Puede eliminar cualquier jugador. |
| Activar o inactivar jugadores | No permitido. | Puede activar o inactivar cualquier jugador. |

Las rutas administrativas deben responder `401 Unauthorized` si falta una autenticación válida y `403 Forbidden` si el usuario autenticado no es administrador. Las rutas de autoservicio sólo permiten acceder al jugador asociado a la sesión autenticada.

## 4. Endpoints propuestos

### Crear un jugador

```http
POST /admin/players
```

Requiere rol de administrador. Recibe `name`, `email`, `password`, `phone` y `active`. El estado se indica explícitamente al crear la cuenta.

Respuesta `201 Created`: representación del jugador, sin datos de contraseña. Si el correo ya está registrado, responde `409 Conflict`.

### Listar jugadores

```http
GET /admin/players
```

Requiere rol de administrador.

Respuesta `200 OK`: lista de jugadores, sin datos de contraseña.

### Consultar un jugador

```http
GET /admin/players/{playerId}
```

Requiere rol de administrador y permite consultar cualquier jugador.

Respuesta `200 OK` con la representación del jugador, o `404 Not Found` si no existe.

### Actualizar los datos de un jugador

```http
PATCH /admin/players/{playerId}
```

Requiere rol de administrador y permite actualizar cualquier jugador. Permite modificar `name`, `email`, `isAdmin` y `phone`; el estado activo/inactivo se cambia mediante el endpoint de estado. No modifica la contraseña, cuyo cambio sigue el flujo de autenticación.

Respuesta `200 OK` con el jugador actualizado. Responde `404 Not Found` si no existe y `409 Conflict` si el correo ya pertenece a otro jugador.

### Consultar la propia información

```http
GET /players/me
```

Requiere autenticación. Devuelve únicamente la información del jugador asociado al token (`200 OK`), sin contraseña ni hash. El jugador no puede usar esta operación para consultar la información de otros jugadores.

### Actualizar la propia información

```http
PATCH /players/me
```

Requiere autenticación. Permite al jugador modificar únicamente `name`, `email` y `phone` de su propia cuenta. No permite cambiar `active` ni `isAdmin`; esos campos no se aceptan en esta operación. La contraseña se cambia mediante el flujo de autenticación.

Respuesta `200 OK` con la información actualizada. Responde `409 Conflict` si el correo ya pertenece a otro jugador.

### Activar o inactivar un jugador

```http
PATCH /admin/players/{playerId}/status
```

Requiere rol de administrador y permite cambiar el estado de cualquier jugador.

Solicitud:

```json
{
  "active": false
}
```

Usar `active: true` para activar y `active: false` para inactivar. Respuesta `200 OK` con el jugador actualizado, o `404 Not Found` si no existe.

### Eliminar un jugador

```http
DELETE /admin/players/{playerId}
```

Requiere rol de administrador y permite eliminar cualquier jugador.

Respuesta `204 No Content` si se elimina correctamente, o `404 Not Found` si no existe.

## 5. Validación y errores

- Los campos requeridos y el formato del correo se validan antes de crear o actualizar un jugador.
- El correo debe ser único tras su normalización.
- Las fechas y el identificador son de solo lectura y los asigna el servidor.
- Los errores usan el formato común de la API:

```json
{
  "code": "ERROR_CODE",
  "message": "Descripción del error"
}
```

Las solicitudes inválidas responden `400 Bad Request`. Las operaciones administrativas y de autoservicio aplican los permisos definidos en la sección anterior.
