# PROMPT 2.0 — SATISPADEL
## Aplicación web para la gestión de partidos de pádel de un club privado

Actúa como un equipo sénior formado por especialistas en UX/UI, diseño de producto, arquitectura frontend, React, TypeScript e integración de APIs REST.

Quiero desarrollar la aplicación web de **Satispadel**, un club privado de pádel. La aplicación permitirá a los socios consultar partidos disponibles, crear partidos en horarios predefinidos, apuntarse a ellos, gestionar sus confirmaciones y consultar su actividad.

La experiencia debe estar inspirada funcionalmente en Playtomic, especialmente en la forma de seleccionar una fecha y consultar disponibilidad, pero debe tener una identidad visual propia, coherente con la marca Satispadel.

El resultado debe ser una aplicación profesional, atractiva, intuitiva, responsive y preparada para integrarse con la API existente.

---

# 1. OBJETIVO Y ALCANCE

Desarrolla exclusivamente el frontend de la aplicación.

**Existe una API backend y un sistema de autenticación propios. No debes crear un backend nuevo, sustituir la API, introducir una base de datos paralela ni implementar un sistema de autenticación alternativo.**

Debes:

- Integrarte con la API existente.
- Analizar el contrato OpenAPI proporcionado.
- Mantener los endpoints y modelos existentes siempre que sea posible.
- Proponer y contemplar las ampliaciones necesarias de la API para satisfacer los requisitos funcionales.
- Actualizar o proponer la correspondiente especificación OpenAPI para las nuevas funcionalidades.
- Implementar el frontend utilizando los contratos reales de la API.
- Evitar inventar endpoints y asumir que una funcionalidad está implementada cuando todavía no lo está.

La API será la fuente de verdad para los datos, los permisos, las inscripciones, las confirmaciones y las reglas de negocio.

**Prioridad principal:** que la aplicación funcione de acuerdo con las reglas de negocio descritas en este documento, aunque para ello sea necesario evolucionar la API actual.

---

# 2. TECNOLOGÍAS Y ARQUITECTURA FRONTEND

Utiliza preferentemente:

- React.
- TypeScript.
- Tailwind CSS.
- Componentes reutilizables y modulares.
- Arquitectura organizada por funcionalidades.
- Diseño responsive y enfoque mobile-first.

Adapta estas tecnologías al entorno de desarrollo disponible, sin introducir migraciones innecesarias.

La arquitectura debe separar claramente:

1. Componentes visuales.
2. Páginas y vistas.
3. Lógica de negocio del frontend.
4. Estado de la aplicación.
5. Servicios de comunicación con la API.
6. Tipos e interfaces TypeScript.
7. Configuración y variables de entorno.

Crea un cliente HTTP centralizado que gestione:

- URL base de la API mediante variable de entorno.
- Cabeceras comunes.
- Autenticación mediante Bearer Token.
- Renovación del token utilizando el mecanismo existente.
- Gestión de errores HTTP.
- Tratamiento de sesiones caducadas.
- Estados de carga.
- Respuestas vacías.
- Mensajes de error comprensibles para el usuario.

No distribuyas llamadas HTTP directamente por los componentes.

Utiliza los modelos de la especificación OpenAPI como referencia para definir los tipos TypeScript.

No dupliques innecesariamente modelos ni inventes propiedades que no existan en el contrato acordado.

---

# 3. IDENTIDAD VISUAL DE SATISPADEL

La aplicación debe respetar la identidad visual de Satispadel.

Referencia de marca:
https://satispadel.es/

## Recursos proporcionados

Se ha proporcionado el archivo:

`satispadel-icon.svg`

Debes utilizar este archivo como recurso de marca.

Requisitos:

- Utiliza el SVG original.
- No redibujes el logotipo.
- No sustituyas el logotipo por una imagen genérica.
- No utilices un logotipo encontrado mediante búsquedas externas.
- Respeta sus proporciones.
- No deformes ni recortes el símbolo.

El color de tinta observado en el SVG es `#211915`. Utilízalo como referencia inicial para el tratamiento del logotipo, sin asumir que representa por sí solo toda la paleta corporativa.

