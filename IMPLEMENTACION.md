# Implementación — remediación SEO/GEO sin migrar

Rama `feat/seo-geo-remediacion`, 9 commits. Todo sobre el repositorio y el
hosting existentes: React + Vite, estático en Cloudflare Pages.

Fecha: 11 de septiembre de 2026 · Dominio canónico: `luxurysmilearchitects.eu`

---

## 1. Resultado

| | Nota media |
|---|---|
| Auditoría de Yussef Co. | 1,9 / 10 |
| Verificado por mí antes de tocar nada | 2,8 / 10 |
| **Ahora** | **8,0 / 10** |
| **Tras dos casillas del panel de Cloudflare** | **8,9 / 10** |

Los 0,9 puntos que faltan son **#09 GEO, y siguen en 0**. Ningún commit los
sube: los bots de IA reciben un 403 del cortafuegos antes de llegar al HTML.
Ver §4.

Misma escala que usó el auditor, sobre las mismas 11 variables que puntuó.

---

## 2. Las 12 variables

Cada fila trae el comando que lo demuestra. Ejecutables tras `npm run build`.

| # | Antes | Ahora | Evidencia | Para llegar a 10 | Depende de |
|---|---|---|---|---|---|
| **01** Renderizado | 1 | **9** | `grep -c Recoletos dist/index.html` → **5**. El `<body>` pasó de `<div id="root"></div>` a 843–5.714 caracteres de texto por ruta | Hidratación limpia | Rework a SSR real (§6) |
| **02** Metadata | 6 | **10** | `grep -oh '<title>[^<]*' dist/**/index.html \| wc -l` → **12 títulos, todos distintos**. Descripciones de 125–149 car. con NAP | — | Nada |
| **03** Open Graph | 2 | **10** | `grep -o 'og:image\|twitter:card' dist/index.html`. Imagen 1200×630, 98 kB, URL absoluta | — | Nada |
| **04** Hreflang | 3 | **9** | `grep -c xhtml:link dist/sitemap.xml` → **36**. hreflang recíproco es-ES / en / x-default en las 12 páginas | Confirmarlo en Search Console | Desplegar |
| **05** JSON-LD | 1 | **9** | `npm run validate-schema` → **19 nodos válidos en las 12 rutas** contra el vocabulario oficial de schema.org | Colegiado y titulación en `Person` | Datos del cliente |
| **06** Canonical | 2 | **9** | `grep -oh 'rel="canonical"...' \| sort -u \| wc -l` → **12 canonicals únicos**. 301 desde los otros tres dominios | Verificar 404 y 301 en producción | Desplegar |
| **07** CSP | 7 | **8** | CSP con Meta Pixel y GA4, **sin `unsafe-inline`**. Sin consentimiento: 0 peticiones a facebook.net y google-analytics.com | Techo declarado | Decisión legal + IDs |
| **08** Indexación | 2 | **8** | `sitemap.xml`: 12 URLs con hreflang. 404 real con `noindex`. Comodín SPA eliminado | Que Google reindexe | Desplegar + Search Console |
| **09** GEO | 0 | **0** | `curl -A "GPTBot/1.2" https://luxurysmilearchitects.eu` → **403** | Desbloquear Cloudflare | **Tú** (§4) |
| **10** EEAT | 3 | **6,5** | 5 nodos `Person` con biografía, puesto e imagen en el HTML | Colegiado, titulación, `sameAs`, casos documentados | Cliente |
| **11** NAP | 4 | **10** | `grep -oh 'tel:[^"]*'` → **14 enlaces, todos `tel:+34689440906`**. `<address>` en las 13 páginas | — | Nada |
| **12** Performance | 5 | **8** | Chunk de `/contacto` 535 → **296 kB**. Mapa: **1,69 MB** que ya no cargan sin desplazarse | Techo declarado | Datos de campo |

**Media sobre las 11 que puntuó el auditor: 8,0/10.** Con #09 desbloqueado: 8,9.

No inflo #09. Está en 0 y seguirá en 0 hasta que toques el panel.

---

## 3. Qué se hizo, por fase

| Fase | Commit | Qué resuelve |
|---|---|---|
| 1 | `0b7bcd0` | Prerenderiza las 13 rutas en build. Cierra `npm audit` (estaba rojo desde antes) |
| 2 | `a416cd6` | Head por página: canonical, Open Graph, Twitter Cards |
| 3 | `96e0c7b` | Imagen social 1200×630 generada del hero |
| 4 | `b39a918` | JSON-LD desde `site.json`, validado contra schema.org |
| 5 | `af1c295` | Sitemap, 404 real, caché diferenciada, CSP y consentimiento |
| 6 | `f77b563` | NAP semántico y −1,69 MB en `/contacto` |
| — | `3cf9798` | Dominio canónico único (tres servían el mismo sitio) |
| 7 | `ac433d5` | CMS en `/admin` con OAuth propio |
| 8 | `daa207f` | Rutas `/en` con slugs traducidos y hreflang |

