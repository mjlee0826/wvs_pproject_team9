# 開發指南（DEVELOPMENT）

這份文件是寫給**「要動 code、加 feature、修 bug」的人**看的。

> 📌 假設你沒寫過 frontend 或 backend，所以連基礎觀念都會說明。
> 如果你還不知道專案怎麼運作，先看 [`ARCHITECTURE.md`](./ARCHITECTURE.md)。
> 如果你連專案都還沒跑起來，先看 [`GETTING_STARTED.md`](./GETTING_STARTED.md)。

---

## 1. 資料夾結構：每個資料夾應該放什麼

### 1-0. 先固定 Node 版本（本專案使用 Node 22 LTS）

為了避免「我這台可以、你那台不行」，請先在專案根目錄執行：

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

cd /path/to/wvs_pproject_team9
nvm install
nvm use
node -v
```

專案有 `.nvmrc`，所以 `nvm install` / `nvm use` 會自動切到 Node 22。
這是**使用者層級**設定，不會改動系統全域版本，也不會影響同台機器其他使用者。

這節是**「我要新增一個檔案，應該放哪？」**的速查表。

### 1-1. Backend (`backend/src/`)

```
src/
├── routes/        ← URL 路徑定義（不寫邏輯，只負責 URL → controller）
├── controllers/   ← 處理 req/res，解析請求、組裝回應
├── services/      ← 業務邏輯、操作 DB（用 Prisma）
├── middleware/    ← 跑在 controller 之前的攔截器（auth、log...）
└── utils/         ← 工具：DB 連線、錯誤類別、檔案上傳、外部 API client
```

**判斷流程：**

```
你要寫什麼？