## Tipografía

Utiliza:

`Inter, ui-sans-serif`

Mantén una jerarquía tipográfica clara:

- Títulos principales con personalidad.
- Subtítulos discretos.
- Texto de interfaz muy legible.
- Etiquetas y metadatos compactos.
- Botones con buena presencia y legibilidad.

## Personalidad de marca

La aplicación debe transmitir:

- Exclusividad.
- Cercanía.
- Diversión.
- Deporte.
- Comunidad.
- Profesionalidad.

No debe parecer una aplicación deportiva genérica ni un panel administrativo convencional.

## Temas visuales

Implementa dos temas:

- Claro, como tema predeterminado.
- Oscuro.

El usuario podrá seleccionar su preferencia desde su perfil.

La selección debe persistir entre sesiones, utilizando el mecanismo apropiado del frontend.

Los dos temas deben mantener contraste, legibilidad y coherencia con la identidad de marca.

---

# 4. TIPOS DE USUARIO Y PERMISOS

Existen dos perfiles diferenciados.

## 4.1. Socio

El socio puede:

- Iniciar sesión.
- Consultar los partidos disponibles.
- Consultar el calendario de los próximos siete días.
- Cambiar entre vista de calendario y vista de lista.
- Crear un partido en una franja horaria disponible.
- Inscribirse en un partido.
- Confirmar o rechazar su participación cuando corresponda.
- Consultar los jugadores inscritos.
- Consultar el estado de confirmación de cada jugador.
- Consultar sus propios partidos.
- Consultar su historial cuando la API lo permita.
- Recibir notificaciones.
- Consultar y editar su perfil.
- Cambiar el tema visual.

El socio NO puede:

- Modificar un partido ya creado.
- Cambiar la fecha u hora de un partido existente.
- Modificar el lugar de un partido.
- Gestionar las franjas horarias generales del club.
- Reactivar por su cuenta un partido completo.
- Modificar los datos de otros socios.
- Confirmar administrativamente un partido.

**Importante:** aunque un socio haya creado un partido, no adquiere permisos especiales sobre él. Solamente el administrador puede editar partidos existentes.

## 4.2. Administrador

El administrador dispone de un entorno independiente de gestión.

Puede:

- Crear partidos.
- Consultar todos los partidos.
- Editar partidos existentes.
- Cancelar partidos.
- Gestionar las inscripciones cuando la API lo permita.
- Reactivar partidos completos.
- Asignar y confirmar el lugar del partido.
- Gestionar socios.
- Consultar la actividad del club.
- Gestionar las franjas horarias predefinidas.
- Configurar las opciones de notificaciones cuando estén soportadas por la API.

La interfaz administrativa debe estar orientada a la gestión eficiente del negocio.

Debe utilizar tablas, filtros, indicadores, formularios y acciones rápidas.

No debe ser simplemente una copia de la interfaz de socios con botones adicionales.

---

# 5. NAVEGACIÓN DE LA APLICACIÓN DE SOCIOS

La navegación principal de socios debe contener exactamente tres opciones:

1. Inicio.
2. Mis partidos.
3. Mi perfil.

No añadas una cuarta opción de navegación principal.

La acción de crear un partido debe estar integrada dentro de Inicio mediante un botón destacado.

En dispositivos móviles utiliza una navegación inferior clara y cómoda.

En escritorio puede utilizarse una navegación superior o lateral, manteniendo siempre las tres secciones.

El área administrativa debe disponer de su propia navegación, separada de la navegación de socios.

---

# 6. PANTALLA DE ACCESO

Diseña una pantalla de inicio de sesión que respete la identidad visual de Satispadel.

Debe incluir:

- Logotipo.
- Campo de correo electrónico.
- Campo de contraseña.
- Botón de acceso.
- Indicador de carga.
- Mensajes de error claros.
- Estado de credenciales incorrectas.
- Tratamiento de sesión caducada.

La autenticación debe conectarse con la API existente.

