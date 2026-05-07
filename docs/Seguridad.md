# Medidas de seguridad en LiveNotes

## Visión general

La seguridad de LiveNotes se implementa en dos capas: **backend (Node/Express)** y **frontend (Angular)**. El backend es la línea de defensa real; el frontend añade experiencia de usuario y reduce carga innecesaria al servidor, pero nunca reemplaza la validación del servidor.

---

## 1 — Autenticación con JWT dual (access + refresh token)

**Dónde:** `app/utils/jwt.js`, `app/middleware/auth.middleware.js`, `app/controller/user.controller.js`

El sistema usa dos tokens con ciclos de vida distintos:

```js
// jwt.js
export const generarAccessToken  = (payload) => jwt.sign(payload, JWT_SECRET,         { expiresIn: '15m' });
export const generarRefreshToken = (payload) => jwt.sign(payload, JWT_REFRESH_SECRET,  { expiresIn: '7d'  });
```

El **access token** (15 min) viaja en la cabecera `Authorization: Bearer ...` en cada petición. El **refresh token** (7 días) se guarda en la base de datos y se envía al cliente solo por cookie httpOnly.

Cuando el middleware detecta un access token expirado, intenta un refresco automático antes de devolver un 401:

```js
// auth.middleware.js
try {
  req.user = jwt.verify(token, JWT_SECRET);
  return next();
} catch {
  // access token inválido → intento de refresh silencioso
  return tryRefresh(req, res, next);
}
```

**Protege contra:** robo de tokens por interceptación de red (el access token expira en 15 min), y contra sesiones eternas en caso de compromiso de un dispositivo (el refresh token puede revocarse en BD).

---

## 2 — Cookies httpOnly, Secure y SameSite

**Dónde:** `app/controller/user.controller.js` (login)

```js
const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
const cookieOpts = {
  httpOnly: true,
  secure:   isSecure,
  sameSite: isSecure ? 'none' : 'lax',
};
res.cookie('refreshToken', refreshToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 });
```

| Atributo | Efecto |
|----------|--------|
| `httpOnly: true` | JavaScript del navegador no puede leer la cookie |
| `secure: true` (producción) | Solo se transmite por HTTPS |
| `sameSite: 'none'` (HTTPS) / `'lax'` (HTTP) | Bloquea envío en peticiones cross-site |

**Protege contra:**
- **XSS** — un script inyectado no puede robar el refresh token porque `httpOnly` lo bloquea.
- **CSRF** — `sameSite` impide que peticiones de otros dominios adjunten automáticamente la cookie.

---

## 3 — Refresco automático en el frontend

**Dónde:** `src/app/interceptors/auth-error.interceptor.ts`

El interceptor captura respuestas 401 y reintenta la petición original con un nuevo token sin que el usuario lo perciba:

```ts
if (err.status === 401 && !req.url.includes('/user/refresh')) {
  return doRefresh(req, next, auth, router, backend);
}
```

Si el refresh también falla (token revocado, expirado en BD), redirige al login y limpia el almacenamiento local.

**Protege contra:** que una sesión legítima se corte abruptamente por expiración, sin exponer credenciales en el proceso.

---

## 4 — Control de acceso basado en permisos (RBAC)

**Dónde:** `app/models/user.model.js`, `app/middleware/admin.middleware.js`, `src/app/guards/`

Los permisos son numéricos y se almacenan en `User.permisos` con valores enum restringidos:

```js
// user.model.js
permisos: { type: Number, enum: { values: [1, 2, 3, 13579] } }
```

El acceso admin requiere pasar dos middlewares encadenados en el router:

```js
// Solo autenticado no basta; debe ser admin
router.post('/admin/accion', authMiddleware, adminMiddleware, controlador);

// admin.middleware.js
if (!req.user || req.user.permisos !== 13579)
  return res.status(403).json({ message: 'Acceso denegado' });
```

El frontend tiene guards (`auth.guard.ts`, `admin.guard.ts`) que bloquean la navegación a rutas protegidas, pero su único propósito es la UX: la autorización real ocurre en el servidor.

**Protege contra:** escalada de privilegios horizontal (usuario normal accediendo a rutas de admin) y vertical (usuario A accediendo a datos de usuario B).

---

## 5 — Hashing de contraseñas con bcrypt

**Dónde:** `app/controller/user.controller.js`

```js
// Registro y cambio de contraseña
const hashedPassword = await bcrypt.hash(password, 10);

// Login
if (!await bcrypt.compare(password, resultado.password))
  return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
```

El cost factor 10 impone ~100 ms por hash. Bcrypt incorpora salt aleatorio automáticamente, por lo que dos usuarios con la misma contraseña producen hashes distintos.

**Protege contra:** ataques de rainbow table y cracking por fuerza bruta en caso de brecha de la base de datos.

---

## 6 — Reglas de complejidad de contraseña

**Dónde:** `app/controller/user.controller.js`

```js
const validarPassword = (password) => {
  if (password.length < 8)       return 'Mínimo 8 caracteres';
  if (!/[A-Z]/.test(password))   return 'Al menos una mayúscula';
  if (!/[0-9]/.test(password))   return 'Al menos un número';
  return null;
};
```

