## 🖋️ Certificación de firma con hash criptográfico, evidencia biométrica y almacenamiento digital seguro con código único de verificación
---

### 🛣️ Flujo completo

1. **Carga de evidencias (cliente)**
   * **Imágenes de cada página** ⇒ `uploadImageFile()` → `gs://.../pages/{uid}/{timestamp}.jpg`
   * **Imagen de DNI / Pasaporte** ⇒ `uploadImageFile()` → `gs://.../ids/{uid}/{timestamp}.jpg`
   * **Audio biométrico** (≤ 60 s) ⇒ `uploadAudioFile()` → `gs://.../audios/{uid}/{timestamp}.webm`

2. **POST `/api/certifications`**
   * **Autenticación** → `verifyIdToken(idToken)` → `uid`
   * **Coste**  
     ```ts
     const COINS_PER_MB_STORAGE = parseFloat(process.env.COINS_PER_MB_STORAGE!);
     const cost = Math.ceil(totalMb * COINS_PER_MB_STORAGE);
     ```
   * **Descuento atómico**
     ```ts
     User.findOneAndUpdate(
       { uid, coinsBalance: { $gte: cost } },
       { $inc: { coinsBalance: -cost } },
       { new: true }
     );
     ```
   * **Hash SHA-256** del PDF combinado  
     `hash = sha256(pdfBytes)`

   * **MongoDB**: guarda el documento `Certification`.

3. **GET `/api/certifications/:code`**
   * Valida saldo mínimo (`1 ThemiCoin`)
   * Devuelve PDF + hash + evidencias.

4. **Cliente (Wizard)**
   * Al terminar, cambia a la pestaña **Consultar** y pasa el `code`.  
     El `useEffect` dispara la búsqueda automática.

---

### 🔢 Cálculo de coste

| Concepto                               | Fórmula                                             | Env var                    |
| -------------------------------------- | --------------------------------------------------- | -------------------------- |
| **Almacenamiento prolongado**          | `storageCost = MB * COINS_PER_MB_STORAGE`           | `COINS_PER_MB_STORAGE`     |
| **Coste total de certificación**       | `coinsCost = Math.ceil(storageCost)`                | —                          |

> Ejemplo: 7,3 MB totales ⇒ `7.3 * 10 = 73` → `coinsCost = 73 ThemiCoins`.

---

### 🔑 Esquema `Certification` (MongoDB)

```ts
// src/lib/models/Certification.ts
{
  code:       { type: String, unique: true },      // 8 dígitos
  pdfUrl:     String,                              // PDF consolidado
  hash:       String,                              // SHA-256 del PDF
  parties: [{
    name:        String,
    dni:         String,
    idImageUrl:  String,
    audioUrl:    String,
    timestamp:   Date,
    ip:          String
  }],
  userUid:    String,
  coinsCost:  Number,
  createdAt:  Date
}
````

---

### 🔧 Archivos clave

| Ruta                                             | Propósito                                                      |
| ------------------------------------------------ | -------------------------------------------------------------- |
| **`src/app/api/certifications/route.ts`**        | POST: crea certificación & descuenta coins                     |
| **`src/app/api/certifications/[code]/route.ts`** | GET: devuelve certificación; cobra 1 coin por consulta         |
| **`src/components/SignatureWizard.tsx`**         | UI de 5 pasos, calcula **cost = MB × COINS\_PER\_MB\_STORAGE** |
| **`src/lib/uploadToFirebase.ts`**                | Sube páginas, DNI y audio a Firebase Storage                   |
| **`src/context/AuthContext.tsx`**                | Expone `coinsPerMbStorage` y `spendCoins()`                    |
| **`.env`**                                       | Define `COINS_PER_MB_STORAGE`                                  |

---

### 🔐 Autenticación

Las rutas `/api/certifications*` exigen:

```
Authorization: Bearer <ID_TOKEN_FIREBASE>
```

* `verifyIdToken` → `uid`
* El documento sólo se crea/lee si `uid` coincide con el dueño.

---

### 🛡️ Protección contra saldo negativo

```ts
const updated = await User.findOneAndUpdate(
  { uid, coinsBalance: { $gte: coinsCost } },
  { $inc: { coinsBalance: -coinsCost } },
  { new: true }
);
if (!updated) return NextResponse.json({ error: 'Saldo insuficiente' }, { status: 402 });
```

---

### 💳 Detalle de cobro en la UI (Wizard – Paso 1)

```tsx
<p className={styles.costInfo}>
  Costo de certificación: <strong>{coinsPerMbStorage} ThemiCoins</strong> por MB
</p>
```

El componente calcula el tamaño total (`pages + DNI + audio + PDF`) y
muestra el coste estimado antes de generar la certificación.

---

### 👁️‍🗨️ Vista de consulta

* **Input de código (8 dígitos)**
* Si viene del Wizard, el código se completa y se busca automáticamente.
* Muestra: PDF combinado, hash, lista de firmantes con imagen y audio.

---

> **Tagline corto**
> *“Certificación digital de firmas con seguridad criptográfica y biométrica.”*

```