### El build ahora se defiende solo

`npm run build` falla, en vez de publicar, si:

- el `<div id="root">` queda vacío;
- aparecen los placeholders de `DEFAULT_CONTENT` (publicaría un equipo que no existe);
- falta el NAP, un canonical, un `og:*` o las Twitter Cards;
- dos páginas comparten título;
- el JSON-LD no parsea, o trae `Review`/`AggregateRating`;
- el `<html lang>` no coincide con el idioma de la ruta, o falta un `hreflang`;
- una página enlaza al otro idioma sin ser el selector;
- las dos listas de rutas o los dos dominios canónicos divergen;
- `site.json` queda inválido: teléfono sin formato internacional, ids repetidos, IDs de medición mal escritos, o el teléfono visible distinto del del schema.

Tres de esas validaciones detectaron errores reales **mientras se escribía esto**:
dos propiedades de schema.org que emití mal (`availableService` sobre `Dentist`,
`provider` sobre `MedicalProcedure`), una violación de CSP por las banderas del
selector de países, y un enlace en español en el footer inglés.

---

## 4. Lo que sigue en tus manos — Cloudflare

**Esto vale 0,9 puntos de la nota y es lo más barato de toda la lista.**

### 4.1. Desbloquear los rastreadores de IA (10 minutos)

Comprobado hoy, mismo IP, misma petición, solo cambia el user-agent:

| | |
|---|---|
| Chrome, Googlebot, Bingbot, Ahrefs, `curl` pelado, un bot inventado | **200** |
| GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot, Bytespider | **403** |

**Dónde:** Security → Bots (o Security → Settings → filtrar «Bot traffic») →
**Block AI bots** / *AI Scrapers and Crawlers*. Desactivar.
Revisa también WAF → Custom rules por si hay una regla manual.

**Recomendación:** abre búsqueda y respuestas (`OAI-SearchBot`, `PerplexityBot`,
`ChatGPT-User`) y decide aparte el entrenamiento (`GPTBot`, `CCBot`). Ser citado
por ChatGPT es el objetivo; ceder texto para entrenar no tiene por qué serlo.

### 4.2. robots.txt gestionado (10 minutos)

Cloudflare **reemplaza** tu `robots.txt`. El que sirve el dominio hoy no es el
del repositorio: antepone `Disallow: /` para GPTBot, ClaudeBot, Google-Extended
y CCBot, más `Content-Signal: ai-train=no`.

**Dónde:** Security → Settings → Bot traffic → *managed robots.txt* /
«Set your preference to block training in robots.txt». Desactivar.

El `public/robots.txt` del repositorio ya trae `Allow: /` explícito para
OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot, GPTBot y Google-Extended,
más `Sitemap:` y `Disallow: /admin`. **Está inerte hasta que desactives esa
opción.** El propio archivo lo documenta en su cabecera.

### 4.3. Comprobación

```bash
for UA in "GPTBot/1.2" "ClaudeBot/1.0" "OAI-SearchBot/1.0" "PerplexityBot/1.0"; do printf "%-20s " "$UA"; curl -sS -o /dev/null -m 20 -w "%{http_code}\n" -A "$UA" https://luxurysmilearchitects.eu; done
```

Los cuatro deben pasar de **403** a **200**. Y:

```bash
curl -sS https://luxurysmilearchitects.eu/robots.txt | head -20
```

Debe devolver el archivo del repositorio, sin el bloque «Cloudflare Managed content».

### 4.4. Después del despliegue

```bash
for P in / /en /tratamientos /en/treatments /contacto /ruta-que-no-existe; do printf "%-22s " "$P"; curl -sS -o /dev/null -m 20 -w "%{http_code}\n" "https://luxurysmilearchitects.eu$P"; done
```

Las cinco primeras **200**, la última **404**. Si la última da 200, el comodín
SPA sigue activo en algún sitio.

### 4.5. Search Console

Verifica el dominio, envía `https://luxurysmilearchitects.eu/sitemap.xml`, y
revisa **Páginas → Por qué no se indexan**. Es donde por fin se contrasta la
afirmación del PDF («1 URL indexada») y la del audio («nunca indexado»).

Hazlo **después** de los 301, no antes: no tiene sentido pedir indexación de
URLs que vas a redirigir.

