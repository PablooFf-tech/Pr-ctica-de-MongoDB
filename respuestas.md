# Respuestas a la práctica: MongoDB Rastro

## PARTE A — Pensar antes de escribir código

### Ejercicio A1: ¿Por qué MongoDB aquí?

#### 1. Columnas en tabla SQL única de anuncios
Columnas comunes del anuncio:
1. `id`
2. `titulo`
3. `descripcion`
4. `precio`
5. `categoria`
6. `estado`
7. `ciudad`
8. `fecha_publicacion`
9. `visitas`
10. `vendedor_id`

Columnas específicas por categoría (según los 4 ejemplos dados):
- Coches:
  11. `marca`
  12. `modelo`
  13. `anio`
  14. `km`
  15. `combustible`
- Móviles:
  *(comparte marca y modelo)*
  16. `almacenamiento_gb`
  17. `bateria_pct`
- Ropa:
  *(comparte marca)*
  18. `talla`
  19. `genero`
- Muebles:
  20. `material`
  21. `ancho`
  22. `fondo`
  23. `alto`

**Total de columnas:** 23 columnas.

#### 2. Relleno de la fila de la chaqueta (Ropa) y conteo de NULLs
- Columnas con valor (13):
  `id`, `titulo`, `descripcion`, `precio`, `categoria`, `estado`, `ciudad`, `fecha_publicacion`, `visitas`, `vendedor_id`, `marca`, `talla`, `genero`.
- Columnas en `NULL` (10 de las 23):
  `modelo`, `anio`, `km`, `combustible`, `almacenamiento_gb`, `bateria_pct`, `material`, `ancho`, `fondo`, `alto`.

#### 3. Llegada de la categoría Deporte
- En SQL habría que ejecutar sentencias `ALTER TABLE anuncios ADD COLUMN ...` para añadir:
  - `tipo_bici`
  - `pulgadas_rueda`
  *(la talla ya existía de ropa)*.
- Esto altera la tabla entera en producción, añade más columnas vacías para el resto de categorías y exige coordinar migraciones de esquema.

#### 4. Alternativa SQL con una tabla por categoría
- Para listar «todos los anuncios de Valencia con sus datos» harían falta **4 `LEFT JOIN`** (uno por cada tabla de categoría: `coches`, `moviles`, `ropa`, `muebles`) para no perder ningún anuncio independientemente de su categoría. Con cada nueva categoría se sumaría otro `LEFT JOIN`.

#### 5. Documentos de ejemplo en MongoDB

**iPhone 13:**
```json
{
  "titulo": "iPhone 13 128 GB",
  "categoria": "Móviles",
  "precio": 380,
  "atributos": {
    "marca": "Apple",
    "modelo": "iPhone 13",
    "almacenamientoGB": 128,
    "bateriaPct": 87
  }
}
```

**Mesa de comedor:**
```json
{
  "titulo": "Mesa de comedor de roble",
  "categoria": "Muebles",
  "precio": 120,
  "atributos": {
    "material": "roble",
    "ancho": 160,
    "fondo": 90,
    "alto": 75
  }
}
```

---

### Ejercicio A2: Anuncio y vendedor

1. **¿Por qué no embebemos el usuario completo dentro del anuncio?**
   - **Ciclo de vida independiente:** El usuario tiene entidad propia (puede publicar múltiples anuncios, hacer ofertas, recibir valoraciones); no pertenece exclusivamente a un único anuncio.
   - **Duplicación masiva y coste de actualización:** Si embebiéramos todo el usuario (email, ciudad, contraseña/perfil), cada cambio en sus datos personales exigiría actualizar N anuncios distintos en lugar de un único documento en `usuarios`.

2. **¿Por qué copiamos el nombre del vendedor y no su email ni su ciudad?**
   - Porque el nombre es lo único necesario para pintar la ficha de detalle (la pantalla más leída de la app) sin hacer una segunda consulta. El email es un dato privado que no se muestra públicamente en la ficha y la ciudad relevante para el anuncio es la ubicación del producto (que ya está en el anuncio). Además, el nombre rara vez cambia.

