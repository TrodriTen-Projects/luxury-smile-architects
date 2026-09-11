# Inventario de datos — Fase 0

**Barrido exhaustivo previo a la implementación.** Ninguna línea de código escrita todavía.
Fecha: 11 de septiembre de 2026 · Commit base: `master@d95991a`

---

## 0. Resultado en una línea

**El repositorio tiene bastantes más datos de los que yo mismo di por ausentes en `AUDITORIA-VERIFICADA.md`.** Horarios, email, bios completas de 5 personas y credenciales existen y son utilizables. Lo que falta de verdad son cuatro cosas: **coordenadas, número de colegiado, titulación académica y rango de precios**. Y hay **dos decisiones** que no puedo tomar por ti: el teléfono canónico y qué hacer con las reseñas.

---

## 1. Qué barrí

| Fuente | Estado |
|---|---|
| `public/content/site.json` (395 líneas, incluido `_readme`) | Leído íntegro |
| `public/locales/es/translation.json` (11.283 B) | Leído íntegro |
| `public/locales/en/translation.json` (10.556 B) | Leído íntegro |
| `src/lib/content.ts` — `DEFAULT_CONTENT` (fallback) | Leído íntegro |
| `public/media/{team,results,patients,images,video}/` | Inventariado |
| `public/{team,results,reels}/` (SVG) | Inventariado |
| `scripts/gen-media-index.mjs` + índices generados | Leído |
| **Componente del mapa** (`src/pages/Contact.tsx:63-66, 445-452`) | **Analizado — ver §4.1** |
| `src/components/layout/Footer.tsx` | Leído íntegro |

---

## 2. Correcciones a mi informe anterior

Antes de nada, cuatro cosas que di por ausentes en `AUDITORIA-VERIFICADA.md` y **sí están**. Las corrijo aquí porque cambian el alcance del trabajo:

| Lo que dije | La realidad | Origen |
|---|---|---|
| *"Horarios: hoy no existen en el repositorio"* | **Existen.** "Lunes a viernes, 10:00 a 20:00" | `locales/es/translation.json:226` |
| *"Bios y formación del Dr. Prato… faltan"* | **Las bios existen, completas, en ES y EN, para las 5 personas.** Lo que falta es colegiado y titulación | `site.json:173-258` |
| *"Equipo: Gonzalo Amaya y Maira Angarita"* | **Falso.** Esos son placeholders del fallback `DEFAULT_CONTENT` (`content.ts`), no del contenido real. El equipo real son **5 personas distintas** | `site.json:173-258` vs `content.ts` |
| *"Email: no mencionado"* | **Existe**: `contacto@luxurysmilearchitects.com` | `locales/es/translation.json:224` |

Y una que mantengo: **no hay coordenadas en ninguna parte** (§4.1).

---

## 3. Mapeo: campo de schema → origen

### 3.1. `Dentist` / `LocalBusiness` — la entidad principal

