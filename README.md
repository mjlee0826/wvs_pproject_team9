# WVS Pocket

**WVS Pocket** 是一個給世界志工社（WVS）營隊使用的師生互動 App。
學生發貼文（閱讀心得、習慣打卡）→ 老師按讚 → 學生得金幣 → 累積換獎品。

| | 技術 |
|---|---|
| 📱 Frontend | React Native (Expo) + expo-router + NativeWind |
| ⚙️ Backend | Node.js + Express 5 + Prisma 7 + TypeScript |
| 🗃️ Database | PostgreSQL（團隊共用，跑在 NTU CSIE 的 server） |
| 🔐 Auth | Logto Cloud（OAuth + JWT） |

---

## 📚 文件索引

這個 repo 有三份文件，請依照你的目的選一份開始看：

### 🟢 [GETTING_STARTED.md](./GETTING_STARTED.md)
> **「我只想把專案跑起來看看畫面」**

適合對象：第一次接觸這個專案、想跑起來體驗看看的人。
包含：環境準備、`.env` 真實值、IP 設定、啟動 backend / frontend 的完整步驟、常見 FAQ。

### 🔵 [ARCHITECTURE.md](./ARCHITECTURE.md)
> **「我想了解這個專案怎麼運作，但我不會動 code」**

適合對象：PM、組員、學長姐、想理解架構但不會 coding 的人。
包含：三層架構圖、套件清單與選用理由、Auth Pipeline 完整流程、資料拿取 Pipeline、資料夾結構解說、已完成 / 未完成功能清單。

### 🟡 [DEVELOPMENT.md](./DEVELOPMENT.md)
> **「我要動 code、加 feature、改 bug」**

適合對象：要寫 code 的工程師。
包含：每個資料夾該放什麼、共用 DB 下的安全 Schema 更新 SOP、`migrate dev` vs `migrate deploy` 何時用、`requireAuth` / `requireAdmin` 權限 middleware 用法、完整實作「聊天室」範例、Git 工作流程、常用指令速查。

### 💬 [CHAT_README.md](./CHAT_README.md)
> **「我要專門看聊天室技術細節、操作方式與 demo 劇本」**

適合對象：要開發聊天室、做 live demo、排查聊天室問題的人。
包含：聊天室資料模型、REST/Socket 事件設計、前後端 workflow、啟動步驟、雙裝置 demo 劇本、常見排錯。

---

## 🚀 一分鐘啟動（已經跑過一次的人用）

```bash
# 先切到專案指定 Node 版本（不影響別人）
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install
nvm use

# Terminal 1：Backend
cd backend && npm install && npm run dev

# Terminal 2：Frontend
cd frontend && npm install && npm run start
# 用手機 Expo Go 掃 QR Code
```

> ⚠️ **第一次跑的人請先看 [GETTING_STARTED.md](./GETTING_STARTED.md)**，需要建立 `.env` 跟設定 IP。
>
> Node 版本目標：**22 LTS**（專案根目錄 `.nvmrc`）。

---

## 🗂️ 專案結構速覽

```
wvs_project_team9/
├── backend/                    後端 API（Express + Prisma）
│   ├── prisma/
│   │   ├── schema/             ★ multi-file schema（每個 model 一個檔）
│   │   └── migrations/         DB 變更歷史（不要手改）
│   ├── src/
│   │   ├── routes/             URL → controller
│   │   ├── controllers/        處理 req/res
│   │   ├── services/           業務邏輯 + Prisma 操作
│   │   ├── middleware/         requireAuth / requireAdmin
│   │   └── utils/              prisma client、檔案上傳、外部 API
│   └── uploads/                使用者上傳的圖片（不進 git）
│
├── frontend/                   手機 App（Expo / React Native）
│   ├── app/                    Expo Router 頁面（資料夾 = 路由）
│   └── src/
│       ├── components/         純 UI 元件
│       ├── containers/         整個畫面（組合 components + hooks）
│       ├── hooks/              拉資料 / 管狀態的 hook
│       ├── services/           包 axios 呼叫
│       └── utils/              axios instance、AsyncStorage、常數
│
├── GETTING_STARTED.md          🟢 啟動指南
├── ARCHITECTURE.md             🔵 架構說明
├── DEVELOPMENT.md              🟡 開發指南
└── docker-compose.yml          本機 Postgres（已不用，現在連雲端共用 DB）
```

---

## ⚠️ 重要提醒（給所有開發者）

### 1. DB 是團隊共用的
所有人的 backend 都連到同一個 PostgreSQL server (`ws2.csie.ntu.edu.tw`)。
**改 schema 前一定要先在群組講一聲**，避免衝突。

詳細的 schema 更新 SOP 看 [DEVELOPMENT.md § 2](./DEVELOPMENT.md#2-schema-更新流程重要)。

### 2. `.env` 不要 commit
專案根目錄 `.gitignore` 已經把 `.env` 擋掉了。如果你的 `.env` 不見了，去 [GETTING_STARTED.md § 2-2 / § 3-3](./GETTING_STARTED.md) 找範本。

### 3. CSS 用 Tailwind / NativeWind
**Frontend 一律用 Tailwind class 寫樣式**，不要寫 `StyleSheet.create({...})`。
詳見 [DEVELOPMENT.md § 5-2](./DEVELOPMENT.md#5-2-樣式一律用-tailwind--nativewind)。

---

## 🆘 卡住了？

按嚴重程度遞減排序：

1. **App 連不上 backend** → [GETTING_STARTED.md § 5 FAQ](./GETTING_STARTED.md#5-常見問題-faq)
2. **Schema 出狀況** → [DEVELOPMENT.md § 2-5 萬一搞砸了怎麼救](./DEVELOPMENT.md#2-5-萬一搞砸了怎麼救)
3. **不知道某個檔案幹嘛的** → [ARCHITECTURE.md § 5 資料夾結構](./ARCHITECTURE.md#5-資料夾結構)
4. **不知道某個指令幹嘛的** → [DEVELOPMENT.md § 7 常用指令速查](./DEVELOPMENT.md#7-常用指令速查)

如果都查不到，**問團隊**比卡兩小時划算。

---

## 📌 專案狀態

- [x] Auth（Logto + JWT + 角色機制）
- [x] 貼文 CRUD + 圖片上傳 + 分頁
- [x] 留言 CRUD
- [x] 老師按讚 → 學生金幣機制
- [x] 個人頁（自己 / 別人）+ 編輯 / 換頭像
- [x] 聊天室（route 已預留）
- [x] 題目解題（route 已預留）

完整功能清單看 [ARCHITECTURE.md § 6](./ARCHITECTURE.md#6-這個專案目前完成的事)。