3. **Si Luis cambia su nombre, ¿qué documentos hay que actualizar?**
   - Su documento en la colección `usuarios`.
   - Todos los documentos de la colección `anuncios` donde `vendedor.id` sea el de Luis.
   - Si su nombre se hubiera desnormalizado en `ofertas` o `valoraciones`, también esos documentos.

4. **Comparación con el ejercicio SQL anterior:**
   - En SQL relacional se resolvía mediante un `JOIN` entre la tabla principal y la tabla de usuarios/monitores (`ON clase.monitor_id = monitor.id`), garantizando normalización pura sin duplicar nombres.
   - En MongoDB desnormalizamos copiando el nombre directamente en el documento para optimizar la lectura atómica de una sola pieza, asumiendo el coste de mantener la consistencia manualmente en las modificaciones.

---

### Ejercicio A3: Ofertas

1. **¿Embeber en el anuncio o colección aparte?**
   - Colección `ofertas` aparte:
     - Una oferta involucra a dos partes (comprador y vendedor). El comprador necesita listar "mis ofertas" sin tener que buscar dentro de todos los anuncios de la base de datos.
     - Un anuncio popular puede recibir cientos de ofertas, lo que haría crecer el array de forma impredecible en el anuncio.

2. **Documento de oferta de ejemplo:**
```json
{
  "_id": "680000000000000000000001",
  "importe": 340,
  "estado": "PENDIENTE",
  "fecha": "2026-10-27T00:00:00.000Z",
  "anuncio": {
    "id": "670000000000000000000003",
    "titulo": "iPhone 13 128 GB",
    "precio": 380
  },
  "comprador": {
    "id": "660000000000000000000005",
    "nombre": "Sara López"
  }
}
```

3. **¿Qué copiarías dentro de la oferta para «mis ofertas»?**
   - Copiaríamos el `titulo` del anuncio y el `precio` original que pedía el vendedor en el momento de la oferta (además de la referencia `id` del anuncio).

4. **Si Ana baja el precio del iPhone a 350 €, ¿debe cambiar el precio guardado en la oferta?**
   - **No.** El precio guardado en la oferta refleja las condiciones comerciales y el contexto exacto en el momento en que se realizó la propuesta económica (similar a cómo una línea de pedido o factura congela el precio histórico aunque el catálogo de la tienda cambie después).

---

### Ejercicio A4: Valoraciones

1. **¿Embeber en el usuario o colección aparte?**
   - Colección `valoraciones` aparte:
     - El número de valoraciones de un usuario activo puede crecer sin límite a lo largo de los años. Embeberlas en el usuario violaría la regla de no acumular arrays no acotados (evitando saturar el límite de 16 MB por documento).
     - Cada valoración está vinculada tanto al autor como al valorado y a un anuncio concreto.

2. **Documento de valoración de ejemplo:**
```json
{
  "_id": "690000000000000000000001",
  "anuncioId": "670000000000000000000004",
  "autor": {
    "id": "660000000000000000000004",
    "nombre": "Hugo Sanz"
  },
  "valoradoId": "660000000000000000000003",
  "estrellas": 5,
  "comentario": "Todo perfecto",
  "fecha": "2026-09-15T00:00:00.000Z"
}
```

3. **Índice único para evitar duplicar valoración por compra:**
   - Índice compuesto único sobre `{ "autor.id": 1, "anuncioId": 1 }`.

4. **Campos en el usuario para mostrar nota media al instante:**
   - `valoracionMedia`: número decimal con el promedio actual.
   - `numValoraciones`: entero con el recuento total de valoraciones recibidas.

---

### Ejercicio A5: Relación N:M Favoritos

1. **Cantidad esperada por extremo:**
   - Un usuario habitual suele tener unas pocas decenas o cientos de favoritos.
   - Un anuncio viral o popular puede ser marcado como favorito por decenas de miles de usuarios.

2. **Opción descartada:**
   - Se descarta la opción **b) Array de usuarios en el anuncio** (`anuncio.favoritoDe: [...]`).
   - *Motivo:* Un anuncio muy popular haría crecer el array sin límite, provocando documentos gigantescos, constantes recolocaciones de memoria y riesgo de alcanzar el límite de 16 MB.