| Campo schema | Valor encontrado | Origen | Estado |
|---|---|---|---|
| `name` | `Luxury Smile Architects` | `index.html:9`, `Footer.tsx:88` | **DISPONIBLE** |
| `address.streetAddress` | `Calle de Recoletos 20` | `locales/es:217` · `en:217` | **DISPONIBLE** |
| `address.addressLocality` | `Madrid` | `locales/es:218` ("Barrio de Salamanca, 28001 Madrid") | **DISPONIBLE** |
| `address.postalCode` | `28001` | `locales/es:218` · `site.json:283` | **DISPONIBLE** |
| `address.addressRegion` | `Madrid` | Derivable de la provincia | **DISPONIBLE** |
| `address.addressCountry` | `ES` | Derivable | **DISPONIBLE** |
| `telephone` | ⚠️ **`+34 659 716 995`** *y* **`+34 689 440 906`** | `locales/es:220` y `:222` | **AMBIGUO — §5.1** |
| `email` | `contacto@luxurysmilearchitects.com` | `locales/es:224` | **DISPONIBLE** *(nota: dominio `.com`, no `.es`)* |
| `openingHoursSpecification` | `Mo,Tu,We,Th,Fr` · `10:00`–`20:00` | `locales/es:226` | **DISPONIBLE** |
| `url` | `https://luxurysmile.es` | Dominio de producción | **DISPONIBLE** |
| `image` / `logo` | `/media/images/hero-main.jpg` (1290×1260) | `site.json:3` | **DISPONIBLE** *(ver §5.3 sobre el recorte)* |
| `sameAs[0]` | `https://www.instagram.com/luxurysmilearchitectsmadrid/` | `site.json:286` | **DISPONIBLE** |
| `sameAs[1]` | Ficha de Fotona *(citada en la auditoría, no en el repo)* | — | **AUSENTE — §6** |
| `hasMap` | URL de búsqueda por texto, sin place ID | `site.json:285` | **PARCIAL — §4.1** |
| **`geo` (`GeoCoordinates`)** | — | — | **AUSENTE — §4.1** |
| `priceRange` | — | — | **AUSENTE — §6** |
| `medicalSpecialty` | `Dentistry` / estética dental | Derivable del contenido | **DISPONIBLE** |
| `areaServed` | Madrid | Derivable | **DISPONIBLE** |
| `currenciesAccepted` | `EUR` | Derivable | **DISPONIBLE** |
| `paymentAccepted` | Existe programa de financiación (`about.financeModal`) | `locales/es` → `about.financeModal` | **DISPONIBLE** *(parcial: no detalla medios de pago)* |

### 3.2. `Person` × 5 — el equipo real

Los 5 tienen `name`, `jobTitle`, `description` (bio completa ES+EN), credenciales e imagen. **Ninguno tiene colegiado, titulación ni perfiles propios.**

| # | `name` | `jobTitle` (`role`) | `description` (`bio`) | `image` | `alumniOf` | Colegiado | `sameAs` |
|---|---|---|---|---|---|---|---|
| 1 | Dr. Martín Prato | Odontólogo, especialista en Rehabilitación Oral, socio fundador | ✅ 20+ años, clínicas en Bogotá, Miami, Tijuana, CDMX, Madrid | ✅ `Prato.jpeg` 1086×1448 | ❌ | ❌ | ❌ |
| 2 | Dr. Álvaro José Escudero Muñoz | Director Clínico · Máster en Endodoncia y Trauma Dentoalveolar | ✅ 15+ años | ✅ `Alvaro.jpeg` | ❌ | ❌ | ❌ |
| 3 | Ludmila Maldonado | Directora General y Comercial · Abogada | ✅ | ✅ `Ludmilla.jpeg` | ❌ | n/a | ❌ |
| 4 | Dra. Adriana Rojas | Odontóloga · Espec. Ortodoncia y Ortopedia Maxilar | ✅ | ✅ `Adriana.jpeg` | ❌ | ❌ | ❌ |
| 5 | Dra. María Fernanda Rocha Serpa | Médica Estética Facial · Máster en Med. Estética, Regenerativa y Antienvejecimiento | ✅ | ✅ `Maria.jpeg` | ❌ | ❌ | ❌ |

Origen: `site.json:173-258`. **Estado: DISPONIBLE** para `name`, `jobTitle`, `description`, `image`, `worksFor`. **AUSENTE** para `alumniOf`, colegiado y `sameAs`.

> En un sitio sanitario (YMYL), el número de colegiado es la señal E-E-A-T más fuerte que existe. Es lo que más valor añadiría por unidad de esfuerzo, y **no puedo inventarlo**.

### 3.3. `MedicalProcedure` × 10 — tratamientos

Los 10 tienen `id`, `image`, `name`, `tagline` y `summary`, todo en ES y EN. Origen `site.json:12-172`.

