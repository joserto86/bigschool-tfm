# Diseño de persistencia con PostgreSQL

## 1. Objetivo

Migrar la capa de persistencia actual en memoria a PostgreSQL manteniendo intacta la lógica de dominio y los casos de uso de la API. La solución debe:

- preservar las interfaces de repositorio actuales,
- permitir cambiar la implementación sin tocar controladores ni casos de uso,
- mantener la compatibilidad con la estructura actual en memoria cuando no exista configuración de base de datos,
- preparar la capa para migraciones y despliegues reproducibles,
- proteger datos sensibles como contraseñas y refresh tokens.

## 2. Estado actual

La aplicación define repositorios en dos áreas:

- `src/persistence/Auth/`
- `src/persistence/Match/`

Las interfaces existentes son:

- `IAuthRepository`
- `IMatchRepository`

Además, `src/app.ts` crea directamente instancias de `InMemoryAuthRepository` y `InMemoryMatchRepository` para todos los endpoints. Esta decisión es válida para desarrollo local, pero no es adecuada para entorno real ni para concurrencia, persistencia, auditoría ni observabilidad.

Los repositorios actuales exponen operaciones síncronas y en memoria; la migración debe pasar a una implementación asíncrona compatible con el patrón Express + TypeScript del proyecto.

## 3. Principios de diseño

### 3.1. Separación de responsabilidades

La persistencia debe vivir exclusivamente en la capa de repositorio. Los casos de uso y los controladores no deben conocer detalles de SQL, Prisma ni de PostgreSQL.

### 3.2. Supervisión de configuración

La elección de la implementación será por configuración de entorno:

- si `DATABASE_URL` está definido, la aplicación usará PostgreSQL/Prisma,
- si no está definido, la aplicación seguirá usando los repositorios en memoria.

Esto permite mantener una experiencia local simple y un despliegue real basado en base de datos.

### 3.3. Compatibilidad con el diseño actual

El diseño propuesto no cambia:

- la estructura de `Player`,
- la lógica de dominios de partidos,
- la firma del middleware de autenticación,
- los endpoints HTTP,
- los errores de dominio y los códigos HTTP.

Únicamente cambia la infraestructura detrás de los repositorios.

## 4. Dependencias propuestas

Se recomienda usar Prisma como ORM para PostgreSQL. Prisma aporta:

- tipado fuerte a nivel de schema,
- migraciones versionadas,
- generación de cliente seguro,
- manejo idiomático de transacciones y consultas complejas,
- integración limpia con TypeScript.

### 4.1. Dependencias de runtime

```json
{
  "dependencies": {
    "@prisma/client": "^6.0.0",
    "dotenv": "^18.0.4",
    "express": "^5.2.1",
    "jose": "^6.2.12",
    "zod": "^4.6.5"
  }
}
```

### 4.2. Dependencias de desarrollo

```json
{
  "devDependencies": {
    "@types/express": "^5.0.6",
    "@types/node": "^22.20.3",
    "@types/supertest": "^7.2.1",
    "prisma": "^6.0.0",
    "supertest": "^7.2.2",
    "tsx": "^4.23.13",
    "ts-node": "^10.9.2",
    "typescript": "^7.0.2",
    "vitest": "^5.0.1"
  }
}
```

### 4.3. Scripts recomendados

En `package.json` se añadirían:

```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:studio": "prisma studio",
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "test": "vitest run"
  }
}
```

### 4.4. Contenedor PostgreSQL local

Para entorno de desarrollo se recomienda un servicio `postgres:16-alpine` a través de `docker-compose.yml`.

Ejemplo de configuración:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: satispadel-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: satispadel
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

Se recomienda usar `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/satispadel?schema=public` en desarrollo local.

## 5. Estructura propuesta

La capa de persistencia se organizará de la siguiente forma:

```text
src/
  infraestructure/
    database/
      prisma/
        migrations/
        schema.prisma
      prisma.ts
      prismaClient.ts
    prismaClient.ts (opcional si se prefiere encapsular la instancia)
    persistence/
      Auth/
        IAuthRepository.ts
        PrismaAuthRepository.ts
        InMemoryAuthRepository.ts
      Match/
        IMatchRepository.ts
        PrismaMatchRepository.ts
        InMemoryMatchRepository.ts
```

