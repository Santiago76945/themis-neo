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
│  │  ├─ layout.tsx
│  │  └─ page.tsx                         ← root redirect (login / menú)
│  │
│  ├─ components
│  │  ├─ ConsoleEffect.tsx
│  │  ├─ ConsoleEffectWrapper.tsx
│  │  ├─ Popup.tsx                        ← **Nuevo componente reutilizable**
│  │  ├─ CoinPurchaseModal.tsx            ← **Modal compra ThemiCoins**
│  │  └─ styles
│  │     ├─ AudioTranscription.module.css
│  │     ├─ CoinPurchaseModal.module.css  ← **Nuevo**
│  │     ├─ Popup.module.css              ← **Nuevo**
│  │     ├─ Clients.module.css
│  │     ├─ GestionCasos.module.css
│  │     ├─ LoginForm.module.css
│  │     ├─ Menu.module.css
│  │     ├─ MyLawFirm.module.css
│  │     ├─ TaskManager.module.css
│  │     └─ global.css
│  │
│  ├─ context
│  │  └─ AuthContext.tsx                  ← ahora maneja `coinsBalance`
│  │
│  ├─ lib
│  │  ├─ models
│  │  │  ├─ User.ts                       ← + coinsBalance
│  │  │  └─ Transcription.ts              ← tokens + coinsCost
│  │  ├─ apiClient.ts                     ← **Nuevo helper con fetch+Auth**
│  │  ├─ db.ts
│  │  ├─ firebase.ts
│  │  ├─ firebaseAdmin.ts
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
