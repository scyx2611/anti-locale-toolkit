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

部署與還原前要記錄 `Antigravity.exe` 是否正在執行。完成後只在原本已開啟時自動啟動 `Antigravity.exe`；若原本關閉，維持關閉。自動啟動失敗要保留已完成的部署結果並提示使用者手動開啟。

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
- 執行摘要：`Skills Used`、`Worked for 1m`、`Thinking time 2s`、`Analyzed`、`Searched`，以及由 `const Sib` 對照表產生的 `folders` 等項目數量。
- 模型選擇器：`Fast` 徽章，以及 `Limited time` 徽章和資訊圖示 Tooltip；兩者都要確認。
- 檔案與終端機入口：`Open File`、`New Terminal`、`Show in File Explorer`。
- 權限確認：一般選項的 `text`，以及自訂回覆的 `writeInLabel`、`writeInPlaceholder`；要確認組合後的完整文案，不只確認其中一個欄位。
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

## AI 可獨立執行的完整 Runbook

以下流程是版本更新時的實際執行順序。每個階段都要留下結果；遇到停止條件時，不要跳到部署階段。

### Phase 0：建立安全基線

先確認目前工作樹與遠端狀態，不要覆蓋未理解的使用者變更：

```text
git status --short --branch
git log -3 --oneline
git remote -v
```

確認專案只包含工具檔案、語言包、Skill、README、`package.json` 與 lockfile。`node_modules` 應由 `.gitignore` 排除。

檢查必要元件與目前安裝狀態：

```text
npm install --no-audit --no-fund
npm run check
node scripts/patcher.js --status
```

`--status` 必須記錄以下資訊：安裝目錄、`app.asar` 是否存在、原版備份是否存在、前端 bundle 與備份是否存在、目前 archive 版本與備份 archive 版本。

### Phase 1：辨識新版本

當使用者更新 Antigravity 後，先重新執行 `node scripts/patcher.js --status`，不要沿用舊版的版本判斷。確認：

1. 實際 `app.asar` 內 `package.json` 的 `version`。
2. `resources\\app.asar.unpacked` 是否與 archive 同版本。
3. 乾淨前端來源資料夾是否有 `main.js`，以及它的檔案大小與修改時間。
4. `dist` 下的六個原生檔案是否仍存在：`languageServer.js`、`loadingOverlay.js`、`menu.js`、`updater.js`、`tray.js`、`main.js`。

若版本不是目前支援版本，先不要部署。建立更新分支或至少保留現有 commit，對照新舊來源的 anchor；只有使用者明確要求測試時才使用 `--allow-version-mismatch`。不要把舊版本的完整解包目錄、舊 scratch 路徑或舊 bundle 複製進公開專案。

確認相容後，才同步更新：

```text
project.json                 -> supportedApplicationVersion
scripts/patcher.js           -> SUPPORTED_APP_VERSION
README.md                    -> 支援版本與限制
skills/.../SKILL.md          -> 不變條件（若維護規則改變）
skills/.../references/...    -> 基線、陷阱與驗證結果
```

若未來要同時支援多個應用程式版本，應設計明確的 version profile；不要在 patcher 裡累積無法判斷的全域替換條件。

### Phase 2：取得乾淨來源並比對結構

前端來源按 `scripts/patcher.js` 的解析順序處理：明確指定來源優先，其次是使用者的 `.gemini\\antigravity\\web_bundle`、`web_bundle.source`，最後才是安裝目錄現有 bundle。最後一項必須視為可能已漢化的來源並在結果中警告。

原生來源優先使用 `app.asar.backup`。如果它引用 `.unpacked` 而旁邊沒有該資料夾，只有在目前 archive 與備份 archive 版本一致時，才可用同版本的目前 `.unpacked` 建立備份對應資料。若版本不一致，停止並要求乾淨來源。

比對新版本時，搜尋要小範圍、可回讀：