---

## 5. Estado de la medición

### Qué dispara, y cuándo

| | Sin consentimiento | Aceptando |
|---|---|---|
| Peticiones a `facebook.net` / `google-analytics.com` | **ninguna** | gtag y fbq cargan |
| Google Consent Mode v2 | `denied` en los 4 | `granted` en los 4 |
| Violaciones de CSP | **0** | **0** |

Verificado en navegador real con IDs de prueba.

### Qué falta para medir conversiones de verdad

1. **Los IDs.** `tracking.metaPixelId` y `tracking.ga4MeasurementId` están
   vacíos en `site.json`, que es lo acordado. Vacío = apagado, sin errores.
   Se rellenan **desde el CMS**, con validación de formato, sin tocar código.
2. **Decisión legal.** Clínica sanitaria en España: el píxel exige base legal y
   consentimiento explícito. El banner ya lo pide; la decisión de activarlo no
   es técnica.
3. **Eventos de conversión.** Hoy solo se mide `PageView`. El formulario abre
   WhatsApp (`Contact.tsx`, `handleSubmit`) y ahí se pierde el rastro: sin un
   evento `Lead` en ese punto, Meta Ads no puede optimizar por conversión.
   **Es el trabajo que más falta para que la inversión en Ads se pueda medir**, y
   son un par de horas una vez decidido el punto 2.

---

## 6. Riesgos introducidos, y cómo revertir

### La limitación conocida: hidratación

