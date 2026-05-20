# Guion — Videotutorial LiveNotes

> **Formato sugerido:** grabación en pantalla con voz en off.  
> **Duración estimada:** 12-15 minutos.  
> Cada sección indica el tiempo aproximado y lo que debe verse en pantalla.

---

## 0. Introducción (0:00 – 0:45)

**[Pantalla: landing page de LiveNotes]**

> "Hola, bienvenido a LiveNotes, tu aplicación de productividad personal todo en uno. En este tutorial vas a ver cada una de las funcionalidades que tienes disponibles: organiza tus tareas, lleva el control de tus finanzas, registra hábitos, toma notas y gestiona tu calendario, todo desde un mismo lugar. Vamos a empezar."

---

## 1. Registro e inicio de sesión (0:45 – 2:00)

### 1.1 Crear una cuenta

**[Pantalla: `/register`]**

> "Lo primero es crear tu cuenta. Introduce tu nombre, correo electrónico y una contraseña segura. Al enviar el formulario recibirás un correo de confirmación — haz clic en el enlace y tu cuenta quedará activada."

- Mostrar el formulario de registro.
- Mostrar la página de confirmación de email (`/email-confirmado`).

### 1.2 Iniciar sesión

**[Pantalla: `/login`]**

> "Una vez confirmada la cuenta, inicia sesión con tu correo y contraseña. Si en algún momento olvidas tu contraseña, usa el enlace '¿Olvidaste tu contraseña?' para recibir un correo de recuperación."

- Mostrar el formulario de login.
- Mostrar el flujo de recuperación (`/forgot-password` → `/reset-password`).

---

## 2. Dashboard principal — Home (2:00 – 4:00)

**[Pantalla: `/home`]**

> "Al entrar verás el dashboard. Está dividido en bloques para que de un vistazo tengas todo lo importante del día."

### 2.1 Strip semanal

> "Arriba tienes la semana actual. Puedes pulsar cualquier día para filtrar los eventos de esa jornada. Los días con eventos tienen un indicador visual. Usa las flechas para navegar entre semanas."

- Clic en distintos días del strip.
- Navegar a la semana anterior y siguiente.

### 2.2 Eventos del día

> "Debajo del strip aparecen los eventos programados para el día seleccionado. Haz clic en cualquiera para ver sus detalles completos."

- Clic en un evento → modal de detalle.

### 2.3 Próximos eventos

> "Un poco más abajo tienes los próximos eventos más inmediatos, los cuatro siguientes a la fecha seleccionada."

### 2.4 Resumen financiero

> "El panel de finanzas te muestra los ingresos y gastos del mes actual, el total ahorrado en tus metas activas y las últimas tres transacciones. Puedes pulsar 'Ver más' para ir directamente al módulo de finanzas."

### 2.5 Notas rápidas y tareas

> "En la parte inferior están tu lista de tareas y tus notas. Desde aquí puedes añadir una nota nueva sin salir del dashboard."

---

## 3. Notas (4:00 – 5:00)

**[Pantalla: `/notes`]**

> "El módulo de notas es un espacio para guardar información rápida: ideas, recordatorios, apuntes."

- Pulsar el botón de nueva nota → modal de creación.
- Escribir título y contenido.
- Guardar y ver la nota en la lista.
- Usar la barra de búsqueda para filtrar notas en tiempo real.
- Editar una nota existente haciendo clic en ella.
- Eliminar una nota.

> "Las notas se sincronizan automáticamente con el servidor, así que las tendrás disponibles desde cualquier dispositivo."

---

## 4. Tareas (To-Do) (5:00 – 6:00)

**[Pantalla: componente de tareas dentro de `/home` o vista dedicada]**

> "El gestor de tareas te permite organizar lo que tienes pendiente."

- Crear una nueva tarea con título.
- Asignar prioridad y dificultad.
- Añadir subtareas.
- Marcar una tarea como completada.
- Reordenar tareas (vista de ordenación).

> "Las tareas completadas se archivan automáticamente para que tu lista principal esté siempre limpia."

---

## 5. Finanzas (6:00 – 8:30)

**[Pantalla: `/finance`]**

> "El módulo financiero tiene tres secciones accesibles desde las pestañas superiores."

### 5.1 Resumen (`/finance` — Overview)

> "El resumen te muestra el balance del mes: ingresos totales, gastos totales y una gráfica mensual para ver la tendencia. También aparecen tus metas de ahorro activas con su progreso."

- Señalar tarjetas de ingresos y gastos.
- Señalar la barra de progreso de metas de ahorro.

