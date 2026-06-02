# 啟動指南（GETTING_STARTED）

這份文件是寫給**「只想把專案跑起來、看看畫面」的人**看的。
不需要寫過 frontend 或 backend，也不需要懂專案內部結構。

跟著步驟做，就可以在自己的電腦上跑起整個 WVS Pocket（手機 App + 後端 API）。

---

## 0. 這個專案有什麼？

```
wvs_project_team9/
├── backend/      # API 伺服器（Node.js + Express + Prisma + PostgreSQL）
├── frontend/     # 手機 App（React Native + Expo）
└── docker-compose.yml   # 你不會用到，這只是當初開發時用的本機 DB
```

整體運作概念：

```
┌────────────┐    HTTP    ┌────────────┐   SQL    ┌──────────────┐
│  手機 App   │ ─────────► │  Backend   │ ──────► │  PostgreSQL  │
│  (Expo)    │            │ (Express)  │          │  (團隊共用)   │
└────────────┘            └────────────┘          └──────────────┘
                              │
                              ▼
                          ┌────────┐
                          │  Logto │  ← 雲端身份驗證服務（已建好）
                          └────────┘
```

**你只需要在自己電腦上跑「Backend」和「Frontend」，DB 跟 Logto 都是大家共用的雲端服務。**

---

## 1. 事前準備

請先確認你電腦上有：

| 工具 | 為什麼需要 | 怎麼確認有沒有 |
|---|---|---|
| **Node.js 22 LTS** | 跑 backend 跟 frontend 都要 | `node -v` |
| **npm** | 裝套件用 | `npm -v` |
| **手機（Android 或 iOS）** | 跑 App 的地方 | 自己的就好 |
| **Expo Go App** | 在手機上跑開發版的 App | 去 App Store / Google Play 下載 |

> 💡 建議用 **nvm** 以「使用者層級」安裝 Node，不會改到系統全域設定、也不影響同機器其他人。

### 1-1. 推薦：用 nvm 切到專案指定 Node（不影響其他人）

在專案根目錄已提供 `.nvmrc`（固定在 Node 22）。

```bash
# 載入 nvm（若你的 shell 尚未自動載入）
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# 讀取 .nvmrc 安裝並使用專案版本
cd /path/to/wvs_pproject_team9
nvm install
nvm use

# 確認版本
node -v
npm -v
```

你應該看到 Node `v22.x.x`。

> 這個做法只影響「目前 shell 與目前使用者」，不會改動系統全域 Node。

---

## 2. 啟動 Backend（先跑這個）

### 2-1. 進入 backend 資料夾、安裝套件

```bash
cd backend
npm install
```

跑完之後會自動執行 `prisma generate`（產生 DB client 程式碼），這是正常的。

### 2-2. 建立 `.env` 檔案

在 `backend/` 資料夾下建立一個叫做 `.env` 的檔案，**直接複製貼上以下內容**：

```env
DATABASE_URL=postgresql://wvs:wvs_secret@ws2.csie.ntu.edu.tw:5432/wvspocket
LOGTO_ENDPOINT=https://01sqdw.logto.app
LOGTO_API_RESOURCE=https://api.wvspocket.com
LOGTO_M2M_APP_ID=d669uerg3riuacyf4hjyn
LOGTO_M2M_APP_SECRET=NMFFePQm5Cfg28rsS3FLEqXdMto8YgjL
PORT=3000
CORS_ORIGIN=http://localhost:8081
```

> ⚠️ 這些值是「**真的可以用**」的開發環境設定。
> 重要說明：
> - `DATABASE_URL` 指向團隊共用的 PostgreSQL（在 NTU CSIE 的 ws2 server）
>   → 你**不需要**跑 docker、也**不需要**自己裝 PostgreSQL
> - `LOGTO_*` 是雲端身份驗證服務，已經幫你建好，直接用
> - `CORS_ORIGIN=http://localhost:8081` 是 Expo dev server 的預設 port

### 2-3. 啟動 Backend

```bash
npm run dev
```

看到下面這行就表示啟動成功：

```
Server running on port 3000
```

打開瀏覽器訪問 `http://localhost:3000/api/posts` 應該會看到 JSON 回應（一個 posts 列表）。

### 2-4. 關於 Prisma（重要！）

> ⚠️ **由於我們團隊共用同一個 PostgreSQL server**，所以：
>
> - **第一次 clone 下來時，不要跑 `npx prisma migrate dev`！**
>   DB 已經被別人建好了，schema 已經存在，直接 `npm run dev` 就好。
> - 如果你只是「啟動專案」，你**完全不需要碰 Prisma 指令**。
> - 如果未來看到別人有改過 schema（`backend/prisma/schema/*.prisma` 有更新），請去看 [`DEVELOPMENT.md`](./DEVELOPMENT.md) 的「Schema 更新流程」章節，那裡有詳細說明。
>
> 簡單記住：**Schema 是共用的，不要亂跑 migrate**。

---

## 3. 啟動 Frontend（手機 App）

### 3-1. 進入 frontend 資料夾、安裝套件

開**另一個 terminal**：