## 6. Patrones de implementación

### 6.1. Cliente Prisma

Se debe crear un cliente pragmático y lazy para evitar inicializar la conexión con PostgreSQL si la aplicación está funcionando en modo memoria.

Idea de diseño:

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

Esto permite centralizar la creación del cliente y decidir dinámicamente la estrategia de persistencia desde `createApp()`.

### 6.2. Elección de repositorio en `createApp()`

La composición actual debería evolucionar a algo como esto:

```ts
const databaseUrl = process.env.DATABASE_URL;

const authRepository = databaseUrl
  ? new PrismaAuthRepository(prisma)
  : new InMemoryAuthRepository();

const matchRepository = databaseUrl
  ? new PrismaMatchRepository(prisma)
  : new InMemoryMatchRepository();
```

Esto mantiene el contrato público del código y reduce el impacto en el resto de la aplicación.

## 7. Modelo de datos propuesto

### 7.1. Tabla `players`

```prisma
model Player {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String   @map("password_hash")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  refreshTokens RefreshToken[]
  matchEntries  MatchPlayer[]

  @@map("players")
}
```

### 7.2. Tabla `matches`

```prisma
model Match {
  id        String      @id @default(cuid())
  dateTime  DateTime    @map("date_time")
  status    String      @default("OPEN")
  createdAt DateTime    @default(now()) @map("created_at")
  updatedAt DateTime    @updatedAt @map("updated_at")

  players   MatchPlayer[]

  @@map("matches")
}
```

### 7.3. Tabla `match_players`

```prisma
model MatchPlayer {
  id        String   @id @default(cuid())
  matchId   String   @map("match_id")
  playerId  String   @map("player_id")
  slot      Int
  createdAt DateTime @default(now()) @map("created_at")

  match     Match  @relation(fields: [matchId], references: [id], onDelete: Cascade)
  player    Player @relation(fields: [playerId], references: [id], onDelete: Cascade)

  @@unique([matchId, playerId])
  @@unique([matchId, slot])
  @@map("match_players")
}
```

### 7.4. Tabla `refresh_tokens`

```prisma
model RefreshToken {
  id        String   @id @default(cuid())
  tokenHash String   @unique @map("token_hash")
  playerId  String   @map("player_id")
  familyId  String   @map("family_id")
  expiresAt DateTime @map("expires_at")
  revoked   Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")

  player    Player @relation(fields: [playerId], references: [id], onDelete: Cascade)

  @@index([playerId])
  @@index([expiresAt])
  @@map("refresh_tokens")
}
```

## 8. Mapeo de repositorios

### 8.1. `PrismaAuthRepository`

Debe implementar `IAuthRepository` con la semántica actual:

- `findUserByEmail(email)` -> buscar jugador con email
- `findUserById(playerId)` -> buscar jugador por id
- `updatePasswordHash(playerId, passwordHash)` -> actualizar hash
- `saveRefreshToken(record)` -> guardar refresh token con hash y metadata
- `findRefreshTokenByHash(tokenHash)` -> localizar token por hash
- `rotateRefreshToken(presentedTokenHash, replacement, now)` -> rotar de forma atómica
- `revokeActiveRefreshTokens(playerId)` -> invalidar tokens activos del usuario

Se recomienda usar transacciones para cualquier operación que combine lectura y escritura, especialmente en la rotación del refresh token.

### 8.2. `PrismaMatchRepository`

Debe implementar `IMatchRepository` con las operaciones actuales:

- `create(match)`
- `findByDateTime(dateTime)`
- `findById(matchId)`
- `deleteById(matchId)`

Además, dado que el modelo de partidos implica inscripciones por jugador y slot, se recomienda envolver la creación del partido y sus jugadores en una transacción. La lógica de negocio del dominio puede seguir siendo la misma; la diferencia es que la carga de datos y las actualizaciones se ejecutan contra postgres.

## 9. Integridad, consistencia y reglas de negocio