| id | Nombre (ES) | Descripción | Imagen |
|---|---|---|---|
| `estetica` | Estética Dental y Carillas | ✅ | `ES_treatment.jpg` |
| `rehabilitacion` | Rehabilitación Oral | ✅ | `RO_treatment.jpg` |
| `medicina-estetica` | Medicina Estética | ✅ | `ME_treatment.jpg` |
| `digital` | Rehabilitación Oral Digital | ✅ | `DI_treatment.jpg` |
| `endodoncia` | Endodoncia | ✅ | `EN_treatment.jpg` |
| `periodoncia` | Periodoncia | ✅ | `PR_treatment.jpg` |
| `blanqueamiento` | Blanqueamiento Dental | ✅ | `BL_treatment.jpg` |
| `exodoncia` | Exodoncia | ✅ | `EX_treatment.jpg` |
| `cirugia` | Cirugía Oral | ✅ | `CO_treatment.jpg` |
| `implantes` | Implantes Dentales | ✅ | `IM_treatment.jpg` |

**Estado: DISPONIBLE** (los 10, completos). Sin coste asociado → sin `offers`/`priceRange`.

### 3.4. Activos de medios

| Carpeta | Contenido | Estado |
|---|---|---|
| `public/media/team/` | 5 `.jpeg`, uno por persona real | **DISPONIBLE** |
| `public/media/results/` | 10 `.jpeg` = 5 pares antes/después (PO, RE, BL, RC, DI) | **DISPONIBLE** |
| `public/media/patients/` | 28 `.jpg` indexados automáticamente | **DISPONIBLE** |
| `public/media/images/` | 13 `.jpg` — hero, `about-hero`, 10 de tratamientos | **DISPONIBLE** |
| `public/media/video/` | 13 reels `.mp4` + `clinic-01`, `lab-01` | **DISPONIBLE** |
| `public/team/*.svg`, `public/results/*.svg`, `public/reels/*.svg` | **Placeholders muertos.** Los de `team/` solo los referencia el fallback `DEFAULT_CONTENT`; los de `results/` y `reels/` no los referencia nada | **IRRELEVANTE** *(candidatos a borrado, fuera de alcance)* |

---

## 4. El mapa: análisis específico

### 4.1. No hay coordenadas, y el embed no las contiene

Me pediste extraer `lat`/`lng` o el place ID del mapa. **No existen.** Esto es lo que hay:

```js
// src/pages/Contact.tsx:63-66
const place = content.business.placeQuery || `${t("contact.clinic.address")}, ${t("contact.clinic.area")}`;
const encPlace = encodeURIComponent(place);
const mapEmbedUrl = `https://www.google.com/maps?q=${encPlace}&output=embed`;
```

Con `placeQuery = "Calle de Recoletos 20, 28001 Madrid"` (`site.json:283`).

Es un **embed por consulta de texto**: Google geocodifica la dirección en el momento de renderizar el iframe. No hay place ID, no hay CID, no hay coordenadas — ni en el embed, ni en `reviewsUrl` (`site.json:285`, que es una URL de *búsqueda*: `/maps/search/?api=1&query=Luxury%20Smile%20Architects%20Madrid`), ni en ningún otro punto del repositorio.

**Veredicto: `GeoCoordinates` = AUSENTE.** Aplicando tu regla 4, no las publico. Podría geocodificar la dirección yo mismo contra un servicio externo, pero eso produciría unas coordenadas *plausibles*, no *verificadas*, y publicar la ubicación aproximada de una clínica sanitaria como dato estructurado es exactamente el tipo de invención que me pediste evitar.

**Cómo resolverlo tú en 2 minutos:** abre la ficha de Google Business Profile de la clínica → clic derecho sobre el pin exacto → "¿Qué hay aquí?" → copia los dos números. Pásamelos y entran en el schema. Alternativamente, dame la **URL corta de la ficha** (`https://maps.app.goo.gl/…`) o el **place ID**, y con eso también mejoro `hasMap` para que apunte a la ficha real en lugar de a una búsqueda por texto.

### 4.2. Beneficio colateral

Si me das el place ID, `hasMap` y el `sameAs` pasan a apuntar a la ficha de Google Business Profile concreta, lo que ayuda a Google a vincular sitio ↔ ficha. Hoy `reviewsUrl` es una búsqueda por nombre: funciona para un humano, es ambiguo para un motor.

---

## 5. Ambigüedades — necesito que decidas

### 5.1. ⚠️ Teléfono canónico (bloquea Fases 2, 4 y 6)

Conviven dos números, ambos etiquetados, ambos en uso:

| Valor | Etiqueta en el repo | Dónde se usa hoy |
|---|---|---|
| `+34 659 716 995` | `phone` — "Teléfono" | Fila de contacto en `/contacto` (`Contact.tsx:151`) |
| `+34 689 440 906` | `whatsapp` — "WhatsApp" | Botón de WhatsApp, `wa.me`, CTA de tratamientos (`site.json:284`) |

Origen: `locales/es/translation.json:220` y `:222`; `site.json:284`.

**Nota:** tanto tu prompt como la auditoría de Yussef Co. citan `+34 689 440 906` como *el* teléfono de la clínica. Pero en el repositorio ese número está etiquetado como WhatsApp, y hay otro distinto como teléfono. **No lo resuelvo adivinando.**

| Opción | Qué implica |
|---|---|
| **A — `+34 689 440 906` como canónico** | Coincide con lo que cita la auditoría y con el canal que ya usan. `telephone` y el WhatsApp serían el mismo número (perfectamente válido). |
| **B — `+34 659 716 995` como canónico** | `telephone` = fijo/principal; WhatsApp queda como `ContactPoint` aparte con `contactType: "customer service"`. |
| **C — Ambos, con roles distintos** | `telephone` = el que elijas; el otro como `ContactPoint` adicional. Es lo más rico, pero **solo si el NAP de Google Business Profile refleja lo mismo**. |

**Criterio decisivo: el que figure en Google Business Profile.** El NAP exige que sitio, schema y ficha digan exactamente lo mismo. Si no coinciden, el schema resta en vez de sumar.

**Dime: A, B o C — y confírmame qué número aparece hoy en la ficha de Google.**

### 5.2. ⚠️ Reseñas: no es un tema de datos, es de política de Google

Hay **8 reseñas completas** (autor, `rating: 5`, texto ES+EN, fecha) en `site.json:293-390`, más `rating: "5.0"` y `reviewsCount: "11 reseñas"` en `site.json:287-291`.

Los datos están **DISPONIBLES**. El problema es otro, y es serio:

1. **Son reseñas copiadas de Google.** El propio `_readme` de `site.json` lo dice: *"Copia tus reseñas reales de Google en el array `reviews`"*. Las directrices de datos estructurados de Google **prohíben marcar reseñas recopiladas de otro sitio**.
2. **Son autoservidas.** Google restringe `Review`/`AggregateRating` en `LocalBusiness` cuando las recopila el propio negocio sobre sí mismo.
3. **Hay una inconsistencia numérica:** se declaran 11 reseñas pero solo hay 8 en el array.
4. **Es una clínica sanitaria.** Una acción manual por *spam* de datos estructurados aquí cuesta mucho más que el beneficio de unas estrellas en el snippet.

| Opción | Riesgo | Beneficio |
|---|---|---|
| **A — Sin `Review` ni `AggregateRating` en el schema** *(recomendada)* | Ninguno | Las reseñas se siguen mostrando en la web como contenido normal. Las estrellas en Google salen de la ficha de GBP, que es su sitio correcto |
| **B — Marcar `AggregateRating`** | Acción manual por incumplimiento | Estrellas en el snippet *si* Google lo acepta, cosa que para reseñas autoservidas cada vez acepta menos |

**Mi recomendación firme: opción A.** Las estrellas que quieres que se vean ya las sirve Google Business Profile. Duplicarlas en el sitio con marcado no conforme arriesga toda la elegibilidad de resultados enriquecidos del dominio.

**Dime: A o B.** Si no respondes a esto, ejecuto A.

### 5.3. `og:image` — el recorte no es gratis

`hero-main.jpg` mide **1290×1260**, prácticamente cuadrada. Recortarla a 1200×630 (proporción 1,91:1) obliga a descartar ~50% de la altura.

`site.json:5` indica `hero.position: "50% 0%"`, es decir, el foco está arriba. Usaré ese mismo encuadre, que es lo correcto para no cortar el rostro.

