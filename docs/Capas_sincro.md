# Capas de sincronización de carga en LiveNotes

## El problema

En una SPA Angular con datos remotos, hay una ventana de tiempo entre que el componente se renderiza y que los datos del backend llegan. Sin gestión explícita, el usuario ve contenido vacío aunque el sistema esté funcionando correctamente.

---

## Capas implementadas

### Capa 1 — Signal de estado de carga en el servicio

Cada servicio mantiene un signal `loading` que los componentes leen reactivamente.

```ts
// EventosService
readonly loading = signal(false);

loadEventos(): Observable<Evento[]> {
  this.loading.set(true);
  return this.http.get<...>(...).pipe(
    finalize(() => this.loading.set(false))
  );
}
```

`FinanceService` añade complejidad porque lanza tres peticiones en paralelo (transacciones, metas, presupuestos), por lo que usa un contador de cargas activas en lugar de un booleano simple:

```ts
private _activeLoads = 0;
private _startLoad() { this._activeLoads++; this.loading.set(true); }
private _endLoad()   { if (--this._activeLoads === 0) this.loading.set(false); }
```

---

### Capa 2 — `isLoading` computado en el componente

`Home` compone los signals de ambos servicios en un único computed:

```ts
readonly isLoading = computed(() =>
  this.eventosService.loading() || this.financeService.loading()
);
```

Esto implica que el loader desaparece solo cuando **todas** las peticiones han terminado. Un retraso en cualquiera de los dos servicios mantiene el estado de carga activo.

---

### Capa 3 — Flags `_loaded` para evitar peticiones duplicadas

Cada servicio guarda un flag booleano que impide repetir la petición HTTP si los datos ya fueron cargados en esa sesión:

```ts
private _loaded = false;

loadEventos(): Observable<Evento[]> {
  if (this._loaded) return of(this._eventos()); // retorno inmediato
  this._loaded = true;
  // ... HTTP
}
```

`FinanceService` tiene cuatro flags independientes: `_txLoaded`, `_goalsLoaded`, `_categoriasLoaded`, `_presupuestosLoaded`, uno por cada colección.

---

### Capa 4 — Retry automático en EventosService

Los eventos del calendario tienen lógica de reintento integrada ante fallos de red transitorios:

```ts
this.http.get<...>(...).pipe(
  retry({ count: 3, delay: 1500 }),
  ...
)
```

Esto alarga el tiempo que `loading` permanece en `true` en caso de error recuperable, pero evita mostrar contenido vacío por un fallo de red puntual.

---

### Capa 5 — Route resolvers

La raíz del problema: las capas 1–5 actúan **después** de que el componente ya se ha renderizado. El resolver mueve la carga **antes** de la navegación:

```ts
{
  path: '',
  resolve: {
    eventos:      () => inject(EventosService).loadEventos(),
    transactions: () => inject(FinanceService).loadTransactions(),
    goals:        () => inject(FinanceService).loadSavingsGoals(),
  }
}
```

Angular no crea el componente hasta que los tres observables completan. Cuando `Home` renderiza por primera vez, los signals ya tienen datos y `isLoading` arranca en `false`.

---

## Por qué fallan las capas 1–4 sin el resolver

| Momento | `loading` | Datos | UI visible |
|---|---|---|---|
| Componente creado | `false` | `[]` | Contenido vacío ← **el bug** |
| Constructor ejecutado | `true` | `[]` | Loader |
| HTTP completa | `false` | `[...]` | Contenido real |

El gap entre la creación del componente y la ejecución del constructor es suficiente para que Angular renderice una vez con `loading = false` y arrays vacíos. Con el resolver, esa primera fila del cuadro desaparece.
