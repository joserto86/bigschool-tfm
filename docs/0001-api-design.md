# Diseño de API REST — Gestión de partidos de pádel

## 1. Objetivo

Diseñar una API REST para gestionar partidos de un club privado de pádel, cubriendo exclusivamente:

* Creación de partidos.
* Inscripción y desinscripción de jugadores.
* Máximo de 4 jugadores por partido.
* Un jugador no puede inscribirse dos veces en el mismo partido.
* Varios partidos pueden existir a la misma fecha y hora.
* Asignación automática del siguiente hueco libre.
* Gestión del ciclo de vida del partido.
* Confirmación o rechazo de los jugadores una vez completado.
* Protección de partidos completados o confirmados frente a modificaciones.

---

# 2. Conceptos principales

## Jugador

Identificado de forma única mediante `playerId`.

## Partido

Entidad que representa un partido programado en una fecha y hora determinadas.

Atributos mínimos:

```text
matchId
dateTime
status
players[]
createdAt
updatedAt
```

`matchId` es el identificador único del partido.

La combinación `dateTime` **no es única**.

Por ejemplo, puede existir:

```text
Match A -> 2026-10-10 18:00
Match B -> 2026-10-10 18:00
Match C -> 2026-10-10 18:00
```

---

# 3. Estados del partido

Se propone el siguiente conjunto de estados:

```text
OPEN
COMPLETED
CONFIRMED
CANCELLED
```

## Máquina de estados

```text
                  +-------------+
                  |     OPEN    |
                  +-------------+
                    |         |
           4 jugadores         |
                    |         |
                    v         | último jugador
             +-------------+   | se desinscribe
             |  COMPLETED  |   |
             +-------------+   |
                |       |       |
       todos    |       |       |
     confirman  |       |       |
                v       v       v
        +-----------+ +-----------+
        | CONFIRMED | | CANCELLED |
        +-----------+ +-----------+
```

Transiciones permitidas:

| Estado actual | Evento                         | Estado siguiente  |
| ------------- | ------------------------------ | ----------------- |
| creado        | Creación del partido           | `OPEN`            |
| `OPEN`        | Se alcanza 4 jugadores         | `COMPLETED`       |
| `OPEN`        | Último jugador se desinscribe  | Partido eliminado |
| `COMPLETED`   | Los 4 jugadores confirman      | `CONFIRMED`       |
| `COMPLETED`   | Un jugador rechaza/no confirma | `CANCELLED`       |
| `CONFIRMED`   | Cualquier modificación         | No permitido      |

### Nota sobre el estado inicial

El partido se crea explícitamente mediante la API y nace en estado:

```text
OPEN
```

Por tanto, la regla anterior de "el primer jugador crea el partido" deja de ser necesaria como mecanismo de creación.

El primer jugador simplemente se inscribe en un partido que ya existe y está `OPEN`.

Esto además evita ambigüedad cuando existen varios partidos a la misma fecha y hora.

---

# 4. Reglas de negocio

## RN-01 — Máximo 4 jugadores

Un partido no puede tener más de 4 jugadores:

```text
0 <= players <= 4
```

En el momento en que se alcanza el cuarto jugador:

```text
OPEN -> COMPLETED
```

---

## RN-02 — Un jugador sólo puede aparecer una vez

La combinación:

```text
(matchId, playerId)
```

debe ser única.

Se recomienda garantizarlo también en base de datos:

```sql
UNIQUE(match_id, player_id)
```

---

## RN-03 — Creación explícita del partido

La creación del partido se realiza mediante:

```http
POST /matches
```

El cliente proporciona al menos la fecha y hora.

Ejemplo:

```json
{
  "dateTime": "2026-10-10T18:00:00+02:00"
}
```

La API genera:

```text
matchId
status = OPEN
```

No existe ninguna restricción que impida crear varios partidos con el mismo `dateTime`.

---

## RN-04 — Varios partidos pueden compartir fecha y hora

La siguiente situación es válida:

```text
2026-10-10T18:00
    ├── Match 101
    ├── Match 102
    └── Match 103
```

Por tanto, **no debe existir**:

```sql
UNIQUE(date_time)
```

en la tabla de partidos.

El `matchId` es quien identifica inequívocamente un partido.

---

## RN-05 — Inscripción mediante `matchId`

Dado que puede haber varios partidos a la misma hora, un jugador debe indicar explícitamente a qué partido quiere apuntarse.

```http
POST /matches/{matchId}/players
```

El servidor:

1. Comprueba que el partido existe.
2. Comprueba que está `OPEN`.
3. Comprueba que el jugador no está ya inscrito.
4. Busca el siguiente hueco libre.
5. Inscribe al jugador.
6. Si pasa a 4 jugadores, cambia el estado a `COMPLETED`.

---

## RN-06 — Asignación automática del siguiente hueco

El cliente no especifica el `slot`.

