## 📝 Documentos generados con IA – Backend (versión 2025-07-07)

### 📄 Formato de los modelos (`/api/document-models`)

Cada plantilla – almacenada estáticamente como JSON en el servidor – tiene **tres** claves.
Ejemplo real ⬇️

```jsonc
{
  "title": "Recibo de pago",           // encabezado legal que irá al comienzo del documento
  "content": "En la ciudad de Córdoba, …", // cuerpo con campos entre corchetes [ ] para sustituir
  "recommendation": "Proveer al menos: …"  // ayuda que el UI muestra como *placeholder*
}
```

| Clave            | Para qué se usa en el cliente                                                       |
| ---------------- | ----------------------------------------------------------------------------------- |
| `title`          | • Aparece como **modelTitle** en el popup/vista detallada.<br>• Se guarda en Mongo. |
| `content`        | Texto base que se envía a GPT-4o junto con los datos personalizados (`info`).       |
| `recommendation` | Se muestra como placeholder para guiar al abogado sobre la información a rellenar.  |

> **Nota:** el nombre del archivo que el usuario elige (`title` en la petición POST) **no** tiene que coincidir con `modelTitle`; normalmente contendrá detalles para ubicar el caso, por ejemplo *“Martínez c/ Pérez – Recibo”*.

---

### 🛣️ Flujo completo

1. **POST `/api/documents`**

   ```jsonc
   {               // body esperado
     "title":      "Martínez – Recibo",  // nombre que verá solo el usuario en su lista
     "modelTitle": "Recibo de pago",     // encabezado legal (viene del modelo JSON)
     "model":      "En la ciudad de …",  // plantilla completa
     "info":       "Lugar: Santa Fe …"   // datos reales para completar la plantilla
   }
   ```

   * **Auth** → `idToken` ↦ `uid`.
   * **OpenAI** → GPT-4o genera `content`.
   * **Coste** → `totalTokens = usage.total_tokens`;
     `coinsCost = Math.ceil(totalTokens * COINS_PER_TOKEN)`.
   * **Transacción Mongo** → comprueba saldo, descuenta y guarda.
   * **Respuesta** → documento con `title`, `modelTitle`, `content`, `tokens`, `totalTokens`, `coinsCost`, fechas, etc.

2. **GET `/api/documents`**

   * Devuelve lista filtrada por `uid`:
     `title, modelTitle, coinsCost, createdAt, …`

3. **GET `/api/documents/[id]`**

   * Devuelve el documento completo si pertenece al usuario.

4. **DELETE `/api/documents/[id]`**

   * Borra el documento y devuelve `{ success:true }`.

---

### 🔑 Esquema `GeneratedDocument`

```ts
{
  title:       String,   // nombre que puso el usuario
  modelTitle:  String,   // encabezado legal de la plantilla
  userUid:     String,
  model:       String,   // plantilla original
  info:        String,   // datos personalizados
  content:     String,   // texto final
  tokens:      Number,   // solo completion
  totalTokens: Number,   // prompt + completion
  coinsCost:   Number,
  createdAt:   Date,
  updatedAt:   Date
}
```

---

### 🔧 Archivos clave

| Ruta                                             | Descripción breve                                    |
| ------------------------------------------------ | ---------------------------------------------------- |
| `src/app/api/documents/route.ts`                 | POST/GET documentos                                  |
| `src/app/api/documents/[id]/route.ts`            | GET/DELETE documento                                 |
| `src/lib/models/Document.ts`                     | Esquema Mongoose                                     |
| `src/lib/generateDocument.ts`                    | Llama a GPT-4o y calcula coste                       |
| `src/app/menu/documents-generator/page.tsx`      | UI principal (crear, lista, popup, **copiar texto**) |
| `src/app/menu/documents-generator/[id]/page.tsx` | Vista detallada (copiar/eliminar)                    |
| `src/lib/apiClient.ts`                           | Fetch helper con token                               |

---

### 💸 Cálculo de coste

| Concepto | Fórmula                                                |
| -------- | ------------------------------------------------------ |
| Coste IA | `coinsCost = Math.ceil(totalTokens * COINS_PER_TOKEN)` |

Ejemplo → `totalTokens = 72`, `COINS_PER_TOKEN = 0 .04` → `coinsCost = 3`.

---

### 🖇️ Integración front-end

```ts
// crear
await postDocument({ title, modelTitle, model, info });

// listar
const docs = await getDocuments(); // título, fecha, coinsCost …

// detalle
//   • muestra modelTitle + content
//   • botón “Copiar texto” (clipboard)
//   • botón “Eliminar”
```
