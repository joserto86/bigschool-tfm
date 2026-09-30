---
name: revision-contrato-openapi
description: 'Revisa cambios de endpoints, controladores, casos de uso o esquemas contra el contrato OpenAPI de Satispadel. Úsalo al implementar, revisar o depurar la API HTTP para detectar desajustes de rutas, payloads, respuestas, errores y reglas de negocio.'
argument-hint: 'Describe los archivos o el endpoint a revisar'
user-invocable: true
---

# Revisión Del Contrato OpenAPI

## Cuándo Usar

- Antes de implementar o revisar cambios en `src/transport/`, `src/domain/` o los tipos de la API.
- Cuando un endpoint devuelve una respuesta, código HTTP o payload inesperado.
- Para comprobar que una nueva regla de negocio está representada en el contrato.

## Fuentes De Verdad

1. Lee [el contrato OpenAPI](../../../satispadel.openapi.yaml) para rutas, métodos, parámetros, cuerpos, esquemas, respuestas y `x-business-rules`.
2. Lee [el diseño de partidos](../../../docs/0001-api-design.md) y, para autenticación, [el diseño de autenticación](../../../docs/0002-authentication-design.md).
3. Inspecciona solo la ruta, el controlador, el caso de uso y los tipos que controlan el comportamiento revisado.

Si las fuentes discrepan, informa de la discrepancia explícitamente. No cambies una fuente para hacerla coincidir con otra sin una decisión del usuario.

## Procedimiento

1. Delimita las operaciones afectadas: método y ruta, `operationId` y archivos de implementación correspondientes.
2. Comprueba el contrato de entrada: parámetros de ruta o query, obligatoriedad, nombres, tipos, formato y campos del JSON.
3. Comprueba la respuesta de éxito: estado HTTP, ausencia o presencia de cuerpo, forma del JSON y campos sensibles que no deben exponerse, incluido `passwordHash`.
4. Comprueba cada respuesta de error: los controladores deben conservar `{ code, message }`, los estados HTTP declarados y el mapeo de errores de dominio.
5. Comprueba las reglas de negocio asociadas. Para partidos, verifica en particular los cuatro jugadores, unicidad por partido, transición `OPEN -> COMPLETED`, confirmación o rechazo y restricciones de baja.
6. Para autenticación, verifica las rutas y payloads contra el diseño de autenticación y evita aceptar o devolver contraseñas hasheadas fuera de los flujos previstos.
7. Revisa los tests cercanos como evidencia del comportamiento actual. No modifiques `src/tests/` salvo que el usuario lo pida.
8. Informa los hallazgos por severidad con: operación afectada, contrato esperado, comportamiento observado, archivo responsable y cambio mínimo recomendado.

## Criterios De Cierre

Una operación está alineada cuando:

- La ruta y el método coinciden con `satispadel.openapi.yaml`.
- Las entradas y salidas coinciden con sus esquemas y códigos HTTP declarados.
- Los errores conservan `code` y `message`.
- Las reglas de negocio y las transiciones de estado descritas en la documentación se respetan.
- No se filtran hashes de contraseña en respuestas de la API.

## Límites

- Esta habilidad es de revisión; no modifica código, el contrato ni las pruebas a menos que el usuario solicite expresamente una implementación.
- Para cambios de API, propone actualizar de forma coherente la implementación, el contrato y la documentación afectada, pero pide confirmación antes de editar.
