# 工時計算器 Web App

一個提供給工讀生與兼職族使用的工時計算工具，幫助使用者記錄上下班時間、自動計算薪資、並在超時時發出提醒。

## 功能特色

### 核心功能（免費）
- ✅ 使用者註冊與登入
- ✅ 工作資料管理（工作名稱、時薪、每日工時上限）
- ✅ 上班/下班打卡功能
- ✅ 自動記錄每日上下班時間
- ✅ 自動計算每日工時與薪資
- ✅ 顯示本週/本月累積工時與薪資
- ✅ 超過每日工時上限即時提醒
- ✅ 工時與薪資歷史紀錄查詢
- ✅ 廣告顯示機制

### Premium 功能（付費）
- 👑 多工作管理
- 👑 工時與薪資資料匯出（Excel / PDF）
- 👑 移除廣告

## 技術架構

- **前端框架**: React 18 + TypeScript
- **建構工具**: Vite
- **路由**: React Router DOM
- **狀態管理**: Zustand
- **樣式**: Tailwind CSS
- **圖示**: Lucide React
- **儲存**: IndexedDB (Dexie.js)
- **PWA**: Vite PWA Plugin

## 開始使用

### 安裝依賴

```bash
npm install
```

### 開發模式

```bash
npm run dev
```

開啟瀏覽器訪問 http://localhost:5173

### 建構生產版本

```bash
npm run build
```

### 預覽生產版本

```bash
npm run preview
```

## 專案結構

```
src/
├── components/     # UI 元件
│   └── ui/         # 通用 UI 元件 (Button, Card, Input, Modal)
├── pages/          # 頁面元件
│   ├── LoginPage.tsx      # 登入頁面
│   ├── RegisterPage.tsx   # 註冊頁面
│   ├── SetupPage.tsx      # 初始設定頁面
│   ├── DashboardPage.tsx  # 主頁面（打卡）
│   ├── HistoryPage.tsx    # 歷史紀錄頁面
│   └── SettingsPage.tsx   # 設定頁面
├── stores/         # Zustand 狀態管理
├── hooks/          # 自定義 Hooks
├── utils/          # 工具函數
├── types/          # TypeScript 型別定義
└── db/             # IndexedDB 資料庫操作
```

## 使用流程

1. **註冊帳號** - 建立新帳號
2. **設定工作** - 輸入工作名稱、時薪和每日工時上限
3. **開始打卡** - 上班時點擊「上班打卡」，下班時點擊「下班打卡」
4. **查看統計** - 首頁顯示今日/本週/本月的工時與薪資統計
5. **歷史紀錄** - 可查看過往的打卡紀錄並進行編輯

## 注意事項

- 所有資料儲存在本機瀏覽器中（IndexedDB）
- 清除瀏覽器資料會導致資料遺失
- 建議定期匯出資料備份（Premium 功能）

## License

MIT