### 5.2 Transacciones (`/finance/transactions`)

> "En transacciones puedes registrar cada movimiento económico."

- Pulsar 'Nueva transacción' → modal.
- Seleccionar tipo (ingreso / gasto), categoría, importe, fecha y descripción.
- Guardar y ver la transacción en la lista.
- Filtrar por tipo o categoría.
- Editar y eliminar una transacción.

### 5.3 Ahorros (`/finance/savings`)

> "En la sección de ahorros creas metas con un nombre, importe objetivo y fecha límite."

- Crear una meta de ahorro.
- Registrar un depósito en esa meta.
- Ver el historial de depósitos y el progreso de la barra.

---

## 6. Tracker — Hábitos y estado de ánimo (8:30 – 10:00)

**[Pantalla: `/tracker`]**

> "El tracker tiene dos bloques: seguimiento de hábitos y registro del estado de ánimo."

### 6.1 Hábitos

> "Crea hábitos personalizados eligiendo un nombre e icono. Cada día que lo completes, marca el checkbox correspondiente. La aplicación registra tu racha actual y tu racha máxima para mantenerte motivado."

- Pulsar 'Añadir hábito' → modal.
- Rellenar nombre e icono.
- Marcar hábito del día.
- Mostrar racha actual y máxima.

### 6.2 Estado de ánimo

> "El registro de mood te permite anotar cómo te sientes cada día: una puntuación del 1 al 10, una o varias emociones y tu nivel de energía. Esto te ayuda a identificar patrones a lo largo del tiempo."

- Abrir el formulario de mood.
- Seleccionar puntuación, emociones y energía.
- Guardar y ver la entrada en el historial.

---

## 7. Calendario (10:00 – 11:15)

**[Pantalla: `/calendar`]**

> "El calendario integra eventos, hábitos completados y registros de mood en una sola vista."

### 7.1 Vista mes

> "La vista mensual te da una panorámica completa. Los días con contenido tienen indicadores de color según el tipo."

### 7.2 Vista semana

> "La vista semanal muestra las franjas horarias de cada día de la semana. Ideal para planificar tu agenda."

- Navegar a la semana actual.
- Señalar un evento en la franja horaria.

### 7.3 Vista día

> "La vista diaria es el mayor nivel de detalle: ves todos los eventos hora a hora."

- Crear un nuevo evento desde la vista día.
- Rellenar título, hora de inicio y fin, tipo de evento.
- Ver el evento creado en el calendario.

> "Puedes navegar entre vistas en cualquier momento usando los botones de la cabecera del calendario."

---

## 8. Configuración (11:15 – 12:15)

**[Pantalla: `/settings`]**

> "Desde ajustes personalizas tu experiencia en LiveNotes."

- **Perfil**: editar nombre y subir foto de avatar.
- **Seguridad**: cambiar contraseña.
- **Apariencia**: alternar entre tema claro y oscuro.
- **Idioma**: cambiar entre español e inglés — la aplicación se actualiza al instante.
- **Suscripción**: acceder al portal de Stripe para gestionar el plan premium.

---

## 9. Funcionalidades premium (12:15 – 12:45)

**[Pantalla: modal de paywall o sección de settings > suscripción]**

> "Algunas funcionalidades avanzadas están disponibles en el plan premium. Al intentar acceder a ellas verás una pantalla con los beneficios del plan. Puedes suscribirte directamente desde la aplicación y gestionar o cancelar tu suscripción en cualquier momento desde Ajustes."

---

## 10. Ayuda y soporte (12:45 – 13:15)

**[Pantalla: `/help`]**

> "Si tienes alguna duda, en el centro de ayuda encontrarás respuestas a las preguntas más frecuentes y un formulario para enviar un ticket de soporte. Nuestro equipo te responderá por correo electrónico."

- Mostrar sección de FAQs.
- Mostrar formulario de ticket.

---

## 11. Cierre (13:15 – 13:45)

**[Pantalla: dashboard `/home`]**

> "Eso es todo lo que necesitas saber para empezar a sacarle partido a LiveNotes. Tienes el control de tus tareas, finanzas, hábitos, notas y calendario en un solo lugar. Si tienes alguna pregunta, no dudes en contactar con nosotros desde la sección de Ayuda. ¡Hasta pronto!"

---

## Notas de producción

