# Diseño de API REST — Gestión administrativa de partidos

## 1. Objetivo y alcance

Definir los endpoints para que un administrador gestione partidos: crearlos, consultarlos, inscribir o desinscribir jugadores, actualizar el estado y eliminarlos.

Este diseño no modifica los endpoints de autoservicio de jugadores ni añade filtros, paginación o reglas de negocio ajenas a estas operaciones.

## 2. Autorización

Todas las rutas de este documento requieren un JWT válido y el rol de administrador (`isAdmin: true`).

- Sin autenticación válida: `401 Unauthorized`.
- Usuario autenticado que no es administrador: `403 Forbidden`.

La identidad del administrador se obtiene del token. Para inscribir o desinscribir a otra persona se usa su `playerId` como recurso explícito.

## 3. Modelo y reglas de negocio

Las respuestas usan el modelo `Match` existente: `id`, `dateTime`, `status` y `players`. El identificador se genera en el servidor. Los estados posibles son `OPEN`, `COMPLETED`, `CONFIRMED` y `CANCELLED`; un partido admite como máximo cuatro jugadores y cada jugador puede estar inscrito una sola vez.

### Creación e inscripción

- Un partido nuevo se crea sin jugadores y en estado `OPEN`.
- El administrador puede inscribir jugadores únicamente en partidos `OPEN` o `COMPLETED`.
- El servidor asigna el siguiente hueco disponible; el cliente no elige el `slot`.
- No se permiten duplicados ni superar cuatro jugadores.
- Al inscribir al cuarto jugador, el partido pasa automáticamente a `COMPLETED`.

### Estado

- Un partido no puede pasar a `COMPLETED` si no tiene exactamente cuatro jugadores.
- El administrador solo puede cambiar manualmente el estado de `COMPLETED` a `CONFIRMED` o `CANCELLED`.
- No se puede pasar manualmente a `CONFIRMED` sin haber estado primero en `COMPLETED`.
- No se puede pasar manualmente a `CANCELLED` sin haber estado primero en `COMPLETED` o `CONFIRMED`.
- No se pueden desinscribir jugadores de un partido `CONFIRMED` o `CANCELLED`, pero si se puede cambiar el estado a `COMPLETED` o para permitir la desinscripción.
- Al desinscribir a un jugador, el partido pasa a `OPEN`. La baja administrativa reinicia las confirmaciones asociadas a las inscripciones restantes.
- Por tanto, la baja administrativa puede reabrir un partido `CONFIRMED`. Esta excepción aplica solo a estas rutas administrativas; no cambia la regla de inmutabilidad para el flujo ordinario de partidos.

### Eliminación

- El administrador puede eliminar un partido en cualquier estado.
- El identificador `id`, el estado y los jugadores no se aceptan como campos de escritura al crear o modificar el partido, salvo el `playerId` de una operación de inscripción.

## 4. Endpoints propuestos

### Crear un partido

```http
POST /admin/matches
```

Solicitud:

```json
{
  "dateTime": "2026-10-10T18:00:00+02:00"
}
```

La API valida `dateTime`, genera el identificador, establece `status: OPEN` y crea el partido sin jugadores.

Respuesta `201 Created`: objeto `Match`.

### Listar todos los partidos

```http
GET /admin/matches
```

Respuesta `200 OK`:

```json
{
  "items": [
    {
      "id": "match-123",
      "dateTime": "2026-10-10T18:00:00+02:00",
      "status": "OPEN",
      "players": []
    }
  ]
}
```

### Consultar un partido

```http
GET /admin/matches/{matchId}
```

Respuesta `200 OK`: objeto `Match`. Responde `404 Not Found` si el partido no existe.

### Inscribir un jugador

```http
POST /admin/matches/{matchId}/players
```

Solicitud:

```json
{
  "playerId": "player-123"
}
```

La API comprueba que existen el partido y el jugador, que el partido está `OPEN`, que el jugador aún no está inscrito y que queda un hueco. El servidor asigna el `slot`.

Respuesta `201 Created`: objeto `Match` actualizado. Si se ocupa el cuarto hueco, la respuesta refleja el estado `COMPLETED`.

### Desinscribir un jugador

```http
DELETE /admin/matches/{matchId}/players/{playerId}
```

La API elimina la inscripción y cambia el estado del partido a `OPEN`. Si la inscripción no existe o el partido no existe, responde `404 Not Found`.

Respuesta `200 OK`: objeto `Match` actualizado.

### Cambiar el estado de un partido

```http
PATCH /admin/matches/{matchId}/status
```

Solicitud:

```json
{
  "status": "CONFIRMED"
}
```

Valores aceptados para esta operación:

| Estado actual | Estado solicitado | Condición |
| --- | --- | --- |
| `OPEN` | `COMPLETED` | El partido tiene exactamente cuatro jugadores. |
| `COMPLETED` | `CONFIRMED` | El partido ha alcanzado previamente `COMPLETED`. |
| `COMPLETED` | `CANCELLED` | El partido ha alcanzado previamente `COMPLETED`. |

Las demás transiciones manuales no están permitidas. La transición automática a `COMPLETED` al inscribir al cuarto jugador y el retorno automático a `OPEN` al desinscribir están descritos en las reglas anteriores.

Respuesta `200 OK`: objeto `Match` actualizado.

### Eliminar un partido

```http
DELETE /admin/matches/{matchId}
```

Elimina el partido en cualquier estado.

Respuesta `204 No Content`. Responde `404 Not Found` si no existe.

## 5. Validación y errores

Las respuestas de error conservan el formato común de la API:

```json
{
  "code": "ERROR_CODE",
  "message": "Descripción del error"
}
```

- `400 Bad Request`: fecha, estado o cuerpo inválido.
- `401 Unauthorized`: falta autenticación válida.
- `403 Forbidden`: el usuario autenticado no es administrador.
- `404 Not Found`: no existe el partido, el jugador o la inscripción solicitada.
- `409 Conflict`: jugador duplicado, partido lleno o transición de estado no permitida; también al intentar completar con menos de cuatro jugadores.

## 6. Criterios de aceptación

- Las rutas administrativas rechazan solicitudes no autenticadas y usuarios que no sean administradores.
- Un partido nuevo está `OPEN`, sin jugadores, y tiene fecha válida e identificador generado.
- El administrador puede listar todos los partidos y consultar uno por su identificador.
- No se puede inscribir más de cuatro jugadores ni repetir un jugador en el mismo partido.
- Al completar la cuarta inscripción, el partido queda `COMPLETED`.
- Solo se permiten las transiciones manuales especificadas y no se completa un partido con menos de cuatro jugadores.
- Una desinscripción administrativa devuelve el partido a `OPEN`.
- El administrador puede eliminar partidos independientemente de su estado.
