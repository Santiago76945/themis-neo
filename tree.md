THEMIS-NEO
├─ .netlify
│  └─ functions
│     └─ authGoogle.ts
│
├─ netlify        (carpeta generada por Netlify CLI en tiempo de dev)
│
├─ .next          (salida de build – se ignora en git)
│
├─ public
│  └─ … (imágenes, iconos, etc.)
│
├─ src
│  ├─ app
│  │  ├─ (auth)                 (segmento Next Auth si lo usas)
│  │  ├─ api
│  │  │  └─ createUserProfile
│  │  │     └─ route.ts         ← **Nuevo Route Handler** (POST /api/createUserProfile)
│  │  ├─ login
│  │  │  └─ page.tsx
│  │  ├─ menu
│  │  │  └─ page.tsx
│  │  ├─ layout.tsx
│  │  └─ page.tsx               (root redirect logic)
│  │
│  ├─ components
│  │  ├─ ConsoleEffect.tsx
│  │  ├─ ConsoleEffectWrapper.tsx
│  │  └─ styles
│  │     ├─ Clients.module.css
│  │     ├─ GestionCasos.module.css
│  │     ├─ LoginForm.module.css
│  │     ├─ Menu.module.css     ← **Editado** (scroll interno + ajustes)
│  │     ├─ MyLawFirm.module.css
│  │     ├─ TaskManager.module.css
│  │     └─ global.css
│  │
│  ├─ context
│  │  └─ AuthContext.tsx        ← **Actualizado** (fetch /api/createUserProfile)
│  │
│  ├─ hooks
│  │  └─ … (custom hooks si los hay)
│  │
│  ├─ lib
│  │  ├─ models
│  │  │  └─ User.ts
│  │  ├─ db.ts                  ← **Nuevo** helper conexión Mongo
│  │  ├─ firebase.ts
│  │  └─ mongoose.ts
│  │
│  ├─ pages / api
│  │  └─ getUserProfile.ts      ← (puedes migrarlo a /app/api si lo deseas)
│  │
│  ├─ services
│  │  ├─ cases.ts
│  │  ├─ clients.ts
│  │  └─ tasks.ts
│  │
│  └─ utils
│     └─ generateCode.ts
│
├─ .env
├─ netlify.toml
├─ tsconfig.json
├─ next.config.ts
├─ package.json
└─ README.md
