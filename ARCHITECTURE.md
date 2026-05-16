# 專案架構說明（ARCHITECTURE）

這份文件是寫給**「想了解這個專案怎麼運作，但不需要動 code」**的人看的。
例如你是組員、PM、學長姐，想知道我們做了什麼、用什麼技術、資料怎麼流動。

> 📌 假設你沒寫過 frontend 或 backend，所以我會把很多基本觀念也一起說明。

---

## 0. 一句話介紹這個專案

**WVS Pocket** 是一個給世界志工社（WVS）營隊使用的師生互動 App。
學生可以發貼文、寫閱讀心得、做習慣打卡；老師可以給學生的貼文按讚（學生每被讚一次就會得到 1 個金幣），累積金幣換獎品。

---

## 1. 整體架構（三層 + 一個雲端服務）

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  📱 Frontend (Expo / React Native)                              │
│  使用者用的手機 App                                              │
│                                                                 │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTPS / HTTP (REST API + JWT)
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ⚙️  Backend (Node.js + Express)                                │
│  處理 API 請求、驗證身分、操作資料庫                              │
│                                                                 │
└────────────────────┬────────────────────────────────────────────┘
                     │ SQL (via Prisma ORM)
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🗃️  PostgreSQL Database (團隊共用)                              │
│  存所有使用者、貼文、留言、按讚資料                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

                     +
                     
┌─────────────────────────────────────────────────────────────────┐
│  🔐 Logto Cloud (雲端身份驗證服務)                                │
│  處理註冊、登入、發 JWT token、管理角色                          │
└─────────────────────────────────────────────────────────────────┘
```

「Logto」是一個第三方的身份驗證服務（類似 Auth0、Firebase Auth）。
我們把「使用者登入、發 token、驗證 token」這些麻煩事都交給它，自己只需要寫 App 的功能。

---

## 2. 用了哪些套件（Tech Stack）

### Backend（`backend/package.json`）

| 套件 | 用途 |
|---|---|
| **Express 5** | Web framework，負責接收 HTTP 請求 |
| **Prisma 7** | ORM，把 JavaScript 物件 ↔ SQL 互轉，不用手寫 SQL |
| **@prisma/adapter-pg** | Prisma 連 PostgreSQL 用的 driver |
| **jose** | 驗證 JWT token（Logto 發的） |
| **multer** | 處理檔案上傳（貼文圖、頭像） |
| **axios** | 後端打給 Logto API 用 |
| **cors** | 允許前端跨網域呼叫 |
| **dotenv** | 讀 `.env` 環境變數 |
| **TypeScript** | 型別檢查 |
| **ts-node-dev** | 開發時 hot reload |

### Frontend（`frontend/package.json`）

| 套件 | 用途 |
|---|---|
| **Expo ~54** | React Native 的開發框架，讓 build / run / debug 變超簡單 |
| **expo-router** | File-based routing（資料夾結構決定畫面路由） |
| **React Native 0.81** | 用 React 寫原生 App |
| **@logto/rn** | Logto 官方 React Native SDK |
| **axios** | 打 API |
| **nativewind 4** + **tailwindcss** | 用 Tailwind class 寫 React Native 樣式 |
| **expo-image-picker** | 從相簿選圖片（發文、頭像） |
| **expo-secure-store** | 安全儲存 token（Logto 自動用） |
| **@react-native-async-storage/async-storage** | 一般 cache 儲存 |
| **expo-linear-gradient** | 漸層背景（登入頁） |
| **react-native-safe-area-context** | 處理瀏海、底部 home indicator 等安全區 |
| **@expo/vector-icons** | Icon (Ionicons) |

### 為什麼選這些？

- **Expo 而不是 vanilla React Native**：不需要碰 Xcode / Android Studio，掃 QR code 就能跑。
- **expo-router 而不是 react-navigation**：路由用「資料夾結構」管理，跟 Next.js 一樣直覺。
- **Prisma 而不是手寫 SQL**：型別安全、有 migration 系統、查詢可讀性高。
- **Logto 而不是自己寫 auth**：自己寫 OAuth + JWT + 角色管理太累。
- **NativeWind 而不是 StyleSheet.create**：寫 utility class 比寫物件 style 快很多。

---

## 3. 身份驗證 Pipeline（Auth Flow）

這是專案最複雜的部分，請耐心看 🙏

### 3-1. 角色介紹

- **使用者（user）**：用 App 的人
- **Frontend**：手機 App
- **Backend**：我們的 API server
- **Logto**：第三方雲端身份服務（外部）

### 3-2. 首次登入完整流程

```
   使用者                Frontend              Logto                Backend              DB
     │                     │                    │                    │                  │
  ① 按「登入」              │                    │                    │                  │
