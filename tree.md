THEMIS-NEO
├─ **public**
│  ├─ images
│  │  ├─ coins-basic.png
│  │  ├─ coins-popular.png
│  │  ├─ coins-premium.png
│  │  └─ mercadopago.svg
│  └─ … (resto de imágenes, iconos, etc.)
│
├─ **src**
│  ├─ **app**
│  │  ├─ **api**
│  │  │  ├─ **coins**  ← micro-servicio saldo
│  │  │  │  └─ route.ts  (GET & POST /api/coins)
│  │  │  ├─ **createUserProfile**
│  │  │  │  └─ route.ts  (POST /api/createUserProfile)
│  │  │  ├─ **checkout**  ← micro-servicio checkout
│  │  │  │  └─ route.ts  (POST /api/checkout)
│  │  │  ├─ **webhook**  ← micro-servicio webhook
│  │  │  │  └─ route.ts  (POST /api/webhook)
│  │  │  └─ **transcriptions**
│  │  │     ├─ route.ts     (POST & GET /api/transcriptions)
│  │  │     └─ **\[id]**
│  │  │        └─ route.ts  (DELETE /api/transcriptions/\[id])
│  │  │
│  │  ├─ **login**
│  │  │  └─ page.tsx
│  │  ├─ **menu**
│  │  │  ├─ page.tsx
│  │  │  └─ **audio-transcription**
│  │  │     ├─ page.tsx   (listado + subida + acciones)
│  │  │     └─ **\[id]**
│  │  │        └─ page.tsx (detalle de una transcripción)
│  │  │
│  │  ├─ success.tsx     
│  │  ├─ layout.tsx
│  │  └─ page.tsx      
│  │
│  ├─ **components**
│  │  ├─ ConsoleEffect.tsx
│  │  ├─ ConsoleEffectWrapper.tsx
│  │  ├─ Popup.tsx              
│  │  ├─ CoinPurchaseModal.tsx   
│  │  ├─ CheckoutButton.tsx      
│  │  └─ **styles**
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
│  ├─ **context**
│  │  └─ AuthContext.tsx  
│  │
│  ├─ **lib**
│  │  ├─ **models**
│  │  │  ├─ User.ts             
│  │  │  └─ Transcription.ts    
│  │  ├─ apiClient.ts         
│  │  ├─ db.ts
│  │  ├─ firebase.ts
│  │  ├─ firebaseAdmin.ts
│  │  ├─ uploadToFirebase.ts
│  │  └─ … (otros helpers)
│  │
│  ├─ **server**                     
│  │  └─ mercadoPago.ts         
│  │
│  ├─ **utils**
│  │  └─ generateCode.ts
│  │
│  └─ … (hooks, servicios, etc.)
│
├─ .env   (IGNORADO en git)
├─ .gitignore
├─ tsconfig.json
├─ next.config.ts
├─ package.json
└─ README.md

