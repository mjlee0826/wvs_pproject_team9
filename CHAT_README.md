# Chat 技術說明與 Demo 指南

這份文件專門給要開發、除錯、demo 聊天室功能的人使用。

你可以在這裡看到：
- 聊天室目前的完整技術設計（REST + WebSocket）
- 具體實作檔案與 workflow
- 如何啟動與驗證
- 如何 demo 所有已完成功能

---

## 1. 功能範圍（目前版本）

已完成：
- 聊天室列表（Room list）
- 房間歷史訊息分頁（cursor pagination）
- 發送訊息
- WebSocket 即時推播（同房間使用者即時收到）
- Socket 失敗時 fallback 到 REST 發送

目前未做：
- typing indicator
- 已讀/未讀
- 訊息編輯與刪除
- 多房間權限管理（目前任何登入使用者可進入既有 room）

---

## 2. 系統設計總覽

聊天室採用「REST 為權威資料層，WebSocket 為即時層」：

1. 初次進入房間
- 先用 REST 抓歷史訊息

2. 即時期間
- 透過 Socket.IO 訂閱房間
- 新訊息由後端廣播 chat:new_message

3. 傳送訊息
- 優先走 WebSocket chat:send
- 若 socket 不可用或 ack 失敗，前端自動改走 REST POST

這樣可以同時達成：
- 即時體驗
- 連線不穩時仍可送訊息

---

## 3. 資料模型（Prisma）

檔案：backend/prisma/schema/chat.prisma

### ChatRoom
- id: Int (PK)
- name: String
- createdAt: DateTime
- updatedAt: DateTime
- messages: Message[]

### Message
- id: Int (PK)
- content: String
- roomId: Int
- authorId: String
- createdAt: DateTime
- updatedAt: DateTime
- index: (roomId, createdAt)

關聯：
- Message.roomId -> ChatRoom.id
- Message.authorId -> User.id

備註：
- User 反向關聯已在 backend/prisma/schema/user.prisma 加上 messages。

---

## 4. 後端技術細節

### 4-1. HTTP API

路由檔案：backend/src/features/chat/chatRoutes.ts

所有 endpoint 都需要 requireAuth：
- GET /api/chat/rooms
- GET /api/chat/rooms/:id/messages?cursor=&limit=
- POST /api/chat/rooms/:id/messages

Controller 檔案：backend/src/features/chat/chatController.ts
Service 檔案：backend/src/features/chat/chatService.ts

### 4-2. WebSocket（Socket.IO）

檔案：backend/src/features/chat/chatSocket.ts

連線認證：
- 使用 verifyAccessToken（與 HTTP 共用 JWT 驗證邏輯）
- token 可從 handshake.auth.token 或 authorization header 取得

房間與事件：
- join: chat:join { roomId }
- leave: chat:leave { roomId }
- send: chat:send { roomId, content }
- push: chat:new_message

廣播機制：
- 對 room:#{roomId} 廣播 chat:new_message
- REST POST 送訊息成功後也會呼叫 broadcastChatMessage，確保 HTTP 路徑發送也有即時推播

### 4-3. 訊息 workflow（後端）

1. 驗證 room 存在
2. 驗證 content（不可空白、長度 <= 2000）
3. 建立 Message
4. 更新 ChatRoom.updatedAt（用於房間排序）
5. 回傳訊息，並廣播給該房間

---

## 5. 前端技術細節

### 5-1. 檔案結構

Router：
- frontend/app/(app)/(tabs)/chat/_layout.tsx
- frontend/app/(app)/(tabs)/chat/index.tsx
- frontend/app/(app)/(tabs)/chat/[roomId].tsx

資料層：
- frontend/src/features/chat/services/chatApi.ts

Hook：
- frontend/src/features/chat/hooks/useChatRooms.ts
- frontend/src/features/chat/hooks/useChatRoom.ts

UI：
- frontend/src/features/chat/containers/ChatListPage.tsx
- frontend/src/features/chat/containers/ChatRoomPage.tsx
- frontend/src/features/chat/components/MessageBubble.tsx

目前 chat 已整理成 feature-based 結構：
- backend/src/features/chat/
- frontend/src/features/chat/

Expo Router 與後端總路由仍保留在原本入口位置，負責把請求導向 chat feature。

### 5-2. useChatRoom 核心行為

1. 初始載入
- chatApi.getMessages(roomId)

2. 建立 socket 連線
- token 來自 Logto getAccessToken
- transport 固定 websocket
- 連線成功後 emit chat:join

3. 接收推播
- 監聽 chat:new_message
- 只收 message.roomId === 目前 roomId
- 以 message.id 去重（避免重複）

4. 傳送訊息
- 優先 emit chat:send，等待 ack
- ack 成功直接更新 UI
- 失敗則 fallback 呼叫 chatApi.sendMessage

5. 清理
- 離開頁面時 emit chat:leave 並 disconnect

---