El contrato actual contempla:

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/password`

Utiliza el sistema de tokens y renovación existente.

No implementes autenticación mediante Supabase, Firebase u otros proveedores.

No sustituyas el login actual por uno ficticio.

---

# 7. PANTALLA PRINCIPAL: INICIO

Esta es la pantalla más importante de la aplicación.

Debe estar inspirada en la experiencia de Playtomic al entrar en un club y consultar la disponibilidad de pistas o partidos.

**No quiero un dashboard genérico con estadísticas y tarjetas sin contexto. Quiero que el socio pueda entrar y consultar rápidamente qué partidos puede jugar.**

## 7.1. Selector de fechas

En la parte superior debe aparecer un selector horizontal de fechas.

Debe mostrar:

- Hoy.
- Los seis días siguientes.

Es decir, siete días en total.

Cada fecha debe mostrar:

- Día de la semana.
- Número del día.
- Indicador visual de selección.

Por defecto debe estar seleccionada la fecha actual.

El selector debe permitir desplazarse horizontalmente en móvil.

Cuando el usuario seleccione una fecha, deben actualizarse los partidos y las franjas horarias correspondientes a ese día.

## 7.2. Selector de vista

Incluye dos modos de visualización:

- Vista de calendario.
- Vista de lista.

El usuario debe poder alternar entre ambos.

La vista seleccionada debe conservarse mientras navega por la pantalla.

## 7.3. Consulta de partidos

La pantalla debe mostrar las oportunidades de juego correspondientes a la fecha seleccionada.

Cada partido debe presentarse en una tarjeta visual atractiva y compacta.

La tarjeta debe incluir:

- Hora de inicio.
- Fecha.
- Lugar, cuando esté asignado.
- Número de jugadores inscritos.
- Capacidad máxima de cuatro jugadores.
- Representación visual de las cuatro plazas.
- Avatares de los jugadores inscritos, cuando existan.
- Plazas libres.
- Estado del partido.
- Estado de las confirmaciones.
- Acción disponible para el socio.

Ejemplo conceptual de una tarjeta:

**18:00 h**

Partido de pádel

Jugadores:
- Avatar del jugador 1.
- Avatar del jugador 2.
- Plaza libre.
- Plaza libre.

Indicador: 2/4 jugadores.

Estado: Abierto.

Acción: Apuntarme.

No muestres información ficticia como si procediera de la API.

Si faltan datos, representa correctamente su ausencia.

## 7.4. Acción de crear partido

Incluye un botón destacado:

**+ Crear partido**

Al pulsarlo, abre un formulario o modal para seleccionar una franja horaria disponible.

El socio solamente puede crear partidos en franjas horarias predefinidas por el administrador.

No permitas introducir una hora arbitraria.

El formulario debe mostrar únicamente las franjas válidas para la fecha seleccionada.

Cuando el socio cree el partido:

- Se crea el partido mediante la API.
- El socio queda inscrito como primer jugador.
- El partido aparece en Inicio.
- Se actualizan las plazas disponibles.
- Se evita que se creen duplicados en la misma franja si las reglas del backend lo impiden.

La API debe validar la disponibilidad y resolver posibles conflictos de concurrencia.

## 7.5. Estados visuales de los partidos

Distingue claramente los siguientes estados:

- Abierto: admite nuevas inscripciones.
- Completo: tiene cuatro jugadores y no admite nuevas inscripciones.
- Pendiente de confirmación: está completo y necesita completar el proceso de confirmación.
- Confirmado: todos los jugadores han confirmado y el administrador ha confirmado el lugar.
- Cancelado: el partido no se celebrará.
- Finalizado: el partido ya se ha celebrado.

El contrato actual contempla los estados `OPEN`, `COMPLETED`, `CONFIRMED` y `CANCELLED`.

No debes asumir que `COMPLETED` significa partido jugado. En este flujo representa el estado de partido completo, pendiente de finalizar el proceso de confirmación.

Define una correspondencia explícita entre los estados del backend y las etiquetas visuales en español.

Si es necesario ampliar el modelo de estados, hazlo de forma coherente y documentada.

---

# 8. REGLAS DE NEGOCIO DE LOS PARTIDOS

Estas reglas son obligatorias.

## 8.1. Capacidad máxima

Cada partido admite exactamente cuatro jugadores.

No se puede superar ese límite.

El backend debe validar siempre esta condición.

## 8.2. Inscripciones

Un socio puede inscribirse en un partido que tenga plazas disponibles.

Al inscribirse:

- Se registra su participación.
- Se actualiza el número de jugadores.
- Se actualizan los avatares.
- Se actualiza el estado del partido.
- Se actualiza la interfaz para todos los usuarios afectados.

## 8.3. Un socio no puede participar en dos partidos simultáneos

Un socio no puede estar inscrito en dos partidos que coincidan temporalmente.

Esta regla debe validarse en el backend.

El frontend debe mostrar un mensaje claro si la API rechaza una inscripción por conflicto horario.

No confíes únicamente en las comprobaciones del frontend.

## 8.4. Partido completo

Cuando se inscribe el cuarto jugador:

- El partido deja de admitir nuevas inscripciones.
- Se considera completo.
- Pasa al proceso de confirmación.
- Se muestra el estado de cada jugador.
- Se informa a los participantes de que deben confirmar su asistencia.

## 8.5. Confirmación individual de los jugadores

Cada jugador debe confirmar su participación.

La interfaz debe mostrar individualmente:

- Nombre del jugador.
- Avatar.
- Estado pendiente.
- Estado confirmado.

El jugador podrá confirmar o rechazar su participación mediante las acciones que soporte la API.

No confundas el rechazo de una confirmación con una simple baja voluntaria.

La API actual contempla una acción de confirmación y permite que un rechazo pueda desembocar en el estado `CANCELLED`. La interfaz debe representar ese comportamiento correctamente y no inventar un flujo diferente.

## 8.6. Confirmación administrativa del lugar

El partido no estará confirmado definitivamente hasta que se cumplan simultáneamente estas dos condiciones:

1. Los cuatro jugadores han confirmado su participación.
2. El administrador ha asignado y confirmado el lugar del partido.

El administrador es responsable de asignar el lugar.

El lugar se introduce mediante un campo de texto libre.

El socio no puede modificarlo.

El administrador no tiene que confirmar la voluntad de jugar de cada socio: esa confirmación es individual y corresponde a cada jugador.

Su intervención consiste en confirmar el lugar del partido.

Hasta que se cumplan ambas condiciones, el partido no debe mostrarse como confirmado.

Si no se cumplen, no debe considerarse que el partido puede celebrarse.

**Esta regla requiere evolucionar la lógica actual de la API**, ya que el contrato existente contempla la confirmación automática cuando los cuatro jugadores confirman. Debe añadirse la confirmación administrativa del lugar como requisito adicional.

No simules esta condición únicamente en el frontend.

## 8.7. Baja y eliminación automática

Los socios no pueden abandonar libremente un partido completo.

Si un partido está completo, el administrador debe reactivarlo antes de que se pueda modificar su composición.

Existe además esta regla específica:

Cuando cualquier jugador que no sea administrador realiza una acción sobre un partido y, como resultado, no queda ningún jugador inscrito, el partido debe eliminarse automáticamente.

Esta regla debe ejecutarse en el backend.

El frontend debe actualizar la información y retirar el partido de las vistas correspondientes cuando la API confirme su eliminación.

## 8.8. Reactivación

El administrador puede reactivar un partido completo cuando sea necesario.

Tras la reactivación:

- Se debe aplicar el estado que corresponda según el modelo de negocio.
- Se debe actualizar el número de plazas.
- Se deben recalcular las condiciones de inscripción.
- Se debe informar a los usuarios afectados cuando proceda.

El backend debe controlar la operación.

---

# 9. PANTALLA MIS PARTIDOS

Esta sección debe mostrar los partidos relacionados con el socio autenticado.

Organiza la información en bloques diferenciados:

- Próximos partidos.
- Partidos pendientes de confirmación.
- Partidos confirmados.
- Partidos cancelados.
- Historial de partidos, cuando la API disponga de los datos necesarios.

Cada partido debe mostrar:

- Fecha.
- Hora.
- Lugar.
- Jugadores.
- Estado.
- Estado de confirmación de cada jugador.
- Información relevante para el socio.
- Acciones permitidas.

Si el socio tiene pendiente confirmar su participación, debe mostrarse una llamada a la acción clara.

No permitas editar partidos desde esta sección.

La gestión de modificaciones corresponde exclusivamente al administrador.

El contrato actual dispone de `GET /api/players/matches`, que devuelve partidos futuros. Para disponer de un historial completo será necesario ampliar los filtros o incorporar la funcionalidad correspondiente en la API.

No inventes el historial mediante datos locales.

---

# 10. PANTALLA MI PERFIL

Diseña una pantalla de perfil moderna, sencilla y coherente con el resto de la aplicación.

El usuario debe poder consultar y editar:

- Nombre.
- Apellidos.
- Nombre de usuario.
- Correo electrónico.
- Teléfono.
- Preferencia de tema visual.

El perfil debe permitir gestionar la contraseña mediante el mecanismo existente de la API.

La ampliación del modelo de usuario debe contemplar estos campos:

- `firstName`
- `lastName`
- `username`
- `email`
- `phone`

Utiliza la nomenclatura definitiva que se acuerde en el contrato OpenAPI y mantén coherencia entre API y frontend.

El usuario debe poder guardar sus cambios y recibir confirmación visual.

Incluye validaciones de formularios y errores de API.

El contrato actual utiliza un campo `name` completo y dispone de `email` y `phone`. Debe evolucionarse para soportar nombre, apellidos y nombre de usuario sin perder compatibilidad innecesariamente.

La autenticación actual utiliza correo electrónico y contraseña. No cambies el mecanismo de acceso a nombre de usuario sin que se acuerde también esa modificación en la API.

---

# 11. NOTIFICACIONES

Diseña un sistema de notificaciones que permita informar al socio de los acontecimientos importantes.

Debe contemplar:

1. Un jugador se apunta a un partido.
2. Un partido alcanza cuatro jugadores.
3. El partido está pendiente de confirmación.
4. Un jugador confirma su participación.
5. Un partido queda confirmado.
6. El administrador asigna o modifica el lugar.
7. El partido se cancela.
8. Se aproxima la hora del partido.

## Canales

Contempla los tres canales:

- Notificaciones dentro de la aplicación.
- Correo electrónico.
- Notificaciones push.

## Recordatorios

La configuración debe contemplar todos los intervalos establecidos:

- 24 horas antes.
- 12 horas antes.
- 2 horas antes.
- 1 hora antes.

El diseño debe permitir administrar estos recordatorios y evitar duplicidades.

El usuario debe poder consultar sus notificaciones y distinguir las leídas de las pendientes.

**Importante:** el contrato API actual no contempla un sistema completo de notificaciones. Debe proponerse y documentarse su ampliación.

No muestres notificaciones como entregadas si no existe confirmación real del servicio correspondiente.

Si alguna funcionalidad todavía no está disponible en backend, deja preparado el punto de integración y señala expresamente la dependencia.

---

# 12. PANEL DE ADMINISTRACIÓN

El administrador debe acceder a una interfaz independiente y orientada a la gestión del club.

Debe estar disponible en escritorio, tablet y móvil.

En escritorio debe aprovechar el espacio para facilitar el trabajo diario.

## 12.1. Dashboard

Incluye indicadores como:

- Total de socios.
- Partidos abiertos.
- Partidos completos pendientes de confirmación.
- Partidos confirmados.
- Partidos cancelados.
- Próximos partidos.
- Actividad reciente.

Los datos deben proceder de la API.

No inventes métricas ni muestres valores simulados como reales.

## 12.2. Gestión de partidos

Incluye una vista administrativa con:

- Listado de partidos.
- Búsqueda.
- Filtros por fecha.
- Filtros por estado.
- Filtros por número de jugadores.
- Acceso al detalle.
- Edición.
- Cancelación.
- Reactivación.

El administrador debe poder consultar el detalle de cada partido.

En el detalle debe aparecer:

- Fecha y hora.
- Jugadores inscritos.
- Confirmación individual de cada jugador.
- Estado general.
- Lugar asignado.
- Estado de confirmación administrativa del lugar.

## 12.3. Confirmación administrativa

Cuando un partido tenga los cuatro jugadores confirmados, debe aparecer claramente como pendiente de confirmación administrativa si todavía no se ha asignado y confirmado el lugar.

El administrador podrá:

- Introducir el lugar.
- Revisar los datos.
- Confirmar el lugar.
- Guardar la operación.

Una vez confirmadas las cuatro participaciones y el lugar, el partido debe pasar al estado confirmado.

La operación debe persistirse en backend.

## 12.4. Gestión de socios

Incluye:

- Listado de socios.
- Búsqueda.
- Filtros.
- Consulta del perfil.
- Edición de datos cuando los permisos lo permitan.
- Estado del socio, si existe en el modelo de API.

## 12.5. Gestión de franjas horarias

Las franjas horarias son predefinidas y administradas por el administrador.

El sistema debe incluir franjas iniciales configuradas por defecto.

El administrador debe poder:

- Crear franjas.
- Editar franjas.
- Activar o desactivar franjas.
- Configurar los días en los que se ofrecen.
- Gestionar su disponibilidad.

El socio solamente puede seleccionar franjas válidas.

El contrato actual no dispone de un modelo específico de configuración de franjas. Debe ampliarse la API para soportarlo.

No implementes las franjas de producción como constantes locales del frontend.

---

# 13. EVOLUCIÓN NECESARIA DE LA API

La API existente es la base de integración. No debe sustituirse.

El contrato OpenAPI proporcionado contempla, entre otros, los siguientes recursos:

### Autenticación

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/password`

