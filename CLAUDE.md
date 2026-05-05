# LiveNotes — Frontend Angular

Aplicación de productividad personal construida con **Angular 21** (standalone components). Consume la API REST del backend en `BackendLiveNotesMongoDB`.

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Angular 21.2 (componentes standalone, sin NgModules) |
| Lenguaje | TypeScript 5.9 (modo strict) |
| Estado | Angular Signals + RxJS 7.8 |
| HTTP | Angular HttpClient + interceptores |
| Testing | Vitest 4 + jsdom 28 |
| Analytics | PostHog 1.369 |
| Onboarding | Driver.js 1.4 (tours guiados) |
| Mobile | Capacitor (empaquetado Android) |
| Deploy | Cloudflare Workers (`wrangler.toml`) |

## Estructura del proyecto

```
src/app/
├── app.ts              # Componente raíz con lógica de routing
├── app.routes.ts       # Definición de rutas
├── app.config.ts       # Configuración global de Angular
├── pages/              # Componentes de página (1 por ruta)
│   ├── auth/           # Login, registro, recuperación de contraseña
│   ├── landing/        # Página pública de entrada
│   ├── home/           # Dashboard principal
│   ├── notes/          # Módulo de notas
│   ├── finance/        # Módulo financiero (3 sub-vistas)
│   ├── tracker/        # Hábitos y estado de ánimo
│   ├── calendarPage/   # Calendario (día/semana/mes)
│   ├── settings/       # Configuración de cuenta
│   ├── help/           # Centro de ayuda
│   ├── admin/          # Panel de administración
│   └── email-confirmado/ # Confirmación de email
├── components/         # Componentes reutilizables
│   ├── commons/        # Botones, modales, sidebar, selectores genéricos
│   ├── header/         # Cabecera global
│   ├── text-notes/     # Editor de notas
│   ├── to-do/          # Lista de tareas
│   ├── finance/        # Widgets financieros
│   ├── tracker/        # UI de hábitos
│   ├── eventos/        # Componentes de eventos
│   ├── day-view/       # Vista de día del calendario
│   ├── week-view/      # Vista de semana
│   └── month-view/     # Vista de mes
├── services/           # Lógica de negocio y llamadas a API (14 servicios)
├── guards/             # Protección de rutas
├── interceptors/       # Interceptores HTTP
├── model/              # Interfaces TypeScript
├── utils/              # Funciones auxiliares
├── tours/              # Definiciones de tours de onboarding
└── lenguajes/          # Archivos de traducción (i18n)
```

## Servicios principales

| Servicio | Responsabilidad |
|----------|----------------|
| `AuthService` | Login, registro, gestión de JWT, signals de estado del usuario |
| `FinanceService` | CRUD de transacciones, presupuestos, metas de ahorro, cálculos |
| `TodoService` | Listas de tareas, subtareas, prioridad/dificultad |
| `NotesService` | CRUD de notas de texto y búsqueda |
| `EventosService` | Eventos de calendario, hábitos, entradas de mood (polimórfico) |
| `HabitsService` | Seguimiento diario de hábitos y rachas |
| `CalendarService` | Cálculos de calendario y filtrado de eventos |
| `PremiumService` | Estado premium y flujo de Stripe |
| `TicketService` | Envío y gestión de tickets de soporte |
| `I18nService` | Soporte multiidioma |
| `ThemeService` | Cambio de tema claro/oscuro |
| `PosthogService` | Tracking de eventos de analytics |
| `TourService` | Tours de onboarding con Driver.js |
| `AdminService` | Operaciones del panel de administración |

## Guards

- `authGuard` — Requiere autenticación; redirige a `/login` si no hay sesión
- `loggedInGuard` — Redirige al dashboard si el usuario ya está autenticado (para páginas de auth)
- `adminGuard` — Solo permite acceso a usuarios con permiso admin

## Interceptores HTTP

- `auth-error.interceptor.ts` — Captura errores 401 y lanza el flujo de refresco de token
- `credentials.interceptor.ts` — Añade `withCredentials: true` para enviar cookies httpOnly
- `lang.interceptor.ts` — Añade header de preferencia de idioma

## Gestión de tokens

- **Access token** → guardado en `localStorage`, enviado como `Authorization: Bearer <token>`
- **Refresh token** → httpOnly cookie, gestionada automáticamente por el navegador
- El interceptor `auth-error` reintenta la petición fallida tras refrescar el token