| Aspecto | Recomendación |
|---------|--------------|
| Resolución | 1920×1080 mínimo |
| Cuenta demo | Crear una cuenta de prueba con datos de ejemplo antes de grabar |
| Datos de ejemplo | Al menos 5 transacciones, 3 notas, 2 hábitos con racha, 3 eventos en el calendario |
| Música de fondo | Suave, sin letra, volumen bajo |
| Subtítulos | Añadir subtítulos en español e inglés para accesibilidad |
| Cortes | Hacer un corte entre cada sección principal para facilitar el montaje |



## Script completo (solo voz en off)

Hola, bienvenido a LiveNotes, tu aplicación de productividad personal todo en uno. En este tutorial vas a ver cada una de las funcionalidades que tienes disponibles: organiza tus tareas, lleva el control de tus finanzas, registra hábitos, toma notas y gestiona tu calendario, todo desde un mismo lugar. Vamos a empezar.

Lo primero es crear tu cuenta. Introduce tu nombre, correo electrónico y una contraseña segura. Al enviar el formulario recibirás un correo de confirmación — haz clic en el enlace y tu cuenta quedará activada.

Una vez confirmada la cuenta, inicia sesión con tu correo y contraseña. Si en algún momento olvidas tu contraseña, usa el enlace '¿Olvidaste tu contraseña?' para recibir un correo de recuperación.

Al entrar verás el dashboard. Está dividido en bloques para que de un vistazo tengas todo lo importante del día.

Arriba tienes la semana actual. Puedes pulsar cualquier día para filtrar los eventos de esa jornada. Los días con eventos tienen un indicador visual. Usa las flechas para navegar entre semanas.

Debajo del strip aparecen los eventos programados para el día seleccionado. Haz clic en cualquiera para ver sus detalles completos.

Un poco más abajo tienes los próximos eventos más inmediatos, los cuatro siguientes a la fecha seleccionada.

El panel de finanzas te muestra los ingresos y gastos del mes actual, el total ahorrado en tus metas activas y las últimas tres transacciones. Puedes pulsar 'Ver más' para ir directamente al módulo de finanzas.

En la parte inferior están tu lista de tareas y tus notas. Desde aquí puedes añadir una nota nueva sin salir del dashboard.

El módulo de notas es un espacio para guardar información rápida: ideas, recordatorios, apuntes.

Las notas se sincronizan automáticamente con el servidor, así que las tendrás disponibles desde cualquier dispositivo.

El gestor de tareas te permite organizar lo que tienes pendiente.

Las tareas completadas se archivan automáticamente para que tu lista principal esté siempre limpia.

El módulo financiero tiene tres secciones accesibles desde las pestañas superiores.

El resumen te muestra el balance del mes: ingresos totales, gastos totales y una gráfica mensual para ver la tendencia. También aparecen tus metas de ahorro activas con su progreso.

En transacciones puedes registrar cada movimiento económico.

En la sección de ahorros creas metas con un nombre, importe objetivo y fecha límite.

El tracker tiene dos bloques: seguimiento de hábitos y registro del estado de ánimo.

Crea hábitos personalizados eligiendo un nombre e icono. Cada día que lo completes, marca el checkbox correspondiente. La aplicación registra tu racha actual y tu racha máxima para mantenerte motivado.

El registro de mood te permite anotar cómo te sientes cada día: una puntuación del 1 al 10, una o varias emociones y tu nivel de energía. Esto te ayuda a identificar patrones a lo largo del tiempo.

El calendario integra eventos, hábitos completados y registros de mood en una sola vista.

La vista mensual te da una panorámica completa. Los días con contenido tienen indicadores de color según el tipo.

La vista semanal muestra las franjas horarias de cada día de la semana. Ideal para planificar tu agenda.

La vista diaria es el mayor nivel de detalle: ves todos los eventos hora a hora.

Puedes navegar entre vistas en cualquier momento usando los botones de la cabecera del calendario.

Desde ajustes personalizas tu experiencia en LiveNotes.

Algunas funcionalidades avanzadas están disponibles en el plan premium. Al intentar acceder a ellas verás una pantalla con los beneficios del plan. Puedes suscribirte directamente desde la aplicación y gestionar o cancelar tu suscripción en cualquier momento desde Ajustes.

Si tienes alguna duda, en el centro de ayuda encontrarás respuestas a las preguntas más frecuentes y un formulario para enviar un ticket de soporte. Nuestro equipo te responderá por correo electrónico.

Eso es todo lo que necesitas saber para empezar a sacarle partido a LiveNotes. Tienes el control de tus tareas, finanzas, hábitos, notas y calendario en un solo lugar. Si tienes alguna pregunta, no dudes en contactar con nosotros desde la sección de Ayuda. ¡Hasta pronto!