### 9.1. Restricciones a nivel base de datos

Se recomienda reforzar, además de la lógica de dominio, las siguientes restricciones:

- `UNIQUE (email)` en `players`
- `UNIQUE (match_id, player_id)` en `match_players`
- `UNIQUE (match_id, slot)` en `match_players`
- `CHECK (status IN ('OPEN', 'COMPLETED', 'CONFIRMED', 'CANCELLED'))` en `matches`
- `CHECK (slot BETWEEN 1 AND 4)` en `match_players`
- `CHECK (expires_at > created_at)` en `refresh_tokens`

Estas restricciones evitan errores de escritura y refuerzan la consistencia even si la lógica de negocio se rompe.

### 9.2. Evitar errores de concurrencia

La API puede recibir varias peticiones al mismo tiempo sobre el mismo partido o usuario. Para ello:

- usar transacciones en operaciones críticas,
- bloquear filas relevantes si se requiere consistencia fuerte,
- validar antes de crear o inscribir al jugador,
- mantener la lógica de negocio en los casos de uso, no en SQL.

## 10. Variables de entorno

Se necesita un conjunto mínimo de variables para producción y desarrollo:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/satispadel?schema=public
JWT_SECRET=supersecreto_minimo_32_bytes
JWT_ISSUER=satispadel-api
JWT_AUDIENCE=satispadel-clients
ACCESS_TOKEN_EXPIRES_IN=900
REFRESH_TOKEN_EXPIRES_IN_SECONDS=604800
```

Nota: `JWT_SECRET` debe mantenerse fuera del código fuente y no ser un valor fijo en producción; se recomienda administrarlo mediante variables de entorno o un gestor de secretos.

## 11. Plan de migración recomendado

1. Añadir dependencias de Prisma y PostgreSQL local.
2. Definir el schema de datos y generar el cliente con `prisma generate`.
3. Crear `docker-compose.yml` para PostgreSQL de desarrollo.
4. Añadir las variables de entorno al archivo `.env.example` y a la configuración del entorno real.
5. Implementar `PrismaAuthRepository` manteniendo el contrato `IAuthRepository`.
6. Implementar `PrismaMatchRepository` manteniendo el contrato `IMatchRepository`.
7. Actualizar `src/app.ts` para elegir la implementación según `DATABASE_URL`.
8. Ejecutar migraciones con `prisma migrate dev` o `prisma migrate deploy`.
9. Validar que la API mantiene el mismo comportamiento que en memoria.
10. Añadir pruebas de integración para cubrir escritura, lectura y concurrencia básica.

## 12. Riesgos y mitigaciones

### Riesgo 1: cambio de comportamiento entre repositorios
Mitigación: mantener los repositorios detrás de una misma interfaz y validar con pruebas de integración.

### Riesgo 2: fallos de concurrencia
Mitigación: usar transacciones y restricciones únicas en la base de datos.

### Riesgo 3: rotación de refresh tokens insegura
Mitigación: almacenar solo hashes y mantener `familyId`, expiración y revocación.

### Riesgo 4: fuga de credenciales
Mitigación: no devolver `passwordHash` ni secretos en respuestas HTTP y no loguear valores sensibles.

## 13. Criterios de aceptación

La implementación de PostgreSQL se considerará correcta si:

- la API funciona con base de datos PostgreSQL cuando `DATABASE_URL` está presente,
- la API sigue funcionando con persistencia en memoria cuando no hay base de datos configurada,
- los repositorios mantienen las mismas interfaces y contratos del dominio,
- los datos críticos quedan protegidos mediante hashes y restricciones SQL,
- las migraciones pueden ejecutarse en entornos locales y de despliegue,
- la API conserva el formato actual de errores y el comportamiento observable de los endpoints.

## 14. Conclusión

La migración a PostgreSQL debe realizarse como una evolución de la infraestructura, no como un cambio de la lógica de negocio. El diseño propuesto mantiene el acoplamiento correcto entre capas, preserva la API y prepara la aplicación para un entorno de producción con almacenamiento persistente, transacciones y mayor fiabilidad.