─────►│                    │                    │                    │                  │
     │  signIn()           │                    │                    │                  │
     │ ──────────────────► │                    │                    │                  │
     │                     │  ② 開啟 Logto 登入頁  │                    │                  │
     │                     │ ──────────────────►│                    │                  │
     │                     │                    │                    │                  │
     │   ③ 輸入帳密 / Google                       │                    │                  │
     │ ──────────────────────────────────────► │                    │                  │
     │                     │                    │                    │                  │
     │                     │ ④ 拿到 access_token │                    │                  │
     │                     │ ◄──────────────────│                    │                  │
     │                     │ (JWT, 含 sub=使用者ID) │                  │                  │
     │                     │                    │                    │                  │
     │                     │ ⑤ POST /users/me                        │                  │
     │                     │ (帶 Bearer token + displayName + email)  │                  │
     │                     │ ────────────────────────────────────────►│                 │
     │                     │                    │                    │                  │
     │                     │                    │                    │  ⑥ 驗證 token     │
     │                     │                    │◄───────────────────│  (取得 JWKS)      │
     │                     │                    │ ──────────────────►│                  │
     │                     │                    │                    │                  │
     │                     │                    │                    │ ⑦ upsert user    │
     │                     │                    │                    │ ────────────────►│
     │                     │                    │                    │                  │
     │                     │ ⑧ POST /logto/users/role { role: "student" }                │
     │                     │ ────────────────────────────────────────►│                 │
     │                     │                    │                    │                  │
     │                     │                    │  ⑨ 用 M2M 身份呼叫 Logto Admin API     │
     │                     │                    │  指派 role 到該使用者                   │
     │                     │                    │◄───────────────────│                  │
     │                     │                    │ ──────────────────►│                  │
     │                     │                    │                    │ ⑩ 更新 DB user.role
     │                     │                    │                    │ ────────────────►│
     │                     │                    │                    │                  │
     │                     │ ⑪ 跳轉到主頁         │                    │                  │
     │ ◄────────────────── │                    │                    │                  │
```

簡化版口述：

1. 使用者按「登入」
2. Frontend 用 `@logto/rn` SDK 開啟 Logto 登入頁
3. 使用者在 Logto 那邊輸入帳密
4. Logto 把使用者導回 App，順便給 App 一個 access_token (JWT)
5. App 帶這個 token 呼叫我們的 Backend，呼叫 `POST /api/users/me`（順便傳 displayName 跟 email）
6. Backend 用 `jose` 套件驗證這個 token 是不是真的 Logto 發的
7. 驗證通過後，把使用者寫進我們自己的 DB
8. App 再呼叫 `POST /api/logto/users/role` 指派 role
9. Backend 用「機器對機器（M2M）token」打 Logto Admin API 改 role
10. Backend 同時更新 DB 裡 user 的 role
11. App 跳到主頁

### 3-3. 之後每次打 API 的流程

```
Frontend                                    Backend
   │                                          │
   │  ① axios.get('/posts')                  │
   │  request interceptor 自動加上：           │
   │    Authorization: Bearer <token>         │
   │ ────────────────────────────────────────►│
   │                                          │
   │                                          │ ② requireAuth middleware
   │                                          │    用 JWKS 驗證 JWT
   │                                          │    把 user.sub 放進 req.user
   │                                          │
   │                                          │ ③ controller 處理請求
   │                                          │    用 req.user.sub 查詢資料
   │                                          │
   │  ④ 200 OK + 資料                         │
   │ ◄────────────────────────────────────────│
