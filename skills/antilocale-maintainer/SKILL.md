---
name: antilocale-maintainer
description: Maintain and extend AntiLocale Toolkit localization for Antigravity Desktop, especially after an application version update or when a translated UI string is missing.
---

# AntiLocale Toolkit 維護 Skill

這個 Skill 用於維護本專案的 Antigravity Desktop 多語言部署工具。它適用於新增語言、補翻譯、修補版本更新後的介面、檢查部署失敗，以及確認語言切換仍可安全還原。

## 重要不變條件

- 目前支援的應用程式版本是 **2.12.0**。版本資訊必須同步檢查 `project.json`、`README.md` 與 `scripts/patcher.js`；字典檔內的 `version` 是字典自身資料，不可誤當成應用程式版本。
- 不把 Antigravity 的 `app.asar`、完整 `main.js`、解包目錄或使用者專屬來源檔提交到公開 Repository。工具只提交部署程式、語言包、維護 Skill 與必要文件。
- 語言包放在 `locales/`，部署程式應使用語言代碼載入它們；不要為每種語言複製一份整套 patcher。
- 來源必須來自使用者目前安裝的應用程式或明確指定的乾淨來源。不要回退到舊的臨時工作目錄，也不要把上一個語言的已修改 bundle 當成乾淨來源而默默覆蓋。
- 前端 `main.js` 中 `qUb("...");` 包住的區段是受保護的第三方程式碼；只在非受保護區段套用字典，以免破壞 JavaScript。
- 套用前保留 `app.asar.backup` 與 `web_bundle.backup`。不要使用 Git reset、廣泛清理或刪除使用者備份來「修復」部署問題。

## 維護流程

1. 先確認安裝目錄、目前 `app.asar`、備份 archive、`.unpacked` 目錄與前端來源，並讀取實際 `package.json` 版本。
2. 若應用程式不是 2.12.0，先停止並說明不相容；只有使用者明確要求測試其他版本時，才使用 `--allow-version-mismatch`。
3. 將新文字加入相應語言包。固定文字放 `exact_properties`；描述或完整片段放 `descriptions`；動態 JSX/React 文字要修補其產生值與 Tooltip，不只修畫面上第一個出現位置。
4. 先做不部署的建構：`npm run check`，再分別執行 `node scripts/patcher.js --lang zh-TW` 與 `node scripts/patcher.js --lang zh-CN`。確認前端與 Electron 原生腳本語法都通過。
5. 只有在使用者要求實際套用時，才執行 `AntiLocaleToolkit.bat` 或 `node scripts/patcher.js --apply --lang <language>`；這會關閉 Antigravity 及 language server，並替換安裝檔。
6. 建構成功不等於桌面流程已驗證。若能啟動應用程式，另外檢查實際選單、模型選擇器、技能區塊、回饋頁與還原流程；無法啟動時要明確標記為未驗證。

## 這次版本的實際經驗

- `Preview`、`Raw`、`Skills Used`、`Fast`、`Limited time`、`Open File`、`New Terminal` 等文字分散在固定字串、動態標題與 Tooltip，不能只搜尋一次畫面文字。
- `Limited time` 至少有模型徽章的 `tagTitle` 與資訊圖示 Tooltip 的 `tagDescription` 兩個來源；只翻譯徽章會留下 Tooltip 英文。`Fast` 也有相同的徽章與 Tooltip 關係。
- `Skills Used` 是動態區塊標題；更新字典時要定位實際產生標題的 expression，而不是只加入一般固定字串。
- `Worked for 1m`、`Thinking time 2s`、`Analyzed ...` 等執行紀錄由回應元件即時產生，必須以動態來源或模板處理；`2s` 等時間單位不能只依賴固定畫面搜尋。
- 靜態檔案檢查只能證明字典與語法正確，不能證明 Electron 啟動、程序關閉、檔案鎖定解除或畫面實際顯示正確。報告結果時分開描述這些證據層級。

進行版本更新或較大的維護時，請讀取 [版本更新維護流程](references/version-update-runbook.md)，其中記錄來源選擇、字典定位、驗證矩陣與這次 2.12.0 維護的具體陷阱。
