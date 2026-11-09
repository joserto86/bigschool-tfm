# SATISPADEL — Aplicación web de gestión de partidos amistosos

## 1. ROL Y OBJETIVO

Actúa como un equipo senior compuesto por:
- Product Designer especializado en aplicaciones deportivas.
- UX/UI Designer especializado en experiencias mobile-first.
- Frontend Engineer especializado en React y TypeScript.
- Especialista en diseño de sistemas y componentes reutilizables.

Diseña y desarrolla una aplicación web responsive para un club privado de pádel llamado SATISPADEL.

La aplicación permitirá a los socios organizar, descubrir, crear, confirmar y gestionar partidos amistosos entre los miembros del club.

El resultado debe ser un producto digital de calidad profesional, con una experiencia de usuario comparable a las mejores aplicaciones deportivas del mercado.

La referencia funcional principal es Playtomic, especialmente la experiencia de selección de club, fecha y disponibilidad de horarios.

No copies literalmente su interfaz. Utiliza sus patrones de interacción como inspiración y desarrolla una identidad propia basada en Satispadel.

## 2. IDENTIDAD VISUAL

La identidad debe estar basada en la marca Satispadel.

Referencias:
- Web corporativa: https://satispadel.es/
- Referencia funcional: https://playtomic.io/

Objetivos de personalidad:
- Exclusividad.
- Cercanía.
- Diversión.
- Comunidad deportiva.
- Modernidad.

Estilo visual: CLUB DEPORTIVO.

Requisitos:
- Conservar el logotipo original de Satispadel.
- Utilizar su tipografía corporativa original.
- Respetar sus colores corporativos.
- No inventar ni sustituir elementos de marca cuando existan recursos originales disponibles.
- Diseñar una interfaz moderna, limpia y visualmente atractiva.
- Utilizar tarjetas con bordes suaves y jerarquías visuales claras.
- Incorporar iconografía consistente.
- Utilizar sombras sutiles, espaciados equilibrados y elementos visuales deportivos sin sobrecargar la interfaz.

La aplicación tendrá:
- Tema claro por defecto.
- Tema oscuro alternativo.
- Posibilidad de cambiar el tema desde el perfil.

Si no están disponibles los archivos originales de identidad, utiliza provisionalmente variables de diseño fácilmente sustituibles.

## 3. ARQUITECTURA Y TECNOLOGÍA

Construye exclusivamente el FRONTEND.

Stack preferente:
- React.
- TypeScript.
- Tailwind CSS.
- Componentes reutilizables.
- Arquitectura modular.
- Diseño responsive mobile-first.

Respeta el entorno y las convenciones nativas de la plataforma de generación utilizada. No migres innecesariamente el proyecto a otra tecnología.

IMPORTANTE: el proyecto ya dispone de un backend API desarrollado y de un sistema de autenticación existente.

NO debes:
- Crear un backend nuevo.
- Crear una base de datos alternativa.
- Implementar un sistema de autenticación propio.
- Utilizar Supabase como sustituto del backend existente.
- Inventar endpoints.
- Duplicar reglas de negocio que corresponden al servidor.

Prepara una capa de integración independiente para conectar posteriormente con la API existente.

Organiza el código en:
- Components.
- Pages / Views.
- Layouts.
- Services.
- API Client.
- Types / Interfaces.
- Hooks.
- Context / State.
- Utils.
- Design Tokens.

Centraliza las peticiones HTTP y la gestión de errores.

Configura la URL base de la API mediante variables de entorno.

La interfaz debe poder funcionar inicialmente con datos simulados mediante un adaptador de desarrollo, sin mezclar los mocks con los servicios reales.

La integración de autenticación debe quedar preparada para utilizar el mecanismo existente cuando se proporcione su contrato técnico.

## 4. ROLES Y PERMISOS

Existen dos roles:

### SOCIO

Puede:
- Iniciar sesión.
- Consultar los horarios disponibles.
- Consultar los partidos existentes.
- Crear partidos utilizando horarios predeterminados.
- Inscribirse en partidos.
- Confirmar su participación en partidos completos.
- Consultar sus partidos.
- Consultar las confirmaciones de los participantes.
- Consultar y modificar su perfil.
- Cambiar el tema visual.
- Consultar sus notificaciones.