3. **Opción más eficiente para la pantalla «Mis favoritos»:**
   - La opción **a) Array de anuncios en el usuario** (`usuario.favoritos: [idAnuncio1, idAnuncio2]`), ya que con una única lectura del perfil del usuario se obtienen todos sus IDs favoritos.

4. **Cómo saber cuántos usuarios tienen un anuncio en favoritos con la opción a:**
   - Con un conteo sobre `usuarios`: `db.usuarios.countDocuments({ favoritos: idAnuncio })`. MongoDB busca eficientemente valores contenidos dentro de un array.

5. **Operador para añadir favoritos sin duplicar:**
   - `$addToSet` (a diferencia de `$push`, solo inserta el elemento si no existe previamente en el array).

---

### Ejercicio A6: ¿Dentro o aparte?

1. **Mensajes de chat:** **Aparte** (colección de mensajes o conversaciones). Un chat puede crecer indefinidamente y se consulta paginado por fecha.
2. **Dirección de envío de una compra:** **Embebida** dentro del documento de la compra/pedido. Es un snapshot histórico inmutable de esa transacción concreta.
3. **Etiquetas de un anuncio:** **Embebidas** como un array de strings dentro del anuncio (`tags: ["urgente", "negociable"]`). Son pocas, fijas y siempre se leen con el anuncio.
4. **Categorías (nombre, icono, lista atributos):** **Aparte** en una colección `categorias`. Son datos maestros del sistema consultados globalmente y compartidos por toda la plataforma.
5. **Historial de cambios de precio:** **Embebido** dentro del anuncio como un array de subdocumentos (`historialPrecios: [{ fecha, precio }]`). Pocas modificaciones a lo largo de la vida del anuncio y de consulta directa en su ficha.
6. **Los anuncios de un usuario dentro del usuario:** **Aparte**. Un vendedor puede publicar cientos o miles de anuncios, y los anuncios se buscan por categoría/ciudad, no navegando usuarios.
7. **Líneas de pedido:** **Embebidas** dentro del pedido. No tienen sentido sin el pedido, son pocas (rara vez más de 20-30) y deben congelar precio y datos de compra.
8. **Reseñas de un producto:** **Aparte** (colección `resenas`). Un producto popular puede acumular miles de reseñas; en el producto solo se guardan campos resumen como la media y el total.

---

### Comparación con el modelo del apartado 9

- El modelo propuesto en el enunciado coincide en decisiones clave: fotos embebidas en anuncios, ofertas y valoraciones en colecciones separadas, favoritos como array de IDs en el usuario, y campos agregados (`valoracionMedia`, `numValoraciones`) en el usuario.
- Coincidencia plena con las 4 colecciones resultantes: `usuarios`, `anuncios`, `ofertas` y `valoraciones`.

---

## PARTE B — Pruebas y Consultas

### Ejercicio B2.3
- **Pregunta:** «Deporte» es una categoría que no existía. ¿Has tenido que cambiar algo antes de insertar? ¿Qué habría pasado en PostgreSQL?
- **Respuesta:** En MongoDB no hubo que modificar nada previamente porque las colecciones no tienen un esquema rígido impuesto a nivel de motor. En PostgreSQL habríamos necesitado modificar la definición de la tabla (con `ALTER TABLE` o actualizando un tipo `ENUM`/tabla maestra de categorías) antes de poder insertar la fila.

---

### Ejercicio B3.5: Plan de ejecución observado con explain()
Al ejecutar `db.anuncios.find({ categoria: "Coches" }).sort({ precio: 1 }).explain("executionStats")`:
- **Stage principal:** `FETCH`, precedido por un inputStage de tipo `IXSCAN` (Index Scan).
- **Índice utilizado:** `categoria_1_precio_1`.
- **Comportamiento del ordenamiento:** No aparece ninguna etapa `SORT` en memoria porque el índice compuesto `{ categoria: 1, precio: 1 }` ya indexa los documentos ordenados por precio dentro de cada categoría.
- **Métricas observadas:** `totalKeysExamined: 2`, `totalDocsExamined: 2`, `nReturned: 2` (examinó exactamente las 2 claves necesarias sin escanear la colección entera `COLLSCAN`).