## Internacionalización (i18n)

Sistema propio basado en **Angular Signals** — no usa `@angular/localize` ni `ngx-translate`.

### Archivos
```
src/lenguajes/
├── es.json    # Español (idioma base)
└── en.json    # Inglés
```

Las claves están organizadas por dominio. Namespaces actuales:
`nav`, `calendar`, `modal`, `eventos`, `week`, `day`, `finance`, `notes`, `tracker`, `home`, `settings`, `lang`, `tour`, `todo`

### Uso en componentes

```typescript
// Inyectar el servicio
readonly t = inject(I18nService).t;
readonly locale = inject(I18nService).locale; // 'es-ES' o 'en-US'
```

```html
<!-- En el template -->
{{ t()('nav.home') }}
{{ t()('finance.modal.save') }}
```

El signal `t` es un `computed<(key: string) => string>`. Cuando el usuario cambia de idioma, **todos los componentes que lo lean se re-renderizan automáticamente** (compatible con `OnPush`).

### Cambiar el idioma

```typescript
inject(I18nService).setLang('en'); // persiste en localStorage
```

El idioma inicial se detecta automáticamente desde `navigator.language`; si empieza por `es` se usa español, en cualquier otro caso inglés.

### Añadir un nuevo idioma

1. Crear `src/lenguajes/xx.json` con las mismas claves que `es.json`
2. Importarlo en `i18n.service.ts` y añadirlo a `TRANSLATIONS` y `LOCALES`
3. Extender el tipo `SupportedLang = 'en' | 'es' | 'xx'`

### Regla para agentes

**Todo texto visible para el usuario debe ir en los JSONs de traducción**, nunca hardcodeado en templates o componentes. Si añades una funcionalidad, añade las claves en ambos archivos (`es.json` y `en.json`) bajo el namespace correspondiente.

---

## Convenciones del código

### Componentes
- **Standalone components** siempre (sin `NgModule`)
- **`ChangeDetectionStrategy.OnPush`** en todos los componentes
- **Angular Signals** para estado local y compartido (no Subject/BehaviorSubject para estado)
- **Sintaxis de control flow moderna**: usar `@if`, `@for`, `@switch` — nunca `*ngIf`, `*ngFor`

### Tipado
- Todas las entidades tienen interfaz en `src/app/model/`
- No usar `any`; usar tipos explícitos o `unknown`

### Llamadas HTTP
- Los servicios devuelven `Observable<T>` de `HttpClient`
- Subscribirse en el componente o usar `async` pipe en template
- Errores capturados con `catchError` en el servicio

## Environments

```
src/environments/
├── environment.ts             # Dev → apiUrl: 'http://localhost:4000/api'
├── environment.staging.ts     # Staging
└── environment.production.ts  # Producción
```

Siempre importar la URL base desde `environment.apiUrl`, nunca hardcodearla.

## Variables de entorno (`.env`)

```env
POSTHOG_PROJECT_TOKEN    # Token de analytics PostHog
POSTHOG_HOST             # Endpoint de PostHog (EU)
```

## Módulos / funcionalidades principales

### Notas
- CRUD con editor modal
- Categorización y búsqueda en tiempo real

### Finanzas (3 sub-vistas)
1. **Resumen** — Totales ingresos/gastos, gráficas mensuales
2. **Transacciones** — Alta de gastos/ingresos, filtros, vinculación a metas
3. **Ahorros** — Creación de metas, seguimiento de progreso, historial de depósitos

### Tracker
- Creación de hábitos con iconos personalizados
- Rachas diarias (actual y máxima)
- Registro de estado de ánimo (puntuación 1-10, emociones, energía)

### Calendario
- Vistas día / semana / mes
- Eventos, hábitos y entradas de mood integrados
- Código de colores por tipo de evento

### Settings
- Edición de perfil y avatar
- Cambio de contraseña
- Selección de tema e idioma
- Gestión de suscripción premium (portal de Stripe)

## Scripts

```bash
npm start           # ng serve → localhost:4200
npm run build:prod  # Build de producción optimizado
npm test            # Vitest
npm run cap:sync    # Build + sincronizar con Capacitor
npm run cap:open    # Abrir en Android Studio
```

## Deploy

- **Frontend**: Cloudflare Workers (SPA, configurado en `wrangler.toml`)
- **Mobile**: Capacitor para empaquetado Android (`capacitor.config.ts`)
