# AntiLocale Toolkit 版本更新維護流程

這份文件是給後續 AI 維護本專案用的操作紀錄。它記錄可重複的判斷方式，不把某一次搜尋結果或替換數量當成永久不變的規格。

## 目前基線

- 專案：AntiLocale Toolkit
- Repository：`anti-locale-toolkit`
- 目標應用程式：Antigravity Desktop
- 目前支援版本：`2.12.0`
- 語言包：`locales/zh-TW.json`、`locales/zh-CN.json`
- 入口：`AntiLocaleToolkit.bat`
- 核心程式：`scripts/patcher.js`

版本更新時，先確認 `project.json`、README 與 patcher 的版本值一致，再檢查實際 archive 內的 `package.json`。不要只改文件中的版本文字。

## 來源與備份

部署程式預設尋找：

1. 使用者明確指定的 `--source-web-bundle` 或 `ANTIGRAVITY_WEB_BUNDLE`。
2. `%USERPROFILE%\\.gemini\\antigravity\\web_bundle`。
3. 安裝目錄下的 `resources\\web_bundle.source`。
4. 安裝目錄下現有的 `resources\\web_bundle`，只作最後備援，且要警告它可能已經被翻譯過。

`app.asar` 的原生來源優先使用 `app.asar.backup`。某些 archive 會引用旁邊的 `.unpacked` 資料；如果備份 archive 與目前 archive 版本一致、而備份 `.unpacked` 不存在，可以用目前同版本的 `.unpacked` 建立對應資料，再解包備份。版本不一致時不要混用。

第一次套用前建立：

- `resources\\app.asar.backup`
- `resources\\web_bundle.backup`

還原時只替換回 app archive，並將目前的外部漢化 bundle 改名為 `web_bundle.disabled`，不要刪除原始備份。

## 前端字典定位

先在乾淨的 `main.js` 搜尋英文來源，再判斷來源類型：

- 固定按鈕、選單、頁籤、標題：加入 `exact_properties`。
- 多句說明或完整片段：加入 `descriptions`。
- `${...}`、函式回傳值、React expression、Tooltip：修改產生該值的 expression，必要時同時處理標籤與說明。
- 非 ASCII 可能以 `\\uXXXX` 出現；patcher 已同時處理一般與 Unicode escaped 形式。
- 先處理較長的精確片段，再處理一般詞條，避免短詞先消耗上下文。
- 不修改 `splitProtectedWebBundleRegions()` 判定的 `qUb("...");` 區段。

### 這次 2.12.0 維護留下的檢查清單

- 檔案預覽標頭：`Preview`、`Raw`。
- 執行摘要：`Skills Used`、`Worked for 1m`、`Thinking time 2s`、`Analyzed`、`Searched`。
- 模型選擇器：`Fast` 徽章，以及 `Limited time` 徽章和資訊圖示 Tooltip；兩者都要確認。
- 檔案與終端機入口：`Open File`、`New Terminal`、`Show in File Explorer`。
- 回饋頁與 Remote Control 相關說明；這些是長描述，不能只翻譯標題。
- 右側技能清單、模型用量、設定頁與原生選單；原生內容不是只靠 web bundle 字典完成。

## 原生 Electron 修改位置

`buildAsar()` 目前處理以下原生檔案：

- `dist/languageServer.js`：注入 `--web_bundle_path`，讓外部前端 bundle 生效。
- `dist/loadingOverlay.js`：翻譯載入畫面。
- `dist/menu.js`：注入原生選單字典；重建時要能更新既有注入內容，避免切換語言仍沿用上一版。
- `dist/updater.js`：更新提示對話框。
- `dist/tray.js`：系統匣代理計數。
- `dist/main.js`：系統匣動作。

所有修改後都要以 `node --check` 驗證。若某個版本的原生片段已改版，應先記錄缺少的 anchor 並停止或警告，不要用寬鬆的全域替換猜測新結構。

## 驗證矩陣

### 每次字典或 patcher 變更

```text
npm run check
node scripts/patcher.js --lang zh-TW
node scripts/patcher.js --lang zh-CN
node scripts/patcher.js --status
```

建構輸出中的前端與 Electron 語法檢查都必須通過；替換數量只作差異提示，不是成功條件，因為上游 bundle 會變動。

### 實際部署後

```text
node scripts/patcher.js --apply --lang zh-TW
node scripts/patcher.js --status
```

重新啟動應用程式後，至少人工確認：語言選單、模型選擇器、Tooltip、技能區塊、檔案／終端機選單、回饋頁與系統匣。再用 `--apply --lang zh-CN` 測試切換，確認原生選單與前端不會殘留繁中。

若沒有進行實際啟動或畫面檢查，只能報告「建構與語法驗證通過」，不能宣稱桌面端完整驗證。