### Perfil

- `GET /api/players/me`
- `PATCH /api/players/me`

### Partidos

- `GET /api/matches`
- `POST /api/matches`
- `GET /api/matches/{matchId}`
- `POST /api/matches/{matchId}/players`
- `DELETE /api/matches/{matchId}/players`
- `POST /api/matches/{matchId}/confirmation`
- `GET /api/players/matches`

### Administración

- Recursos de administración bajo `/api/admin/players`.
- Recursos de administración bajo `/api/admin/matches`.

Debes estudiar las operaciones concretas y los esquemas de la especificación antes de implementar la integración.

## Ampliaciones necesarias

La evolución de la API debe cubrir, como mínimo:

### A. Perfil ampliado

Incorporar:

- Nombre.
- Apellidos.
- Nombre de usuario.

Mantener correo electrónico y teléfono.

### B. Confirmación completa de partidos

Separar claramente:

- Confirmación individual de cada jugador.
- Confirmación administrativa del lugar.

La transición a `CONFIRMED` debe requerir las cuatro confirmaciones individuales y la confirmación administrativa del lugar.

### C. Franjas horarias

Incorporar un recurso de configuración y consulta de franjas horarias.

Debe permitir al administrador gestionar la oferta y al socio consultar las franjas disponibles.

### D. Notificaciones