```

關鍵程式碼位置：

- 前端自動加 token：`frontend/app/_layout.tsx` 的 `InterceptorSetup`
- 後端驗證 token：`backend/src/middleware/auth.ts` 的 `requireAuth`
- 後端 admin 權限檢查：`backend/src/middleware/auth.ts` 的 `requireAdmin`

### 3-4. Token 過期了怎麼辦？

`@logto/rn` 自己會處理 refresh token，App 端只要呼叫 `getAccessToken()` 就會拿到一個還活著的 token。
萬一真的 401 失敗了，Frontend 的 response interceptor 會嘗試 refresh 一次再重試，再失敗就強制登出。

### 3-5. 為什麼要分「Logto 的角色」跟「DB 的 role 欄位」？

兩邊都要存，是因為：
- **Logto 的 role**：給 Logto 自己用，例如未來要限制某些 OAuth scope
- **DB 的 role**：我們自己的 API 用，每次驗證 admin 不用打外網

兩者透過 `POST /api/logto/users/role` 同步寫入。

---

## 4. 資料拿取 Pipeline（Data Flow）

以「滑首頁看貼文」為例：

```
   使用者          Frontend                     Backend                    DB
     │              │                            │                         │
     │              │ MainPage 元件 mount         │                         │
     │              │ usePosts() Hook 被呼叫       │                        │
     │              │                            │                         │
     │              │ ① 先讀 AsyncStorage 快取    │                         │
     │              │   getCachedPosts()         │                         │
     │              │   立刻顯示舊資料（有的話）    │                          │
     │              │                            │                         │
     │              │ ② 同時呼叫 API              │                         │
     │              │   GET /api/posts?limit=10   │                        │
     │              │ ──────────────────────────►│                         │
     │              │                            │                         │
     │              │                            │ requireAuth (驗 token)   │
     │              │                            │                         │
     │              │                            │ postController.getPosts │
     │              │                            │   ↓                     │
     │              │                            │ postService.getPosts    │
     │              │                            │ ──────────────────────►│
     │              │                            │ prisma.post.findMany(...)│
     │              │                            │ ◄──────────────────────│
     │              │                            │                         │
     │              │ ③ 回傳 { items, nextCursor } │                        │
     │              │ ◄──────────────────────────│                         │
     │              │                            │                         │
     │              │ ④ setPosts(...) + 更新 cache │                        │
     │              │   畫面重新 render            │                        │
     │              │                            │                         │
     │ 看到貼文      │                            │                         │
     │◄─────────────│                            │                         │
