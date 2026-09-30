---
name: "Pruebas Vitest"
description: "Use when writing, updating, or reviewing Vitest and Supertest API tests in src/tests. Covers isolated app fixtures, JWT environment setup, HTTP assertions, and test scope."
applyTo: "src/tests/**/*.test.ts"
---

# Pruebas Vitest

- Escribe pruebas de integración HTTP con Vitest, Supertest y `createApp()` de `src/app.ts`; crea una aplicación nueva en `beforeEach` para aislar el estado en memoria.
- Construye escenarios mediante solicitudes HTTP públicas. No accedas a repositorios internos ni a casos de uso para preparar el estado de una prueba de ruta.
- Agrupa pruebas por recurso y operación, con `describe("METHOD /ruta")`, y usa nombres de caso que describan el resultado observable.
- Para respuestas de éxito, comprueba el estado HTTP y el contrato relevante. Usa `toMatchObject` para campos estables y aserciones específicas para valores calculados o identificadores.
- Para respuestas de error, comprueba el estado y el formato `{ code, message }`; verifica códigos concretos cuando formen parte del contrato.
- Si una prueba necesita firmar o verificar tokens, usa `vi.stubEnv("JWT_SECRET", value)` antes de crear la app que emitirá el token y ejecuta `vi.unstubAllEnvs()` en `afterEach`.
- Mantén los casos independientes: no compartas aplicaciones, partidos, tokens ni estado mutable entre `it`.
- Sigue [AGENTS.md](../../AGENTS.md) para la política de modificación y ejecución de pruebas. Añade o modifica tests solo cuando la solicitud lo autorice explícitamente.