Incorporar los recursos y mecanismos necesarios para:

- Consultar notificaciones.
- Marcar notificaciones como leídas.
- Registrar preferencias.
- Gestionar los canales.
- Programar y enviar recordatorios.

### E. Historial

Permitir consultar partidos pasados, además de los futuros.

### F. Reactivación y administración

Asegurar que la API dispone de las operaciones necesarias para reactivar partidos completos y gestionar su estado de forma segura.

### G. Concurrencia y reglas de negocio

El backend debe proteger las operaciones críticas frente a solicitudes simultáneas.

Debe validar:

- Capacidad máxima de cuatro jugadores.
- Disponibilidad real de plazas.
- Conflictos horarios de los socios.
- Permisos por rol.
- Inscripciones y bajas.
- Cambios de estado.
- Condiciones de confirmación.
- Eliminación automática cuando corresponda.

## Entregable de API

Antes de dar por terminada la integración, presenta una propuesta de evolución del contrato OpenAPI.

Debe incluir:

- Operaciones nuevas.
- Operaciones modificadas.
- Esquemas nuevos o ampliados.
- Estados y transiciones.
- Validaciones.
- Respuestas de error.
- Reglas de autorización.
- Compatibilidad con los recursos existentes.

No afirmes que las ampliaciones están desplegadas si solamente has preparado el contrato o los adaptadores del frontend.