---

### Ejercicio B4: Pruebas de integridad

#### B4.1 (Email duplicado)
- **Predicción:** Fallará con error de clave duplicada (`E11000 duplicate key error`) porque en B3 creamos un índice único sobre `email`.
- **Resultado observado:**
  ```text
  Error B4.1: E11000 duplicate key error collection: rastro.usuarios index: email_1 dup key: { email: "ana@rastro.es" }
  ```
- **Explicación:** MongoDB aplica la restricción de unicidad gracias al índice explícito `email_1`.

#### B4.2 (Hugo valora otra vez a Marta por el mismo anuncio)
- **Predicción:** Fallará con error de clave duplicada por el índice compuesto único `{ "autor.id": 1, "anuncioId": 1 }`.
- **Resultado observado:**
  ```text
  Error B4.2: E11000 duplicate key error collection: rastro.valoraciones index: autor.id_1_anuncioId_1 dup key: { autor.id: ObjectId('660000000000000000000004'), anuncioId: ObjectId('670000000000000000000004') }
  ```
- **Explicación:** El índice compuesto único impide combinaciones repetidas de ambos campos, impidiendo múltiples valoraciones del mismo autor sobre el mismo anuncio.

#### B4.3 (Anuncio con vendedor inexistente)
- **Predicción:** Se insertará con éxito y sin error.
- **Resultado observado:** Inserción exitosa (`acknowledged: true`, generó `_id: ObjectId('...')`). No lanzó ningún error ni advertencia.
- **Explicación:** MongoDB no valida integridad referencial entre colecciones (no existen claves foráneas nativas forzadas a nivel de motor).

#### B4.4 (Precio como texto y búsqueda `$lt: 100`)
- **Predicción:** Se inserta sin error, pero no aparecerá en la búsqueda `{ precio: { $lt: 100 } }`.
- **Resultado observado:** Inserción exitosa. En la búsqueda `{ precio: { $lt: 100 } }` la lámpara de precio `"75"` no aparece; solo se devuelven los anuncios cuyo precio es numérico (90, 25, 40, 10).
- **Explicación:** En BSON los tipos de datos se comparan estrictamente; un string (`"75"`) no se convierte automáticamente a número ni satisface comparaciones matemáticas contra valores numéricos.

#### B4.5 (Modificar precio sin operador atómico)
- **Predicción:** Lanzará un error exigiendo operadores atómicos (`$set`, etc.).
- **Resultado observado:**
  ```text
  Error B4.5: Update document requires atomic operators
  ```
- **Explicación:** En `updateOne` MongoDB exige operadores atómicos (como `$set`) para evitar que se reemplace involuntariamente todo el documento con un objeto `{ precio: 80 }`.

#### B4.6 (Buscar `_id` como texto en vez de `ObjectId`)
- **Predicción:** Devolverá `null`.
- **Resultado observado:** `null`.
- **Explicación:** El tipo BSON `string` no coincide con el tipo BSON `ObjectId`, aunque contengan los mismos 24 caracteres hexadecimales.

#### B4.7 a B4.9
- **B4.7:** En SQL una clave foránea inexistente habría lanzado un error de violación de Foreign Key impidiendo la inserción. En MongoDB la comprobación debe realizarse en la capa de aplicación (backend) antes de insertar, o mediante reglas `$jsonSchema`.
- **B4.8:** En el orden de tipos BSON, los números y las cadenas son tipos distintos y las comparaciones numéricas no convierten tipos implícitamente.
- **B4.9:** Ambos casos demuestran que MongoDB por defecto no comprueba tipos de datos ni integridad referencial (claves foráneas) automáticamente.

---

### Ejercicio B5.12
- **Pregunta:** En la consulta 2 filtramos por `atributos.km`. ¿Qué pasa con los anuncios que no tienen ese campo? ¿Dan error?
- **Respuesta:** No dan ningún error. MongoDB simplemente evalúa que la propiedad no existe (o es `null`/`undefined`) y no coincide con el filtro, excluyendo el documento del resultado sin fallar.

---