```text
rg -n -F "Preview" <clean-web-bundle>\\main.js
rg -n -F "Limited time" <clean-web-bundle>\\main.js
rg -n -F "Skills Used" <clean-web-bundle>\\main.js
rg -n "tagTitle|tagDescription|Worked for|Thinking time|const Sib|writeInLabel|writeInPlaceholder" <clean-web-bundle>\\main.js
```

大型 minified 檔案不要整份貼進上下文；只取命中位置前後的短片段，並記錄它屬於固定字串、expression、模板、Tooltip 還是原生程式。

### Phase 3：更新語言包

每個語言包都應維持相同的頂層區段與結構：

```text
overlay
native_menu
native_update_dialog
tray
exact_properties: [{ key, val, optional description }]
descriptions: [{ from, to, optional description }]
```

更新規則：

- 先補乾淨來源中的英文，再以完整來源片段作 key；不要把已翻譯結果當成來源 key。
- 固定 UI 用 `exact_properties`；長說明或完整片段用 `descriptions`。
- `key` 必須保留來源的引號、跳脫、模板與必要上下文；值必須保持可嵌回原始 JavaScript 的語法。
- 非 ASCII 可能以 `\\uXXXX` 出現；不必為每個 escaped 變體手寫重複詞條，patcher 會嘗試兩種來源形式。
- 新增或修改繁中後，檢查簡中是否也需要對應更新；不要因某語言暫時沒有翻譯而刪除結構。
- 不翻譯檔案路徑、命令列、模型名稱、API 名稱、程式識別字或品牌名稱，除非它確實是可見 UI 文案。
- 新增語言只需新增 `locales/<language>.json`；互動選單會掃描 JSON 語言包，只有需要特殊顯示名稱時才更新 `LANGUAGE_LABELS`。

### Phase 4：處理動態文字與原生程式

對每個未翻譯畫面，先判斷它是否由前端 bundle、原生 Electron、系統匣、回饋表單或外部設定頁產生。不能因為畫面在同一頁就假設來源相同。

動態摘要要追到資料來源：`const Sib` 會把工具類別映射成單數／複數英文，再由摘要函式組成像 `3 folders` 的輸出；應翻譯對照表本身，而不是只翻譯外層的摘要模板。權限確認的自訂回覆則會把 `writeInLabel` 與 `writeInPlaceholder` 組合成一個選項，必須和一般選項的 `text` 分開檢查。

前端 `buildWebBundle()` 的順序不可破壞：

1. 將 `main.js` 分成可修改與 `qUb("...");` protected 區段。
2. 依 key 長度由長到短套用 `exact_properties`。
3. 套用 `descriptions`。
4. 寫入暫存 bundle，執行 `node --check`。

原生 `buildAsar()` 的檢查點：

- `languageServer.js` 的 `--web_bundle_path` 只能注入一次。
- `loadingOverlay.js` 要確認原始載入文字仍存在；anchor 不見時不要用模糊替換。
- `menu.js` 若已有 `i18nMenuDict`，要更新字典而不是跳過，否則切換語言會殘留上一種語言。
- `updater.js`、`tray.js`、`main.js` 的替換要以具體片段為界，並在找不到片段時留下警告。
- 六個原生 JavaScript 檔案都要通過 `node --check`。

### Phase 5：建構驗證

先只建構，不替換安裝檔：

```text
npm run check
node scripts/patcher.js --lang zh-TW
node scripts/patcher.js --lang zh-CN
node scripts/patcher.js --status
```

兩種語言建構都應看到：

- 偵測到的應用程式版本為目標版本。
- 前端腳本語法校驗通過。
- Electron 主進程代碼語法校驗通過。
- 成功產生暫存 `app.asar.patched`。

替換數量只用來發現異常變化，不可當成固定成功門檻。若新版本替換數突然大幅下降，回到 Phase 2 檢查來源與字串結構。

可以用互動入口做不部署測試：

```text
cmd.exe /d /c "echo 0|call AntiLocaleToolkit.bat"
```