## 6. 環境需求與設定

### 6-1. Node 版本

專案統一使用 Node 22 LTS（.nvmrc）。

建議執行：

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
cd /path/to/wvs_pproject_team9
nvm install
nvm use
node -v
```

### 6-2. 後端 .env

參考 GETTING_STARTED.md 的範本，至少要有：
- DATABASE_URL
- LOGTO_ENDPOINT
- LOGTO_API_RESOURCE
- LOGTO_M2M_APP_ID
- LOGTO_M2M_APP_SECRET
- PORT
- CORS_ORIGIN

### 6-3. 前端 .env

至少要有：
- EXPO_PUBLIC_API_URL
- EXPO_PUBLIC_LOGTO_ENDPOINT
- EXPO_PUBLIC_LOGTO_APP_ID
- EXPO_PUBLIC_LOGTO_API_RESOURCE
- EXPO_PUBLIC_LOGTO_REDIRECT_URI

---

## 7. 啟動步驟（開發）

```bash
# 1) 專案根目錄切 Node 22
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
cd /path/to/wvs_pproject_team9
nvm install
nvm use

# 2) 安裝依賴
cd backend && npm install
cd ../frontend && npm install

# 3) 套用 migration（若你的 Prisma migrate 流程可用）
cd ../backend
npx prisma migrate deploy

# 4) 啟 backend
npm run dev

# 5) 另一個 terminal 啟 frontend
cd ../frontend
npm run start
```

備註：
- 若你的環境對 multi-file Prisma schema 的 migration 偵測有差異，可能需要先確認 ChatRoom / Message 表是否已存在，再決定是否手動套 SQL。

---

## 8. Demo 劇本（可展示所有現有聊天室功能）

### 8-1. Demo 前準備

1. 兩台手機都安裝 Expo Go
2. 兩台手機與開發機在同一 Wi-Fi
3. frontend/.env 的 EXPO_PUBLIC_API_URL 使用開發機 LAN IP
4. backend、frontend 都已啟動

### 8-2. Demo 場景 A：聊天室列表

1. 手機 A 登入
2. 進入 Chat tab
3. 檢查：
- 看到 room 清單
- 有訊息數量
- 顯示最新一則訊息預覽

### 8-3. Demo 場景 B：房間歷史訊息 + 分頁

1. 點進 room（例如 General）
2. 確認歷史訊息可載入
3. 點「載入更早訊息」
4. 確認頁面可往前翻

### 8-4. Demo 場景 C：雙裝置即時聊天（重點）

1. 手機 A 與手機 B 都進同一個 room
2. A 發一則訊息：Hello from A
3. 預期：
- A 自己立即看到
- B 幾乎同步收到（無需手動重整）
4. B 再發一則，A 同步收到

### 8-5. Demo 場景 D：斷線容錯（fallback）

1. 在房間中暫時讓 A 網路不穩（例如關掉 Wi-Fi 再開）
2. 觀察標題下方連線狀態字串（連線中 / 重新連線中...）
3. 重連前後嘗試送訊息
4. 預期：
- 即便 socket 失敗，REST fallback 仍可送出
- 重連後能繼續收到即時推播

---

## 9. API 與 Socket 測試範例

### 9-1. REST

需要 Bearer token：

```bash
# rooms
curl -H "Authorization: Bearer <ACCESS_TOKEN>" \
  http://localhost:3000/api/chat/rooms

# messages
curl -H "Authorization: Bearer <ACCESS_TOKEN>" \
  "http://localhost:3000/api/chat/rooms/1/messages?limit=30"

# send
curl -X POST -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"content":"hello"}' \
  http://localhost:3000/api/chat/rooms/1/messages
```

### 9-2. Socket

事件對照：
- emit chat:join
- emit chat:send
- on chat:new_message
- emit chat:leave

若要做自動化測試，可用兩個 socket.io-client 連線同一 room，A 發送、B 驗證是否收到。

---

## 10. 常見問題與排錯

### Q1. 為什麼看不到聊天室資料？

檢查：
- 是否有登入（chat API 全都 requireAuth）
- backend .env 是否正確
- DB 是否存在 ChatRoom / Message

### Q2. 為什麼能送但不即時？

檢查：
- Socket 是否成功連線（前端狀態字串）
- CORS_ORIGIN 是否允許
- WebSocket 是否被網路或代理擋住

### Q3. 為什麼 migration 指令顯示沒有 migration？

在 multi-file schema 設定下，不同環境可能有 migration 探測差異。
可先直接確認 DB 表是否存在，再決定是否套用 migration.sql。

### Q4. 訊息重複怎麼處理？

前端 useChatRoom 以 message.id 做 upsert 去重，避免重複渲染。

---

## 11. 後續擴充建議（Roadmap）

1. typing indicator
2. unread count / read receipt
3. room membership 權限
4. Redis adapter（多實例 websocket 廣播）
5. E2E 測試（雙 client 自動化）