### Ejercicio B7: Modificaciones y consistencia

- **B7.1 (Foto añadida):** Se utilizó el operador `$push` sobre el array `fotos` del iPhone (`670000000000000000000003`), añadiendo `{ url: "https://img.rastro.es/a3-4.jpg", orden: 4 }`.
- **B7.2 (Visita sumada):** Se utilizó `$inc: { visitas: 1 }` sobre el Xiaomi. *Nota de idempotencia:* Esta operación no es idempotente; si se ejecuta dos veces por error, el contador de visitas subirá 2 veces en lugar de 1.
- **B7.3 (Operador `$addToSet` en favoritos):**
  - Se eliminó el iPhone mediante `$pull`.
  - Se añadió el Ford Focus con `$addToSet`. En la primera ejecución `modifiedCount` fue 1.
  - Al ejecutar una segunda vez exactamente la misma sentencia `$addToSet`, `modifiedCount` fue 0 y el array no se duplicó, manteniendo únicamente una ocurrencia del ObjectId.
- **B7.4 (Transacciones e interrupciones en venta):**
  - Se necesitaron **2 instrucciones independientes**: un `updateOne` en `ofertas` (para pasar a `ACEPTADA`) y un `updateOne` en `anuncios` (para pasar a `RESERVADO`).
  - *¿Qué pasaría si se corta la luz entre ambas?* La base de datos quedaría en un estado incoherente e inconsistente: la oferta constaría como aceptada pero el anuncio seguiría apareciendo públicamente como `DISPONIBLE` para otros compradores. Para evitar esto en producción se requeriría una sesión transaccional multi-documento (`session.startTransaction()`).
- **B7.5 (Rebajas con `$mul`):**
  - Se ejecutó `updateMany({ categoria: "Coches" }, { $mul: { precio: 0.9 } })`, rebajando el Seat Ibiza (6500 € a 5850 €) y el Ford Focus (4200 € a 3780 €).
  - *Nota de idempotencia:* Al igual que `$inc`, `$mul` no es idempotente; volver a ejecutarlo aplicaría un 10 % de descuento acumulado adicional.
- **B7.6 (Propagación del cambio de nombre de Luis):**
  - Al actualizar únicamente la colección `usuarios`, los anuncios de Luis (`Seat Ibiza` y `Xiaomi Redmi Note 10`) continuaban mostrando `"Luis Martín"` porque el nombre estaba desnormalizado.
  - Para sincronizar los datos en toda la base de datos se propagó el cambio a:
    1. **`anuncios`:** 2 documentos actualizados (`vendedor.nombre`).
    2. **`ofertas`:** 1 documento actualizado donde Luis figura como comprador (`comprador.nombre` en la oferta de las zapatillas Nike).
    3. **`valoraciones`:** Comprobación preventiva por si Luis fuera autor de alguna valoración.
  - Esto ilustra el inconveniente principal de la desnormalización: lecturas atómicas rápidas a cambio de actualizaciones manuales en cascada.

---

### Ejercicio B8: Conclusiones

1. **Dos razones para usar MongoDB en Rastro:** Estructura polimórfica para los atributos de distintas categorías y lectura atómica de la ficha de anuncio en una sola consulta.
2. **Parte que guardaríamos en SQL:** Módulo de pagos, transacciones financieras y facturación, donde se exige consistencia estricta, tipos fijos e integridad referencial garantizada.
3. **Fotos embebidas vs Ofertas aparte:** Las fotos son acotadas (máximo 10) y pertenecen exclusivamente al anuncio. Las ofertas pueden crecer sin límite y deben consultarse tanto por anuncio como por comprador.
4. **Por qué la oferta copia el precio:** Para congelar el precio histórico exacto al momento de la oferta comercial, independientemente de variaciones posteriores.
5. **Qué es desnormalizar:** Copiar datos de un documento en otro. Ventaja: lectura ultrarrápida sin joins; inconveniente: necesidad de actualizar múltiples sitios ante un cambio.
6. **Quién comprueba las referencias inexistentes en MongoDB:** La lógica de negocio en la capa de aplicación (backend) o validaciones de esquema personalizadas.

