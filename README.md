# LiveNotes — Frontend

Tu espacio personal. Agenda, finanzas, notas y hábitos en una sola app diseñada para tu día a día.

## Tecnologías

- **Angular 21** — framework principal, standalone components, signals
- **TypeScript 5.9** — tipado estricto en todo el proyecto
- **RxJS 7.8** — manejo de streams y llamadas HTTP
- **PostHog** — analytics de uso y eventos
- **Capacitor** — empaquetado como app Android
- **Vitest** — tests unitarios e integración

## Propósito

LiveNotes es un workspace personal all-in-one que reemplaza el uso de múltiples apps separadas (Notion, YNAB, Habitica, Google Calendar). Todo en un solo lugar, con un solo login.

## Módulos y características

### Notas
- Notas de texto libre con categorías personalizables
- Todos / lista de tareas con seguimiento
- Búsqueda en tiempo real por contenido y categoría
- Creación y edición desde modal

### Finanzas
- Registro de movimientos (gastos e ingresos)
- Metas de ahorro con seguimiento de progreso
- Presupuestos mensuales
- Vista resumen con overview de tu situación financiera

### Tracker
- Seguimiento de hábitos con rachas diarias
- Mood tracker — registra tu estado de ánimo cada día
- Visualización de progreso por semana

### Calendario
- Vista diaria, semanal y mensual
- Gestión de eventos
- Integración con el resto de módulos

### Ajustes y cuenta
- Tema claro / oscuro
- Soporte multiidioma (i18n)
- Plan gratuito y plan premium (integración con Stripe)
- Recuperación de contraseña

## Estructura del proyecto

```
src/app/
├── components/       # Componentes reutilizables
│   ├── commons/      # Botones, modales, inputs
│   ├── finance/      # Componentes de finanzas
│   ├── tracker/      # Habit tracker y mood tracker
│   ├── text-notes/   # Componente de notas
│   ├── to-do/        # Lista de tareas
│   └── header/       # Cabecera global
├── pages/            # Páginas de la aplicación
│   ├── landing/      # Página pública de inicio
│   ├── auth/         # Login, registro, recuperar contraseña
│   ├── home/         # Dashboard principal
│   ├── notes/        # Módulo de notas
│   ├── finance/      # Módulo de finanzas
│   ├── tracker/      # Módulo de hábitos
│   ├── calendarPage/ # Módulo de calendario
│   ├── settings/     # Configuración de cuenta
│   └── help/         # Centro de ayuda
└── services/         # Lógica de negocio y llamadas API
```

## Instalación y desarrollo

```bash
npm install
npm start          # Servidor de desarrollo en http://localhost:4200
npm run build      # Build de producción
npm test           # Tests con Vitest
```

### Build para Android

```bash
npm run cap:sync   # Build + sincronizar con Capacitor
npm run cap:open   # Abrir en Android Studio
```

## Convenciones del proyecto

- Standalone components (Angular 17+, sin NgModules)
- Signals para estado local, `computed()` para estado derivado
- `ChangeDetectionStrategy.OnPush` en todos los componentes
- Control flow nativo (`@if`, `@for`) en lugar de directivas estructurales
- `inject()` en lugar de constructor injection
