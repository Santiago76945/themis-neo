---

## 🧠 ¿Qué sucede cuando un usuario inicia sesión por primera vez?

Cuando un usuario inicia sesión con Google por primera vez, la función `createUserProfile` en el backend se encarga de:

1. ✅ **Verificar** el `idToken` de Firebase.
2. 🔎 **Buscar** si ese usuario ya existe en MongoDB (por su `uid`).
3. 🆕 **Crear** el usuario en la colección `users` si no existe aún.

---

## 🆔 Datos de identificación del usuario

Cada usuario tiene los siguientes campos clave:

| Campo         | Descripción                                                    |
| ------------- | -------------------------------------------------------------- |
| `uid`         | ID único del usuario generado por Firebase Auth                |
| `email`       | Correo electrónico de la cuenta de Google                      |
| `displayName` | Nombre completo proveniente del perfil de Google               |
| `uniqueCode`  | Código interno irrepetible generado por la app (tipo "ABC123") |

---

## 📦 Tecnología utilizada

Usamos **Next.js 15**, que ya soporta **API Routes nativas** en la carpeta `app/api`, por eso **no utilizamos más `netlify/functions`** para el backend.

---

## 🔁 Flujo completo de creación y recuperación

### 🔐 Autenticación – `src/context/AuthContext.tsx`

* El usuario inicia sesión con Google usando Firebase.
* Esto automáticamente te da:

  * `uid`: ID único.
  * `email`: correo electrónico.
  * `displayName`: nombre completo.

---

### 📡 API interna – `src/app/api/createUserProfile/route.ts`

* Recibe el token de sesión (`idToken`).
* Verifica la sesión con Firebase Admin.
* Extrae `uid`, `email` y `name` del token.
* Busca o crea al usuario en MongoDB.

---

### 🧬 Modelo de usuario – `src/lib/models/User.ts`

Define el esquema de MongoDB para los usuarios:

```ts
{
  uid: { type: String, required: true, unique: true },
  email: { type: String },
  displayName: { type: String },
  uniqueCode: { type: String, unique: true }
}
```

---

### 🌐 Conexión a base de datos – `src/lib/db.ts`

Maneja la conexión a **MongoDB** para permitir guardar y leer usuarios desde las rutas API (`route.ts`).

---

### 🔢 Código único – `src/utils/generateCode.ts`

Función auxiliar que genera el campo `uniqueCode` si el usuario es nuevo (ej: `"GHT927"`).

---

El **enlace entre el usuario y su `uniqueCode`** se produce en el momento en que el usuario inicia sesión por primera vez y queda **almacenado en MongoDB**. Te explico todo el flujo en tres partes: **cómo se produce**, **cómo se almacena** y **cómo se recupera**.

---

### 🧩 1. ¿Cómo se **produce** el `uniqueCode`?

Cuando el usuario inicia sesión por primera vez con Google:

* En `src/context/AuthContext.tsx`, se obtiene automáticamente desde Firebase:

  * `uid`, `email`, `displayName`

Luego, `AuthContext` hace un `fetch` a:

```ts
POST /api/createUserProfile
```

Esto dispara `src/app/api/createUserProfile/route.ts`, que hace:

1. Verifica el `idToken` con Firebase Admin.
2. Busca en MongoDB un usuario con ese `uid`.
3. Si **ya existe**, simplemente lo devuelve.
4. Si **no existe**, **genera** un `uniqueCode` usando `generateUniqueCode()` y crea el usuario.

---

### 💾 2. ¿Cómo se **almacena**?

En el archivo `src/lib/models/User.ts` está definido el esquema de MongoDB:

```ts
const UserSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: String,
  displayName: String,
  uniqueCode: { type: String, unique: true }
});
```

Cuando se ejecuta:

```ts
await User.create({ uid, email, displayName, uniqueCode });
```

Se almacena un nuevo documento como este:

```json
{
  "uid": "FbA1B2C3",
  "email": "usuario@gmail.com",
  "displayName": "Usuario Ejemplo",
  "uniqueCode": "ZK83TQ"
}
```

Este documento queda persistido en la colección `users` de MongoDB.

---

### 🔍 3. ¿Cómo se **recupera**?

Después de crearse (o si ya existía), la ruta `route.ts` responde con:

```ts
return NextResponse.json({ uniqueCode: user.uniqueCode });
```

Y en `AuthContext.tsx`, ese valor se guarda en el contexto:

```ts
const data = await res.json();
setUniqueCode(data.uniqueCode);
```

Entonces, cualquier componente que use `useAuth()` accede al `uniqueCode` del usuario actual. Por ejemplo:

```tsx
const { uniqueCode } = useAuth();
```

---




