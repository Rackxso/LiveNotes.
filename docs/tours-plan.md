# Plan: Sistema de Tours Interactivos

## Tours definidos

| Tour ID    | Rutas que cubre                                              | Descripción               |
| ---------- | ------------------------------------------------------------ | ------------------------- |
| `home`     | `/`                                                          | Dashboard principal       |
| `calendar` | `/calendar/month`, `/calendar/week`, `/calendar/day`         | Vistas del calendario     |
| `notes`    | `/notes`                                                     | Notas                     |
| `finance`  | `/finance/overview`, `/finance/transactions`, `/finance/savings` | Finanzas y subvistas  |
| `tracker`  | `/tracker`                                                   | Tracker de hábitos        |
| `global`   | Todas las anteriores en secuencia                            | Tour completo de la app   |

---

## Arquitectura

### Piezas nuevas

**`src/app/tours/tour-definitions.ts`**
Fichero de solo datos. Exporta un objeto `TOUR_DEFINITIONS` con los pasos (`DriveStep[]`) de cada tour agrupados por tour ID. Los tours con múltiples rutas (calendar, finance) definen segmentos internos, uno por ruta.

```ts
export const TOUR_DEFINITIONS: Record<TourId, TourSegment[]> = {
  home: [ { route: '/', steps: [...] } ],
  calendar: [
    { route: '/calendar/month', steps: [...] },
    { route: '/calendar/week',  steps: [...] },
    { route: '/calendar/day',   steps: [...] },
  ],
  finance: [
    { route: '/finance/overview',      steps: [...] },
    { route: '/finance/transactions',  steps: [...] },
    { route: '/finance/savings',       steps: [...] },
  ],
  notes:   [ { route: '/notes',   steps: [...] } ],
  tracker: [ { route: '/tracker', steps: [...] } ],
  global:  [ /* referencia a todos los segmentos anteriores en orden */ ],
}
```

**`src/app/services/tour.service.ts`**
- Instancia de Driver.js
- Señales: `tourActive`, `currentTourId`, `globalTourSegmentIndex`
- `startTour(tourId)` — navega a la primera ruta del tour y arranca los pasos
- `startGlobalTour()` — igual pero recorre todos los segmentos en orden
- Escucha `NavigationEnd` del Router: cuando hay un tour activo, arranca los pasos del segmento correspondiente a la ruta actual
- `markCompleted(tourId)` / `isCompleted(tourId)` — persiste en `localStorage` bajo la clave `tour_completed_{tourId}`
- `resetTour(tourId)` / `resetAll()`
- `startTourIfNewUser()` — comprueba `localStorage` clave `tour_new_user`; si no existe, lanza el tour global y crea la clave

### Piezas modificadas

**`src/app/pages/help/help.ts` y `help.html`**
Nueva sección **"Tours"** en la página de ayuda, con:
- Una tarjeta por cada tour (nombre, descripción breve, badge "Completado")
- Botón "Iniciar" / "Repetir" que llama a `tourService.startTour(id)`
- Botón "Resetear todos los tours" que llama a `tourService.resetAll()`

**`src/app/components/commons/sidebar/sidebar.ts`**
Nuevo ítem en `secondaryNav` (junto a Settings y Help): **"Tour"**, con icono adecuado. Al pulsarlo lanza `tourService.startTour()` para la vista activa, o el tour global si se está en home.

**`src/app/app.ts`**
En `ngOnInit` o similar, llamar a `tourService.startTourIfNewUser()` para auto-lanzar el tour global la primera vez que el usuario entra autenticado.

---

## Flujo del tour global

```
startGlobalTour()
  → navega a '/'
  → NavigationEnd → arranca pasos de home
  → al terminar → navega a /calendar/month
  → NavigationEnd → arranca pasos de calendar/month
  → al terminar → navega a /calendar/week
  → ...
  → al terminar → navega a /finance/overview
  → ...
  → al terminar → navega a /tracker
  → al terminar → markCompleted('global')
```

---

## Stack técnico

- **Driver.js** (`driver.js`) — sin dependencias adicionales, TypeScript nativo
- Sin wrappers de Angular; el servicio gestiona todo
- Señales Angular para estado reactivo
- `localStorage` para persistencia del progreso

---

## Orden de implementación

1. `npm install driver.js`
2. `src/app/tours/tour-definitions.ts` — definir pasos de cada tour
3. `src/app/services/tour.service.ts` — lógica completa
4. Sección "Tours" en Settings
5. Ítem "Tour" en Sidebar
6. Auto-lanzado en `app.ts` para nuevos usuarios