```

### 4-1. 為什麼要先讀快取再呼叫 API？

讓使用者**馬上看到舊資料**，不用盯著 loading 轉圈圈。等 API 回來再「無感更新」成最新版本。這個模式叫做 **stale-while-revalidate**。

實作位置：`frontend/src/hooks/usePosts.ts`、`frontend/src/utils/asyncStorage.ts`

### 4-2. 分頁是怎麼做的？

用 **Cursor-based pagination**（不是用 page 數）：

- API 一次回 10 筆貼文，外加一個 `nextCursor`（下一頁從哪個 ID 開始）
- 滑到底部時，呼叫 `loadMore()` 傳 `cursor=` 給 API
- 比 offset 分頁穩定（即使中間有新資料插入也不會跳）

實作位置：`backend/src/services/postService.ts` 的 `getPosts`

### 4-3. 圖片是怎麼存的？

- Frontend 用 `FormData` 把圖片 + 文字一起送上去
- Backend 用 `multer` 套件把檔案存到 `backend/uploads/` 資料夾（檔名：時間戳記）
- DB 只存「相對路徑」例如 `/uploads/1716123456.jpg`
- Frontend 顯示時拼接：`${API_BASE}${imageUrl}` 變成完整網址
- Express 設定 `app.use('/uploads', express.static(...))` 讓圖片能直接被網址訪問

實作位置：`backend/src/utils/upload.ts`、`backend/src/app.ts`

### 4-4. 按讚增加金幣是怎麼做到的？

按讚跟「貼文作者加 1 金幣」必須一起成功或一起失敗（不能讚加了金幣沒加，反之亦然），所以用 Prisma 的 `$transaction`：

```typescript
// backend/src/services/postService.ts
await prisma.$transaction([
  prisma.like.create({ data: { postId, teacherId } }),
  prisma.user.update({ where: { id: post.authorId }, data: { coins: { increment: 1 } } }),
]);
```

只有「老師」可以按讚，由 `requireAdmin` middleware 把關（看路由設定 `backend/src/routes/postRoutes.ts`）。

---

## 5. 資料夾結構

### 5-1. 整體

```
wvs_project_team9/
├── backend/                   後端 API
├── frontend/                  手機 App
├── docker-compose.yml         本機 Postgres（已不用）
├── CLAUDE.md                  AI 寫 code 用的指示
├── GETTING_STARTED.md         啟動指南
├── ARCHITECTURE.md            ← 你正在看這個
└── DEVELOPMENT.md             開發指南
```

### 5-2. Backend (`backend/`)

```
backend/
├── .env                       環境變數（不進 git）
├── .env.example               範本
├── package.json               套件清單 + 指令
├── tsconfig.json              TypeScript 設定
├── prisma.config.ts           Prisma 設定（指向 multi-file schema）
├── prisma/
│   ├── schema/                ★ schema 拆檔放這裡（重要！）
│   │   ├── config.prisma      generator + datasource 設定
│   │   ├── user.prisma        User model
│   │   ├── post.prisma        Post model
│   │   ├── comment.prisma     Comment model
│   │   ├── like.prisma        Like model（按讚 + 金幣機制）
│   │   └── admin.prisma       AllowedAdminEmail（白名單）
│   └── migrations/            DB schema 變更紀錄（不要手改）
│       ├── 20260516085742_init/
│       ├── 20260516120702_rename_user_role_to_student/
│       └── 20260516171515_add_likes_and_coins/
├── uploads/                   使用者上傳的圖片（不進 git）
└── src/
    ├── server.ts              啟動入口（listen port）
    ├── app.ts                 Express app（middleware、router 掛載、錯誤處理）
    ├── routes/                URL 路由定義
    │   ├── index.ts           合併所有子路由
    │   ├── postRoutes.ts      /api/posts/*
    │   ├── commentRoutes.ts   /api/comments/*
    │   ├── userRoutes.ts      /api/users/*
    │   ├── logtoRoutes.ts     /api/logto/*
    │   ├── chatRoutes.ts      /api/chat/*    (尚未實作)
    │   └── questionRoutes.ts  /api/questions/* (尚未實作)
    ├── controllers/           ★ 處理 request / response 的入口
    │   ├── postController.ts
    │   ├── commentController.ts
    │   ├── userController.ts
    │   └── logtoController.ts
    ├── services/              ★ 業務邏輯（操作 DB、組裝資料）
    │   ├── postService.ts
    │   ├── commentService.ts
    │   ├── userService.ts
    │   └── logtoService.ts
    ├── middleware/            中間件（每個 request 先過一遍）
    │   └── auth.ts            requireAuth / requireAdmin
    └── utils/                 工具函數
        ├── prismaClient.ts    Prisma 連線（單例）
        ├── apiError.ts        自訂錯誤類別
        ├── upload.ts          multer 圖片上傳設定
        └── logtoAdmin.ts      M2M 呼叫 Logto Admin API
```

#### Backend 三層架構：Route → Controller → Service

這是 Express app 的標準寫法，每一層有明確職責：

| 層 | 負責什麼 | 不負責什麼 |
|---|---|---|
| **Route** | URL → Controller 對應、掛 middleware | 不寫業務邏輯 |
| **Controller** | 解析 `req.body`、`req.params`、呼叫 Service、回傳 `res.json()` | 不操作 DB |
| **Service** | 操作 DB（Prisma）、組裝資料、丟錯誤 | 不接觸 Express 的 req/res |

舉例：使用者按下「發貼文」

```
POST /api/posts
   ↓
postRoutes.ts
   → 確認路由 + 跑 requireAuth + 跑 uploadPostImage
   ↓
postController.createPost
   → 從 req.body 取 title/content，從 req.file 取圖片
   → 呼叫 postService.createPost({...})
   → res.status(201).json(post)
   ↓
postService.createPost
   → prisma.post.create({...})
```

### 5-3. Frontend (`frontend/`)

```
frontend/
├── .env                       環境變數（含 IP、Logto 設定）
├── app.json                   Expo 設定（App 名字、bundle ID、scheme）
├── package.json
├── tsconfig.json
├── babel.config.js            NativeWind / Babel 設定
├── metro.config.js            Metro bundler（吃 global.css）
├── tailwind.config.js         Tailwind 主題（自訂顏色：brand、accent...）
├── global.css                 Tailwind 入口
├── index.ts                   App 入口（轉給 expo-router）
├── assets/                    圖片、icons
└── app/                       ★ expo-router 的頁面（資料夾即路由）
    ├── _layout.tsx            根 Layout：LogtoProvider + axios interceptor
    ├── index.tsx              "/" 登入頁
    ├── role-select.tsx        "/role-select" 角色選擇頁
    └── (app)/                 (括號) = group，不影響 URL
        ├── _layout.tsx        Auth Guard（未登入 redirect 到 /）
        ├── (tabs)/            底部 Tab 群組
        │   ├── _layout.tsx    Tab 列設定
        │   ├── home/          首頁
        │   │   ├── _layout.tsx
        │   │   ├── index.tsx          /(app)/(tabs)/home
        │   │   └── [postId].tsx       /(app)/(tabs)/home/123 (動態路由)
        │   ├── chat.tsx       (尚未實作)
        │   ├── questions.tsx  (尚未實作)
        │   └── profile/
        │       ├── _layout.tsx
        │       └── index.tsx          自己的個人頁
        └── user/
            └── [userId].tsx           看別人的個人頁
└── src/                       ★ 可重用的程式碼
    ├── components/            純 UI 元件（不打 API、不存 state）
    │   ├── ThreadPost.tsx     單篇貼文卡片
    │   ├── CommentItem.tsx
    │   ├── CreatePostModal.tsx
    │   ├── CustomButton.tsx
    │   ├── BlueButton.tsx
    │   ├── Loading.tsx / LoadingScreen.tsx
    │   ├── StudentIconButton.tsx
    │   └── TeacherIconButton.tsx
    ├── containers/            ★ 整個畫面（組合 components + hooks）
    │   ├── MainPage.tsx       首頁主畫面
    │   ├── PostDetail.tsx     貼文詳細頁
    │   └── ProfilePage.tsx    自己的個人頁
    ├── hooks/                 ★ 自訂 React Hooks（拿資料、管 state）
    │   ├── usePosts.ts        貼文列表（分頁、快取、refresh）
    │   ├── usePost.ts         單篇貼文 + 留言
    │   └── useUser.ts         使用者資料
    ├── services/              ★ API client（包 axios 呼叫）
    │   ├── postApi.ts
    │   └── userApi.ts
    └── utils/
        ├── api.ts             axios instance（baseURL = .env 的 API_URL）
        ├── asyncStorage.ts    本地快取讀寫
        └── constants.ts       常數
```

#### Frontend 分層：app / containers / components / hooks / services

| 層 | 負責什麼 | 範例 |
|---|---|---|
| **app/** | 路由 + Layout，盡量薄，只 import container | `<MainPage />` |
| **containers/** | 一整個畫面、把資料和元件串起來 | 處理「按讚」、組合 ThreadPost |
| **components/** | 純 UI，不知道 API 存在 | `<ThreadPost />` 接 props 顯示 |
| **hooks/** | 拿資料 + 管 state，可以重用 | `usePosts()`、`useUser()` |
| **services/** | API 呼叫包裝層 | `postApi.getPosts()` |

---

## 6. 這個專案目前完成的事

### ✅ 已完成的功能

#### 身份驗證
- [x] Logto OAuth 登入（Google、Email 註冊）
- [x] JWT 驗證 middleware
- [x] 第一次登入選擇身份（學生 / 老師）
- [x] 老師白名單機制（DB 的 `AllowedAdminEmail` 表）
- [x] 自動 token refresh + 401 retry
- [x] 登出（清快取 + 通知 Logto）
- [x] Auth Guard：未登入跳登入頁、沒角色跳角色選擇頁

#### 貼文（Posts）
- [x] 列表（cursor-based 分頁）
- [x] 發文（含圖片上傳）
- [x] 看單篇貼文
- [x] 更新貼文（只有作者）
- [x] 刪除貼文（只有作者）
- [x] 老師按讚 / 取消讚 → 學生加 1 / 減 1 金幣（用 transaction）
- [x] 列表下拉刷新 + 滑到底自動載入
- [x] 本地快取（離線開 App 也能看舊貼文）

#### 留言（Comments）
- [x] 在貼文下留言
- [x] 更新留言（只有作者）
- [x] 刪除留言（只有作者，跟 post 連動：post 刪了 comment 也跟著刪）

#### 個人頁（Profile）
- [x] 自己的個人頁（編輯名字、換頭像、看自己的貼文、看金幣進度）
- [x] 看別人的個人頁
- [x] 金幣進度條 + 獎品列表（獎品還是 mock 資料）
- [x] 登出按鈕

### 🚧 還沒實作的功能

| 功能 | 路由（已預留） | 說明 |
|---|---|---|
| 聊天室 | `/api/chat/*` + `(tabs)/chat.tsx` | 即時聊天功能 |
| 題目解題 | `/api/questions/*` + `(tabs)/questions.tsx` | 老師出題、學生作答 |

---

## 7. 其他值得知道的事

### 7-1. 為什麼 Prisma schema 拆成多個檔案？

`backend/prisma/schema/` 裡面每個 model 一個檔案（`user.prisma`、`post.prisma`...），這是 **Prisma 5+ 的 multi-file schema 功能**，由 `prisma.config.ts` 的 `schema: './prisma/schema'` 啟用。

好處：
- 多人協作時不會一直 git conflict（每個人改自己負責的 model）
- 容易找特定 model
- 不會出現一個 1000 行的 `schema.prisma`

### 7-2. 為什麼 user.id 是 String 而不是 Int auto-increment？

因為 user.id 直接用 **Logto 給的 user sub（subject identifier）**，這樣 backend 不用維護「Logto user ↔ DB user」的對應表，直接用同一個 ID 串起來。

### 7-3. 為什麼 frontend 不存 user.id 在本地？

不需要存。每次打 API 時 token 裡就帶著 user 的 sub，backend 自己會從 token 解出來放進 `req.user.sub`。

### 7-4. M2M 是什麼？

**Machine to Machine** 的縮寫。我們的 backend 要叫 Logto Admin API 改 user 的 role，但 backend 不是「使用者」，沒辦法用一般登入方式。所以 Logto 提供一種「機器身份」，backend 用 `client_id + client_secret` 換 admin token。

這就是 `LOGTO_M2M_APP_ID` 和 `LOGTO_M2M_APP_SECRET` 的用途。

### 7-5. log 看起來都很詳細？

對，整個專案幾乎每個關鍵步驟都有 `console.log`，這是刻意設計的，方便：
- 老師驗收 / debug 時可以看到流程
- 出錯時可以從 log 反推哪一步爆掉

正式上線時應該換成正式的 logger（如 `pino` / `winston`），但目前 dev 階段這樣很好用。

### 7-6. 為什麼 ProfilePage 和 user/[userId] 看起來很像？

因為 UI 設計上自己的個人頁和別人的個人頁長得幾乎一樣，但功能不同（自己可以編輯、別人不行）。
目前是寫兩份，未來可以重構成「共用元件 + 兩種 mode」。

### 7-7. 為什麼有些 console log 寫中文有些寫英文？

中文 log 主要是給 dev 看的（我們在開發階段），英文錯誤訊息是要回給 API caller 的（未來如果其他開發者用 API 也看得懂）。

---

## 8. 想更深入？

- 想知道 Logto 的細節 → [Logto 官方文件](https://docs.logto.io)
- 想知道 Prisma 的細節 → [Prisma 官方文件](https://www.prisma.io/docs)
- 想知道 Expo Router 的細節 → [Expo Router 官方文件](https://docs.expo.dev/router/introduction/)
- 想動 code → 看 [`DEVELOPMENT.md`](./DEVELOPMENT.md)