確認語言選單列出 `繁體中文(TW)`、`简体中文`，並且不會因缺少語言包而崩潰。

### Phase 6：獲得授權後才部署

實際部署會關閉 `Antigravity.exe` 與 `language_server.exe`，所以只有使用者明確要求時才執行：

```text
node scripts/patcher.js --apply --lang zh-TW
```

部署前確認 `app.asar.backup` 與 `web_bundle.backup` 已存在或即將建立；確認來源不是上一個語言的輸出。工具會記錄 Antigravity 是否原本正在執行：

- 原本開啟：部署或還原完成後自動啟動 `Antigravity.exe`。
- 原本關閉：部署或還原完成後維持關閉。
- 自動啟動失敗：部署結果仍保留，提示使用者手動開啟。

部署後先執行 `--status`，再重新啟動或等待工具自動啟動。畫面驗收至少包含：設定頁、檔案預覽、模型選擇器、Tooltip、技能區塊、檔案／終端機選單、回饋頁與系統匣。

### Phase 7：失敗處理與回復

| 症狀 | 判斷 | 安全處理 |
|---|---|---|
| archive 解包找不到 `.unpacked` 檔案 | 備份 archive 依賴旁側外部檔案 | 先比對 archive 版本；同版本才建立對應 `.unpacked`，否則停止 |
| `spawnSync npx.cmd EINVAL` | Windows 將 `.cmd` 當成直接可執行檔失敗 | 使用專案內 `node_modules/asar/bin/asar.js` 搭配 Node 執行，不要把錯誤改成忽略 |
| 前端替換數為 0 或大幅下降 | bundle 結構、來源版本或字串編碼已變 | 重新搜尋乾淨來源，檢查 protected 區段與動態 expression |
| Tooltip 仍是英文 | 只處理了 badge 或標題，沒有處理 description | 尋找 `tagTitle` 與 `tagDescription` 兩個來源並分別驗證 |
| 摘要仍顯示 `3 folders` 等英文單位 | 類別單複數由 `const Sib` 對照表即時產生，沒有命中外層摘要模板 | 以完整 `const Sib` 片段加入 `exact_properties`，並檢查檔案、資料夾、搜尋與指令等類別 |
| 權限選項仍顯示 `No (tell the agent what to do instead)` | 自訂回覆的 label／placeholder 不經一般選項文字翻譯函式 | 同時定位並翻譯 `writeInLabel` 與 `writeInPlaceholder`，再驗證組合後的畫面文案 |
| 切換語言後原生選單未變 | 使用了上一個已修改 archive，或跳過既有 `i18nMenuDict` | 從乾淨 backup 重建，或更新既有注入字典；不要累加替換 |
| app.asar 被鎖定 | Antigravity 或 language server 尚未退出 | 只關閉目標程序後重試；不要停止無關程序，不要刪除備份 |
| 應用程式無法啟動 | 原生語法、archive 或 bundle 部署不完整 | 先關閉目標程序，執行 `--restore`，確認備份版本，再檢查語法與來源 |
| 自動重啟失敗 | 執行檔位置不存在或程序啟動被系統阻擋 | 不回滾已完成部署；提示手動啟動並記錄為部分驗證 |

### Phase 8：公開提交與交接

公開前逐項確認：

```text
git status --short
git diff --check
git ls-files node_modules
git ls-files | findstr /I "app.asar backup unpacked web_bundle main.js"
```

預期：沒有 `node_modules`、`app.asar`、`*.backup`、`.unpacked`、完整 vendor `main.js` 或使用者機器的絕對路徑。用 `rg` 掃描 Token、密碼、私鑰與硬編碼個人路徑；語言包中的說明性英文詞彙不等於秘密。

只有得到明確發布授權才 commit/push。提交後回報：commit、分支、遠端 URL、公開／私人狀態、驗證命令，以及哪些桌面驗收仍是 `NOT VERIFIED`。更新完成後也要同步修改本 Skill 的基線與新版本陷阱，避免下一次 AI 重新猜測。