---

# 14. ESTADOS, ERRORES Y EXPERIENCIA DE USUARIO

Toda la aplicación debe contemplar:

- Carga inicial.
- Carga de datos.
- Listas vacías.
- Errores de conexión.
- Errores de validación.
- Sesión caducada.
- Permisos insuficientes.
- Acciones no permitidas.
- Confirmaciones satisfactorias.
- Operaciones pendientes.
- Actualización de datos.

Utiliza mensajes claros y orientados al usuario.

Ejemplos:

- «Te has apuntado al partido».
- «El partido ya está completo».
- «No puedes apuntarte porque ya tienes otro partido a esa hora».
- «Tu confirmación está pendiente».
- «El partido está pendiente de confirmación del lugar».
- «El partido ya está confirmado».
- «Este partido necesita ser reactivado por un administrador».

Incluye confirmaciones antes de realizar acciones sensibles, como cancelar un partido o eliminar una inscripción cuando esté permitido.

No utilices alertas genéricas del navegador como solución visual principal.

---

# 15. DISEÑO RESPONSIVE

La experiencia debe estar diseñada primero para móvil.

## Móvil

Prioriza:

- Selector horizontal de fechas.
- Tarjetas compactas.
- Avatares visibles.
- Botones grandes y accesibles.
- Navegación inferior.
- Formularios sencillos.
- Modales adaptados a pantalla pequeña.

