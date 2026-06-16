# Luxury Smile Architects — Web

Sitio web premium, **bilingüe (ES/EN)** y multipágina de la clínica de
odontología estética del **Dr. Martín Prato** (Calle de Recoletos 20, Barrio de
Salamanca, Madrid).

Casi todo el contenido (imágenes, vídeos, equipo, reseñas, datos) se edita desde
**un único archivo** (`public/content/site.json`) y subiendo archivos a
`public/media/`, **sin tocar código**.

---

## 1. Puesta en marcha

Necesitas [Node.js](https://nodejs.org) 18 o superior.

```bash
npm install        # solo la primera vez
npm run dev        # desarrollo en vivo  ->  http://localhost:5173
npm run build      # genera la versión final en /dist
npm run preview    # previsualiza /dist  ->  http://localhost:4173
```

- En **`npm run dev`** los cambios se ven al instante (ideal para editar).
- Para **publicar**, ejecuta `npm run build` y sube la carpeta `dist/` a tu hosting
  (o haz *deploy* en Vercel). En hosting estático, cualquier cambio en `site.json`
  o en `public/media` necesita un nuevo *deploy*.

---

## 2. El archivo central: `public/content/site.json`

Es el "panel de control" de la web. Editas este archivo + subes imágenes a
`public/media/` y la web se actualiza. Campos:

| Campo | Para qué sirve |
|---|---|
| `hero.image` | Foto principal del inicio |
| `logo.image` | Logo de la empresa (`null` = usa el logo de texto) |
| `treatments` | Servicios: añade/quita aquí (id, imagen, y nombre/lema/resumen en ES/EN) |
| `patients` | Fotos del carrusel "Sonrisas felices" (solo súbelas a `/media/patients`) |
| vídeos | Vídeos del carrusel "Reels": solo súbelos a `/media/video` |
| `team` | Personas del equipo (nombre, foto, cargo y bio en ES/EN) |
| `beforeAfter` | Pares de fotos Antes/Después (página Resultados) |
| `business.whatsapp` | Número de WhatsApp (lo usa "Más información" y Contacto) |
| `business.reviewsUrl` | Enlace a tu ficha/reseñas de Google |
| `reviews` | Reseñas escritas a mano (las "de respaldo" si la importación en vivo no está configurada) |

> 🔑 La **clave de API de Google ya NO va en `site.json`**. Por seguridad se
> configura como variable de entorno en Vercel (ver §4.8); así nunca llega al
> navegador del visitante.

> ⚠️ Es un archivo **JSON**: respeta las comillas `"`, las comas y los corchetes.
> Si algo se rompe, valida el archivo en [jsonlint.com](https://jsonlint.com).

---

## 3. Mapa de imágenes a subir

Sube tus archivos a estas carpetas y luego pon la ruta en `site.json`.
**La ruta siempre empieza por `/media/...`** (sin `public`).

| Imagen | Cuántas | Carpeta donde subir | Proporción / tamaño sugerido | Dónde se enlaza en `site.json` |
|---|---|---|---|---|
| **Foto principal (hero)** | 1 | `public/media/` → `hero-main.jpg` | Horizontal, ~2000×1200 px (rostro/sonrisa) | `hero.image` |
| **Logo** | 1 | `public/media/` → `logo.svg` o `.png` | Horizontal, fondo transparente, legible sobre blanco | `logo.image` |
| **Servicios** | 1 por servicio | `public/media/services/` | 5:4, ~1200×960 px | `treatments[].image` |
| **Pacientes (carrusel)** | las que quieras | `public/media/patients/` | Vertical 3:4, ~1080×1440 px | (auto, solo subir) |
| **Vídeos (reels)** | los que quieras | `public/media/video/` | Vertical 9:16, `.mp4` | (auto, solo subir) |
| **Antes / Después** | pares (2 c/u) | `public/media/results/` | 4:3, ~1200×900 px, **mismo encuadre** | `beforeAfter[].before` / `.after` |
| **Equipo (doctores)** | 1 por persona | `public/media/team/` | Vertical 4:5, ~1000×1250 px | `team[].photo` |
| **Favicon** (opcional) | 1 | `public/` → `favicon.svg` | Cuadrado | (fijo) |

Formato recomendado: **JPG** para fotos (más ligero) y **SVG/PNG** para el logo.
Mantén cada foto por debajo de ~500 KB para que la web cargue rápida.

Los **9 `id` de servicios** son:
`estetica`, `rehabilitacion`, `digital`, `endodoncia`, `periodoncia`,
`blanqueamiento`, `exodoncia`, `cirugia`, `implantes`.

---

## 4. Guías paso a paso

### 4.1 Cambiar la foto principal (hero)
1. Sube tu foto a `public/media/hero-main.jpg`.
2. Ya está enlazada por defecto. Si usas otro nombre, cámbialo en `hero.image`.

### 4.2 Poner el logo de la empresa
1. Sube el logo a `public/media/logo.svg` (o `.png`, fondo transparente).
2. En `site.json`: `"logo": { "image": "/media/logo.svg" }`.
3. Si lo dejas en `null`, se muestra el logo de texto **LUXURY SMILE / ARCHITECTS**.

### 4.3 Servicios (añadir, quitar y editar)
Todo en un solo sitio: `site.json` → array **`treatments`**. Añade o borra un bloque por servicio (texto en ES/EN). Aparecen solos en la página de Tratamientos, en el inicio y en el desplegable de Contacto.
1. Sube la imagen del servicio a `public/media/services/`.
2. Añade su bloque en `treatments`:
   ```json
   {
     "id": "ortodoncia",
     "image": "/media/services/ortodoncia.jpg",
     "name":    { "es": "Ortodoncia",  "en": "Orthodontics" },
     "tagline": { "es": "Alineación discreta", "en": "Discreet alignment" },
     "summary": { "es": "Texto…", "en": "Text…" }
   }
   ```
   - Para **quitar** un servicio: borra su bloque (y la coma que lo separa).
   - El `id` debe ser único y sin espacios.

### 4.4 Carrusel "Sonrisas felices" (pacientes)
1. Sube las fotos a `public/media/patients/`.
2. Lístalas en `site.json` → `patients`:
   ```json
   "patients": [
     "/media/patients/sonrisa-01.jpg",
     "/media/patients/sonrisa-02.jpg"
   ]
   ```
3. Si lo dejas vacío (`[]`), se muestran marcos vacíos. Con fotos, el carrusel
   **se mueve solo** (autoplay).

### 4.5 Vídeos del carrusel (sección "Reels")
El carrusel de vídeos reproduce los archivos **locales** que subas a
`public/media/video/` (formato vertical 9:16, `.mp4`). No hay que tocar
`site.json`: se indexan solos al hacer `dev`/`build`.

- Para **añadir** un vídeo: súbelo a `public/media/video/`.
- Para **quitarlo**: bórralo de esa carpeta.
- El botón "Síguenos en Instagram" enlaza a tu perfil
  (`src/data/instagram.ts`). Es solo un enlace externo: **ya no se incrustan**
  publicaciones de Instagram en la web (más rápido y más privado para el
  visitante).

### 4.6 Antes / Después (página Resultados)
Cada caso necesita **2 fotos del mismo encuadre** (antes y después).
1. Súbelas a `public/media/results/`.
2. En `site.json` → `beforeAfter`:
   ```json
   "beforeAfter": [
     { "before": "/media/results/caso1-antes.jpg", "after": "/media/results/caso1-despues.jpg" },
     { "before": "/media/results/caso2-antes.jpg", "after": "/media/results/caso2-despues.jpg" }
   ]
   ```
   Se muestran 3 cajas + 1 caja de "Reserva tu cita".

### 4.7 Equipo (añadir, quitar y fotos)
Es muy sencillo: todo en un solo sitio.
1. Sube la foto de cada persona a `public/media/team/`.
2. En `site.json` → `team`, **añade o borra** un bloque por persona:
   ```json
   {
     "id": "garcia",
     "name": "Dra. Ana García",
     "photo": "/media/team/ana-garcia.jpg",
     "role":        { "es": "Ortodoncia",  "en": "Orthodontics" },
     "credentials": { "es": "Ortodoncista", "en": "Orthodontist" },
     "bio":         { "es": "Texto…",       "en": "Text…" }
   }
   ```
   - Para **quitar** a alguien: borra su bloque (y la coma que lo separa).
   - El `id` debe ser único y sin espacios.

### 4.8 Reseñas de Google (importarlas en vivo, de forma segura)

> **¿Por qué así?** Una clave de API que viaja al navegador la puede copiar
> cualquiera (mirando el código de la página) y gastar tu cuota o cobrarte. Por
> eso la clave vive **solo en el servidor**: el navegador llama a `/api/reviews`
> (función serverless en Vercel) y es esa función la que usa la clave para
> hablar con Google. La clave **nunca** se descarga al cliente.

**Pasos (una sola vez):**
1. En **Google Cloud Console** crea un proyecto y habilita **Places API**
   (la *Maps JavaScript API* ya no hace falta: el mapa de Contacto es un iframe
   sin clave).
2. Crea una **Clave de API**. Restríngela a **Places API** y ponle un límite de
   cuota/presupuesto diario (defensa ante abuso).
3. Consigue tu **Place ID** en el "Place ID Finder" de Google.
4. En **Vercel → tu proyecto → Settings → Environment Variables**, añade dos
   variables (para *Production* y *Preview*):

   | Nombre | Valor |
   | --- | --- |
   | `GOOGLE_PLACES_API_KEY` | tu clave `AIza...` |
   | `GOOGLE_PLACE_ID` | tu Place ID `ChIJ...` |

   > ⚠️ **No** uses el prefijo `VITE_` ni las pongas en `site.json`: cualquier
   > cosa con `VITE_` se empaqueta en el sitio público. (Para probar en local,
   > crea un archivo `.env` partiendo de `.env.example`; ya está en `.gitignore`.)
5. Haz *Redeploy*. Las reseñas aparecen en mini-tarjetas (hasta ~5) en Contacto.

**Si NO configuras la clave** (o Google no responde), la web no se rompe:
muestra las reseñas "de respaldo" que escribas a mano en `reviews` y, si no hay
ninguna, el botón "Ver reseñas en Google" (`business.reviewsUrl`).

```json
"reviews": [
  { "author": "María G.", "rating": 5, "text": "Increíble experiencia…", "date": "Hace 2 semanas" }
]
```

### 4.9 Datos de contacto (teléfono, email, WhatsApp, horario, dirección)
- **WhatsApp**: en `site.json` → `business.whatsapp` (lo usan los botones).
- **Teléfono, email, horario, dirección**: en los archivos de traducción
  `public/locales/es/translation.json` y `public/locales/en/translation.json`,
  dentro de `contact.clinic`.

---

## 5. Textos y traducciones (ES / EN)

Todo el texto vive en:
- `public/locales/es/translation.json` (español)
- `public/locales/en/translation.json` (inglés)

Edita el valor (lo que va después de `:` entre comillas) **en los dos archivos**
para mantener la web bilingüe. Ejemplos de qué hay ahí: títulos, subtítulos,
**descripciones de los 9 servicios** (`treatments.items`), textos del formulario,
y los datos de la clínica (`contact.clinic`).

> No cambies los nombres de las "claves" (lo que va antes de `:`), solo los textos.

---

## 6. Estructura del proyecto

```
public/
  content/site.json        <- panel de control (editas esto)
  locales/{es,en}/…json     <- textos / traducciones
  media/
    hero-main.jpg           <- foto principal (la subes tú)
    logo.svg                <- logo (lo subes tú)
    services/               <- imágenes de servicios
    patients/               <- fotos del carrusel
    results/                <- antes/después
    team/                   <- fotos del equipo
    video/                  <- vídeos de reels (fallback)
src/                        <- código (no hace falta tocarlo)
```

---

## 7. Publicar los cambios (deploy)

1. `npm run build`
2. Sube la carpeta `dist/` a tu hosting, o conecta el repositorio a **Vercel**
   (ya incluye `vercel.json` con la configuración y las cabeceras de seguridad).
3. En hosting estático, **cada cambio** en `site.json`, `media/` o las
   traducciones requiere volver a hacer *deploy*.

---

## 8. Notas técnicas

- **Stack:** Vite + React + TypeScript + Tailwind CSS + react-i18next.
- **Seguridad:** *Content Security Policy* estricta (`script-src 'self'`, sin
  scripts de terceros) y cabeceras de seguridad (HSTS, X-Frame-Options,
  Referrer-Policy, Permissions-Policy…) en `vite.config.ts` y `vercel.json`;
  *Subresource Integrity* en los bundles propios; formulario de contacto con
  validación (Zod) y saneo anti-XSS (DOMPurify). La clave de Google vive solo en
  el servidor (`/api/reviews`, ver §4.8). Si añades servicios externos nuevos,
  habrá que permitirlos explícitamente en la CSP.
- **Marca:** fondo claro, textos en negro y dorado; tipografías Fraunces +
  Hanken Grotesk (incluidas, sin depender de Google Fonts).
