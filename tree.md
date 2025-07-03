THEMIS-NEO
├─ public
│  ├─ images
│  │  ├─ coins-basic.png
│  │  ├─ coins-popular.png
│  │  ├─ coins-premium.png
│  │  └─ mercadopago.svg
│  └─ … (resto de imágenes, iconos, etc.)
│
├─ src
│  ├─ app
│  │  ├─ api
│  │  │  ├─ coins                         ← **Nuevo micro-servicio saldo**
│  │  │  │  └─ route.ts                   ← GET & POST /api/coins
│  │  │  ├─ createUserProfile
│  │  │  │  └─ route.ts                   ← POST /api/createUserProfile
│  │  │  ├─ checkout                       ← **Nuevo micro-servicio checkout**
│  │  │  │  └─ route.ts                   ← POST /api/checkout
│  │  │  ├─ webhook                        ← **Nuevo micro-servicio webhook**
│  │  │  │  └─ route.ts                   ← POST /api/webhook
│  │  │  └─ transcriptions                ← micro-servicio de transcripciones
│  │  │     ├─ route.ts                   ← POST & GET /api/transcriptions
│  │  │     └─ [id]
│  │  │        └─ route.ts                ← DELETE /api/transcriptions/[id]
│  │  │
│  │  ├─ login
│  │  │  └─ page.tsx
│  │  ├─ menu
│  │  │  ├─ page.tsx
│  │  │  └─ audio-transcription
│  │  │     ├─ page.tsx                   ← listado + subida + acciones
│  │  │     └─ [id]
│  │  │        └─ page.tsx                ← detalle de una transcripción
│  │  │
│  │  ├─ success.tsx                      ← **Nuevo** página “Gracias por tu compra”
│  │  ├─ layout.tsx
│  │  └─ page.tsx                         ← root redirect (login / menú)
│  │
│  ├─ components
│  │  ├─ ConsoleEffect.tsx
│  │  ├─ ConsoleEffectWrapper.tsx
│  │  ├─ Popup.tsx                        ← componente reutilizable
│  │  ├─ CoinPurchaseModal.tsx            ← modal compra ThemiCoins
│  │  ├─ CheckoutButton.tsx               ← botón de redirección a MP Checkout
│  │  └─ styles
│  │     ├─ AudioTranscription.module.css
│  │     ├─ CoinPurchaseModal.module.css
│  │     ├─ Popup.module.css
│  │     ├─ Clients.module.css
│  │     ├─ GestionCasos.module.css
│  │     ├─ LoginForm.module.css
│  │     ├─ Menu.module.css
│  │     ├─ MyLawFirm.module.css
│  │     ├─ TaskManager.module.css
│  │     └─ global.css
│  │
│  ├─ context
│  │  └─ AuthContext.tsx                  ← ahora maneja `coinsBalance` + `refreshCoins`
│  │
│  ├─ lib
│  │  ├─ models
│  │  │  ├─ User.ts                       ← + coinsBalance
│  │  │  └─ Transcription.ts              ← tokens + coinsCost
│  │  ├─ apiClient.ts                     ← fetch+Auth + createCheckoutPreference
│  │  ├─ db.ts
│  │  ├─ firebase.ts
│  │  ├─ firebaseAdmin.ts
│  │  ├─ mercadoPago.ts                   ← configuración y createPreference
│  │  ├─ uploadToFirebase.ts
│  │  └─ … (otros helpers)
│  │
│  ├─ utils
│  │  └─ generateCode.ts
│  │
│  └─ … (hooks, servicios, etc.)
│
├─ .env                (IGNORADO en git)
├─ .gitignore
├─ tsconfig.json
├─ next.config.ts
├─ package.json
└─ README.md

finalmente mercadoPago.ts fue movido a src/server porque sino
El error te está saltando porque src/lib/mercadoPago.ts se importa en un contexto de cliente (tu bundle de React), y ahí no existen las variables de entorno ni el SDK de MercadoPago. 
