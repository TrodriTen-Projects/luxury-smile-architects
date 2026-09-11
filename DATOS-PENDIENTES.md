# Datos pendientes

Lo que falta de verdad tras aplicar las decisiones del Bloque 0. Nada de esto
está inventado en el código: si un dato no existe, no se publica.

Ordenado por retorno, no por dificultad.

---

## 1. Coordenadas de Google Business Profile — 2 minutos

**Estado:** resuelto provisionalmente con `40.421789, -3.689292`.

Esas coordenadas me las diste tú y están publicadas en el `GeoCoordinates` del
schema. **Confírmalas contra la ficha real** antes de dar por bueno el
despliegue: si apuntan al centro aproximado de la calle y no al portal, la
precisión en búsquedas de proximidad se resiente.

**Cómo:** ficha de Google Business Profile → clic derecho sobre el pin → «¿Qué
hay aquí?» → los dos números aparecen abajo.

**Dónde entra:** CMS → Contenido → Clínica → Datos de la clínica → Coordenadas.

---

## 2. Place ID de la ficha de Google — 5 minutos

**Estado:** ausente. `hasMap` apunta a una URL de *búsqueda* por nombre
(`/maps/search/?api=1&query=Luxury+Smile+Architects+Madrid`), no a la ficha.

**Por qué importa:** una búsqueda por nombre es ambigua para un motor —
especialmente con clínicas homónimas en Miami, Bogotá y Ciudad de México. El
place ID ata el sitio web a *esa* ficha concreta, que es el vínculo que más pesa
en SEO local.

**Cómo:** abre la ficha en Google Maps, pulsa «Compartir» y copia el enlace
corto (`https://maps.app.goo.gl/…`). Con eso basta.

**Dónde entra:** CMS → Datos de la clínica → Enlace a las reseñas de Google.

---

## 3. Número de colegiado de los cuatro sanitarios — lo saben ellos

**Estado:** ausente. Los `Person` del schema salen con nombre, puesto,
biografía e imagen, y nada más.

**Por qué importa:** en un sitio sanitario es la señal E-E-A-T más fuerte que
existe. Google trata la odontología como YMYL («tu dinero o tu vida») y pondera
la verificabilidad del profesional por encima de casi cualquier otra cosa.

Hacen falta para: Dr. Martín Prato, Dr. Álvaro José Escudero Muñoz, Dra. Adriana
Rojas y Dra. María Fernanda Rocha Serpa. Ludmila Maldonado es abogada, no
sanitaria, así que no aplica.

**No lo puedo inventar ni deducir.** Es el único campo de esta lista cuyo dato
falso tendría consecuencias legales, no solo de posicionamiento.

---

## 4. Titulación y universidad de cada uno — lo saben ellos

**Estado:** ausente (`alumniOf`).

Las biografías dicen «más de 20 años de experiencia» y «Máster en Endodoncia»,
que es texto libre. El schema puede declarar la institución concreta, y eso es
lo que permite a un motor enlazar a la persona con una entidad verificable.

---

## 5. Perfiles públicos de cada profesional — 10 minutos

**Estado:** ausente (`sameAs` por persona). La clínica sí tiene su Instagram
declarado.

LinkedIn, Instagram profesional, Doctoralia, perfil en sociedades científicas.
Son los enlaces que permiten a Google confirmar que el «Dr. Martín Prato» de
esta web es el mismo que aparece en otros sitios.

---

## 6. Rango de precios — decisión comercial

**Estado:** deliberadamente ausente. Ni `priceRange` ni `offers`.

**Por qué importa más de lo que parece:** «cuánto cuestan unas carillas en
Madrid» es de las consultas más frecuentes en ChatGPT y Perplexity, y una web
sin ninguna señal de precio no entra en esa conversación.

No hace falta publicar tarifas: `priceRange` admite `"€€€"`, que es una señal de
posicionamiento sin comprometer una cifra.

**Es decisión del cliente, no técnica.** Si dice que no, se queda como está.

---

## 7. Ficha de Fotona y otras citaciones — 5 minutos

**Estado:** ausente. La auditoría de Yussef menciona que el NAP está verificado
en Fotona, pero no aporta la URL.

Cada citación externa consistente refuerza el NAP. Si hay más (colegio de
dentistas, directorios sanitarios, Doctoralia), van todas al `sameAs`.

---

## 8. ¿Abren sábados? — confirmar

**Estado:** el schema declara `Mo-Fr 10:00-20:00`, tomado de los locales.

La omisión de sábado y domingo equivale a «cerrado», y es correcto **si de
verdad cierran**. Si abren sábados por la mañana y no consta, se están
perdiendo las búsquedas de fin de semana, que en estética son muchas.

---

## 9. Imagen pensada para compartir — opcional

**Estado:** resuelto con un recorte del hero (1200×630, 98 kB). Funciona: el
rostro queda centrado y la sonrisa visible.

Una imagen diseñada para ese formato —con el logo y quizá un reclamo— rendiría
mejor, porque es lo primero que ve quien recibe el enlace por WhatsApp. No es
urgente.

**Dónde entra:** sustituir la foto del hero en el CMS, o pasarme un archivo y lo
conecto como imagen social independiente.

---

## 10. Casos de éxito documentados — el trabajo de fondo

**Estado:** hay 5 pares antes/después y 28 fotos de pacientes, sin texto.

Un caso que posiciona necesita: qué tratamiento fue, cuánto duró, qué problema
resolvía, y consentimiento firmado que cubra la publicación. Las fotos solas no
responden a ninguna pregunta que alguien le haga a ChatGPT.

Esto ya es publicable desde el CMS sin desarrollador. Es lo que el auditor
señalaba con razón, y es trabajo del cliente.

---

## Lo que NO está pendiente

Para evitar que vuelva a aparecer en una auditoría como si faltara:

- **Horarios, email, dirección completa con CP y biografías del equipo** ya
  estaban en el repositorio y ahora se publican en el HTML de las 13 páginas.
- **Las reseñas** están y se muestran. No se marcan como dato estructurado a
  propósito: las directrices de Google prohíben marcar reseñas copiadas de otro
  sitio, y en un sitio sanitario una acción manual cuesta más que unas
  estrellas.
- **El teléfono** está resuelto: `+34 689 440 906` en toda la web y en el
  schema, con el `+34 659 716 995` como línea secundaria. El build falla si los
  dos dejan de coincidir.