| Opción | Resultado |
|---|---|
| **A — Recorte de `hero-main.jpg` con foco `50% 0%`** *(por defecto)* | Funciona, pero un retrato casi cuadrado recortado a panorámico rara vez queda bien |
| **B — Me pasas una imagen pensada para compartir** | Notablemente mejor: es lo primero que ve alguien cuando le mandan el enlace por WhatsApp |

Ejecuto **A** salvo que me des una imagen. Te enseñaré el resultado en la Fase 3 antes de seguir; si no convence, cambiamos.

---

## 6. Ausentes de verdad — se omiten, no se rellenan

Aplicando tu regla 3. Ninguno de estos va al schema:

| Campo | Consecuencia de omitirlo | Cuánto cuesta conseguirlo |
|---|---|---|
| **`GeoCoordinates`** | El `LocalBusiness` sigue siendo válido con `PostalAddress`. Pierde precisión en búsquedas de proximidad | **2 min** — §4.1. Lo de mayor impacto por esfuerzo |
| **Número de colegiado** (los 4 sanitarios) | Se pierde la señal E-E-A-T más fuerte de un sitio sanitario | Lo saben ellos |
| **`alumniOf`** (titulación y universidad) | `Person` sin respaldo académico verificable | Lo saben ellos |
| **`sameAs` por persona** (LinkedIn, Instagram, Doctoralia) | Google no vincula a los profesionales con su identidad en la web | 10 min de recopilación |
| **`priceRange`** | Se pierde en consultas transaccionales tipo *"cuánto cuestan unas carillas en Madrid"* — muy consultadas en LLM | Decisión comercial |
| **`sameAs` ficha de Fotona** | Una citación externa menos | La auditoría la menciona; falta la URL |
| **Horario de fin de semana** | Se declara `Mo-Fr` y punto. Correcto y verdadero: la omisión implica cierre | Confirmar si abren sábados |

Estos siete van a `DATOS-PENDIENTES.md` al cerrar la implementación.

---

## 7. Lo que esto cambia respecto al plan

Buenas noticias sobre las estimaciones de `AUDITORIA-VERIFICADA.md`:

- **Fase 4 (JSON-LD) baja de 4–6 h a 3–5 h.** El `Dentist` sale casi entero de los datos existentes, y los 5 `Person` y 10 `MedicalProcedure` se generan leyendo los JSON.
- **Fase 6 (NAP) baja a ~1 h.** El `Footer` ya renderiza dirección, horario, email e Instagram (`Footer.tsx:47-84`). Solo falta el teléfono, el marcado semántico (`<address>`, `tel:`) y resolver §5.1.
- **#10 (EEAT) tiene mejor techo del que estimé: ~6,5 en lugar de ~6.** Con 5 `Person` con bio y credenciales reales se llega más lejos de lo que pensaba. Para pasar de ahí hacen falta colegiado y titulaciones.

Y una advertencia: **el schema se generará leyendo `site.json` y los locales**, como pediste. Eso significa que si el cliente edita esos archivos, el schema se actualiza solo — pero también que **un error de edición se propaga al schema**. Añadiré validación en el generador para que el build falle antes que publicar un schema roto.

---

## 8. Qué necesito para arrancar la Fase 1

**Bloqueantes** (sin esto no puedo cerrar las Fases 2, 4 y 6):

1. **§5.1 — Teléfono canónico: ¿A, B o C?** Y qué número figura en Google Business Profile.
2. **§5.2 — Reseñas: ¿A o B?** *(sin respuesta, ejecuto A)*

**No bloqueantes** (si llegan durante la implementación, entran; si no, a `DATOS-PENDIENTES.md`):

3. **Coordenadas o place ID** (§4.1) — 2 minutos, el mejor retorno de la lista.
4. Imagen para compartir (§5.3).
5. Colegiados, titulaciones y perfiles del equipo (§6).
6. `priceRange`, aunque sea un rango amplio.
7. URL de la ficha de Fotona.
8. ¿Abren sábados?

---

**La Fase 1 (prerendering) no depende de ninguna de estas respuestas.** Si quieres, arranco con ella mientras resuelves §5.1 y §5.2, y paro antes de la Fase 2, que es la primera que necesita el teléfono. Dime si tiro por ahí o prefieres contestar primero.
