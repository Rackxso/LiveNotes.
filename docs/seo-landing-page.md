# Plan SEO — Landing Page pública

## Contexto

LiveNotes es una SPA Angular con todas las rutas internas protegidas por `authGuard`. Esto significa que los buscadores solo pueden ver las páginas públicas. Para posicionarse en búsquedas de "livenotes" es necesario una landing page pública, bien etiquetada y accesible sin autenticación.

---

## Problema de partida

| Problema | Impacto |
|----------|---------|
| Ruta `''` apuntaba a `Home`, protegida por `authGuard` | Google no podía indexar la app |
| `index.html` sin `<meta name="description">` ni Open Graph | Sin snippet en resultados de búsqueda |
| Sin `robots.txt` ni `sitemap.xml` | Los crawlers no saben qué indexar |
| Título interno `"LiveNotesAngular"` | No descriptivo para buscadores ni usuarios |

---

## Cambios realizados

### 1. Nueva ruta pública en `''`

- Se creó `src/app/pages/landing/` con su componente Angular.
- La ruta `''` ya no tiene `authGuard`, por lo que Google puede indexarla.
- La ruta anterior `''` (home autenticado) se movió a `'home'`.

**Archivos afectados:**
- `src/app/app.routes.ts`

### 2. Redirecciones actualizadas

Tras el cambio de rutas, se actualizaron los puntos que antes enviaban al usuario a `/`:

- `login.ts` — redirige a `/home` tras login exitoso (antes `/`)
- `logged-in.guard.ts` — redirige a `/home` si el usuario ya está autenticado (antes `/`)

**Archivos afectados:**
- `src/app/pages/auth/login.ts`
- `src/app/guards/logged-in.guard.ts`

### 3. Sidebar oculto en la landing

El componente raíz `App` controla si se muestra el sidebar según la URL. Se añadió la ruta `/` al check para que la landing no muestre el sidebar de la app.

**Archivos afectados:**
- `src/app/app.ts` — método `isAuthUrl`

### 4. Componente Landing

Página pública con tres secciones:

- **Nav** — logo + accesos a login y registro, sticky en scroll.
- **Hero** — tagline principal, subtítulo, CTAs y tarjetas decorativas de las 4 funcionalidades.
- **Features** — grid de 4 cards (Calendario, Finanzas, Notas, Hábitos).
- **Bottom CTA** — llamada a la acción final con enlace a registro.
- **Footer** — copyright.

Usa las mismas variables CSS globales (`--primary-color`, `--fuente-titulo`, etc.) para coherencia visual con el resto de la app.

**Archivos creados:**
- `src/app/pages/landing/landing.ts`
- `src/app/pages/landing/landing.html`
- `src/app/pages/landing/landing.css`

---

## Pendiente (siguiente fase)

Estos cambios mejoran el posicionamiento pero no son suficientes solos. La siguiente fase debería incluir:

### Alta prioridad

- [ ] **Mejorar `index.html`** — añadir `<meta name="description">`, Open Graph tags y JSON-LD con datos estructurados.
- [ ] **Crear `robots.txt`** — permitir el crawling de la landing y bloquear rutas privadas.
- [ ] **Crear `sitemap.xml`** — listar `/`, `/login` y `/register` con la URL de producción.
- [ ] **Registrar en Google Search Console** — subir el sitemap y verificar la propiedad.

### Media prioridad

- [ ] **Crear `manifest.json`** — hace la app instalable como PWA y mejora Core Web Vitals.
- [ ] **Cambiar el título** de `index.html` de `LiveNotesAngular` a algo descriptivo como `LiveNotes — Tu app de notas, calendario y finanzas`.

### Baja prioridad

- [ ] **Angular SSR** — renderizado en servidor para mejorar tiempo de carga y Core Web Vitals. No tiene impacto SEO directo en este proyecto porque todo el contenido relevante está autenticado, pero sí mejora el LCP de la landing. Requiere migrar `ThemeService` y otros servicios que usan `window`/`localStorage` para usar `isPlatformBrowser`.

---

## Árbol de archivos modificados

```
src/
├── app/
│   ├── app.ts                          ← isAuthUrl incluye '/'
│   ├── app.routes.ts                   ← '' → Landing, 'home' → Home
│   ├── guards/
│   │   └── logged-in.guard.ts          ← redirige a /home
│   ├── pages/
│   │   ├── auth/
│   │   │   └── login.ts                ← navega a /home tras login
│   │   └── landing/                    ← nuevo
│   │       ├── landing.ts
│   │       ├── landing.html
│   │       └── landing.css
```
