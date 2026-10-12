# Diseño del comando para crear un usuario administrador

## 1. Objetivo y alcance

Añadir un comando de npm que ejecute un script interactivo para crear un usuario administrador en PostgreSQL. El script solicitará las credenciales en la terminal y guardará la contraseña únicamente como hash.

Este diseño no implementa el comando ni el script. No modifica endpoints ni promueve automáticamente cuentas existentes.

## 2. Estado actual

- `Player` ya contiene `email`, `passwordHash`, `isAdmin` y `active`; el esquema Prisma exige también `name`.
- El proyecto ya dispone de Prisma, `tsx` y la función `hashPassword()` basada en `scrypt`.
- El repositorio de autenticación no ofrece actualmente una operación para crear usuarios.
- `createApp()` no es un punto de entrada adecuado para este script: por defecto configura repositorios en memoria. El comando debe conectarse directamente a Prisma y exigir `DATABASE_URL`.

## 3. Necesidades y comportamiento

- Añadir un script npm —por ejemplo, `admin:create`— que ejecute `scripts/create-admin.ts` con `tsx`.
- Solicitar el correo y la contraseña de forma interactiva; ocultar la contraseña mientras se escribe y no aceptarla como argumento de línea de comandos.
- Normalizar el correo con las mismas reglas que el acceso (eliminar espacios y convertir a minúsculas), validar su formato y aplicar a la contraseña los límites existentes de 8 a 128 caracteres.
- Generar `passwordHash` mediante `hashPassword()`; nunca guardar ni mostrar la contraseña en texto plano.
- Crear el registro con `isAdmin: true` y `active: true`. Rechazar un correo ya existente sin modificar ni elevar los permisos de esa cuenta.
- Informar del resultado sin imprimir el hash. Ante configuración ausente, entrada inválida, correo duplicado o error de base de datos, finalizar con un error explícito y código de salida distinto de cero.
- Cerrar la conexión de Prisma al terminar, tanto si la operación tiene éxito como si falla.

## 4. Dependencias

Ya están disponibles `tsx`, `@prisma/client`, `zod` y la utilidad de hash del proyecto; no se requiere otra dependencia para Prisma, validación ni hashing.

Para solicitar la contraseña de forma enmascarada, se propone añadir `@inquirer/prompts` como dependencia de runtime. Alternativamente, se puede usar la API estándar de Node.js, implementando el enmascaramiento de la entrada. La primera opción evita mantener esa lógica de terminal.

## 5. Decisiones

El comando solicitará también el nombre visible, porque el modelo Prisma lo requiere y no debe inferirse del correo. Se usará `@inquirer/prompts` para ocultar la contraseña durante su entrada.

## 6. Pasos de implementación

1. Añadir `admin:create` en `package.json` para ejecutar `scripts/create-admin.ts` con `tsx`.
2. Comprobar `DATABASE_URL`, solicitar y validar nombre, correo y contraseña, normalizar el correo y rechazar cuentas existentes.
3. Delegar validación, normalización, hashing y reglas de duplicidad al caso de uso `src/domain/Admin/CreateAdminUseCase.ts`, usando una interfaz de repositorio.
4. Implementar el adaptador Prisma en `src/infrastructure/persistence/Admin/`; crear el registro como activo y administrador, y gestionar también la carrera de correo duplicado mediante la restricción única.
5. Mantener el script como capa de interacción y composición; desconectar Prisma en un bloque `finally` y mostrar errores explícitos con código de salida distinto de cero.
6. Verificar con pruebas de caso de uso y una base de datos de desarrollo la creación, la contraseña enmascarada, los duplicados, datos inválidos y fallos de conexión. No usar credenciales reales en las pruebas.
