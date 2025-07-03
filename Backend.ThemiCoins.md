## 💰 Gestión de ThemiCoins – Backend

---

### 🛣️ Flujo completo

1. **Consulta de saldo – `GET /api/coins`**

   * **Autenticación**: se valida el `idToken` con Firebase Admin (`verifyIdToken`).
   * **MongoDB**: se busca el documento del usuario y se devuelve:

     ```json
     { "coinsBalance": 250, "coinsPerToken": 0.04, "coinsPerMb": 0.5 }
     ```

2. **Compra de monedas – `POST /api/coins`**

   * **Body**: `{ amount: <número de monedas a comprar> }`.
   * **Autenticación**.
   * **MongoDB**: incrementa `coinsBalance` con `amount` usando `findOneAndUpdate($inc)`.
   * **Respuesta**: saldo actualizado.
   * **⚡ Hook en el cliente**: `purchaseCoins(amount)` del `apiClient` refresca el contexto (`refreshCoins`).

3. **Consumo de monedas**

   * Cualquier endpoint que incurra en coste (p. ej. `/api/transcriptions`) debe:

     1. Calcular `cost = tokenCost + sizeCost`.
     2. Verificar que `user.coinsBalance ≥ cost`; si no, responde `402 Payment Required`.
     3. Restar el coste con `$inc: { coinsBalance: -cost }` antes de llamar a OpenAI, garantizando que nunca quede saldo negativo.

---

### 🔢 Cálculo de coste

| Concepto                        | Fórmula                                       | Variable de entorno |
| ------------------------------- | --------------------------------------------- | ------------------- |
| **Coste por tokens**            | `tokenCost = tokens * COINS_PER_TOKEN`        | `COINS_PER_TOKEN`   |
| **Coste por tamaño de archivo** | `sizeCost  = megabytes * COINS_PER_MB`        | `COINS_PER_MB`      |
| **Coste total**                 | `coinsCost = Math.ceil(tokenCost + sizeCost)` | —                   |

> Ejemplo: 3 MB y 420 tokens
> `tokenCost = 420 × 0.04 = 16.8` | `sizeCost = 3 × 0.5 = 1.5` → `coinsCost = 19 ThemiCoins`.

---

### 🔑 Esquema de `User` (MongoDB)

```ts
// src/lib/models/User.ts
{
  uid:          { type: String, required: true, unique: true },
  email:        String,
  displayName:  String,
  uniqueCode:   { type: String, unique: true },
  coinsBalance: { type: Number, default: 0 }   // ← saldo de ThemiCoins
}
```

---

### 🔧 Archivos clave

| Ruta                                      | Propósito                                                      |
| ----------------------------------------- | -------------------------------------------------------------- |
| **`src/app/api/coins/route.ts`**          | GET (saldo) & POST (compra) de ThemiCoins                      |
| **`src/lib/models/User.ts`**              | Añade el campo `coinsBalance`                                  |
| **`src/lib/apiClient.ts`**                | `getCoinsBalance`, `purchaseCoins` con header `Authorization`  |
| **`src/context/AuthContext.tsx`**         | Mantiene `coinsBalance` en el estado global + `refreshCoins()` |
| **`.env`**                                | Define `COINS_PER_TOKEN` y `COINS_PER_MB`                      |
| **`src/app/api/transcriptions/route.ts`** | Resta `coinsCost` antes de llamar a Whisper                    |

---

### 🔐 Autenticación

Todas las rutas `/api/coins*` (y cualquier otra que mueva saldo) deben recibir:

```
Authorization: Bearer <ID_TOKEN_FIREBASE>
```

* Se valida con `admin.auth().verifyIdToken`.
* Se usa `uid` para acceder al documento correcto y evitar fraudes.

---

### 🛡️ Protección contra saldo negativo

```ts
const session = await mongoose.startSession();
session.startTransaction();

const usr = await User.findOneAndUpdate(
  { uid, coinsBalance: { $gte: coinsCost } },      // asegura saldo suficiente
  { $inc: { coinsBalance: -coinsCost } },
  { new: true, session }
);

if (!usr) {
  await session.abortTransaction();
  return NextResponse.json({ error: "Saldo insuficiente" }, { status: 402 });
}

await session.commitTransaction();
```

De esta forma el descuento es **atómico** y no hay riesgo de condiciones de carrera.

---

### 💸 Proceso de compra (demo)

* El cliente abre `CoinPurchaseModal.tsx` y elige un paquete.
* Llama a `purchaseCoins(amount)`.
* Tras la respuesta, se refresca `coinsBalance` en el contexto y la UI refleja el nuevo saldo.

