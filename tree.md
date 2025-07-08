THEMIS-NEO
├─ public
│  └─ images
│     ├─ coins-basic.png
│     ├─ coins-popular.png
│     ├─ coins-premium.png
│     └─ mercadopago.svg
│     └─ … (más iconos e imágenes)
│
├─ src
│  ├─ app
│  │  ├─ api
│  │  │  ├─ coins/route.ts
│  │  │  ├─ createUserProfile/route.ts
│  │  │  ├─ checkout/route.ts
│  │  │  ├─ webhook/route.ts
│  │  │  ├─ transcriptions/route.ts
│  │  │  ├─ transcriptions/[id]/route.ts
│  │  │  ├─ documents/route.ts              ← POST & GET documentos
│  │  │  ├─ documents/[id]/route.ts         ← GET & DELETE por ID
│  │  │  ├─ document-models/route.ts        ← lista modelos JSON
│  │  │  └─ documents-generator/[id]/route.ts  (legacy: open single doc)
│  │  │
│  │  ├─ login/page.tsx
│  │  ├─ menu
│  │  │  ├─ page.tsx
│  │  │  ├─ audio-transcription
│  │  │  │  ├─ page.tsx
│  │  │  │  └─ [id]/page.tsx
│  │  │  └─ documents-generator
│  │  │     ├─ page.tsx                     ← lista + crear documentos
│  │  │     └─ [id]/page.tsx                ← detalle de un documento
│  │  │
│  │  ├─ success.tsx
│  │  ├─ layout.tsx
│  │  └─ page.tsx
│  │
│  ├─ components
│  │  ├─ Toolbar.tsx
│  │  ├─ Popup.tsx
│  │  ├─ CoinPurchaseModal.tsx
│  │  ├─ CheckoutButton.tsx
│  │  ├─ ConsoleEffect.tsx
│  │  ├─ ConsoleEffectWrapper.tsx
│  │  └─ styles
│  │     ├─ AudioTranscription.module.css
│  │     ├─ CoinPurchaseModal.module.css
│  │     ├─ Popup.module.css
│  │     ├─ DocumentsGenerator.module.css
│  │     ├─ Menu.module.css
│  │     ├─ … (resto de .css)
│  │
│  ├─ context
│  │  └─ AuthContext.tsx
│  │
│  ├─ data
│  │  └─ documentModels
│  │     ├─ recibo.json
│  │     ├─ convenio241.json
│  │     └─ … (otros modelos)
│  │
│  ├─ lib
│  │  ├─ models
│  │  │  ├─ User.ts
│  │  │  ├─ Transcription.ts
│  │  │  └─ Document.ts                    ← esquema GeneratedDocument
│  │  ├─ apiClient.ts
│  │  ├─ db.ts
│  │  ├─ firebase.ts
│  │  ├─ firebaseAdmin.ts
│  │  ├─ uploadToFirebase.ts
│  │  └─ generateDocument.ts              ← GPT-4o + coste tokens
│  │
│  ├─ server
│  │  └─ mercadoPago.ts
│  │
│  ├─ utils
│  │  └─ generateCode.ts
│  │
│  └─ hooks / servicios / … (otros helpers)
│
├─ .env            (IGNORADO en git)
├─ .gitignore
├─ tsconfig.json
├─ next.config.ts
├─ package.json
└─ README.md

//before implementing docx generator
