# 工時計算 Web App - Copilot Instructions

## 專案概述
這是一個提供給工讀生與兼職族使用的工時計算工具 Web App，使用 React + TypeScript + Vite 建構。

## 技術架構
- **前端框架**: React 18 + TypeScript
- **建構工具**: Vite
- **路由**: React Router DOM
- **狀態管理**: Zustand
- **樣式**: Tailwind CSS
- **圖示**: Lucide React
- **儲存**: LocalStorage / IndexedDB (Dexie.js)
- **PWA**: Vite PWA Plugin

## 核心功能
1. 使用者註冊與登入（本地儲存）
2. 工作資料管理（工作名稱、時薪、每日工時上限）
3. 上下班打卡功能
4. 自動計算每日/每週/每月工時與薪資
5. 超時提醒功能
6. 工時歷史紀錄查詢
7. 響應式設計（手機優先）

## 專案結構
```
src/
├── components/     # UI 元件
├── pages/          # 頁面元件
├── stores/         # Zustand 狀態管理
├── hooks/          # 自定義 Hooks
├── utils/          # 工具函數
├── types/          # TypeScript 型別定義
└── db/             # IndexedDB 資料庫操作
```

## 開發指南
- 使用 `npm run dev` 啟動開發伺服器
- 使用 `npm run build` 建構生產版本
- 所有元件應為響應式設計，優先支援行動裝置
