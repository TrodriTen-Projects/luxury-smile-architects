# Auditoría verificada — luxurysmile.es

**Verificación técnica independiente de la auditoría SEO/GEO/LLM de Yussef Co. (10 sept 2026)**
Fecha: 11 de septiembre de 2026 · Stack auditado: React 18 + Vite 7 + React Router 7, desplegado estático en Cloudflare Pages

---

## 1. Veredicto en una línea

**Migrar no es necesario: ninguno de los 12 problemas señalados exige cambiar de plataforma, y el más grave de todos — que ChatGPT, Claude y Perplexity no pueden leer la web — ni siquiera lo causa el código, sino dos ajustes del panel de Cloudflare que una migración no arreglaría.**

---

## 2. Resumen para el cliente

1. La auditoría tiene razón en el diagnóstico central: hoy el código de la web llega vacío a Google y a la IA. Eso es cierto y está verificado.
2. Pero el motivo por el que ChatGPT, Claude y Perplexity no ven la web **no es el que dice la auditoría**. Están literalmente bloqueados por el cortafuegos: reciben un "prohibido el paso" antes de llegar a la página.
3. Ese bloqueo lo activa una casilla del panel de Cloudflare. Se desactiva en **diez minutos, sin tocar el código y sin coste**.
4. Ese mismo bloqueo seguiría exactamente igual después de migrar, si el dominio sigue en Cloudflare. La migración no resuelve el problema que se usa para justificarla.
5. Tres de las afirmaciones de la auditoría son incorrectas: la web **sí** tiene seguridad por cabeceras reales, **sí** tiene el código dividido por páginas, y la falta de "datos estructurados" **no** deja la web fuera de las respuestas de Google con IA (Google lo dice expresamente).
6. El audio dice que la web "nunca ha sido indexada"; el propio informe escrito dice que hay una página indexada. Se contradicen. Los datos dan la razón al informe escrito.
7. Lo que sí hay que hacer: que la web se entregue ya "escrita" en lugar de vacía, añadir la ficha de la clínica en formato que entienden los buscadores, poner dirección y teléfono en el propio código, e imagen al compartir enlaces.
8. Todo eso se hace sobre la web actual. Estimación: **entre 3 y 6 días de trabajo**, según si se mantiene la versión en inglés.
9. La nota pasaría de aproximadamente 2,8/10 a **8,5/10**. Una web migrada daría prácticamente lo mismo, a un coste entre 10 y 20 veces mayor y rehaciendo todos los contenidos.
10. La auditoría sí acierta en un punto de fondo: hoy no pueden publicar casos nuevos sin desarrollador. Eso se resuelve con un gestor de contenidos sobre esta misma web (4–10 h), no migrando.

---

## 3. Fase 0 — Qué se pudo inspeccionar

**Inspeccionado y verificado:**

- `package.json`, `vite.config.ts`, `index.html`, `src/App.tsx` (router), `src/main.tsx`, `src/lib/i18n.ts`, `src/lib/content.ts`, las 6 páginas y los componentes de layout.
- `public/`: `robots.txt`, `_headers`, `_redirects`, `content/site.json`, `locales/{es,en}/translation.json`, `media/`.
- `.github/workflows/ci-cd.yml` (pipeline de despliegue a Cloudflare Pages).
- Build de producción ejecutado (`npm run build`) y `dist/index.html` leído literalmente.
- **Sitio en producción consultado por red** con 15 user-agents distintos, más cabeceras HTTP, DNS, `robots.txt` en vivo, subpáginas y URLs inexistentes.

**No existe en el repo:** `wrangler.toml`, `functions/`, `sitemap.xml`.

**No se pudo verificar** (requiere accesos del cliente): estado real del índice de Google, métricas Core Web Vitals de campo, configuración exacta del panel de Cloudflare, Google Business Profile, datos de Analytics. Se detalla en §8 qué consultar y qué respuesta confirmaría o refutaría cada punto.

### 3.1. El HTML tal como lo recibe un rastreador

Salida literal de `npm run build && cat dist/index.html` (sección `<body>`):

```html
<body>
  <div id="root"></div>
</body>
```

**El `<body>` sale vacío.** Confirmado. Todo el contenido — títulos, tratamientos, equipo, dirección, teléfono — sólo existe después de que el navegador ejecute JavaScript. Esta es la parte del diagnóstico de la auditoría que es correcta y que hay que conceder sin rodeos.

En producción se sirve exactamente el mismo HTML (2.838 bytes), más un script de detección de bots que inyecta Cloudflare.

### 3.2. Hallazgo no detectado por la auditoría: los bots de IA reciben 403

Misma IP, misma petición, mismo segundo. Lo único que cambia es el user-agent:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -A "<user-agent>" https://luxurysmile.es
```

| User-agent | Resultado |
|---|---|
| Chrome (navegador normal) | **200** — 2.838 bytes |
| Googlebot | **200** — 2.838 bytes |
| Bingbot | **200** — 2.838 bytes |
| AhrefsBot / SemrushBot | **200** |
| facebookexternalhit | **200** |
| `curl/8.5.0` sin más | **200** |
| Un user-agent de bot inventado por mí | **200** |
| **GPTBot** (OpenAI, entrenamiento) | **403 Forbidden** — 25 bytes |
| **OAI-SearchBot** (OpenAI, **búsqueda de ChatGPT**) | **403 Forbidden** |
| **ChatGPT-User** (navegación en vivo de ChatGPT) | **403 Forbidden** |
| **ClaudeBot** (Anthropic) | **403 Forbidden** |
| **PerplexityBot** | **403 Forbidden** |
| **Bytespider** (TikTok/ByteDance) | **403 Forbidden** |

Cuerpo de la respuesta 403, íntegro: `Your request was blocked.` Servida por `Server: cloudflare`, sin `cf-cache-status`, es decir **antes de llegar a Cloudflare Pages**.

El bloqueo no es genérico contra bots: un user-agent inventado pasa, AhrefsBot pasa, `curl` pelado pasa. **Sólo está bloqueada la lista curada de rastreadores de IA.** Eso corresponde a la regla gestionada *"Block AI bots"* de Cloudflare (Security → Bots, o Security → Settings → Bot traffic en los paneles nuevos), o a una regla WAF equivalente.

### 3.3. Segundo bloqueo: Cloudflare está reescribiendo el `robots.txt`

El `robots.txt` que se sirve **no es** el del repositorio. `public/robots.txt` contiene dos líneas (`User-agent: * / Allow: /`). Lo que devuelve el dominio en vivo es el archivo gestionado de Cloudflare, que antepone:

```
User-agent: *
Content-Signal: search=yes,ai-train=no,use=reference
Allow: /

User-agent: ClaudeBot
Disallow: /