No puede:
- Modificar partidos existentes.
- Eliminar manualmente partidos.
- Reactivar partidos completos.
- Modificar horarios predeterminados.
- Gestionar otros socios.

### ADMINISTRADOR

Dispone de un panel independiente.

Puede:
- Crear, consultar, editar y eliminar partidos.
- Reactivar partidos completos.
- Gestionar socios.
- Consultar confirmaciones.
- Confirmar el lugar de celebración de los partidos.
- Configurar horarios predeterminados.
- Gestionar parámetros de la aplicación.

El administrador es el único rol autorizado para modificar partidos existentes.

El backend será la autoridad definitiva para validar los permisos.

## 5. NAVEGACIÓN DE LOS SOCIOS

La aplicación de socios tendrá una navegación inferior con exactamente tres opciones:

1. INICIO.
2. MIS PARTIDOS.
3. MI PERFIL.

No añadir secciones principales adicionales.

La creación de partidos debe estar integrada dentro de Inicio mediante un botón de acción destacado.

La navegación debe ser sencilla, intuitiva y optimizada para el uso con una sola mano desde el móvil.

## 6. PANTALLA DE INICIO: BUSCADOR DE PARTIDOS

Esta es la pantalla más importante de toda la aplicación.

Debe inspirarse en la experiencia de Playtomic cuando un usuario accede a un club y busca disponibilidad de pistas.

No diseñes un dashboard convencional ni un listado genérico de tarjetas.

Diseña un buscador visual de disponibilidad de partidos.

### Cabecera

Incluir:
- Logotipo Satispadel.
- Mensaje de bienvenida.
- Acceso a notificaciones.

Mensaje principal sugerido:

"¡Vamos a jugar!"

Subtítulo:

"Encuentra tu próximo partido."

### Selector de fechas

Mostrar un selector horizontal de siete días consecutivos.

Características:
- Incluir el día de la semana.
- Mostrar el número del día.
- Destacar visualmente la fecha seleccionada.
- Permitir desplazamiento horizontal.
- Seleccionar por defecto el día actual.
- Mostrar los siguientes siete días.
- Actualizar dinámicamente los horarios al cambiar la fecha.

El selector debe ser cómodo de utilizar con el pulgar.

### Horarios disponibles

Una vez seleccionada la fecha, mostrar los horarios disponibles.

Cada horario debe representar un partido o una oportunidad para crear uno.

Los partidos deben mostrar:
- Hora de inicio.
- Lugar, cuando esté asignado.
- Número de jugadores inscritos.
- Indicador visual de las cuatro plazas.
- Estado del partido.
- Acción disponible.

Utilizar cuatro posiciones visuales para representar a los jugadores.

Cuando exista un jugador inscrito, mostrar su avatar o sus iniciales.

Las plazas vacías deben representarse mediante elementos visuales diferenciados.

Estados visuales:
- Partido abierto: plazas disponibles.
- Partido completo: cuatro jugadores inscritos.
- Pendiente de confirmación.
- Confirmado.
- Cancelado, cuando corresponda.

Los partidos completos no deben permitir nuevas inscripciones.

Cuando un horario no tenga todavía un partido creado, permitir al socio crear uno si ese horario está habilitado.

Incluir filtros por fecha y lugar cuando resulte útil.

## 7. CREACIÓN DE PARTIDOS

Los socios y administradores pueden crear partidos.

El formulario debe permitir:
- Seleccionar fecha.
- Seleccionar uno de los horarios predeterminados.
- Crear el partido.

Los horarios iniciales deben estar configurados en la aplicación y ser modificables por el administrador.

No permitir seleccionar horarios arbitrarios fuera de los configurados.

El lugar será asignado posteriormente por el administrador.

No solicitar al socio que elija la ubicación definitiva.

La interfaz debe mostrar claramente el resultado de la creación.

## 8. DETALLE DE UN PARTIDO

