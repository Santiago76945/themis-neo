---

## 💳 Compra de ThemiCoins con Mercado Pago – Backend

---

### 🛣️ Flujo completo

1. **Selección del paquete**
   El usuario abre `CoinPurchaseModal.tsx`, ve los **3 bundles** disponibles:

   | bundle  | monedas             | precio final | id interno |
   | ------- | ------------------- | ------------ | ---------- |
   | Básico  | **100 ThemiCoins**  | \$ 1 499,99  | `basic`    |
   | Popular | **500 ThemiCoins**  | \$ 4 999,00  | `popular`  |
   | Premium | **1000 ThemiCoins** | \$ 8 999,99  | `premium`  |

   Al hacer clic se llama a `createCheckoutPreference(bundleId)` desde `apiClient`.

2. **POST `/api/checkout`**

   * **Autenticación** (se extrae y valida el `idToken` → `uid`).

   * **Mercado Pago SDK**
     Crea la *preferencia* con:

     ```ts
     items: [{ title: 'ThemiCoins – premium', quantity: 1, unit_price: 8999.99 }],
     metadata: { uid, bundle: 'premium' },
     back_urls: { success: BASE_URL + '/success', … },
     auto_return: 'approved'
     ```

   * **Respuesta** → `{ init_point }`.

3. **Redirección al checkout**
   `CheckoutButton.tsx` recibe `init_point` y hace
   `window.location.href = init_point`, llevando al usuario al formulario hospedado en Mercado Pago.

4. **Pago**
   El usuario paga con tarjeta / MP Cuenta. Al finalizar, Mercado Pago:

   * Redirige a **`/success`** (vista Next.js que llama a `refreshCoins()`).
   * Dispara un **webhook** (`POST /api/webhook`).

5. **POST `/api/webhook`**

   * Valida la firma (token de consulta).
   * Pide a MP los datos del pago `findById(paymentId)`.
   * Si `status === 'approved'`:

     1. Lee `metadata.bundle` y `metadata.uid`.

     2. Determina la cantidad con un *mapa*:

        ```ts
        const bundles = { basic: 100, popular: 500, premium: 1000 };
        const credit = bundles[bundle];
        ```

     3. `User.findOneAndUpdate({ uid }, { $inc: { coinsBalance: credit } })`

     4. Opcional: registra el movimiento en colección `coin_logs`.

6. **Refresco de saldo**

   * **`/success`** invoca `refreshCoins()` (GET `/api/coins`) ⇒ UI muestra el nuevo balance.
   * Si el webhook llegó primero, el saldo ya estará actualizado; si no, se actualizará en los segundos siguientes.

---

### 🔑 Esquema de `User` (MongoDB)

```ts
{
  uid:          String,
  email:        String,
  displayName:  String,
  uniqueCode:   String,
  coinsBalance: Number   // saldo actual
}
```

---

### 🔧 Archivos clave

| Ruta                                    | Propósito                                                         |
| --------------------------------------- | ----------------------------------------------------------------- |
| **`src/app/api/checkout/route.ts`**     | Genera preferencia (Checkout Pro) y devuelve `init_point`         |
| **`src/app/api/webhook/route.ts`**      | Recibe notificaciones, verifica pago, acredita ThemiCoins         |
| **`src/lib/mercadoPago.ts`**            | Inicializa SDK con `MP_ACCESS_TOKEN`, expone `createPreference()` |
| **`src/components/CheckoutButton.tsx`** | Pide preferencia y redirige al checkout                           |
| **`src/app/success.tsx`**               | Página de retorno, llama `refreshCoins()`                         |
| **`src/lib/apiClient.ts`**              | `createCheckoutPreference`, `purchaseCoins`                       |
| **`.env`**                              | `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, `NEXT_PUBLIC_BASE_URL`, …     |

---

### 🔐 Seguridad & validaciones

* **Autenticación**
  Rutas `/api/checkout` y `/api/coins` exigen header

  ```
  Authorization: Bearer <ID_TOKEN_FIREBASE>
  ```

* **Verbos y estados**

  * `POST /api/checkout` → `201 Created` con `{ init_point }`.
  * `POST /api/webhook`  → `200 OK` siempre; el pago se re-verifica server-to-server.

* **Evitar fraudes**
  El crédito **solo** se agrega dentro del webhook, **nunca** confíes en la redirección de éxito.
  El campo `metadata.uid` asegura que el pago se asigne al usuario correcto.

---