User-agent: GPTBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: CCBot
Disallow: /
...
```

Es decir: **la propia configuración del dominio le está diciendo explícitamente a GPTBot, ClaudeBot y Google-Extended que no entren**, y además el cortafuegos les responde 403 si lo intentan. Doble cerrojo, ninguno de los dos en el código.

> **Consecuencia decisiva para la decisión:** el canal GEO no está roto por el renderizado. Está cerrado por configuración. Si la web se migrase a cualquier otra plataforma manteniendo el DNS en Cloudflare con estos ajustes, **los bots de IA seguirían recibiendo 403 exactamente igual**. La migración que propone la auditoría no resuelve el problema que la auditoría usa como argumento principal.

### 3.4. Otros dos hallazgos que la auditoría no recoge

**Toda URL inexistente devuelve HTTP 200 con HTML.** La regla `/*  /index.html  200` de `public/_redirects` no excluye nada:

```
/esta-pagina-no-existe-12345   → HTTP 200, text/html, 2.838 bytes
/sitemap.xml                   → HTTP 200, text/html  (no existe el sitemap)
/assets/no-existe.js           → HTTP 200, text/html
```

No hay ningún 404 en todo el sitio. Para Google esto son *soft 404* y es un problema de higiene de índice más serio que el canonical ausente.

**`https://www.luxurysmile.es` no responde.** `http://www.` redirige 301 a `https://www.`, que agota el tiempo de espera. El DNS resuelve a las mismas IPs de Cloudflare que el dominio raíz, pero el host `www` no está enlazado al proyecto de Pages. Cualquier enlace entrante a `www` está muerto.

---

## 4. Fase 1 — Verificación de las 12 variables

Leyenda de la última columna: **NO-código** = se arregla en este repo · **NO-CF** = es configuración de Cloudflare · **SÍ** = exige migrar · **DEPENDE**.

| # | Afirmación de la auditoría | Veredicto | Evidencia | Impacto real | ¿Exige migrar? |
|---|---|---|---|---|---|
| **01** | *Renderizado.* CSR puro, body vacío, invisible para IA. **0/10 CRÍTICO** | **CONFIRMADO** (con una imprecisión) | `dist/index.html` → `<body><div id="root"></div></body>`. Producción idéntica. | **Alto y real.** Es la causa raíz de #08, #10 y #11. GPTBot/ClaudeBot/PerplexityBot no ejecutan JS: confirmado. **Imprecisión:** Bingbot **sí** renderiza JS desde 2019 (motor Chromium), y Googlebot también. Meterlos en el mismo saco es incorrecto — de hecho la home *está* indexada, lo que prueba que Googlebot renderiza. | **NO-código** |
| **02** | *Metadata.* Title OK, description 198 car. **6/10 ATENCIÓN** | **CONFIRMADO** | `index.html:10-11` → 199 caracteres (medido). Title 32 car. (la auditoría dice 34). | **Bajo.** Google reescribe snippets el ~70% de las veces. Merece arreglarse por ser 15 minutos, no por su impacto. | **NO-código** |
| **03** | *Open Graph.* Faltan `og:url`, `og:image`; Twitter Cards ausentes. **2/10 CRÍTICO** | **CONFIRMADO** | `index.html:17-22`: sólo `og:type`, `og:title`, `og:description`, `og:locale`. Cero `twitter:*`. | **Alto para este negocio.** Cada enlace compartido por WhatsApp o DM de Instagram sale sin imagen. Para una clínica cuyo canal principal hoy es Meta Ads, es pérdida directa de clic. No es SEO (no es factor de ranking), es conversión — pero el impacto es real. | **NO-código** |
| **04** | *Hreflang.* No existe; ES y EN "compiten en Google". **1/10 CRÍTICO** | **PARCIAL — el mecanismo descrito es FALSO, el problema real es mayor** | No hay `hreflang` (grep en `index.html` y `src/`). Pero además: **no existe ninguna URL en inglés**. `LanguageSwitcher.tsx:23` llama a `i18n.changeLanguage()` y persiste en `localStorage` (`i18n.ts:25-28`). No hay rutas `/en/*` en `App.tsx`. | ES y EN **no compiten**: sólo hay una URL, y el inglés es estado de cliente. Google no puede indexar la versión EN bajo ninguna dirección. Arreglarlo no es añadir una etiqueta, es añadir rutas. **Pero:** "pérdida total de tráfico internacional" está descalibrado para una clínica de un solo local en Madrid, donde el inglés es un nicho (expatriados), no un canal. | **NO-código** (pero es el arreglo más caro) |
| **05** | *JSON-LD.* Ausente. "Sin schema el sitio es **inelegible** para Google AI Overviews." **0/10 CRÍTICO** | **CONFIRMADO el hecho / FALSA la consecuencia** | Cero `application/ld+json` en todo el repo (grep). El schema **sí** falta, y debe añadirse. | **Medio.** Google declara expresamente que **no hay requisitos técnicos especiales de schema** para aparecer en AI Overviews ni en AI Mode, y que los datos estructurados **no son factor de ranking**. "Inelegible" es falso — y es justamente la frase que el audio repite. El schema sirve para desambiguar la entidad, habilitar resultados enriquecidos y dar hechos limpios a los LLM. Eso vale, pero no es lo que impide hoy aparecer en IA (§3.2). | **NO-código** |
| **06** | *Canonical.* Ausente; riesgo de duplicados. **0/10 CRÍTICO** | **CONFIRMADO, y hay dos problemas peores que no detecta** | No hay `rel=canonical`. Además: **toda URL inexistente devuelve 200 + HTML** (`_redirects:5`), incluidos `/sitemap.xml` y `/assets/*`. Y **`https://www.luxurysmile.es` agota el tiempo de espera** — el host `www` no está enlazado al proyecto de Pages. | **Medio.** El canonical ausente es menor con una sola URL real. Los *soft 404* generalizados y el `www` muerto sí son problemas de verdad, y la auditoría no los encontró. | **NO-código** + **NO-CF** |
| **07** | *CSP.* "Vía `meta http-equiv`, menos eficaz que header HTTP". Bloquea GA/GTM/Meta Pixel. **5/10 ATENCIÓN** | **FALSA la primera mitad / CONFIRMADA la segunda** | **Falso:** la CSP se sirve como **cabecera HTTP real** en producción — comprobado en la respuesta 200, incluyendo `frame-ancestors 'none'`, que una etiqueta `meta` no puede emitir. Está en `public/_headers:4`, que la auditoría no abrió. Junto a HSTS con `preload`, COOP, CORP, Permissions-Policy, `nosniff` y SRI en los bundles. **Cierto:** `script-src 'self'; connect-src 'self'` bloquea Meta Pixel, GA4 y GTM. | La seguridad técnica es de las **partes más fuertes** del sitio, muy por encima de la media del sector. El auditor miró el código fuente y no las cabeceras. **Pero el punto del tracking es correcto y caro:** una clínica que invierte en Meta Ads **sin píxel en la web** no puede medir conversiones ni optimizar campañas. Hallazgo adicional: el script de detección de bots de Cloudflare es *inline* y **lo bloquea la propia CSP del sitio**. | **NO-CF** (una línea en `_headers`) |
| **08** | *Indexación.* 1 URL indexada; el script de Cloudflare "puede bloquear bots menores"; "las rutas internas no se rastrean". **1/10 CRÍTICO** | **PARCIAL / NO VERIFICABLE DESDE EL REPO** | Las 6 rutas devuelven **200 a Googlebot** con el mismo shell de 2.838 bytes. **No existe `sitemap.xml`** (la URL responde 200 sirviendo HTML). El script de challenge existe (verificado en el HTML servido). | "Las rutas internas no se rastrean" es **impreciso**: son rastreables y Googlebot renderiza. Lo que las suprime es la ausencia de sitemap, la ausencia de enlaces internos en el HTML crudo y que todas rindan el mismo shell. El script de Cloudflare **no** es lo que bloquea bots: lo que bloquea es el 403 del WAF (§3.2), que el auditor no encontró. La cifra "1 URL indexada" **no es verificable sin Search Console** (§8). | **NO-código** |
| **09** | *GEO.* "ChatGPT, Perplexity, Claude y Gemini leen sólo el head. El sitio no existe para ningún motor de respuesta IA." **1/10 CRÍTICO** | **CONFIRMADO el resultado — FALSA la causa, y la causa real es peor** | GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot y Bytespider reciben **HTTP 403** de Cloudflare. Googlebot, Bingbot, Ahrefs, `curl` y un bot inventado reciben 200. Además Cloudflare reescribe `robots.txt` con `Disallow: /` para GPTBot, ClaudeBot y Google-Extended, y `Content-Signal: ai-train=no`. (§3.2, §3.3) | **Crítico y correctamente señalado como tal — pero mal explicado.** No "leen sólo el head": **no leen nada**, reciben un 403 antes del HTML. Es el hallazgo más importante de todo el expediente y cambia la decisión: **son dos casillas del panel, diez minutos, cero código, cero coste. Y una migración no lo arregla.** Matiz técnico adicional: Google-Extended no es un rastreador, es un token de control en `robots.txt`; no visita páginas. | **NO-CF** — y explícitamente **no** se arregla migrando |
| **10** | *EEAT.* Sin schema `Person` para el Dr. Prato, sin formación ni casos rastreables. **2/10 CRÍTICO** | **CONFIRMADO** | Sin `Person`. `src/pages/Team.tsx` sí renderiza bios desde `site.json`, pero en cliente: no llegan al HTML. | **Alto** en un sector YMYL (salud). Matiz: los "117K seguidores" corresponden a la marca global / cuenta personal; la cuenta de Madrid ronda los 9K. La auditoría transfiere al sitio de Madrid una autoridad que es de otra entidad — que es justo la brecha que denuncia. **Este punto está bloqueado por contenido del cliente, no por la plataforma**: en cualquier stack seguiría sin resolverse hasta que alguien escriba las bios y los casos. | **NO-código** (bloqueado por contenido) |
| **11** | *NAP.* Dirección incompleta, teléfono "completamente ausente del HTML". **3/10 ATENCIÓN** | **PARCIAL** | Cierto en el HTML **servido**. Falso respecto al repo: `public/locales/es/translation.json:218` contiene "Barrio de Salamanca, **28001** Madrid", `:220` el teléfono `+34 659 716 995` y `:222` el WhatsApp `+34 689 440 906`. `site.json:283` tiene la dirección completa. | Los datos **ya existen**; sólo no llegan al HTML por el CSR. El prerender los publica **sin escribir un solo dato nuevo**. Problema real que la auditoría no vio: **hay dos teléfonos distintos** en el contenido. El NAP exige un único número canónico, idéntico al de Google Business Profile. | **NO-código** |
| **12** | *Performance.* "Bundle JS único **sin code splitting**". **PENDIENTE / N-D** | **FALSO en la premisa** | `src/App.tsx:6-11` usa `React.lazy()` por ruta. El build emite chunks separados: `Home 10,5 kB`, `Treatments 3,7 kB`, `Team 3,9 kB`, `Results 5,0 kB`, `About 10,7 kB`, más `carousel`, `dialog` y `button` aparte. | El code splitting **existe**. Problema real no detectado: **`Contact-DYBMsBgx.js` pesa 535 kB** (130 kB gzip) porque `react-phone-number-input` arrastra todas las banderas y los metadatos de libphonenumber (`Contact.tsx:3-8`). Eso sí amenaza LCP/INP, pero **sólo en `/contacto`**. Marcar la variable como PENDIENTE fue correcto; afirmar "sin code splitting" no. | **NO-código** |

### 4.1. Contradicciones entre el audio y el PDF

1. **Indexación.** Audio: *"Indexabilidad directamente nunca han sido indexado a Google."* PDF #08: *"Google tiene indexada 1 sola URL (homepage)."* Contradicción directa. Una búsqueda web devuelve `https://luxurysmile.es/` con un extracto que reproduce la meta description — coherente con el PDF y con que los buscadores leen el `<head>` y nada más. **El audio exagera en contra del sitio.**

2. **"La única que está aprobada."** El audio presenta #02 (Metadata) como lo único que pasa. Pero el PDF puntúa #07 con 5/10, en la misma banda ATENCIÓN que el 6/10 de #02. Además, la leyenda del PDF define un nivel **SÓLIDO** que **ninguna variable recibe**: "aprobada" es glosa del audio, no calificación del informe.

3. **"No pueden posicionarse."** Audio, sobre #04: *"todo lo que es SEO Internacional no lo tienen ustedes, es decir, no pueden posicionarse."* El PDF acota el daño al tráfico internacional. El audio lo generaliza a que la web no puede posicionar en absoluto — **falso**, y es la afirmación más engañosa del audio para un cliente que no puede contrastarla.

4. **"Leen sólo el head."** Audio y PDF #09 coinciden. Ambos son imprecisos en la misma dirección: esos rastreadores descargan el **documento entero**; lo que ocurre es que el body está vacío. Irrelevante para la conclusión, pero revela que el mecanismo no se comprobó. Y en este caso concreto la realidad es otra: reciben 403 y no leen nada (§3.2).

5. **"Es simplemente un template, una plantilla prediseñada."** Falsable y **falso**. El repositorio contiene i18n propio con detección y backend HTTP, capa de contenido editable por JSON, CSP y SRI escritos a mano, pipeline propio de medios (`scripts/gen-media-index.mjs`, `scripts/compress-videos.mjs`), code splitting por ruta, validación con Zod, saneado con DOMPurify, y CI con CodeQL y `npm audit` como puerta dura. Sea cual sea su déficit de SEO, no es una plantilla. La metáfora de "la casa sin suelo" es retórica comercial: describe con precisión el `<body>` vacío y, aplicada al resto, es falsa.

6. **Acceso ⇒ migración.** El audio abre con que el cliente no puede manipular la web y cierra concluyendo que hay que migrarla. La premisa es cierta (§7); la conclusión no se sigue. Es un argumento a favor de un gestor de contenidos, no de cambiar de plataforma.

### 4.2. ¿Está calibrado el 1.9/10?

La aritmética es honesta: las 11 variables puntuadas suman 21, y 21/11 = 1,909. Lo que no está calibrado son las entradas.

De las 12 variables, **8 se etiquetan CRÍTICO**. Cuando dos tercios de un informe son críticos, la etiqueta deja de discriminar. Tres de esos ocho descansan sobre afirmaciones que no resisten verificación (#05 "inelegible", #07 "sólo meta tag", #04 "compiten en Google"), y el nivel **SÓLIDO** de la propia leyenda no se concede ni una vez — ni siquiera a una configuración de seguridad que está por encima de la media del sector.

| # | Auditor | Mío | Diferencia y motivo |
|---|---|---|---|
| 01 | 0 | **1** | El `<head>` está bien construido y Googlebot renderiza; la home está indexada. Un 0 absoluto no describe eso. |
| 02 | 6 | **6** | De acuerdo. |
| 03 | 2 | **2** | De acuerdo. Severidad correcta, por motivo comercial y no de SEO. |
| 04 | 1 | **3** | El defecto es real y mayor de lo descrito, pero el impacto para una clínica de un local en Madrid no es crítico. |
| 05 | 0 | **1** | Falta de verdad y hay que añadirlo; pero la consecuencia declarada ("inelegible") es falsa. |
| 06 | 0 | **2** | El canonical importa poco con una URL; los *soft 404* y el `www` muerto importan más y no se detectaron. |
| 07 | 5 | **7** | **La mayor discrepancia.** La CSP es cabecera HTTP real, con HSTS preload, COOP, CORP y SRI. El descuento se lo lleva el bloqueo del píxel, que sí es un coste real. |
| 08 | 1 | **2** | Las rutas son rastreables y devuelven 200; falta sitemap y sobran *soft 404*. |
| 09 | 1 | **0** | **Peor que lo que dice el auditor**: no es que lean poco, es que reciben 403. Y es lo más barato de arreglar. |
| 10 | 2 | **3** | De acuerdo en la sustancia; bloqueado por contenido del cliente, no por el stack. |
| 11 | 3 | **4** | Los datos existen en el repo; sólo no llegan al HTML. |
| 12 | N/D | **5** (provisional) | El code splitting existe. Un chunk desmedido en `/contacto`. Sin datos de campo. |

**Media actual verificada: 2,8/10** sobre las mismas 11 variables (frente a 1,9/10). La diferencia se explica casi íntegramente por #07 y por la calibración de #04 y #11. **La foto de fondo no cambia: la web está mal para SEO y GEO, y hay que intervenirla.** Lo que cambia es dónde está el problema y cuánto cuesta arreglarlo.

### 4.3. Lo que cuesta tráfico hoy vs. deuda técnica sin impacto medible

**Cuesta clientes hoy, de forma medible:**
- El 403 a los bots de IA (#09) — canal GEO cerrado al 100%.
- El `<body>` vacío (#01) — limita a Google y anula Bing y toda la IA.
- Sin `og:image` (#03) — cada enlace compartido pierde clic, hoy, en el canal que ya usan.
- Sin píxel de Meta (#07) — invierten en Meta Ads sin poder medir conversión en web.
- NAP fuera del HTML (#11) y sin Google Business Profile optimizado — para una clínica local, el mayor lever de todos.

**Deuda técnica real pero de impacto menor para este negocio:**
- Canonical (#06) — con una sola URL indexada, hoy no erosiona nada.
- Hreflang y rutas EN (#04) — sólo importa si de verdad atienden pacientes anglófonos.
- Chunk de 535 kB en `/contacto` (#12) — una sola página, y no es la de entrada.
- Meta description de 199 car. (#02) — Google reescribe snippets la mayoría de las veces.

---

## 5. Fase 2 — La decisión

### 5.1. Comparación de nota proyectada

| # | Variable | Hoy (verificado) | Remediado en sitio | Migrado |
|---|---|---|---|---|
| 01 | Renderizado | 1 | **9** | 9 |
| 02 | Metadata | 6 | **9** | 9 |
| 03 | Open Graph | 2 | **9** | 9 |
| 04 | Hreflang | 3 | **8** | 8 |
| 05 | JSON-LD | 1 | **9** | 9 |
| 06 | Canonical | 2 | **9** | 9 |
| 07 | Seguridad / CSP | 7 | **8** | 5–7 · *suele empeorar* |
| 08 | Indexación | 2 | **8** | 8 |
| 09 | GEO | 0 | **9** | **0 si no se toca Cloudflare** |
| 10 | EEAT | 3 | **7** | 7 · *igual: depende del contenido* |
| 11 | NAP | 4 | **9** | 9 |
| **Media (11 var.)** | | **2,8 / 10** | **8,5 / 10** | **8,5 / 10** *(0,7 puntos menos si no se desbloquea Cloudflare)* |

Tres observaciones sobre la columna "Migrado":

- **#09 no mejora migrando.** El 403 lo emite Cloudflare por user-agent, antes de llegar al hosting. Mientras el DNS siga en Cloudflare con "Block AI bots" activo, el nuevo sitio recibe el mismo 403. La migración no toca la causa.
- **#03, #05, #06 y #11 exigen el mismo trabajo manual en cualquier plataforma.** Ningún CMS escribe solo el `MedicalProcedure` de la clínica, ni elige la `og:image`, ni decide cuál es el teléfono canónico. Se hace una vez, aquí o allí.
- **#07 normalmente empeora.** La configuración actual (CSP por cabecera, HSTS preload, SRI, COOP/CORP) es artesanal. Un CMS genérico carga scripts de terceros y rara vez sostiene una política así.

**Conclusión: el delta entre remediar en sitio y migrar es de 0 a 0,5 puntos**, a cambio de 10–20 veces el coste, reintroducir todo el contenido y perder una configuración de seguridad que hoy es un activo.

### 5.2. ¿El prerendering resuelve #01, #08 y #09?

**Para #01 y #08: sí, sin matizar.** Es el eje del argumento y no tiene contraindicaciones.

Prerenderizar en build significa que, al terminar `vite build`, un navegador headless abre cada ruta, deja que React pinte, y guarda el HTML resultante en `dist/tratamientos/index.html`, `dist/equipo/index.html`, etc. Cloudflare Pages sirve archivos estáticos antes de aplicar el fallback SPA, así que esos HTML se entregan **ya escritos** a cualquier rastreador, sin ejecutar una línea de JavaScript. El despliegue sigue siendo 100% estático en Cloudflare Pages: sin servidor, sin runtime, sin cambiar de hosting. React hidrata encima y la experiencia de usuario es idéntica — y mejor, porque el primer pintado deja de esperar al JS (lo que también mejora #12).

Con eso, `#01` deja de existir, y `#08` se resuelve junto con un `sitemap.xml` generado en el mismo build.

**Para #09: es necesario pero no suficiente, y debo decirlo con precisión porque es donde el expediente entero se decide.**

El prerender arregla *lo que los bots de IA leerían*. No arregla que **hoy no leen nada porque reciben un 403**. Un sitio perfectamente prerenderizado, con schema impecable, seguiría siendo invisible para ChatGPT, Claude y Perplexity mientras la casilla de Cloudflare siga activa. El orden correcto es: **primero se desbloquea Cloudflare (10 minutos), después el prerender le da algo que leer.** Invertir ese orden produce trabajo que no se puede medir.

**Herramienta recomendada:** un script propio de ~60 líneas con Playwright (o Puppeteer) que recorra las rutas sobre `vite preview`. Razón concreta de este repo: la app carga `/content/site.json` y `/locales/{lng}/translation.json` **por HTTP en tiempo de ejecución** (`src/lib/content.ts`, `src/lib/i18n.ts:21-23`). Un renderizador de Node como `vite-react-ssg` no resuelve esas URLs relativas y obligaría a reescribir la capa de i18n y la de contenido. Un navegador headless contra un servidor local las resuelve tal cual: **cero cambios en el código fuente**, salvo cambiar `createRoot` por `hydrateRoot` en `src/main.tsx` cuando el contenedor ya trae HTML. **`react-snap` está sin mantenimiento** (última publicación ~2020) y arrastra fricción conocida con React 18: no lo recomiendo aquí.

### 5.3. ¿Qué queda sin resolver tras aplicar todo lo posible en sitio? — Lista cerrada

1. **Publicación de contenido sin desarrollador.** Sigue requiriendo un commit y un rebuild. *(Se cubre con un CMS git-based sobre este mismo repo — §7.)*
2. **El cliente depende de un único desarrollador.** Ni el prerender ni el schema lo cambian.
3. **Un cambio de contenido tarda 2–4 minutos en publicarse** (build + despliegue), frente a segundos en un CMS con render en servidor. Irrelevante para unos pocos casos al mes.
4. **SEO/GEO como práctica continua** — contenidos, enlaces, reseñas, gestión de Google Business Profile. No lo entrega ningún stack.
5. **Los contenidos de EEAT (#10) no existen todavía**: bios, formación, casos documentados. Bloqueado por el cliente, en cualquier plataforma.
6. **Sin datos de campo de Core Web Vitals** hasta que haya tráfico indexado y CrUX acumule muestra.

### 5.4. ¿Algo de eso justifica por sí solo una migración?

**No.** Punto por punto: (1) se resuelve con un CMS sobre este repo, 4–10 h; (2) es organizativo y persiste igual tras migrar — cambiaría el proveedor del que se depende, no la dependencia; (3) es irrelevante a este volumen de publicación; (4) es un servicio, no una plataforma, y hay que contratarlo en cualquier escenario; (5) es contenido del cliente; (6) es cuestión de tiempo.

Ninguno, ni aislado ni sumado, compensa reconstruir un sitio funcional para ganar entre 0 y 0,5 puntos sobre 10.

---

## 6. Fase 3 — Plan de remediación sin migrar

### Orden de ejecución por impacto/esfuerzo

| Prioridad | Tarea | Bloque | Esfuerzo | Desbloquea |
|---|---|---|---|---|
| **1** | Desactivar "Block AI bots" + robots.txt gestionado | B | **20 min** | **#09 entero** |
| **2** | Acortar meta description a ~155 car. | A | 15 min | #02 |
| **3** | Enlazar o redirigir `www` | B | 30 min | #06 |
| **4** | **Prerendering en build** | A | **6–10 h** | **#01, #08, #10, #11, #12** |
| **5** | Head por página (canonical, og:url, og:image, Twitter) | A | 5–8 h | #03, #06 |
| **6** | JSON-LD | A | 4–6 h | #05, #10 |
| **7** | `sitemap.xml` + 404 real | A | 3–5 h | #06, #08 |
| **8** | CSP para Meta Pixel + analítica | B | 45 min | #07 |
| **9** | Bloque NAP en el HTML | A | 1–2 h | #11 |
| **10** | Adelgazar el chunk de `/contacto` | A | 2–3 h | #12 |
| **11** | Rutas `/en/` + hreflang | A | **8–14 h** | #04 |

### Bloque A — Código, sobre el repositorio actual

---

**A1 · Prerendering en build** — *6–10 h · impacto máximo · riesgo medio*

- **Problema:** `dist/index.html` entrega `<body><div id="root"></div></body>`. Todo el contenido exige JS.
- **Solución:** script `scripts/prerender.mjs`. Tras `vite build`, levanta `vite preview`, abre las 6 rutas con Playwright, espera a que i18n y `site.json` hayan cargado, serializa el DOM y escribe `dist/<ruta>/index.html`. Añadir `"postbuild": "node scripts/prerender.mjs"` en `package.json`.
- **Archivos:** `scripts/prerender.mjs` (nuevo), `package.json`, `src/main.tsx` (`createRoot` → `hydrateRoot` condicional), `.github/workflows/ci-cd.yml` (instalar el navegador en CI).
- **Dependencias nuevas:** `playwright` (devDependency).
- **Impacto:** resuelve #01 y #08; publica gratis el NAP (#11) y las bios (#10); adelanta el primer pintado (#12).
- **Riesgo:** desajustes de hidratación por contenido dependiente de `localStorage` o de tiempo. Mitigación: forzar `es` en el prerender y revisar la consola en las 6 rutas. **Reversible al 100%** — se quita el `postbuild` y todo vuelve al estado actual.

---

**A2 · JSON-LD** — *4–6 h · riesgo nulo*

- **Problema:** cero datos estructurados.
- **Solución:** `src/lib/schema.ts` que genere, desde `site.json` y los locales (los datos ya están):
  - `Dentist` (subtipo de `LocalBusiness` y `MedicalBusiness`) con `PostalAddress` completa (Calle de Recoletos 20, 28001, Madrid, ES), `GeoCoordinates`, `ContactPoint`, `openingHoursSpecification`, `priceRange`, `sameAs` → Instagram y ficha de Fotona.
  - `Person` para el Dr. Martín Prato: `jobTitle`, `alumniOf`, `knowsAbout`, `worksFor`, `sameAs`.
  - `MedicalProcedure` por cada tratamiento de `site.json`.
  - `WebSite` + `BreadcrumbList` por página.
- **Archivos:** `src/lib/schema.ts` (nuevo), las 6 páginas, `index.html`.
- **Dependencias:** ninguna. Es un `<script type="application/ld+json">`.
- **Impacto:** desambiguación de entidad, elegibilidad para resultados enriquecidos, hechos limpios para los LLM. **No** es lo que hoy impide aparecer en IA — eso es el 403.
- **Riesgo:** nulo. Validar en Rich Results Test y Schema.org Validator.

---

**A3 · Head por página** — *5–8 h · riesgo bajo*

- **Problema:** `title`, `description`, `canonical` y Open Graph son globales; las 6 rutas comparten metadatos.
- **Solución:** `react-helmet-async` (o un hook propio de ~40 líneas, que evita la dependencia y funciona igual con el prerender). Por ruta: `title`, `description`, `link rel=canonical` absoluto, `og:url`, `og:image`, `og:type`, `twitter:card=summary_large_image`, `twitter:title/description/image`.
- **Archivos:** `src/lib/seo.ts` (nuevo), las 6 páginas, `src/main.tsx`.
- **Dependencias:** `react-helmet-async` (opcional).
- **Impacto:** #03 y #06. Los enlaces compartidos pasan a mostrar imagen.
- **Riesgo:** bajo. Debe ejecutarse **después** de A1 para que el prerender capture las etiquetas.

---

**A4 · Imagen social (`og:image`)** — *1–2 h · riesgo nulo*

- **Problema:** no existe imagen de previsualización. `public/favicon.svg` es lo único.
- **Solución:** generar `public/og-default.jpg` a 1200×630 desde `media/images/hero-main.jpg` con `sharp` (ya está en devDependencies), más una variante por sección si se quiere afinar.
- **Archivos:** `scripts/gen-og-images.mjs` (nuevo), `public/og-*.jpg`.
- **Impacto:** directo y visible en WhatsApp e Instagram desde el primer despliegue.

---

**A5 · `sitemap.xml`** — *1–2 h · riesgo nulo*

- **Problema:** no existe. La URL responde 200 sirviendo HTML, lo que la hace inválida para Search Console.
- **Solución:** generarlo en el `postbuild` a partir de la misma lista de rutas que usa A1, con `lastmod`. Referenciarlo desde `robots.txt`.
- **Archivos:** `scripts/prerender.mjs` (extender), `public/robots.txt`.
- **Impacto:** #08. Es el primer paso para que Google descubra las 5 páginas que hoy ignora.

---

**A6 · 404 real** — *2–3 h · riesgo bajo*

- **Problema:** `_redirects:5` reescribe **todo** a `index.html` con 200. Toda URL inexistente es un *soft 404*.
- **Solución:** con A1, las rutas válidas existen como archivos reales y Pages las sirve directamente. Sustituir el fallback comodín por un `dist/404.html` (Cloudflare Pages lo sirve automáticamente con código 404) y limitar la regla SPA a las rutas conocidas. Cambiar además `<Route path="*" element={<Navigate to="/" />}>` en `App.tsx:23` por una página 404 de verdad.
- **Archivos:** `public/_redirects`, `src/App.tsx`, `src/pages/NotFound.tsx` (nuevo).
- **Riesgo:** bajo, pero **desplegar después de A1** — antes de que existan los HTML prerenderizados, romper el fallback tumbaría la navegación directa a subpáginas.

---

**A7 · Meta description a ~155 caracteres** — *15 min · riesgo nulo*

- **Problema:** 199 caracteres (medido); Google trunca y se pierde la dirección.
- **Solución:** reescribir priorizando NAP. Propuesta (152 car.): *"Odontología estética en el Barrio de Salamanca, Madrid. Diseño de sonrisa con el Dr. Martín Prato. Calle de Recoletos 20 · +34 689 440 906."*
- **Archivos:** `index.html:10-11`.

---

**A8 · Bloque NAP en el HTML** — *1–2 h · riesgo nulo*

- **Problema:** dirección y teléfono sólo existen tras ejecutar JS.
- **Solución:** bloque en el `Footer` con `<address>`, `<a href="tel:">` y horarios, marcado con microdatos. Tras A1 aparece en el HTML de las 6 páginas.
- **Archivos:** `src/components/layout/Footer.tsx`, locales.
- **Dependencia previa:** **decidir cuál es el teléfono canónico.** Hoy conviven `+34 659 716 995` y `+34 689 440 906` (`locales/es/translation.json:220,222`). Debe coincidir exactamente con Google Business Profile.

---

**A9 · Adelgazar el chunk de `/contacto`** — *2–3 h · riesgo bajo*

- **Problema:** `Contact-DYBMsBgx.js` = 535 kB (130 kB gzip) por `react-phone-number-input` con todas las banderas y metadatos.
- **Solución:** usar `react-phone-number-input/input` con `min` metadata, o cargar las banderas con `import()` diferido. Reducción estimada: 60–75%.
- **Archivos:** `src/pages/Contact.tsx:3-8`, `src/lib/validation.ts:2`.
- **Riesgo:** bajo; validar que la validación E.164 sigue aceptando los prefijos que usan.

---

**A10 · Rutas `/en/` + hreflang** — *8–14 h · riesgo medio · **opcional***

- **Problema:** no hay ninguna URL en inglés. El idioma es estado de `localStorage`. `og:locale:alternate=en_US` anuncia una versión que no tiene dirección.
- **Solución:** prefijo de idioma en el router (`/` y `/en/`), sincronizar i18n con la ruta en vez de con `localStorage`, `link rel=alternate hreflang` recíproco (es-ES, en, x-default), y prerenderizar las 12 combinaciones.
- **Archivos:** `src/App.tsx`, `src/lib/i18n.ts`, `src/components/LanguageSwitcher.tsx`, `Navbar`, `Footer`, `scripts/prerender.mjs`.
- **Riesgo:** medio. Toca el router y duplica la superficie prerenderizada.
- **Recomendación:** **no hacerlo hasta decidir si el inglés es un canal real.** Si no atienden pacientes anglófonos de forma habitual, es la peor relación impacto/esfuerzo de la lista. Si se descarta, **retirar `og:locale:alternate`** para no anunciar algo inexistente.

---

### Bloque B — Cloudflare, sin tocar código

---

**B1 · Desbloquear los rastreadores de IA** — *10 min · **la acción de mayor impacto de todo el plan***

- **Dónde mirar, en este orden:**
  1. **Security → Bots** (paneles nuevos: **Security → Settings → filtrar por "Bot traffic"**) → localizar **"Block AI bots"** / *"AI Scrapers and Crawlers"*. Es lo que produce el 403 de §3.2. Desactivar, o pasar a modo "sólo bloquear entrenamiento" si quieren permitir búsqueda y respuestas pero no entrenamiento.
  2. **Security → WAF → Custom rules** → comprobar si existe además una regla manual por user-agent.
  3. **Security → Bots → Bot Fight Mode.** Está inyectando `/cdn-cgi/challenge-platform/scripts/jsd/main.js` (verificado en el HTML servido). Revisar: puede penalizar rastreadores legítimos, y además ese script **inline lo bloquea la propia CSP del sitio**, así que hoy no está cumpliendo su función.
- **Verificación inmediata** (debe pasar de 403 a 200):
  ```bash
  curl -s -o /dev/null -w "%{http_code}\n" -A "GPTBot/1.2" https://luxurysmile.es
  curl -s -o /dev/null -w "%{http_code}\n" -A "ClaudeBot/1.0" https://luxurysmile.es
  curl -s -o /dev/null -w "%{http_code}\n" -A "OAI-SearchBot/1.0" https://luxurysmile.es
  ```
- **Decisión de negocio que corresponde al cliente:** bloquear bots de IA es una postura legítima para quien vende contenido. Para una clínica que **quiere ser recomendada** por ChatGPT, es contraproducente. Merece la pena distinguir: `OAI-SearchBot` y `PerplexityBot` alimentan **respuestas y citas** — ahí es donde está el negocio. `GPTBot` y `CCBot` son de **entrenamiento** y se pueden mantener cerrados sin coste comercial. Mi recomendación: abrir búsqueda y respuestas, decidir entrenamiento aparte.

---

**B2 · robots.txt gestionado** — *10 min*

- **Problema:** Cloudflare reescribe `/robots.txt` y antepone `Disallow: /` para ClaudeBot, GPTBot, Google-Extended, CCBot, Bytespider, Amazonbot, Applebot-Extended y meta-externalagent, más `Content-Signal: ai-train=no` (§3.3). El `public/robots.txt` del repo **no se está sirviendo**.
- **Dónde:** **Security → Settings → Bot traffic → "Set your preference to block training in robots.txt"** / *Managed robots.txt*. Desactivar, o ajustar los Content Signals a `search=yes, ai-input=yes, ai-train=no` si quieren aparecer en respuestas de IA sin ceder entrenamiento.
- **Verificación:** `curl https://luxurysmile.es/robots.txt` debe devolver el archivo del repo, sin el bloque "Cloudflare Managed content".
- **Después:** ampliar `public/robots.txt` con `Allow: /` explícito para GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot y PerplexityBot, y la línea `Sitemap: https://luxurysmile.es/sitemap.xml` (tras A5). Nota: **Google-Extended no es un rastreador** — es un token que controla el uso de datos ya rastreados por Googlebot para Gemini/Vertex; no visita el sitio. Se permite o no según la postura sobre entrenamiento, sin efecto sobre el rastreo.

---

**B3 · Arreglar `www`** — *20–30 min*

- **Problema:** `https://www.luxurysmile.es` agota el tiempo de espera. `http://www.` redirige 301 hacia ese host muerto. El DNS resuelve a Cloudflare, pero `www` no está enlazado al proyecto de Pages.
- **Solución:** en **Workers & Pages → luxury-smile-architects → Custom domains**, añadir `www.luxurysmile.es`; después crear una **Redirect Rule** (Rules → Redirect Rules) de `www` → apex, 301 permanente, conservando ruta y query. Alternativa sin enlazar el dominio: Redirect Rule sobre el hostname `www` directamente.
- **Verificación:** `curl -sIL https://www.luxurysmile.es` debe terminar en 200 sobre el apex.

---

**B4 · CSP para Meta Pixel y analítica** — *45 min*

- **Problema:** `script-src 'self'; connect-src 'self'` en `public/_headers:4` bloquea todo tracking externo. Invierten en Meta Ads sin medir conversión web.
- **Solución:** ampliar **sólo** lo imprescindible. Para Meta Pixel:
  ```
  script-src 'self' https://connect.facebook.net;
  connect-src 'self' https://www.facebook.com https://connect.facebook.net;
  img-src 'self' data: blob: https://www.facebook.com;
  ```
  Para analítica, mi recomendación es **Cloudflare Web Analytics**: sin cookies, sin banner de consentimiento, gratis, ya está en el mismo panel, y su beacon es de primera parte (`/cdn-cgi/`), lo que **no obliga a tocar la CSP en absoluto**. Si insisten en GA4, hay que añadir `https://www.googletagmanager.com` a `script-src` y `https://*.google-analytics.com` a `connect-src`, y entonces sí hace falta banner de consentimiento por RGPD.
- **Archivos:** `public/_headers` y la constante `CSP` de `vite.config.ts:16-31` (**mantener ambas sincronizadas** — está documentado en el propio archivo).
- **Riesgo:** cada origen añadido reduce la protección. Añadir sólo los que se vayan a usar de verdad; no abrir `'unsafe-inline'` en `script-src` bajo ningún concepto.
- **Nota RGPD:** clínica en España, datos de salud. Meta Pixel exige base legal y consentimiento explícito antes de disparar. Es una decisión legal, no técnica.

---

**B5 · Search Console y Business Profile** — *30 min + seguimiento*

- Verificar la propiedad de dominio, enviar `sitemap.xml` (tras A5), solicitar indexación de las 5 subpáginas, y revisar **Páginas → Por qué no se indexan** para contrastar la cifra de "1 URL indexada".
- **Google Business Profile:** para una clínica de un solo local, es probablemente el mayor lever de captación local, y **no aparece ni en la auditoría ni en la propuesta de migración**. NAP idéntico al del sitio, categorías, horarios, fotos, y gestión activa de reseñas.

---

### Lo que NO merece la pena hacer

| Acción | Por qué no |
|---|---|
| **Migrar de plataforma** | 0–0,5 puntos de ganancia por 10–20× el coste, reintroduciendo todo el contenido y perdiendo la configuración de seguridad actual. Y **no arregla #09**, que es el argumento con el que se vende. |
| **SSR (renderizado en servidor)** | No hay contenido dinámico por petición. El prerender en build da el mismo resultado SEO, mantiene el despliegue estático, cuesta menos y no añade runtime que mantener. |
| **Relajar la CSP en bloque** para "arreglar" #07 | Se perdería una de las pocas fortalezas reales del sitio. Sólo allowlist puntual. |
| **Rutas `/en/` (A10)** *si el inglés no es un canal real* | 8–14 h por el menor retorno de la lista para una clínica de un local en Madrid. Decisión del cliente. |
| **Perseguir 10/10 en #12** | Sin datos de campo no hay nada que optimizar. Primero indexación y tráfico, después CrUX. |
| **Bot Fight Mode tal como está hoy** | Su script es bloqueado por la propia CSP del sitio: no protege, y sí arriesga penalizar rastreadores legítimos. |

### Totales

| | Horas | Días de calendario |
|---|---|---|
| **Bloque B completo** (Cloudflare) | **2–3 h** | **1 día** — B1 y B2 hoy mismo |
| **Bloque A sin A10** | **21–34 h** | **3–5 días** |
| **Bloque A con A10** | **29–48 h** | **5–7 días** |
| **Total recomendado** (A sin A10 + B) | **23–37 h** | **4–6 días laborables** |

No incluye la producción de contenidos de EEAT (bios, formación, casos), que depende del cliente y va en paralelo.

---

## 7. Fase 4 — El punto débil de mi propio argumento

### 7.1. ¿Es real la necesidad de publicar casos sin desarrollador?

**Sí. Es real, es legítima, y es el argumento más fuerte de toda la auditoría.** No lo despacho como excusa comercial.

Para una clínica de estética dental, los casos antes/después son a la vez el principal activo de conversión y la principal señal de frescura y autoridad. Si publicar uno exige un desarrollador y un rebuild, la frecuencia de publicación tiende a cero — y eso es exactamente lo que ha pasado: **los últimos commits de contenido son de junio y hoy es septiembre.** El dato le da la razón al auditor.

Matiz técnico que sí conviene precisar: `site.json` y los índices de medios se cargan **en tiempo de ejecución**, y las fotos de pacientes y los reels aparecen solos al subirlos a `/public/media` (así está documentado en `site.json:_readme`). O sea, la arquitectura ya separa contenido de código. **Lo que falta no es arquitectura: es una interfaz de edición y un disparador de despliegue.** Eso es precisamente lo que aporta un CMS git-based, y por eso no hace falta migrar para conseguirlo.

### 7.2. CMS headless git-based sobre este mismo repo

Todas estas opciones escriben commits en el repositorio actual, disparan el CI que ya existe y despliegan en el mismo Cloudflare Pages. Sin cambiar de hosting, sin tocar el stack, sin reintroducir contenido.

| Opción | Esfuerzo | Notas |
|---|---|---|
| **Sveltia CMS** ⭐ *recomendada* | **4–8 h** | Reescritura moderna y mantenida de Decap, compatible con su `config.yml`. OAuth de GitHub integrado, buena gestión de imágenes, interfaz muy superior. La mejor relación esfuerzo/resultado aquí. |
| **Pages CMS** | 3–6 h | Muy ligero, configuración por YAML, alojado, cero infraestructura propia. La vía más rápida si sólo necesitan editar `site.json` y subir medios. |
| **Decap CMS** (ex-Netlify CMS) | 6–10 h | Maduro y muy extendido, pero mantenimiento lento. En Cloudflare Pages requiere montar el OAuth de GitHub con una Pages Function. |
| **Keystatic** | 8–12 h | Git-based, excelente tipado con TS, buen editor. Integración con Vite algo más laboriosa. |
| **TinaCMS** | 10–16 h | Edición visual sobre la página real, lo más vistoso para un cliente no técnico. Integración más pesada y su capa gestionada tiene coste. |

Flujo resultante: el cliente entra en `luxurysmile.es/admin`, sube fotos del caso, escribe el texto, pulsa publicar → commit → CI → desplegado en 3–5 minutos. **Sin desarrollador.**

**Lo que hay que conceder:** con el prerender activo, cada publicación exige un rebuild de 2–4 minutos. Para una clínica que publica unos pocos casos al mes es irrelevante; para un medio que publica cada hora no lo sería. Conviene decirlo abiertamente en vez de esconderlo.

### 7.3. Argumentos de la auditoría que resisten aunque se ejecute todo el plan

Anticipo los que, con razón, seguirán en pie:

1. **"Siguen dependiendo de un desarrollador para el código."** Cierto, y no lo arregla ninguna tecnología. Un CMS cubre el contenido, no el código. Cambiar de plataforma no elimina esa dependencia: la traslada a otro proveedor — que es quien vende la migración. Mitigación honesta: documentación de traspaso, acceso completo del cliente al repo y al panel de Cloudflare, y un retainer de soporte.

2. **"Nadie está haciendo SEO/GEO de forma continuada."** **Correcto, y es su mejor argumento.** Prerender, schema y sitemap son condición necesaria, no suficiente. Posicionar por "diseño de sonrisa Madrid" exige contenido regular, enlaces, reseñas y gestión de Google Business Profile. Ni esta web ni una migrada lo entregan solas. Ahora bien, esto justifica **contratar un servicio de SEO/contenidos** — no reconstruir la web. Son dos facturas distintas y conviene no confundirlas.

3. **"Los contenidos de EEAT no existen."** Cierto (#10). Bios, formación, colegiación, casos documentados. Bloqueado por el cliente en cualquier escenario: una web migrada tendría exactamente el mismo vacío.

4. **"La velocidad de publicación sigue atada a un build."** Cierto, mitigado, no eliminado (§7.2).

5. **"Hay que medir para saber si algo de esto funciona."** Cierto, y hoy no hay ni analítica ni píxel (#07). Va en el plan (B4), pero merece reconocerse como una carencia real y actual.

**Y los que no resisten la verificación:** "hay que migrar porque el sitio es invisible para la IA" (es una casilla de Cloudflare, y migrar no la desactiva); "sin schema es inelegible para AI Overviews" (Google dice expresamente lo contrario); "no hay code splitting" (lo hay, por ruta); "la CSP es sólo un meta tag" (es cabecera HTTP real desde `public/_headers`); "ES y EN compiten en Google" (no existe URL en inglés); "nunca ha sido indexado" (lo contradice su propio PDF).

---

## 8. Lo que necesito que me facilites

### 8.1. Accesos

| Acceso | Para qué | Qué confirmaría o refutaría |
|---|---|---|
| **Cloudflare — Security → Bots / Settings** | Confirmar el origen exacto del 403 y desactivarlo | Si "Block AI bots" está activo → confirma §3.2 y se resuelve #09 en 10 min. Si está inactivo, hay una regla WAF manual y hay que buscarla en Custom rules |
| **Cloudflare — Security → WAF → Custom rules** | Descartar una regla manual por user-agent | Cualquier regla que discrimine por UA de IA |
| **Cloudflare — Managed robots.txt / Content Signals** | Confirmar §3.3 y devolver el control al repo | `curl https://luxurysmile.es/robots.txt` debe devolver el archivo del repo |
| **Cloudflare — Workers & Pages → Custom domains** | Arreglar `www` | Si `www.luxurysmile.es` no figura, confirma §3.4 |
| **Cloudflare — DNS** | Verificar registros del apex y de `www` | — |
| **Google Search Console** | **Contrastar la afirmación clave del PDF y del audio** | **Cobertura → Páginas:** si muestra 1 indexada y 5 excluidas → el PDF acierta y el audio miente. Si muestra 0 → acierta el audio. **Revisa también "Por qué no se indexan"**: "Rastreada, no indexada" apunta a contenido delgado; "Descubierta, no rastreada" apunta a falta de sitemap |
| **Google Analytics / cualquier analítica** | Saber si existe alguna medición | Probablemente ninguna: la CSP la bloquea |
| **Google Business Profile** | Verificar el NAP y el lever local más importante | Si el teléfono o la dirección difieren del sitio, hay que unificarlos antes de A2/A8 |
| **Meta Business Manager** | Confirmar que el píxel no dispara en la web | Eventos web a cero pese a la inversión en Ads confirma #07 |

### 8.2. Datos del cliente que hoy faltan en el HTML

1. **Teléfono canónico — decisión, no dato.** Hoy conviven `+34 659 716 995` y `+34 689 440 906` en `locales/*/translation.json:220,222`. ¿Cuál va en el schema, en el NAP y en Google Business Profile? Deben ser el mismo en los tres sitios.
2. **Dirección completa y verificada**, tal como debe aparecer en `PostalAddress`: Calle de Recoletos 20, ¿planta/puerta?, 28001 Madrid, España.
3. **Coordenadas exactas** (`GeoCoordinates`) — se toman de Google Maps.
4. **Horarios de apertura** por día, para `openingHoursSpecification`. Hoy no existen en el repositorio.
5. **Bio y formación del Dr. Martín Prato**: titulación, universidad, colegiación (**número de colegiado** — relevante para EEAT en salud), especialidades, años de ejercicio, publicaciones o ponencias, y las URLs de perfiles oficiales para `sameAs`.
6. **Equipo**: mismos datos para Gonzalo Amaya y Maira Angarita.
7. **Tratamientos**: descripción clínica de cada uno para `MedicalProcedure`, y rango de precios si están dispuestos a publicarlo (mejora notablemente las respuestas de IA a consultas transaccionales).
8. **Casos de éxito**: fotos antes/después con consentimiento firmado del paciente, tratamiento aplicado, duración. Es la materia prima de #10 y de lo que el auditor propone publicar.
9. **Fotos**: una imagen apta para `og:image` 1200×630 y fotos reales de la clínica.

### 8.3. Decisiones del cliente

1. **¿Se mantiene la versión en inglés?** Si sí → A10 (8–14 h). Si no → se retira `og:locale:alternate` y se ahorra la partida más cara del plan. **Esta decisión cambia el presupuesto entre 3–5 y 5–7 días.**
2. **¿Blog o sección de casos?** Determina si el CMS se configura sólo para `site.json` o también para contenido de formato largo.
3. **Postura ante los bots de IA:** ¿abrir búsqueda y respuestas (OAI-SearchBot, PerplexityBot) y cerrar entrenamiento (GPTBot, CCBot), o abrir todo? Mi recomendación: lo primero.
4. **Analítica:** Cloudflare Web Analytics (sin cookies, sin banner, no toca la CSP) o GA4 (más potente, exige consentimiento RGPD y ampliar la CSP).
5. **¿Meta Pixel?** Clínica sanitaria en España: requiere base legal y consentimiento explícito. Decisión legal antes que técnica.
6. **Plazo y quién ejecuta.** B1 y B2 deberían hacerse hoy, independientemente de todo lo demás.
7. **¿Se integra el CMS?** Si la respuesta es sí, el argumento de fondo del auditor queda cubierto sobre este mismo repositorio.

---

## 9. Supuestos y límites

**Verificado directamente, reproducible por cualquiera:**
- Contenido del repositorio y del build (`npm run build` ejecutado el 11/09/2026).
- Comportamiento del sitio en producción: códigos HTTP, cabeceras, HTML servido, `robots.txt` en vivo, DNS, y el contraste de 15 user-agents distintos (§3.2). Todos los comandos están en el informe.

**Inferido, no probado:**
- **Que el 403 lo produce la regla gestionada "Block AI bots".** Lo que está probado es que el bloqueo es **condicional al user-agent** y que la lista bloqueada coincide exactamente con la lista curada de rastreadores de IA de Cloudflare. Podría tratarse de una regla WAF manual equivalente. **En ambos casos la corrección está en el mismo panel y ninguno de los dos es un problema del código.** Confirmar en Security → Bots y en WAF → Custom rules.
- Que el sitio en producción corresponde a `master@d95991a`: el `dist/index.html` construido localmente coincide byte a byte con el servido, salvo el script inyectado por Cloudflare.

**No verificable desde aquí — requiere tus accesos (§8.1):**
- **El número real de URLs indexadas.** Sólo Search Console responde. Una búsqueda web devuelve la home con un extracto que reproduce la meta description, lo que es coherente con el PDF (1 URL) y contradice el audio ("nunca indexada"), pero **no es prueba concluyente** del estado del índice.
- **Core Web Vitals de campo.** Requiere CrUX, que necesita tráfico suficiente. Las cifras de #12 son de build, no de campo.
- **Si el Meta Pixel está instalado y no dispara**, o directamente no está instalado.
- **Estado de Google Business Profile** y consistencia del NAP externo.
- **El impacto real en captación.** Nadie — ni el auditor ni yo — puede cuantificar hoy cuántos pacientes se pierden. Lo que sí está probado es que el canal GEO está cerrado al 100% por configuración, y que abrirlo cuesta diez minutos.

**Límites de alcance de este informe:**
- No he modificado ningún archivo del proyecto. El único archivo creado es este documento.
- Las estimaciones de horas suponen un desarrollador familiarizado con este repositorio. Duplicarlas para alguien externo.
- Las notas proyectadas de §5.1 son mi criterio técnico, con la misma escala del auditor. Son defendibles, no objetivas — igual que las suyas.
- No he auditado accesibilidad, RGPD/LOPD, textos legales ni cumplimiento sanitario de la publicidad. Para una clínica en España, el aviso legal, la política de privacidad, la cookie banner y la normativa de publicidad sanitaria merecen una revisión aparte, y no aparecen en ninguno de los dos informes.

---

## 10. Cierre

La auditoría acierta en lo esencial y hay que concederlo sin rodeos: **el `<body>` sale vacío, y eso es un problema real y grave.** Acierta también en que no hay datos estructurados, en que faltan `og:image` y canonical, en que el NAP no llega al HTML, y en que sin píxel no se mide nada pese a la inversión en Meta Ads. Son cinco señalamientos válidos y bien traídos.

Donde el expediente se rompe es en el salto del diagnóstico a la conclusión. El problema que se presenta como más grave —que la IA no puede leer la web— **no lo causa el código**: lo causa una casilla del panel de Cloudflare que responde 403 a GPTBot, ClaudeBot, OAI-SearchBot y PerplexityBot antes de que lleguen al HTML. Se demuestra con un `curl` y se corrige en diez minutos. **Y sobrevive intacta a una migración**, porque el bloqueo vive en el DNS, no en el hosting.

A eso se suma que tres afirmaciones concretas de la auditoría no resisten la verificación —la CSP sí es cabecera HTTP real, el code splitting sí existe, y Google declara expresamente que no hace falta schema para AI Overviews— y que el audio contradice a su propio PDF en el punto de la indexación, siempre en la dirección de agravar el cuadro.

El resto —prerender, schema, canonical, hreflang, sitemap, NAP, imagen social— se hace sobre este mismo repositorio, en **4 a 6 días laborables**, manteniendo el despliegue estático en Cloudflare Pages y la configuración de seguridad actual, que es un activo y no un defecto. La nota proyectada es **8,5/10**, prácticamente idéntica a la de una migración que costaría entre 10 y 20 veces más y obligaría a reintroducir todo el contenido.

Queda un punto en el que el auditor tiene razón de fondo y que conviene no esquivar: **el cliente debe poder publicar casos sin llamar a nadie.** Eso es cierto, y el hecho de que no se publique contenido desde junio lo confirma. Pero se resuelve con un CMS git-based sobre este mismo repositorio —Sveltia CMS, 4 a 8 horas— y no con un cambio de plataforma.

**El orden correcto de trabajo es:** hoy, desbloquear Cloudflare (B1, B2). Esta semana, prerender, schema y metadatos (A1–A8). Después, el CMS. Y en paralelo, lo único que ninguna tecnología entrega sola: los contenidos del Dr. Prato y una gestión activa de Google Business Profile.

---

*Informe de verificación técnica independiente. Todas las comprobaciones son reproducibles con los comandos incluidos. Ninguna afirmación descansa en la autoridad de quien la firma — ni en la del auditor, ni en la mía.*