## Tablet

Adapta el contenido para aprovechar el espacio sin perder claridad.

## Escritorio

Utiliza mejor el espacio disponible.

En el panel administrativo puedes emplear:

- Tablas.
- Paneles laterales.
- Filtros avanzados.
- Indicadores.
- Vistas de detalle.

No conviertas la versión móvil en una simple reducción de la versión de escritorio.

---

# 16. COMPONENTES REUTILIZABLES

Crea componentes reutilizables, entre otros:

- Logo Satispadel.
- Selector de fechas.
- Selector de vista.
- Tarjeta de partido.
- Avatar de jugador.
- Indicador de plazas.
- Indicador de estado.
- Indicador de confirmación.
- Botón de acción.
- Modal de creación de partido.
- Modal de confirmación.
- Formulario de perfil.
- Lista de notificaciones.
- Tabla administrativa.
- Filtros.
- Navegación de socios.
- Navegación administrativa.

Mantén los componentes desacoplados de las llamadas directas a la API.

---

# 17. DATOS DE PRUEBA Y MODO DESARROLLO

Si la API no está disponible durante el desarrollo, puedes utilizar datos de prueba.

Pero debes cumplir estas condiciones:

- Los mocks deben estar separados de los servicios reales.
- Debe existir una configuración explícita para activar el modo mock.
- No mezcles datos ficticios con datos reales.
- No simules que una operación se ha persistido en backend.
- No presentes funcionalidades simuladas como terminadas.
- Documenta las dependencias que todavía necesitan implementación en la API.

Cuando la API esté disponible, la aplicación debe poder cambiar a integración real mediante configuración, sin rehacer los componentes.

---

# 18. CRITERIOS DE CALIDAD Y ACEPTACIÓN

La aplicación se considerará correctamente implementada cuando se cumplan estos escenarios:

### Escenario 1. Consultar partidos

Un socio entra en Inicio, ve los próximos siete días, selecciona una fecha y consulta los partidos y franjas correspondientes.

### Escenario 2. Crear un partido

Un socio selecciona una franja disponible y crea un partido. Queda inscrito automáticamente como primer jugador.