Se aplica en registro, cambio de contraseña y reset. La validación está en el servidor, no solo en el formulario Angular.

**Protege contra:** ataques de diccionario y fuerza bruta al exigir un espacio de contraseñas más amplio.

---

## 7 — Verificación de email con token criptográfico

**Dónde:** `app/utils/token.js`, `app/controller/user.controller.js`

```js
// token.js — 256 bits de entropía, no adivinable
export const generarToken = () => crypto.randomBytes(32).toString('hex');

// Al registrarse
resultado.tokenVerificacion = generarToken();
resultado.verificado = false;

// Al verificar
resultado.verificado = true;
resultado.tokenVerificacion = null;  // el token se invalida inmediatamente
```

El token se envía por email y se consume una sola vez. Hasta que el email no está verificado la cuenta no puede operar con normalidad.

**Protege contra:** registros con emails falsos o de terceros, y reuso del enlace de verificación.

---

## 8 — Recuperación de contraseña segura

**Dónde:** `app/controller/user.controller.js` (`forgotPassword`, `resetPassword`)

```js
// Respuesta idéntica exista o no el email → evita enumeración
return res.status(200).json({ message: 'Si el email existe, recibirás un enlace...' });

// Token con caducidad de 1 hora
resultado.tokenCambioPasswordExpira = new Date(Date.now() + 60 * 60 * 1000);

// Se invalida al usarse
resultado.tokenCambioPassword = null;
resultado.tokenCambioPasswordExpira = null;
```

**Protege contra:**
- **Enumeración de usuarios** — el atacante no puede saber qué emails están registrados.
- **Replay attacks** — el token expira en 1 hora y se destruye tras el primer uso.

---

## 9 — Rate limiting por IP

**Dónde:** `app/middleware/rate.middleware.js`

```js
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // ventana de 15 min
  max: 5,                     // 5 intentos máximo
  message: { message: 'Demasiados intentos, espera 15 minutos' },
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
});

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
```

`app.js` activa `trust proxy: 1` para que el limitador lea la IP real detrás de un reverse proxy (Nginx, etc.).

**Protege contra:** fuerza bruta en login, spam de registros y denegación de servicio (DoS) básica.

---

## 10 — CORS con lista blanca de orígenes

**Dónde:** `app/app.js`

```js
const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:4200'].filter(Boolean);

const corsOption = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true,  // necesario para enviar cookies
};
```

Solo los orígenes explícitamente listados pueden hacer peticiones credenciadas. Cualquier otro dominio recibe un error de CORS.

**Protege contra:** peticiones cross-origin maliciosas desde dominios no autorizados.

---

## 11 — Verificación de firma en webhooks de Stripe

**Dónde:** `app/controller/stripe.controller.js`

```js
// app.js: el webhook recibe el body crudo (sin parsear)
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// stripe.controller.js
event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], STRIPE_WEBHOOK_SECRET);
```

Stripe firma cada webhook con `STRIPE_WEBHOOK_SECRET`. Si el body ha sido manipulado en tránsito o la firma no coincide, la construcción del evento lanza una excepción y la petición se rechaza con 400.

**Protege contra:** webhooks falsificados que podrían activar upgrades de plan sin pago real.

---

## 12 — Aislamiento de datos por propietario

**Dónde:** Todos los controladores de datos (`nota.controller.js`, `evento.controller.js`, `finance.controller.js`, etc.)

Cada consulta incluye el `userId` extraído del JWT verificado, no del body de la petición:

```js
// nota.controller.js
const notas = await Nota.find({ usuario: req.user.id });
const nota  = await Nota.findOneAndDelete({ _id: id, usuario: req.user.id });
```

Un usuario autenticado que envíe el `_id` de la nota de otro usuario recibirá un 404: la consulta no encontrará el documento porque el `usuario` no coincide.

**Protege contra:** escalada de privilegios horizontal — acceder o modificar datos de otros usuarios adivinando IDs de MongoDB.

---

## Resumen por tipo de ataque

| Ataque | Medidas que lo mitigan |
|--------|----------------------|
| **XSS** | Cookie httpOnly (el script no lee el refresh token) |
| **CSRF** | SameSite cookie, CORS con lista blanca |
| **Robo de token** | Access token de 15 min, refresh revocable en BD |
| **Fuerza bruta / diccionario** | Rate limiting (5 intentos/15 min), bcrypt cost 10, complejidad de contraseña |
| **Rainbow table** | bcrypt con salt automático |
| **Enumeración de usuarios** | Respuestas genéricas en login y forgot-password |
| **Replay de tokens** | Tokens de un solo uso, caducidad de 1 hora en reset |
| **Escalada horizontal** | userId de JWT en todas las consultas |
| **Escalada vertical** | RBAC numérico + doble middleware auth+admin |
| **Webhook falso** | Firma HMAC verificada con STRIPE_WEBHOOK_SECRET |
| **Peticiones cross-origin** | CORS con lista blanca explícita |
| **DoS básico** | Rate limiting general (100 req/15 min por IP) |
| **Registro con email falso** | Verificación por token criptográfico de 256 bits |