Crear una pantalla específica para consultar cada partido.

Mostrar:
- Fecha.
- Hora de inicio.
- Lugar, cuando esté asignado.
- Cuatro plazas.
- Jugadores inscritos.
- Estado del partido.
- Estado de confirmación de cada jugador.

Los participantes deben identificarse mediante nombre y apellidos.

Utilizar avatares con iniciales cuando no existan fotografías.

Cuando el usuario no esté inscrito y haya plazas disponibles, mostrar la acción "Apuntarme".

Cuando esté inscrito, mostrar su estado y las acciones permitidas.

No permitir inscribirse si:
- El partido está completo.
- El partido no está abierto.
- El usuario ya participa en otro partido simultáneo.

La comprobación de conflictos debe realizarse mediante la API.

## 9. REGLAS DE NEGOCIO DE LOS PARTIDOS

Estas reglas son obligatorias y deben reflejarse correctamente en toda la interfaz.

### Capacidad

Cada partido admite exactamente cuatro jugadores.

### Inscripción

Cuando se inscribe el cuarto jugador:
- El partido se cierra automáticamente.
- Deja de admitir nuevas inscripciones.
- Pasa a estado pendiente de confirmación.

### Confirmación

Para confirmar un partido deben cumplirse estas condiciones:

1. Los cuatro jugadores inscritos deben confirmar su participación.
2. El administrador debe confirmar el lugar donde se celebrará el partido.
3. Cuando ambas condiciones estén satisfechas, el partido pasa a estado confirmado.

La confirmación del administrador consiste en asignar y validar el lugar de celebración.

No debe sustituir ni duplicar la confirmación individual de los cuatro jugadores.

Mostrar claramente:
- Jugadores que han confirmado.
- Jugadores pendientes.
- Estado de confirmación del lugar.
- Estado global del partido.

Un partido que no esté confirmado no puede comenzar ni celebrarse.

### Bajas

Cuando un partido está completo no se permite que los jugadores se desapunten.

El administrador debe reactivar el partido para permitir su gestión posterior.

No implementar una baja automática de un partido completo.

### Eliminación automática

Si un jugador que no es administrador realiza una acción sobre un partido y como consecuencia de dicha acción no queda ningún jugador inscrito, el partido debe eliminarse automáticamente.

Esta regla debe ejecutarse y validarse en el backend.

El frontend debe actualizar la interfaz según el resultado devuelto por la API.

### Edición

Únicamente los administradores pueden editar partidos existentes.

Los socios no pueden modificar fecha, hora, lugar ni otros datos de un partido creado.

### Restricción horaria

Un mismo jugador no puede participar en dos partidos que se celebren simultáneamente.

La validación definitiva debe realizarse en el servidor.

## 10. PANTALLA MIS PARTIDOS

Crear una sección donde el socio pueda consultar sus partidos.

Organizarla en dos apartados:

- Próximos partidos.
- Historial de partidos.

En próximos partidos mostrar:
- Fecha.
- Hora.
- Lugar.
- Participantes.
- Estado.
- Confirmaciones pendientes.

Diferenciar claramente partidos abiertos, pendientes de confirmación y confirmados.

Permitir acceder al detalle de cada partido.

El historial debe presentar los partidos anteriores de manera ordenada y sencilla.

## 11. PERFIL DEL SOCIO

Diseñar una pantalla de perfil donde el usuario pueda consultar y modificar:

- Nombre.
- Apellidos.
- Nombre de usuario.
- Correo electrónico.
- Teléfono.
- Preferencia de tema claro u oscuro.

Incluir acceso a la gestión de contraseña mediante el sistema de autenticación existente.

Incorporar validaciones visuales y mensajes de éxito o error.

No implementar almacenamiento ni gestión de credenciales propia.

## 12. NOTIFICACIONES

Preparar una experiencia de notificaciones para:

1. Cuando alguien se apunta a un partido.
2. Cuando un partido alcanza cuatro jugadores.
3. Cuando un partido requiere confirmación.
4. Cuando se confirma un partido.
5. Recordatorios antes de los partidos.

