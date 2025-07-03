---
## 💳 Compra de **ThemiCoins** con Mercado Pago – Backend
---

### 🛣️ Flujo completo

1. **Selección del paquete**  
   El usuario abre `CoinPurchaseModal.tsx` y ve los **3 bundles**:

   | bundle  | monedas             | precio final | id interno |
   | ------- | ------------------- | ------------ | ---------- |
   | Básico  | **100 ThemiCoins**  | \$ 1 499,99  | `basic`    |
   | Popular | **500 ThemiCoins**  | \$ 4 999,00  | `popular`  |
   | Premium | **1000 ThemiCoins** | \$ 8 999,99  | `premium`  |

   Al hacer clic se dispara `createCheckoutPreference(bundleId)` desde `apiClient`.

2. **`POST /api/checkout`**

   * **Autenticación** → extrae y valida el `idToken` → `uid`.  
   * **Mercado Pago SDK**:  
     ```ts
     const preference = await mercadopago.preferences.create({
       items: [{ title: pkg.label, quantity: 1, unit_price: pkg.price }],
       metadata: { uid, bundle: pkg.id },
       back_urls: {
         success: `${BASE_URL}/success`,
         failure: `${BASE_URL}/failure`,
         pending : `${BASE_URL}/pending`,
       },
       auto_return: 'approved',
     });
     ```
   * Respuesta → `{ init_point }`.

3. **Redirección al checkout**  
   `CoinPurchaseModal.tsx` asigna `window.location.href = init_point`.

4. **Pago**  
   MP redirige a **`/success`** y envía **webhook** a `/api/webhook`.

5. **`POST /api/webhook`**

   * Valida header `x-secret-token`.  
   * `const payment = await mercadopago.payment.get(id)`.  
   * Si `status === 'approved'` → acredita coins:
     ```ts
     const bundles = { basic: 100, popular: 500, premium: 1000 };
     User.findOneAndUpdate(
       { uid: payment.body.metadata.uid },
       { $inc: { coinsBalance: bundles[payment.body.metadata.bundle] } }
     );
     ```

6. **Refresco de saldo**  
   `/success` llama `refreshCoins()`; si el webhook llegó antes, el saldo ya está refrescado.

---

### 🔑 Esquema de `User` (MongoDB)

```ts
{
  uid:          string,
  email:        string,
  displayName:  string,
  uniqueCode:   string,
  coinsBalance: number
}
````

---

### 🔧 Archivos clave

| Ruta                                       | Propósito                                                              |
| ------------------------------------------ | ---------------------------------------------------------------------- |
| **`src/app/api/checkout/route.ts`**        | Genera preferencia y devuelve `init_point` (Checkout Pro)              |
| **`src/app/api/webhook/route.ts`**         | Recibe notificaciones, verifica pago, acredita ThemiCoins              |
| **`src/server/mercadoPago.ts`**            | Inicializa SDK con `MP_ACCESS_TOKEN`, expone `createPreference()`      |
| **`src/components/CoinPurchaseModal.tsx`** | Muestra bundles y redirige al checkout                                 |
| **`src/app/success.tsx`**                  | Página de retorno, llama `refreshCoins()`                              |
| **`src/lib/apiClient.ts`**                 | Funciones `createCheckoutPreference` y `purchaseCoins`                 |
| **`.env`**                                 | Contiene `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, `NEXT_PUBLIC_BASE_URL`, … |

---

### 🛡️ Seguridad & validaciones

* **Headers protegidos**
  Rutas privadas exigen
  `Authorization: Bearer <ID_TOKEN_FIREBASE>`

* **Webhook first**: el crédito **solo** se abona dentro del webhook; nunca confíes en la redirección a `/success`.

* **Metadatos de pago** aseguran la relación bundle ↔ usuario (`uid` + `bundle`).

---

### 📝 Lecciones & tips para evitar los errores vistos

| Problema detectado                                | Solución aplicada / recomendación                                                 |
| ------------------------------------------------- | --------------------------------------------------------------------------------- |
| *“Property `configure` does not exist…”*          | **Import dinámico** del SDK y casteo a `any`, p.ej. `const mp: any = …`           |
| Next.js Edge bundling rompía el SDK               | Añadir `export const runtime = "nodejs";` en las rutas API que usan MP            |
| Tipos de la v2 del SDK incompletos / en conflicto | Evitar los tipos del paquete ⇒ usar `require` + `any` o un wrapper minimal        |
| Variables de entorno faltantes en Netlify         | Declararlas en UI **AND** “plain text” (sin comillas) \| revisar `process.env`    |
| Error “a.configure is not a function” en build    | Asegurarse de **configurar** el SDK *dentro* del handler (no en la parte Edge)    |
| Timeout del webhook                               | Sólo devolver `200` y procesar en background; evitar operaciones lentas sin await |

---