### Escenario 3. Completar un partido

Otros tres socios se inscriben. El partido alcanza cuatro jugadores y deja de aceptar nuevas inscripciones.

### Escenario 4. Confirmaciones individuales

Los cuatro jugadores pueden confirmar su participación y la interfaz refleja individualmente cada estado.

### Escenario 5. Confirmación administrativa

Aunque los cuatro jugadores hayan confirmado, el partido no aparece como confirmado hasta que el administrador asigna y confirma el lugar.

### Escenario 6. Conflicto horario

Un socio intenta apuntarse a dos partidos simultáneos. La API rechaza la segunda inscripción y el frontend muestra un mensaje comprensible.

### Escenario 7. Edición administrativa

Un administrador modifica los datos de un partido. Un socio no puede realizar esa operación.

### Escenario 8. Reactivación

Un administrador reactiva un partido completo y el sistema actualiza correctamente su disponibilidad.

### Escenario 9. Franjas horarias

El administrador modifica las franjas horarias y los socios ven la configuración actualizada al consultar Inicio.

### Escenario 10. Perfil

Un socio modifica su nombre, apellidos, nombre de usuario, correo electrónico o teléfono y los cambios se guardan mediante la API.

### Escenario 11. Notificaciones

El socio puede consultar las notificaciones disponibles y sus preferencias, siempre que los servicios correspondientes estén implementados.

### Escenario 12. Responsive

Las funcionalidades principales se pueden utilizar correctamente en móvil, tablet y escritorio.

---

# 19. ORDEN DE TRABAJO

No intentes construir toda la aplicación de golpe sin validar antes su arquitectura.

Sigue este orden:

**Fase 1. Análisis**

- Analiza la API y su OpenAPI.
- Identifica recursos, modelos, roles y operaciones.
- Detecta las diferencias entre el contrato actual y los requisitos.
- Presenta un resumen de las ampliaciones necesarias.

**Fase 2. Arquitectura**

- Define la estructura del frontend.
- Define los modelos TypeScript.
- Diseña el cliente HTTP.
- Define los servicios de API.
- Separa claramente las funcionalidades de socios y administradores.

**Fase 3. Diseño visual**

- Define la paleta visual.
- Integra el SVG original.
- Configura Inter.
- Implementa los temas claro y oscuro.
- Diseña los componentes base.

**Fase 4. Aplicación de socios**

- Login.
- Inicio.
- Selector de fechas.
- Vista de calendario y lista.
- Creación de partidos.
- Mis partidos.
- Perfil.
- Notificaciones.

**Fase 5. Administración**

- Dashboard.
- Gestión de partidos.
- Confirmación del lugar.
- Gestión de socios.
- Gestión de franjas horarias.

**Fase 6. Integración**

- Conecta los servicios reales.
- Gestiona estados y errores.
- Valida permisos.
- Verifica las reglas de negocio.
- Comprueba los escenarios de aceptación.

**Fase 7. Revisión**

- Revisa responsive.
- Revisa accesibilidad.
- Revisa consistencia visual.
- Comprueba que no existan datos ficticios en producción.
- Comprueba que las operaciones críticas dependan de la API.

---

# 20. INSTRUCCIONES FINALES

Quiero un producto que parezca una aplicación real, terminada y profesional, no una maqueta genérica.

Da prioridad a la experiencia de consultar partidos y apuntarse a ellos.

La pantalla Inicio debe ser el centro de la aplicación y transmitir desde el primer momento la sensación de comunidad deportiva de un club privado.

No añadas funcionalidades que no se hayan solicitado si complican innecesariamente la experiencia.

No cambies las reglas de negocio descritas.

No permitas que las decisiones de diseño contradigan los permisos o las reglas del backend.

No inventes endpoints, datos, estados ni operaciones.

Cuando una funcionalidad necesite una ampliación de API, identifícala claramente y prepara el contrato necesario, sin fingir que ya está implementada.

**El resultado debe ser Satispadel: una aplicación de club privado, sencilla para los socios, potente para la administración y fiel a la identidad de marca.**