```bash
cd frontend
npm install
```

> 💡 第一次 install 會比較久（500+ 個套件），請耐心等。

### 3-2. 查出自己電腦的 IP 位址（非常重要！）

**為什麼要這一步？**
手機跟你的電腦不是同一台機器，手機上的 App 沒辦法用 `localhost` 連到你電腦的 backend。所以要告訴 App 「我的 backend 在某某 IP」。

#### 怎麼查 IP？

**Linux / macOS：**
```bash
ip addr show       # Linux
ifconfig           # macOS / 老 Linux
```
找你的 Wi-Fi 介面（通常是 `wlan0`、`wlp...`、`en0`），看 `inet` 後面的 IP，會像 `192.168.x.x` 或 `172.20.x.x`。

**Windows：**
```cmd
ipconfig
```
找「無線區域網路介面卡」的 IPv4 位址。

> ⚠️ **手機跟電腦一定要連同一個 Wi-Fi！** 不然手機根本連不到你的電腦。

### 3-3. 建立 `.env` 檔案

在 `frontend/` 資料夾下建立 `.env` 檔案，**把第一行的 IP 換成你剛查到的 IP**：

```env
EXPO_PUBLIC_API_URL=http://172.20.10.6:3000/api
EXPO_PUBLIC_LOGTO_ENDPOINT=https://01sqdw.logto.app
EXPO_PUBLIC_LOGTO_APP_ID=eybbjds3rhfga0vimiz00
EXPO_PUBLIC_LOGTO_API_RESOURCE=https://api.wvspocket.com
EXPO_PUBLIC_LOGTO_REDIRECT_URI=wvspocket://callback
```

例如你的 IP 是 `192.168.1.50`，第一行就改成：
```env
EXPO_PUBLIC_API_URL=http://192.168.1.50:3000/api
```

> ⚠️ **port 一定要是 `3000`，後面要保留 `/api`**，這是 backend 預設的位址。

### 3-4. 啟動 Frontend

```bash
npm run start
```

啟動後 terminal 會出現一個 **QR Code**。

### 3-5. 用手機打開 App

1. 手機打開剛剛裝的 **Expo Go**
2. 掃描 terminal 上的 QR Code（Android 可以直接掃，iOS 要用相機 App 掃）
3. 等 30~60 秒讓 App 載入完成
4. 看到「WVS Pocket」登入畫面就代表成功了 🎉

---

## 4. 啟動後測試流程

完整體驗應該長這樣：

1. 開啟 App → 看到藍色漸層的登入畫面
2. 按「登入」→ 跳到 Logto 登入頁（瀏覽器或 in-app browser）
3. 用 Google 或註冊一個帳號登入
4. 回到 App，第一次登入會看到「請問你的身份是？」
   - 選「學生」→ 可以發貼文、留言
   - 選「老師」→ 還要這個 email 在白名單裡才行（白名單存在 DB 的 `AllowedAdminEmail` 表）
5. 進到主畫面 → 看到貼文列表
6. 右下角的「+」按鈕 → 發貼文

---

## 5. 常見問題 FAQ

### Q1：手機連不上 backend / App 一直 loading

99% 是 IP 問題。檢查：
1. 手機跟電腦是否連同一個 Wi-Fi？
2. `frontend/.env` 的 `EXPO_PUBLIC_API_URL` 是否填對 IP？
3. backend 是否還在跑（terminal 沒關）？
4. 防火牆是否擋了 3000 port？（Linux 通常沒事，Windows 可能會跳通知請允許）

可以用手機瀏覽器訪問 `http://你的IP:3000/api/posts` 測試。如果連網頁都打不開，就是網路問題；如果有 JSON 回應，就是 App 設定問題。

### Q2：登入後一直跳回登入畫面

可能是 Logto 那邊的設定問題，或是 `EXPO_PUBLIC_LOGTO_*` 環境變數沒填對。直接複製貼上文件給的值就好。

### Q3：要修改 `.env` 後要重啟嗎？

- Backend：要 ✅（Ctrl+C 後 `npm run dev`）
- Frontend：要 ✅（Ctrl+C 後 `npm run start`，因為 `EXPO_PUBLIC_*` 是 build time 變數）

### Q4：可以在 Web 上跑嗎？

可以，`npm run start` 後按 `w`，會在瀏覽器開啟。但因為是手機 App，Web 版會有些 UI 不正常，建議還是用手機跑。

### Q5：docker-compose.yml 是幹嘛的？

那是當初本機開發用的 PostgreSQL，**你不需要動它**。我們現在用的是團隊共用的 server (`ws2.csie.ntu.edu.tw`)。

### Q6：我換 Wi-Fi 後就不能用了

換 Wi-Fi 通常 IP 也會變，請重新查 IP 並更新 `frontend/.env` 的 `EXPO_PUBLIC_API_URL`，然後重啟 frontend。

---

## 6. 下一步要去哪？

- 想了解這個專案怎麼運作的（不寫 code）→ 看 [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- 想加新功能 / 改 code → 看 [`DEVELOPMENT.md`](./DEVELOPMENT.md)