├── 新 API endpoint？
│   ├── 1. 在 routes/ 新增/編輯路由
│   ├── 2. 在 controllers/ 新增/編輯 handler
│   └── 3. 在 services/ 新增/編輯實際邏輯
│
├── 共用驗證 / log / 跨多個 endpoint 的攔截？
│   └── middleware/
│
├── 操作 DB / 跟其他 service 互動的純邏輯？
│   └── services/
│
├── 一個不依賴 Express 的工具函式（純函數）？
│   └── utils/
│
└── DB schema 改動？
    └── prisma/schema/*.prisma
```

#### 範例：「新增一個取得熱門貼文的 API」

```
1. backend/prisma/schema/post.prisma  → 如果需要新欄位 (e.g. viewCount)
2. backend/src/routes/postRoutes.ts   → 新增 router.get('/popular', ctrl.getPopular)
3. backend/src/controllers/postController.ts → 新增 export const getPopular
4. backend/src/services/postService.ts → 新增 export async function getPopular()
```

### 1-2. Frontend (`frontend/`)

```
app/                                    ← Expo Router（資料夾結構 = URL 結構）
├── _layout.tsx                         根 Layout
├── index.tsx                           "/"
├── role-select.tsx                     "/role-select"
└── (app)/                              群組（不影響 URL，只用來掛 Auth Guard）
    ├── _layout.tsx
    ├── (tabs)/                         底部 Tab 群組
    │   ├── _layout.tsx
    │   ├── home/
    │   │   ├── index.tsx               "/(app)/(tabs)/home"
    │   │   └── [postId].tsx            "/(app)/(tabs)/home/123" (動態)
    │   └── ...
    └── user/[userId].tsx               "/(app)/user/xxx"

src/
├── components/    ← 純 UI 元件（不打 API，靠 props 傳資料）
├── containers/    ← 整個畫面（組合 components + hooks，含商業邏輯）
├── hooks/         ← 抓資料 + 管狀態的可重用邏輯
├── services/      ← 包 axios 呼叫，純資料層
└── utils/         ← 工具：axios instance、AsyncStorage、constants
```

**判斷流程：**

```
你要寫什麼？

├── 新畫面（一個新的「頁」）？
│   ├── 1. 在 app/ 對應位置開檔（決定 URL）
│   ├── 2. 在 containers/ 寫實際畫面內容
│   └── (app/ 裡的檔案只 import + return <YourContainer />)
│
├── 可重用的 UI（按鈕、卡片、modal...）？
│   └── components/
│
├── 抓資料 / 管狀態的邏輯，多個地方用得到？
│   └── hooks/
│
├── 新的 API 呼叫？
│   └── services/xxxApi.ts
│
└── 不依賴 React 的純函式？
    └── utils/
```

#### 為什麼 `app/` 跟 `containers/` 要分開？

`app/` 是 Expo Router 的固定結構，只負責「URL ↔ 畫面」的對應。
真正寫畫面內容放 `containers/`，這樣未來如果要換 router 函式庫，畫面的 code 不用動。

#### 範例：「新增一個聊天室畫面」

```
1. app/(app)/(tabs)/chat.tsx           → 改成 return <ChatPage />
2. src/containers/ChatPage.tsx         → 寫整個畫面
3. src/components/MessageBubble.tsx    → 訊息泡泡元件
4. src/hooks/useChat.ts                → 拉訊息、傳訊息的 hook
5. src/services/chatApi.ts             → API client (GET/POST 訊息)
```

---

## 2. Schema 更新流程（重要！）

> ⚠️ **這節最重要，沒看完不要動 schema！**
> 我們團隊**共用同一個 PostgreSQL server**，所以 schema 操作有衝突風險。

### 2-1. 背景：我們的 DB 是共用的

`DATABASE_URL=postgresql://wvs:wvs_secret@ws2.csie.ntu.edu.tw:5432/wvspocket`

這個 DB 跑在 NTU CSIE 的 server 上，**所有組員的 backend 都連同一個 DB**。

這代表：
- A 改 schema → B 拉下來 → B 不重跑 migrate 也會看到資料變了（但 prisma client 不知道）
- A 跑 `migrate dev` → 立刻影響所有人

### 2-2. Prisma 是怎麼運作的？

Prisma 有兩個關鍵概念：

1. **Schema files** (`prisma/schema/*.prisma`)：宣告 model 長什麼樣
2. **Migrations** (`prisma/migrations/`)：實際對 DB 做的 SQL 變更紀錄
3. **Generated Client** (`node_modules/.prisma/client`)：可以在 TypeScript 用的 `prisma.user.findMany(...)` 物件

流程：
```
編輯 .prisma 檔
       ↓
prisma migrate dev --name xxx
       ↓
產生新的 SQL migration
       ↓
套用到 DB（執行 SQL）
       ↓
重新產生 Prisma Client
       ↓
TypeScript 立刻能用新的 model
```

### 2-3. 安全的 Schema 更新 SOP

**寫程式之前先說一聲！** 在 Slack / Discord 跟團隊講：「我要改 schema，加一個 xxx 欄位，可以嗎？」

#### 步驟（A：你是要改 schema 的人）

```bash
# 1. 先確保自己拉到最新
git pull

# 2. 看一下 backend/prisma/migrations 有沒有新的 migration（如果有，先 follow B 流程套用）
ls backend/prisma/migrations

# 3. 編輯 .prisma 檔（在 backend/prisma/schema/ 下對應的 model 檔）
# 例如新增欄位 viewCount 到 Post：
#   model Post {
#     ...
#     viewCount Int @default(0)   ← 新增
#   }

# 4. 跑 migrate dev
cd backend
npx prisma migrate dev --name add_post_view_count
# 這會：
#   a. 在 prisma/migrations/ 下產生新資料夾 + migration.sql
#   b. 直接套用到 DB（注意！其他人連的 DB 也變了）
#   c. 重新產生 Prisma Client

# 5. 寫對應的 code（service/controller）

# 6. git commit 包含：
#    - 改過的 .prisma 檔
#    - 新增的 prisma/migrations/xxxx/migration.sql
#    - 改過的程式碼
git add backend/prisma backend/src
git commit -m "feat: add post viewCount"
git push

# 7. 通知團隊：「Schema 改了，請大家 pull 後跑 npx prisma generate」
```

#### 步驟（B：你 pull 到別人改的 schema）

```bash
git pull

# 重新產生 Prisma Client（讓你的 TypeScript 認識新欄位 / 新 model）
cd backend
npx prisma generate

# 重啟 backend
npm run dev
```

> 💡 **為什麼不用跑 `migrate deploy`？**
> 因為我們團隊**共用同一個 DB**。當 A 跑了 `migrate dev`，**DB 已經被改完了**（你連的是同一個 DB），`_prisma_migrations` 表也已經有「已套用」紀錄。
> 你的本機跟 DB 之間唯一的差距是：**`node_modules` 裡的 Prisma Client 是舊的**，所以只要跑 `prisma generate` 重新產生 client 就好。
> `migrate deploy` 在共用 DB 情境下會偵測「migration 都已套用」→ 直接結束，不會做事，跑了沒效果但也不會壞。

### 2-3.5. `migrate deploy` 真正在什麼時候用？

雖然我們團隊日常開發用不到 `deploy`，但你還是要知道它的用途，**因為未來部署正式環境一定會用到**。

| 情境 | 用 `migrate dev` | 用 `migrate deploy` | 用 `prisma generate` |
|---|---|---|---|
| 改自己的 schema | ✅ | ❌ | （自動跑） |
| pull 別人改的 schema（我們團隊共用 DB） | ❌ 危險 | ⚠️ 跑了也是 no-op，不必要 | ✅ |
| pull 別人改的 schema（如果是各自本機 DB） | ❌ 危險 | ✅ | ✅ 自動跑 |
| 部署 production / staging | ❌ 絕對禁止 | ✅ | ✅ 自動跑 |

**`migrate deploy` 是給「DB 還沒套用 migration」的環境用的**，例如：
- 正式上線時，正式 DB 是空的或舊版本
- 同事改用各自本機 DB（未來如果改架構）

### 2-4. 避免衝突的 4 條鐵則

1. **🛑 永遠不要直接改 DB**（用 GUI tool、psql 之類的）
   - 任何改動都要透過 Prisma migration，否則 schema 跟 DB 不同步

2. **🛑 不要刪除 `prisma/migrations/` 裡的歷史 migration**
   - 那是 DB 的「歷史紀錄」，刪了會大爆炸

3. **🛑 不要兩個人同時改 schema**
   - 約定一下誰先改、誰後改
   - 後改的人 pull + `prisma generate` 同步 client 之後再開始

4. **🛑 不要在 staging/production DB 上跑 `migrate dev`**
   - `dev` 會「自動 reset」如果偵測到 schema 不同步！這會清空 DB！
   - 部署時用 `migrate deploy`

### 2-5. 萬一搞砸了怎麼救？

#### 情境：我跑了 `migrate dev` 失敗，DB 看起來壞了

```bash
cd backend
# 看現在狀態
npx prisma migrate status

# 如果只是 Prisma Client 跟 DB 不同步：
npx prisma generate

# 如果某個 migration 半套用、半失敗：
npx prisma migrate resolve --rolled-back <migration_name>
# 或
npx prisma migrate resolve --applied <migration_name>
```

#### 情境：兩人都改了 schema 然後都 push 了

這是最痛的情況。處理方式：
1. 兩個人約時間
2. 決定一個 base version（A 的版本還是 B 的版本）
3. 另一個人手動把自己的改動再加上去
4. 重新產生一個 migration（先在本機刪除自己的舊 migration → `migrate dev`）

避免方法：**改 schema 前先在群組講一聲**。

### 2-6. 我只想看 DB 內容怎麼辦？

不需要改 schema，只是想 query / 看資料：

```bash
cd backend
npx prisma studio
```

會開瀏覽器，給你一個 GUI 看所有 table。**只用來看 / 改資料，不要改結構**。

---

## 3. 實作一個 Feature 的完整流程

以「**新增聊天室功能**」為例，從 DB 一路寫到 UI。

### 3-1. 規劃階段（寫 code 之前）

問自己幾個問題：
- 要存什麼資料？→ 設計 DB schema
- API 長怎樣？→ 定 endpoint
- UI 長怎樣？→ 想 component 結構

範例規劃：
- **Models**：`ChatRoom`、`Message`
- **API**：
  - `GET /api/chat/rooms` 列出聊天室
  - `GET /api/chat/rooms/:id/messages` 拿訊息（分頁）
  - `POST /api/chat/rooms/:id/messages` 送訊息
- **UI**：
  - `ChatListPage`：聊天室列表
  - `ChatRoomPage`：訊息畫面

### 3-2. Backend：從 DB 往上寫

#### Step 1：改 Prisma Schema

`backend/prisma/schema/chat.prisma`（新檔案）：

```prisma
model ChatRoom {
  id        Int       @id @default(autoincrement())
  name      String
  messages  Message[]
  createdAt DateTime  @default(now())
}

model Message {
  id        Int      @id @default(autoincrement())
  content   String
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  roomId    Int
  room      ChatRoom @relation(fields: [roomId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}
```

> ⚠️ 如果 `User` 需要反向關聯，要去 `user.prisma` 加 `messages Message[]`。

**先 commit 確認，跟團隊溝通後再跑 migrate**：

```bash
cd backend
npx prisma migrate dev --name add_chat_models
```

#### Step 2：寫 Service（業務邏輯）

`backend/src/services/chatService.ts`（新檔案）：

```typescript
import { prisma } from '../utils/prismaClient';
import { ApiError } from '../utils/apiError';

export async function getRooms() {
  return prisma.chatRoom.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function getMessages(roomId: number, cursor?: number, limit = 20) {
  const messages = await prisma.message.findMany({
    where: { roomId },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { id: true, displayName: true, avatar: true } },
    },
  });
  const hasNextPage = messages.length > limit;
  const items = hasNextPage ? messages.slice(0, -1) : messages;
  return {
    items,
    nextCursor: hasNextPage ? items[items.length - 1].id : null,
    hasNextPage,
  };
}

export async function sendMessage(roomId: number, authorId: string, content: string) {
  const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
  if (!room) throw new ApiError('Chat room not found', 404);
  return prisma.message.create({
    data: { roomId, authorId, content },
    include: {
      author: { select: { id: true, displayName: true, avatar: true } },
    },
  });
}
```

#### Step 3：寫 Controller（接 HTTP 請求）

`backend/src/controllers/chatController.ts`（新檔案）：

```typescript
import { Request, Response, NextFunction } from 'express';
import * as chatService from '../services/chatService';

export const getRooms = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log(`[Chat] getRooms sub=${req.user!.sub}`);
    const rooms = await chatService.getRooms();
    res.json(rooms);
  } catch (err) {
    next(err);
  }
};

export const getMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roomId = Number(req.params.id);
    const cursor = req.query.cursor ? Number(req.query.cursor) : undefined;
    console.log(`[Chat] getMessages roomId=${roomId} cursor=${cursor}`);
    const result = await chatService.getMessages(roomId, cursor);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roomId = Number(req.params.id);
    const { content } = req.body as { content: string };
    console.log(`[Chat] sendMessage roomId=${roomId} sub=${req.user!.sub}`);
    const message = await chatService.sendMessage(roomId, req.user!.sub, content);
    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
};
```

#### Step 4：改 Route

`backend/src/routes/chatRoutes.ts`（覆蓋現有的 TODO）：

```typescript
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as ctrl from '../controllers/chatController';

const router = Router();

router.get('/rooms', requireAuth, ctrl.getRooms);
router.get('/rooms/:id/messages', requireAuth, ctrl.getMessages);
router.post('/rooms/:id/messages', requireAuth, ctrl.sendMessage);

export default router;
```

> `routes/index.ts` 已經把 `chatRoutes` 掛上去了（`router.use('/chat', chatRoutes)`），不用動。

#### Step 5：測試 backend

用 curl 或 Postman / Bruno 測：

```bash
# 沒帶 token 應該 401
curl http://localhost:3000/api/chat/rooms

# 帶 token 應該 200
curl http://localhost:3000/api/chat/rooms \
  -H "Authorization: Bearer <你從 App log 撈出來的 token>"
```

### 3-3. Frontend：從 API 層往上寫

#### Step 1：寫 Service（API client）

`frontend/src/services/chatApi.ts`（新檔案）：

```typescript
import { apiClient } from '../utils/api';

export interface MessageAuthor {
  id: string;
  displayName: string;
  avatar: string | null;
}

export interface ChatMessage {
  id: number;
  content: string;
  authorId: string;
  author: MessageAuthor;
  roomId: number;
  createdAt: string;
}

export interface ChatRoom {
  id: number;
  name: string;
  createdAt: string;
}

export const chatApi = {
  getRooms: async () => {
    const { data } = await apiClient.get<ChatRoom[]>('/chat/rooms');
    return data;
  },
  getMessages: async (roomId: number, cursor?: number) => {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', String(cursor));
    const { data } = await apiClient.get(`/chat/rooms/${roomId}/messages?${params}`);
    return data;
  },
  sendMessage: async (roomId: number, content: string) => {
    const { data } = await apiClient.post<ChatMessage>(
      `/chat/rooms/${roomId}/messages`,
      { content },
    );
    return data;
  },
};
```

#### Step 2：寫 Hook（管 state）

`frontend/src/hooks/useChatRooms.ts`（新檔案）：

```typescript
import { useState, useEffect, useCallback } from 'react';
import { chatApi, ChatRoom } from '../services/chatApi';

export function useChatRooms() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await chatApi.getRooms();
      setRooms(data);
    } catch (err) {
      console.error('[useChatRooms]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { rooms, loading, refresh: fetch };
}
```

#### Step 3：寫 Container（畫面）

`frontend/src/containers/ChatListPage.tsx`（新檔案）：

```tsx
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChatRooms } from '@/hooks/useChatRooms';
import Loading from '@/components/Loading';

export default function ChatListPage() {
  const { rooms, loading } = useChatRooms();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (loading) return <Loading text="載入中..." />;

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <Text className="text-xl font-bold p-4">聊天室</Text>
      <FlatList
        data={rooms}
        keyExtractor={(r) => String(r.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="p-4 border-b border-gray-100"
            onPress={() => router.push(`/(app)/(tabs)/chat/${item.id}` as any)}
          >
            <Text className="text-base font-semibold">{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
```

#### Step 4：接到 Router

改 `frontend/app/(app)/(tabs)/chat.tsx`：

```tsx
import ChatListPage from '@/containers/ChatListPage';
export default function ChatScreen() {
  return <ChatListPage />;
}
```

要有「點進某個聊天室」的話，把 `chat.tsx` 改成資料夾：

```
app/(app)/(tabs)/chat/
├── _layout.tsx        Stack 路由
├── index.tsx          chat list
└── [roomId].tsx       單個聊天室
```

`_layout.tsx`：
```tsx
import { Stack } from 'expo-router';
export default function ChatLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

`[roomId].tsx`：
```tsx
import ChatRoomPage from '@/containers/ChatRoomPage';
export default function ChatRoomScreen() {
  return <ChatRoomPage />;
}
```

### 3-4. 測試流程清單

- [ ] Backend 啟動沒錯誤
- [ ] DB 有新的 table（用 `prisma studio` 看）
- [ ] curl 帶 token 能呼叫到 API
- [ ] curl 沒帶 token 回 401
- [ ] Frontend 沒有 type error
- [ ] App 進畫面有看到資料
- [ ] App refresh 行為正常
- [ ] 換 IP / 重啟 dev server 也 OK

---

## 3.5. 權限控制：`requireAuth` 與 `requireAdmin`

這節說明 `backend/src/middleware/auth.ts` 提供的兩個 middleware 怎麼用、何時用、有什麼差別。

### 3.5-1. 兩者比較

| Middleware | 做什麼 | 通過後 `req.user` 有什麼 | 用在什麼路由 |
|---|---|---|---|
| `requireAuth` | 驗證 JWT token 是不是 Logto 發的 | `{ sub: string, scope?: string }` | 所有需要登入的 endpoint |
| `requireAdmin` | 進一步檢查 DB 裡的 `user.role === 'admin'` | （沿用 requireAuth 的值） | 只有「老師」可以做的事 |

**重要：`requireAdmin` 必須掛在 `requireAuth` 後面**，因為它依賴 `req.user.sub` 去查 DB。
順序錯了會直接報錯（讀不到 `req.user`）。

### 3.5-2. 怎麼用：在 routes 檔案裡

打開 `backend/src/routes/postRoutes.ts` 看現有的範例：

```typescript
import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import * as ctrl from '../controllers/postController';

const router = Router();

// 公開：任何人都能看（連 token 都不用）
router.get('/', ctrl.getPosts);
router.get('/:id', ctrl.getPostById);

// 需要登入：學生跟老師都可以
router.post('/', requireAuth, uploadPostImage, ctrl.createPost);
router.patch('/:id', requireAuth, ctrl.updatePost);
router.delete('/:id', requireAuth, ctrl.deletePost);

// 只有老師可以：按讚 / 取消讚
router.post('/:id/like', requireAuth, requireAdmin, ctrl.likePost);
router.delete('/:id/like', requireAuth, requireAdmin, ctrl.unlikePost);
```

關鍵就一行：在 `requireAuth` 後面加 `requireAdmin`。

### 3.5-3. 通過後 Controller 怎麼拿到使用者資訊？

```typescript
export const createPost = async (req: Request, res: Response, next: NextFunction) => {
  // req.user.sub 是 Logto 給的 user ID（也就是 DB 的 user.id）
  const userId = req.user!.sub;
  // ...
};
```

`req.user` 是 `requireAuth` 塞進去的，TypeScript 已經宣告好型別了（在 `auth.ts` 最上面的 `declare global` 區塊）。
因為 controller 跑的時候 `requireAuth` 一定已經跑過了，所以可以放心用 `req.user!.sub`（用 `!` 告訴 TS 這個值不會是 undefined）。

### 3.5-4. 錯誤情境

| 情境 | requireAuth 回應 | requireAdmin 回應 |
|---|---|---|
| 沒帶 `Authorization` header | 401 Unauthorized | — |
| Token 過期 / 無效 | 401 Unauthorized | — |
| 通過 `requireAuth`，但 DB 裡 role 不是 admin | — | 403 Forbidden |
| DB 裡找不到該 user | — | 403 Forbidden（因為 `user?.role !== 'admin'`） |

Frontend 對 401 會自動 retry 一次再失敗就登出（看 `frontend/app/_layout.tsx` 的 interceptor）。
對 403 的話前端沒特別處理，會丟給 catch 區塊（通常 UI 上會 `Alert.alert('錯誤', ...)`）。

### 3.5-5. 我想做新權限怎麼辦？

範例：未來要新增「super admin」可以刪除任何人的貼文。

#### Step 1：在 `auth.ts` 加新 middleware

```typescript
// backend/src/middleware/auth.ts
export const requireSuperAdmin = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (user?.role !== 'super_admin') {
      console.warn(`[Auth] 權限不足，非 super_admin sub=${req.user!.sub}`);
      throw new ApiError('Forbidden', 403);
    }
    next();
  } catch (err) {
    next(err);
  }
};
```

#### Step 2：在 route 掛上

```typescript
// 注意順序：requireAuth → requireSuperAdmin
router.delete('/:id/force', requireAuth, requireSuperAdmin, ctrl.forceDeletePost);
```

#### Step 3：前端用 `user.role` 決定 UI 顯示

```tsx
const { user: currentUser } = useUser('me');
const isSuperAdmin = currentUser?.role === 'super_admin';

{isSuperAdmin && <Button title="強制刪除" onPress={...} />}
```

### 3.5-6. Frontend 也要做權限檢查嗎？

**前端做的是「體驗」，後端做的是「安全」**。兩邊都要做：

- **Frontend**：根據 `currentUser.role` 隱藏按鈕 / 顯示提示（例如 `MainPage.tsx` 的 `handleLike`：學生按讚會跳 `Alert.alert('無法按讚', '只有老師可以幫學生的貼文按讚喔！')`）
- **Backend**：用 `requireAdmin` 把關，即使有人繞過 UI 直接打 API 也會被擋

**沒有 backend 把關 = 沒有安全**。前端任何檢查都可以被繞過。

### 3.5-7. 為什麼 `requireAdmin` 要查 DB，不直接看 token？

理論上 Logto token 裡也有 role 資訊（在 `scope` 欄位），但我們選擇查 DB：

- ✅ DB 是 single source of truth，role 變更後馬上生效（不用等 token 過期）
- ✅ Logto 跟 DB 萬一不同步，以 DB 為準
- ❌ 多一次 DB 查詢（成本可接受，因為已經有連線池）

如果未來需要效能優化（例如高 QPS），可以改成讀 token 的 scope，但目前的規模不需要。

---

## 4. 必須要改的地方總覽（依任務類型）

### 4-1. 新增一個 endpoint

| 檔案 | 動作 |
|---|---|
| `backend/src/routes/xxxRoutes.ts` | 加路由 |
| `backend/src/controllers/xxxController.ts` | 加 handler |
| `backend/src/services/xxxService.ts` | 加業務邏輯 |
| `frontend/src/services/xxxApi.ts` | 加對應 API 呼叫 |
| `frontend/src/hooks/useXxx.ts` | （如果是要拿資料）加 hook |
| `frontend/src/containers/XxxPage.tsx` | 在畫面用 hook |

### 4-2. 新增一個資料表

| 檔案 | 動作 |
|---|---|
| `backend/prisma/schema/xxx.prisma` | 新增 model |
| `backend/prisma/schema/<related>.prisma` | （如有外鍵）加反向關聯 |
| 跑 `npx prisma migrate dev --name xxx` | 套用變更 |
| **通知團隊 pull + `migrate deploy`** | 同步 schema |
| 之後參照 4-1 寫 API 跟畫面 | |

### 4-3. 新增一個畫面

| 檔案 | 動作 |
|---|---|
| `frontend/app/...` | 決定路由位置開檔 |
| `frontend/src/containers/XxxPage.tsx` | 寫實際內容 |
| `frontend/src/components/...` | （需要時）抽出可重用元件 |
| `frontend/src/hooks/...` | （需要時）抽出資料邏輯 |

### 4-4. 新增權限規則

| 檔案 | 動作 |
|---|---|
| `backend/src/middleware/auth.ts` | （需要新角色時）加新 middleware |
| `backend/src/routes/xxxRoutes.ts` | 在 endpoint 掛 middleware |
| 前端 `containers/*` | 用 `currentUser.role` 判斷 UI 顯示/禁用 |

### 4-5. 新增圖片上傳

| 檔案 | 動作 |
|---|---|
| `backend/src/utils/upload.ts` | 加一個 `upload<Xxx>` |
| `backend/src/routes/xxxRoutes.ts` | 在 endpoint 掛 multer middleware |
| `backend/src/controllers/xxxController.ts` | 從 `req.file` 取檔案、組路徑 |
| `frontend/src/containers/XxxPage.tsx` | 用 `expo-image-picker` 選圖、組 `FormData` |

---

## 5. 寫 Code 的約定（Conventions）

### 5-1. 命名

- React component / container：`PascalCase`（`ThreadPost.tsx`）
- Hook：`camelCase` 且 `use` 開頭（`usePosts.ts`）
- Service：`xxxApi.ts` / `xxxService.ts`
- Prisma model：`PascalCase`、單數（`Post`、`Comment` 不是 `Posts`）
- Route file：`xxxRoutes.ts`、複數（`/api/posts`）

### 5-2. 樣式：一律用 Tailwind / NativeWind

```tsx
// ✅ 正確
<View className="flex-1 bg-white p-4">

// ❌ 不要
<View style={{ flex: 1, backgroundColor: 'white', padding: 16 }}>
```

例外：動態值（用 state 控制的尺寸、進度條等）才用 `style={...}`：
```tsx
<View className="h-full bg-amber-400 rounded-xl" style={{ width: `${progress * 100}%` }} />
```

主題色（`brand`、`accent`、`navy`...）定義在 `frontend/tailwind.config.js`。要加新色就改那裡。

### 5-3. Log

**寫 console.log 是好的**。整個專案的風格就是 log 多。
格式：
```typescript
console.log(`[模組名稱] 行為描述 key=${value}`);
console.warn(`[模組名稱] 預期內的錯誤 ...`);
console.error(`[模組名稱] 預期外的錯誤:`, err);
```

範例：
```typescript
console.log(`[Post] createPost sub=${req.user!.sub} title="${title}"`);
```

### 5-4. 錯誤處理

**Backend**：用 `ApiError`：
```typescript
import { ApiError } from '../utils/apiError';
throw new ApiError('Post not found', 404);
throw new ApiError('Forbidden', 403);
```
Express middleware 會接住、轉成 JSON 回應。

**Frontend**：用 try/catch + `Alert.alert`：
```typescript
try {
  await postApi.createPost(formData);
} catch {
  Alert.alert('錯誤', '發布失敗，請稍後再試');
}
```

### 5-5. TypeScript：盡量加型別

```typescript
// ✅
const { content } = req.body as { content: string };

// ✅
export interface Post { id: number; title: string; ... }

// ❌ 避免大量 any
function doSomething(x: any) { ... }
```

### 5-6. Frontend Path Alias

`tsconfig.json` 設定了 `@/* → src/*`，所以：

```typescript
// ✅
import ThreadPost from '@/components/ThreadPost';
import { usePosts } from '@/hooks/usePosts';

// ⚠️ 但 app/ 裡用 alias 有時候會壞掉，可以用相對路徑：
import MainPage from '../../../../src/containers/MainPage';
```

---

## 6. Git 工作流程建議

### 6-1. 每次開始寫之前

```bash
git pull
cd backend && npm install && npx prisma generate  # 同步 schema/Prisma Client
cd ../frontend && npm install                       # 同步前端套件
```

### 6-2. Branch 命名

- `feat/chat-room` 新功能
- `fix/login-redirect` bug fix
- `refactor/profile-page` 重構

### 6-3. Commit 訊息

中英文都可以，但要寫得讓人看得懂：

- ✅ `feat: add chat room API`
- ✅ `fix(profile): 修正登出後沒清快取`
- ❌ `update`
- ❌ `fix bug`

### 6-4. PR 之前檢查

- [ ] 沒留 `console.log` 殘渣（重要的 log 留著沒關係，debug 用的拿掉）
- [ ] 沒留 commented-out code
- [ ] backend `npm run build` 跑得起來
- [ ] frontend 在手機上能跑、新功能能用
- [ ] 如果改了 schema，有附 migration 檔
- [ ] 沒把 `.env` 推上去

---

## 7. 常用指令速查

### Backend

```bash
cd backend

npm run dev                                # 開發模式（hot reload）
npm run build                              # 編譯到 dist/
npm start                                  # 跑編譯後的版本

npx prisma generate                        # 重新產生 Prisma Client
npx prisma migrate dev --name xxx          # 改 schema 後產生 + 套用 migration
npx prisma migrate deploy                  # 套用既有的 migration（pull 後用）
npx prisma migrate status                  # 看現在 DB 跟 migration 對不對得上
npx prisma studio                          # GUI 看 DB
```

### Frontend

```bash
cd frontend

npm run start                              # 啟動 Expo dev server
# 啟動後 terminal 內可以按：
#   a → 開 Android 模擬器
#   i → 開 iOS 模擬器
#   w → 在瀏覽器開
#   r → reload
#   j → 開 debugger
```

---

## 8. 進階主題

### 8-1. Logto 端要新增角色怎麼做？

1. 去 Logto Console (`https://01sqdw.logto.app`)
2. **API resources** → 找到 `https://api.wvspocket.com`
3. 新增 Role + Scope
4. 改 `backend/src/services/logtoService.ts` 的 `assignRole`：加上新角色驗證邏輯
5. 改 `backend/src/middleware/auth.ts` 加新 `requireXxx` middleware
6. 改 `backend/src/controllers/logtoController.ts` 的 `assignRole` 接受新 role
7. 前端 `role-select.tsx` 加新身份選項

### 8-2. 想要 production 化？

目前缺：
- [ ] HTTPS（用 nginx / Caddy）
- [ ] 把 `uploads/` 移到 S3 / Cloudflare R2
- [ ] 正式 logger（pino）
- [ ] 環境變數驗證（zod / envalid）
- [ ] Rate limiting
- [ ] DB connection pooling 調校
- [ ] CI/CD（GitHub Actions）

### 8-3. 想用 WebSocket（聊天室即時推播）？

Express 5 配 `ws` 套件，或改用 `socket.io`。記得也要在 frontend 用對應 client。
（這是大改造，提案前先跟團隊討論）

---

## 9. 卡住了怎麼辦？

1. **檢查 console log**：backend terminal + Expo terminal + 手機 App 連到 Expo 後在 terminal 也會印 log
2. **看 Prisma Studio**：`npx prisma studio` 直接看 DB 有沒有寫入
3. **用 curl 測 backend**：把 frontend 的不確定因素拿掉
4. **看 git log**：說不定別人改過你以為沒人動的東西
5. **問團隊**：相信我，問問題比卡兩小時划算

---

## 10. 連結到其他文件

- 啟動專案：[`GETTING_STARTED.md`](./GETTING_STARTED.md)
- 專案架構：[`ARCHITECTURE.md`](./ARCHITECTURE.md)
