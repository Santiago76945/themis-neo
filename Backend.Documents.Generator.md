
---
## 📝 Documentos generados con IA – Backend

### 🛣️ Flujo completo

1. **POST `/api/documents`**  
   * **Autenticación**: se verifica el `idToken` con Firebase Admin.  
   * **Entrada**: `{ title, model, info }`.  
   * **OpenAI**: `generateDocument(model, info)` llama a GPT 3.5/4 para crear el texto.  
   * **Tokens & coste**: se calcula `coinsCost = Math.ceil(tokens * COINS_PER_TOKEN)`.  
   * **MongoDB (transacción)**  
     1. Comprueba que `user.coinsBalance ≥ coinsCost`.  
     2. Resta `coinsCost` de forma atómica.  
     3. Guarda el documento en la colección `generateddocuments`.  
   * **Respuesta**: documento completo (incluye `title`, `content`, `tokens`, `coinsCost`).

2. **GET `/api/documents`**  
   * Devuelve **solo** los documentos del usuario (`uid`) con campos:  
     `title, model, info, content, tokens, coinsCost, createdAt`.

3. **GET `/api/documents/[id]`**  
   * Devuelve un documento concreto si pertenece al usuario.

4. **DELETE `/api/documents/[id]`**  
   * Elimina el documento si el `uid` coincide y actualiza la lista en el cliente.

---

### 🔑 Esquema de `GeneratedDocument` (MongoDB)

```ts
// src/lib/models/Document.ts
{
  title:      { type: String, required: true },
  userUid:    { type: String, required: true, index: true },
  model:      { type: String, required: true },   // prompt base
  info:       { type: String, required: true },   // datos del usuario
  content:    { type: String, default: '' },      // texto generado
  tokens:     { type: Number, default: 0 },
  coinsCost:  { type: Number, required: true },
  createdAt:  Date,                               // timestamps:true
  updatedAt:  Date
}
````

---

### 🔧 Archivos clave

| Ruta                                      | Propósito                                                  |
| ----------------------------------------- | ---------------------------------------------------------- |
| **`src/app/api/documents/route.ts`**      | `POST` (crear) y `GET` (listar) documentos                 |
| **`src/app/api/documents/[id]/route.ts`** | `GET` (detalle) y `DELETE` documento                       |
| **`src/lib/models/Document.ts`**          | Esquema Mongoose de `GeneratedDocument`                    |
| **`src/lib/generateDocument.ts`**         | Llama a OpenAI, cuenta tokens y calcula `coinsCost`        |
| **`src/lib/db.ts`**                       | Conexión global a MongoDB                                  |
| **`src/lib/firebaseAdmin.ts`**            | Verificación de tokens Firebase                            |
| **`src/lib/apiClient.ts`**                | Funciones `getDocuments`, `postDocument`, `deleteDocument` |

---

### 🔐 Autenticación

Todas las rutas `/api/documents*` exigen:

```
Authorization: Bearer <ID_TOKEN_FIREBASE>
```

* Verificado con `admin.auth().verifyIdToken`.
* Extrae `uid` para filtrar/crear/eliminar documentos solo del propietario.

---

### 💸 Cálculo de coste

| Concepto         | Fórmula                                           | Variable          |
| ---------------- | ------------------------------------------------- | ----------------- |
| **Coste por IA** | `coinsCost = Math.ceil(tokens * COINS_PER_TOKEN)` | `COINS_PER_TOKEN` |

> Ejemplo: 68 tokens, `COINS_PER_TOKEN = 0.04` → `68 × 0.04 = 2.72` → `coinsCost = 3`.

La transacción resta el saldo **antes** de guardar el documento; si el usuario no tiene monedas suficientes, responde `402 Payment Required`.

---

### 🖇️ Integración en el cliente

* **Crear**:

  ```ts
  await postDocument({ title, model, info });
  ```
* **Listar** (pestaña *Crear escrito*):

  ```ts
  const docs = await getDocuments(); // muestra título y fecha
  ```
* **Detalle**:
  La página `[id]/page.tsx` llama `GET /api/documents/[id]` y renderiza:

  * `content` completo
  * `tokens` y `coinsCost`
  * Botón **Eliminar** (`DELETE /api/documents/[id]`)

---