El servidor determina automáticamente el primer hueco disponible.

Ejemplo:

```text
slot 1 -> Player A
slot 2 -> Player B
slot 3 -> libre
slot 4 -> Player D
```

El siguiente jugador recibe:

```text
slot 3
```

Se recomienda mantener:

```text
slot ∈ {1,2,3,4}
```

---

## RN-07 — Cuatro jugadores implican partido completado

Cuando se registra el cuarto jugador:

```text
OPEN -> COMPLETED
```

La transición debe realizarse en la misma transacción que la inscripción.

---

## RN-08 — Confirmación individual

Cuando un partido está `COMPLETED`, cada jugador debe confirmar o rechazar.

Cada inscripción puede tener:

```text
PENDING
CONFIRMED
DECLINED
```

Estado inicial al completar el partido:

```text
PENDING
PENDING
PENDING
PENDING
```

---

## RN-09 — Un rechazo cancela el partido

Si cualquiera de los cuatro jugadores rechaza el partido:

```text
COMPLETED -> CANCELLED
```

No es necesario esperar la respuesta de los otros jugadores.

---

## RN-10 — Cuatro confirmaciones confirman el partido

Cuando los cuatro jugadores han confirmado:

```text
COMPLETED -> CONFIRMED
```

El partido queda confirmado.

---

## RN-11 — Desinscripción

Un jugador puede desinscribirse únicamente si el partido está:

```text
OPEN
```

No puede desinscribirse de:

```text
COMPLETED
CONFIRMED
```

### Último jugador

Si el jugador era el único inscrito:

```text
OPEN
  |
  | DELETE player
  v
eliminar partido
```

Por tanto, no se permite que un partido sobreviva sin jugadores como consecuencia de una desinscripción.

---

## RN-12 — Partido confirmado inmutable

Un partido `CONFIRMED` no puede editarse.

Esto incluye, como mínimo:

* Fecha/hora.
* Jugadores.
* Estado.
* Cualquier otro dato funcional del partido que se incorpore posteriormente.

---

# 5. Modelo de datos

## Tabla `matches`

```text
matches
-------
id              PK
date_time       NOT NULL
status          NOT NULL
created_at      NOT NULL
updated_at      NOT NULL
```

Importante:

```text
NO UNIQUE(date_time)
```

Puede haber múltiples registros con la misma fecha/hora.

---

## Tabla `match_players`

```text
match_players
-------------
match_id        FK -> matches.id
player_id       FK -> players.id
slot            NOT NULL
confirmation    NOT NULL
created_at      NOT NULL

PK(match_id, player_id)
UNIQUE(match_id, slot)
```

Valores de `confirmation`:

```text
PENDING
CONFIRMED
DECLINED
```

---

# 6. Endpoints

## 6.1 Crear partido

```http
POST /matches
```

Body:

```json
{
  "dateTime": "2026-10-10T18:00:00+02:00"
}
```

Respuesta:

```http
201 Created
```

```json
{
  "id": "match-123",
  "dateTime": "2026-10-10T18:00:00+02:00",
  "status": "OPEN",
  "players": []
}
```

No se comprueba que ya exista otro partido con esa fecha/hora.

Por ejemplo, ambas peticiones son válidas:

```text
POST /matches
dateTime = 2026-10-10T18:00

POST /matches
dateTime = 2026-10-10T18:00
```

y generan dos `matchId` diferentes.

---

## 6.2 Consultar partido

```http
GET /matches/{matchId}
```

Ejemplo de respuesta:

```json
{
  "id": "match-123",
  "dateTime": "2026-10-10T18:00:00+02:00",
  "status": "OPEN",
  "players": [
    {
      "playerId": "player-1",
      "slot": 1
    },
    {
      "playerId": "player-2",
      "slot": 2
    }
  ]
}
```

---

## 6.3 Consultar partidos por fecha/hora

Dado que puede haber múltiples partidos en el mismo horario, resulta necesario poder recuperarlos:

```http
GET /matches?dateTime=2026-10-10T18:00:00+02:00
```

Respuesta:

```json
{
  "items": [
    {
      "id": "match-101",
      "dateTime": "2026-10-10T18:00:00+02:00",
      "status": "OPEN"
    },
    {
      "id": "match-102",
      "dateTime": "2026-10-10T18:00:00+02:00",
      "status": "OPEN"
    }
  ]
}
```

Esto permite que un usuario seleccione posteriormente el `matchId` al que quiere inscribirse.

---

## 6.4 Inscribir jugador

```http
POST /matches/{matchId}/players
```

Body:

```json
{
  "playerId": "player-2"
}
```

Respuesta:

```http
201 Created
```

```json
{
  "matchId": "match-123",
  "playerId": "player-2",
  "slot": 2,
  "matchStatus": "OPEN"
}
```

Si es el cuarto jugador:

```json
{
  "matchId": "match-123",
  "playerId": "player-4",
  "slot": 4,
  "matchStatus": "COMPLETED"
}
```

---

## 6.5 Desinscribir jugador

```http
DELETE /matches/{matchId}/players/{playerId}
```

Respuesta:

```http
204 No Content
```

Sólo permitido cuando el partido está `OPEN`.

Si es el último jugador, se elimina también el partido.

---

## 6.6 Confirmar o rechazar partido

```http
POST /matches/{matchId}/confirmation
```

Body para confirmar:

```json
{
  "playerId": "player-1",
  "decision": "CONFIRMED"
}
```

Body para rechazar:

```json
{
  "playerId": "player-1",
  "decision": "DECLINED"
}
```

Comportamiento:

```text
COMPLETED + DECLINED
    -> CANCELLED

COMPLETED + 4 CONFIRMED
    -> CONFIRMED
```

---

# 7. API mínima

Con estos cambios, la API mínima queda:

```http
POST   /matches
GET    /matches/{matchId}
GET    /matches?dateTime={dateTime}

POST   /matches/{matchId}/players
DELETE /matches/{matchId}/players/{playerId}

POST   /matches/{matchId}/confirmation
```

No es necesario exponer un endpoint específico para cambiar el estado del partido.

Los estados se derivan de las operaciones de negocio:

```text
Create match
    -> OPEN

Add 4th player
    -> COMPLETED

Player declines
    -> CANCELLED

4 players confirm
    -> CONFIRMED
```

---

# 8. Concurrencia

La concurrencia sigue siendo especialmente relevante en la inscripción de jugadores.

Supongamos que el partido tiene:

```text
Player 1
Player 2
Player 3
slot 4 -> libre
```

y dos peticiones simultáneas intentan ocupar el cuarto hueco.

La operación de inscripción debe ser transaccional:

```text
BEGIN TRANSACTION

1. Obtener partido
2. Bloquear partido para escritura
3. Comprobar status = OPEN
4. Comprobar que el jugador no está inscrito
5. Obtener primer slot libre
6. Insertar jugador
7. Si players = 4:
       status = COMPLETED
8. COMMIT
```

Además:

```sql
UNIQUE(match_id, player_id)
UNIQUE(match_id, slot)
```

deben existir en base de datos.

La eliminación del último jugador debe ejecutarse también de forma transaccional para evitar inconsistencias entre `matches` y `match_players`.

---

# 9. Autorización

En una implementación real, el `playerId` debería preferiblemente obtenerse de la identidad autenticada en lugar de confiar en el valor enviado por el cliente.

Por ejemplo:

```http
POST /matches/{matchId}/players
```

podría no necesitar body:

```text
Usuario autenticado
      |
      v
playerId
      |
      v
Inscripción
```

Lo mismo aplica a la confirmación.

Esto evita que un jugador pueda operar en nombre de otro.

---

# 10. Resumen de decisiones

| Necesidad                             | Solución                              |
| ------------------------------------- | ------------------------------------- |
| Crear partidos                        | `POST /matches`                       |
| Varios partidos a la misma fecha/hora | Permitido                             |
| Identificación del partido            | `matchId`                             |
| Máximo 4 jugadores                    | Slots `1..4`                          |
| Evitar duplicados                     | `UNIQUE(match_id, player_id)`         |
| Siguiente hueco libre                 | Asignación automática en servidor     |
| 4 jugadores                           | `OPEN -> COMPLETED`                   |
| Confirmación individual               | `PENDING / CONFIRMED / DECLINED`      |
| Un rechazo                            | `COMPLETED -> CANCELLED`              |
| Cuatro confirmaciones                 | `COMPLETED -> CONFIRMED`              |
| Desinscripción                        | Sólo en `OPEN`                        |
| Último jugador se va                  | El partido se elimina                 |
| Partido confirmado                    | Inmutable                             |
| Concurrencia                          | Transacciones + bloqueo + constraints |

---

# 11. Arquitectura recomendada

La lógica de negocio debería permanecer fuera del controlador HTTP:

```text
                REST Controller
                       |
                       v
              Application Service
                       |
                       v
                  Domain Model
                       |
                       v
                   Repository
                       |
                       v
                    Database
```

Casos de uso principales:

```text
CreateMatch
JoinMatch
LeaveMatch
ConfirmMatch
DeclineMatch
GetMatch
GetMatchesByDateTime
```

Cada caso de uso encapsula sus correspondientes reglas de negocio.

Por ejemplo:

```text
JoinMatch
    |
    +-- Match exists?
    +-- Match is OPEN?
    +-- Player already exists?
    +-- Slot available?
    +-- Assign next slot
    +-- Add player
    +-- 4 players?
           |
           +-- yes -> COMPLETED
```

Este enfoque mantiene la máquina de estados y las reglas de negocio centralizadas, independientemente de que el día de mañana exista otra interfaz además de REST.