Canales previstos:
- Notificaciones internas.
- Correo electrónico.
- Notificaciones push.

Preparar la interfaz para mostrar:
- Notificaciones leídas.
- Notificaciones no leídas.
- Fecha y hora.
- Tipo de notificación.
- Acceso al partido relacionado.

No inventar mecanismos de envío ni implementar servicios externos sin conocer la infraestructura disponible.

La entrega efectiva de las notificaciones corresponde a los sistemas existentes o a integraciones posteriores.

## 13. PANEL DE ADMINISTRACIÓN

Diseñar una zona administrativa independiente de la navegación de socios.

Su estética debe ser más profesional y orientada a la gestión, manteniendo la identidad de Satispadel.

Debe estar optimizada tanto para desktop como para tablet y móvil.

### Dashboard

Mostrar indicadores como:
- Total de socios.
- Partidos activos.
- Partidos pendientes de confirmación.
- Partidos confirmados.
- Actividad reciente.

No utilizar cifras ficticias en producción.

### Gestión de partidos

Crear una vista de gestión con:
- Tabla de partidos.
- Filtros por fecha.
- Filtros por estado.
- Búsqueda.
- Acciones de administración.

Permitir:
- Crear.
- Consultar.
- Editar.
- Eliminar.
- Reactivar.

Incluir una vista de detalle para gestionar los cuatro participantes, sus confirmaciones y el lugar.

### Gestión de confirmaciones

Mostrar los partidos pendientes de confirmación.

Permitir al administrador asignar y confirmar el lugar de celebración.

Mostrar claramente qué jugadores han confirmado su participación.

### Gestión de socios

Crear una vista de socios con:
- Nombre y apellidos.
- Nombre de usuario.
- Correo electrónico.
- Teléfono.
- Estado de la cuenta.

### Configuración de horarios

Permitir al administrador gestionar los horarios predeterminados disponibles para crear partidos.

## 14. LOGIN Y ACCESO

Diseñar una pantalla de inicio de sesión profesional y coherente con la marca.

Incluir:
- Logotipo Satispadel.
- Campo de usuario.
- Campo de contraseña.
- Mostrar/ocultar contraseña.
- Botón de acceso.
- Mensajes de validación.
- Estados de carga y error.

La pantalla debe integrarse posteriormente con el sistema de autenticación existente.

No implementar autenticación propia.

## 15. DISEÑO RESPONSIVE

La prioridad absoluta es móvil.

Diseñar primero para una pantalla de aproximadamente 390 píxeles de ancho.

La aplicación debe adaptarse correctamente a:
- Móviles.
- Tablets.
- Ordenadores.

En móvil:
- Navegación inferior fija.
- Acciones principales accesibles con el pulgar.
- Tarjetas compactas.
- Selector de fechas horizontal.
- Formularios sencillos.
- Evitar desplazamientos horizontales accidentales.

En desktop:
- Aprovechar el espacio disponible.
- Mantener una jerarquía visual clara.
- Adaptar la navegación.
- Utilizar tablas y paneles administrativos cuando aporten valor.

## 16. CALIDAD DE INTERFAZ Y MICROINTERACCIONES

Prestar especial atención a los detalles:

- Transiciones suaves.
- Estados hover y active.
- Feedback visual al inscribirse.
- Indicadores de carga.
- Skeleton loaders.
- Mensajes de éxito.
- Mensajes de error.
- Confirmaciones antes de operaciones destructivas.
- Estados vacíos atractivos.
- Animaciones discretas.
- Accesibilidad y contraste.
- Tamaños táctiles adecuados.

No utilizar animaciones excesivas.

La interfaz debe transmitir calidad, agilidad y confianza.

## 17. COMPONENTES REUTILIZABLES

Crear un sistema de componentes coherente.

Entre otros:
- AppHeader.
- BottomNavigation.
- DateSelector.
- MatchSlotCard.
- PlayerAvatar.
- PlayerSlots.
- MatchStatusBadge.
- MatchDetail.
- ConfirmationStatus.
- MatchCreationForm.
- NotificationList.
- ProfileForm.
- AdminSidebar.
- AdminDashboard.
- AdminMatchTable.
- AdminPlayerTable.