Las páginas se prerenderizan serializando el DOM de un navegador. React espera
los marcadores `<!--$-->` que emite *su propio* renderizador de servidor, y un
DOM serializado no los tiene; además el serializador del navegador normaliza el
markup distinto a React (`object-position: 50% 0%;` frente a
`object-position:50% 0%`). Resultado: React descarta el HTML y vuelve a
renderizar en cliente (errores #418/#423 en consola).

**Impacto medido:** 156 muestras durante la carga, **0 fotogramas en blanco**,
contenido visible desde 479 ms. No afecta a rastreadores, que leen el HTML. El
coste es ruido en consola y un renderizado desperdiciado.

**Resolverlo del todo** exige SSR real con `renderToString` (3–5 h). El
obstáculo que me llevó a descartarlo —la app carga contenido y traducciones por
HTTP— ya no aplica: `src/lib/prerender-state.ts`, escrito en la Fase 1, es
justamente el mecanismo que lo resuelve.

### Reversión por fase

Cada fase es un commit. `git revert <sha>` deshace una sin tocar las demás,
salvo estas dependencias:

- Revertir la **Fase 1** obliga a revertir también 2, 4, 5 y 8: todas dependen
  del prerender.
- Revertir la **Fase 5** sin revertir la 1 deja el sitio sin `404.html` y sin
  comodín SPA. Restaura `/* /index.html 200` en `public/_redirects` si lo haces.
- La **Fase 7** (CMS) es aislable: `git revert ac433d5` y borrar `functions/`.
- La **Fase 8** es aislable pero deja `og:locale:alternate` anunciando una
  versión inexistente; quítalo también.

### Dependencias nuevas

| Paquete | Tipo | Por qué |
|---|---|---|
| `playwright` | dev | El navegador que prerenderiza |
| `@sveltia/cms` | dev | El CMS, vendorizado desde `node_modules` para no depender de un CDN |

Ninguna llega al bundle de producción. `npm audit --omit=dev --audit-level=high`
→ **exit 0**.

### Riesgo operativo

El CMS hace commits **como el usuario de GitHub que inicia sesión**, con
permiso de escritura sobre el repositorio. Y el repositorio es **público**: las
fotos de pacientes son descargables desde GitHub y **permanecen en el historial
de git** aunque se borren de la web. Para una clínica sanitaria eso merece una
decisión consciente: pasarlo a privado es gratis y son dos clics.

---

## 7. Alta de la OAuth App de GitHub

Ya la creaste, pero queda documentado para rehacerla.

1. `https://github.com/organizations/TrodriTen-Projects/settings/applications` →
   **New OAuth App**
2. Campos:

| Campo | Valor |
|---|---|
| Application name | `Luxury Smile CMS` |
| Homepage URL | `https://luxurysmilearchitects.eu` |
| **Authorization callback URL** | `https://luxurysmilearchitects.eu/api/auth/callback` |

3. **Register** → copia el **Client ID**
4. **Generate a new client secret** → GitHub lo muestra **una sola vez**
5. Cloudflare → Workers & Pages → `luxury-smile-architects` → Settings →
   Variables and Secrets, entorno **Production**:

| Nombre | Tipo |
|---|---|
| `GITHUB_CLIENT_ID` | Text |
| `GITHUB_CLIENT_SECRET` | **Secret** (cifrado) |

El secreto nunca pasa por el código ni por el repositorio: lo lee
`functions/api/auth/callback.js` del entorno.

---

## 8. Manual para el cliente

> Cópialo y mándalo tal cual. Sin jerga a propósito.

### Publicar un caso nuevo

**1. Entra.** Abre `luxurysmilearchitects.eu/admin` y pulsa **«Iniciar sesión
con GitHub»**. Se abre una ventana, aceptas y se cierra sola. Solo la primera
vez.

**2. Elige qué editar.** Verás **Contenido** con tres apartados:

- **Clínica, equipo y tratamientos** — datos de la clínica, las personas del
  equipo, los tratamientos, los casos antes/después y las reseñas.
- **Textos en español** — cualquier texto que se lea en la web.
- **Textos en inglés** — los mismos, en inglés.

**3. Sube el caso.** En «Clínica, equipo y tratamientos» baja hasta **Casos
antes y después** y pulsa **«Add Caso»**. Te pedirá dos fotos: la de antes y la
de después. Arrástralas y listo.

**4. Publica.** Pulsa **Save** arriba a la izquierda. Ya está.

**5. Espera unos minutos.** El cambio tarda entre **3 y 5 minutos** en verse en
la web. No hace falta hacer nada más ni avisar a nadie.

### Cosas que conviene saber

- **Si algo está mal escrito, no se publica.** El sistema comprueba los datos
  antes de subirlos: si un teléfono no tiene el formato correcto o falta un dato
  obligatorio, el cambio no llega a la web y no se rompe nada. Aviso: el error
  no te aparece en pantalla al guardar, así que si pasados diez minutos no ves
  el cambio, es esto — avisa a Tomás.
- **Las fotos de pacientes** se suben solas a la web con solo ponerlas en el
  apartado correspondiente. Asegúrate de tener el consentimiento firmado: una
  vez publicadas quedan registradas de forma permanente.
- **Los apartados de medición** (los códigos de Google y Meta) solo se tocan si
  Tomás te lo pide.
- **El apartado «Notas internas»** no se toca.
- **No hay ningún sitio donde puedas romper la web.** Los textos y las fotos son
  lo único editable; el funcionamiento no se toca desde aquí.

---

## 9. Lo que no se hizo, y por qué

- **No se migró de plataforma.** Nada de lo señalado lo exigía. La comparación
  está en `AUDITORIA-VERIFICADA.md`.
- **No se marcaron las reseñas como dato estructurado.** Están copiadas de
  Google y sus directrices lo prohíben. En un sitio sanitario, una acción manual
  cuesta más que unas estrellas en el snippet.
- **No se publicó `priceRange` ni `offers`.** No hay precios en el repositorio e
  inventarlos sería publicar una cifra que nadie aprobó.
- **No se añadió `alumniOf` ni colegiado a los `Person`.** No constan, y este es
  el último sitio donde conviene adivinarlos.
- **El chunk de `/contacto` bajó un 43%, no el 60% estimado.** Lo que queda es la
  metadata mínima que necesita la validación de teléfonos internacionales, y
  recortarla más significaría dejar de validar números de EE. UU., Colombia y
  México, que es de donde viene parte de la clientela.
- **No se auditó accesibilidad, RGPD ni publicidad sanitaria.** Para una clínica
  en España, el aviso legal, la política de privacidad y la normativa de
  publicidad sanitaria merecen una revisión aparte. No aparecen en ninguno de
  los dos informes, ni en el de Yussef ni en el mío.

---

## 10. Siguiente paso recomendado

Por orden de retorno:

1. **Hoy, 20 minutos:** desbloquear los bots de IA y el robots.txt gestionado
   (§4). Es 0,9 puntos de nota y el único trabajo que abre el canal GEO entero.
2. **Al desplegar:** enviar el sitemap en Search Console y comprobar los 404 y
   los 301 (§4.4).
3. **Esta semana:** el evento `Lead` en el formulario (§5), para que la
   inversión en Meta Ads se pueda medir.
4. **Cuando el cliente pueda:** los datos de `DATOS-PENDIENTES.md`, empezando
   por los números de colegiado.
5. **Lo que ninguna tecnología entrega sola:** gestión activa de Google Business
   Profile. Para una clínica de un solo local es, probablemente, el mayor lever
   de captación que existe — y no aparece ni en la auditoría de Yussef ni en su
   propuesta de migración.
