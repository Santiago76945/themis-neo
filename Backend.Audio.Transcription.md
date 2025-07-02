---

## 🔊 Conversión de Audio a Texto – Backend

---

### 🛣️ Flujo completo

1. **Subida de archivo**
   El cliente usa `uploadAudioFile` (Firebase Storage) para subir el audio y recibe una URL pública.

2. **POST `/api/transcriptions`**

   * **Autenticación**: se extrae y verifica el `idToken` de Firebase Admin (`verifyIdToken`).
   * **Descarga**: el servidor descarga el audio desde la URL en Firebase Storage.
   * **Whisper API**: envía el archivo a la API de OpenAI Whisper (`v1/audio/transcriptions`).
   * **Cálculo**: cuenta tokens (nº palabras) y calcula coste en ThemiCoins.
   * **MongoDB**: guarda un documento en la colección `transcriptions`.

3. **GET `/api/transcriptions`**

   * **Autenticación**
   * **Lectura**: devuelve todas las transcripciones del usuario, ordenadas por fecha.

4. **DELETE `/api/transcriptions/[id]`**

   * **Autenticación**
   * **Eliminación**: borra la transcripción si pertenece al usuario.

5. **Detalle**

   * La página cliente en `/menu/audio-transcription/[id]` recupera de la lista
     y muestra audio, texto, tokens y coste.

---

### 🔑 Esquema de `Transcription` (MongoDB)

```ts
// src/lib/models/Transcription.ts

{
  userUid:  { type: String, required: true, index: true },
  title:    { type: String, required: true },
  fileUrl:  { type: String, required: true },
  text:     { type: String, default: '' },
  tokens:   { type: Number, default: 0 },
  coinsCost:{ type: Number, required: true },
  createdAt:{ Date, auto via timestamps }
}
```

---

### 🔧 Archivos Clave

| Ruta                                           | Propósito                                       |
| ---------------------------------------------- | ----------------------------------------------- |
| **`src/app/api/transcriptions/route.ts`**      | POST & GET de transcripciones                   |
| **`src/app/api/transcriptions/[id]/route.ts`** | DELETE de una transcripción                     |
| **`src/lib/models/Transcription.ts`**          | Definición del esquema Mongoose                 |
| **`src/lib/db.ts`**                            | Conexión optimizada a MongoDB                   |
| **`src/lib/firebaseAdmin.ts`**                 | Inicialización y verificación de Firebase Admin |
| **`src/lib/uploadToFirebase.ts`**              | Lógica de subida de archivos a Firebase Storage |

---

### 🔐 Autenticación

Todas las rutas `/api/transcriptions*` esperan en el header:

```
Authorization: Bearer <ID_TOKEN_DE_FIREBASE>
```

* Se verifica con `admin.auth().verifyIdToken`
* Extrae `uid` para filtrar/crear/leer/eliminar datos sólo del usuario.

---

### 🪄 Whisper y ThemiCoins

* **Modelo**: `whisper-1` de OpenAI.
* **Formato**: `multipart/form-data` con campo `file`.
* **Tokens**: se cuentan como nº de palabras (`text.split(/\s+/).length`).
* **Coste**:

  ```ts
  const COINS_PER_TOKEN = parseFloat(process.env.COINS_PER_TOKEN!);
  coinsCost = Math.ceil(tokens * COINS_PER_TOKEN);
  ```

  Muestra al usuario “ThemiCoin por token: X” en la UI.

---

### 🗂️ Recuperación y detalle

* La página **`/menu/audio-transcription/[id]`**:

  1. Lee la lista completa (`GET /api/transcriptions`).
  2. Filtra por `id` en el cliente.
  3. Muestra `<audio>` con `src=fileUrl` y el texto transcrito.

---