Evitar duplicar componentes o implementar la misma lógica visual en diferentes pantallas.

## 18. ESTADOS Y TRATAMIENTO DE ERRORES

Contemplar todos los escenarios:

- Sin partidos disponibles.
- Sin partidos propios.
- Partido completo.
- Partido pendiente de confirmación.
- Partido confirmado.
- Error de conexión.
- Error de permisos.
- Inscripción duplicada.
- Conflicto de horario.
- Usuario no autenticado.
- Sesión expirada.
- Operación en curso.
- Operación completada correctamente.

No mostrar datos incorrectos ni estados de éxito antes de recibir confirmación de la API.

## 19. INTEGRACIÓN CON LA API EXISTENTE

Crear una capa de servicios independiente.

No asumir rutas, métodos HTTP, parámetros ni estructuras de respuesta.

Cuando se proporcione la documentación de la API:
- Analizar sus endpoints.
- Identificar los modelos.
- Identificar los mecanismos de autenticación.
- Mapear las operaciones con las pantallas.
- Implementar los adaptadores necesarios.
- Mantener los tipos TypeScript sincronizados con los contratos reales.

Mientras no exista esa documentación, utilizar interfaces provisionales claramente identificadas y datos simulados.

No presentar una operación simulada como si se hubiera guardado realmente en el backend.

## 20. METODOLOGÍA DE DESARROLLO

Desarrollar el proyecto por fases.

FASE 1 — Sistema visual:
- Identidad de marca.
- Tipografía.
- Colores.
- Componentes.
- Navegación.
- Diseño responsive.

FASE 2 — Experiencia del socio:
- Inicio.
- Selector de fechas.
- Horarios.
- Detalle de partido.
- Creación de partidos.
- Mis partidos.
- Perfil.

FASE 3 — Administración:
- Dashboard.
- Gestión de partidos.
- Confirmaciones.
- Gestión de socios.
- Configuración de horarios.

FASE 4 — Estados y comportamiento:
- Inscripciones.
- Confirmaciones.
- Restricciones.
- Notificaciones.
- Estados de error y carga.

FASE 5 — Integración:
- Preparación y conexión con la API existente.
- Autenticación existente.
- Validación de contratos.
- Pruebas de integración.

## 21. CRITERIOS FINALES DE ACEPTACIÓN

El proyecto debe cumplir estas condiciones:

1. La experiencia principal debe parecer una aplicación deportiva premium, no una plantilla administrativa genérica.
2. La pantalla de inicio debe estar inspirada en el buscador de disponibilidad de Playtomic.
3. El selector de fechas debe mostrar siete días.
4. Los horarios deben actualizarse al cambiar la fecha.
5. Los partidos deben mostrar visualmente sus cuatro plazas.
6. Los socios deben poder crear partidos utilizando horarios predefinidos.
7. No debe ser posible apuntarse a partidos simultáneos.
8. No debe ser posible superar cuatro jugadores.
9. La confirmación requiere los cuatro jugadores y la intervención del administrador para validar el lugar.
10. Un partido no confirmado no puede celebrarse.
11. Solo el administrador puede editar partidos.
12. Los partidos completos no permiten bajas hasta su reactivación.
13. Debe existir un panel administrativo independiente.
14. La interfaz debe funcionar correctamente en móvil.
15. Debe existir modo claro y oscuro.
16. El proyecto debe estar preparado para conectarse con la API existente sin desarrollar un backend alternativo.

## INSTRUCCIÓN FINAL

No sacrifiques la calidad visual por desarrollar rápidamente muchas pantallas.

Prioriza una experiencia de usuario excelente, una identidad visual coherente y una arquitectura frontend limpia.

Construye una aplicación que parezca un producto real, cuidado y listo para utilizar por los socios de un club privado.

No generes únicamente una landing page ni un dashboard genérico.

El objetivo es desarrollar SATISPADEL: una aplicación privada de gestión de partidos amistosos que convierta la organización de partidos en una experiencia sencilla, rápida y agradable.