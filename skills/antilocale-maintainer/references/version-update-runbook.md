# AntiLocale Toolkit 版本更新維護流程

這份文件是給後續 AI 維護本專案用的操作紀錄。它記錄可重複的判斷方式，不把某一次搜尋結果或替換數量當成永久不變的規格。

## 目前基線

- 專案：AntiLocale Toolkit
- Repository：`anti-locale-toolkit`
- 目標應用程式：Antigravity Desktop
- 目前支援版本：`2.12.0`、`2.12.2`
- 語言包：`locales/zh-TW.json`、`locales/zh-CN.json`
- 入口：`AntiLocaleToolkit.bat`
- 核心程式：`scripts/patcher.js`

版本更新時，先確認 `project.json` 的 `supportedApplicationVersions`、README 與 patcher 的版本清單一致，再檢查實際 archive 內的 `package.json`。不要只改文件中的版本文字。

## 來源與備份

部署程式預設尋找：

1. 使用者明確指定的 `--source-web-bundle` 或 `ANTIGRAVITY_WEB_BUNDLE`。
2. `%USERPROFILE%\\.gemini\\antigravity\\web_bundle`。
3. 安裝目錄下的 `resources\\web_bundle.source`。
4. 安裝目錄下現有的 `resources\\web_bundle`，只作最後備援，且要警告它可能已經被翻譯過。

這些來源不會隨公開 Repository 或下載包附帶；`%USERPROFILE%` 必須在每台電腦上解析成目前使用者的家目錄，不能把某次執行的 `C:\\Users\\yx` 路徑寫入設定或文件。若安裝目錄也沒有可用 bundle，才要求使用者以 `--source-web-bundle` 指向乾淨來源。

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
- 執行摘要：`Skills Used`、`Worked for 1m`、`Thinking...`、`Thinking time 2s`、`Analyzed`、`Searched`、`Working..`，以及由 `const Sib` 對照表產生的 `folders` 等項目數量。
- 模型選擇器：`Fast` 徽章，以及 `Limited time` 徽章和資訊圖示 Tooltip；2.12.0 的 `var zW` renderer 會同時處理 `tagTitle` 與 `tagDescription`，`Fast`／`Limited time` 兩個分支都要確認。
- `Skills Used` 的區塊標題由動態 `J1` expression 產生；簡中 lookup 要保留英文比較值，避免 generic exact replacement 將 `Skills Used` 改成目標語言後無法命中。
- 檔案與終端機入口：`Open File`、`New Terminal`、`New Preview`、`Show in File Explorer`；`New Preview` 要檢查目前 bundle 的 `y`／`z` 元件變體。
- 權限確認：一般選項的 `text`，以及自訂回覆的 `writeInLabel`、`writeInPlaceholder`；要確認組合後的完整文案，不只確認其中一個欄位。
- 回饋頁與 Remote Control 相關說明；這些是長描述，不能只翻譯標題。
- MCP 工具權限的完整問句不應逐句硬編；2.12.0 的標題由 wGb action 對照表或 actionDescription 與固定 Allow 模板組成。應分開翻譯固定模板／對照表，並保留動態工具描述、指令、路徑與名稱。
- MCP 伺服器卡片的 `Click to disable tool`／`Click to enable tool` 是固定 Tooltip；工具數量則由 `B?`${E} tool${E!==1?"s":""} enabled`:`${v.tools.length} tool${v.tools.length!==1?"s":""} disabled`` 動態產生。要翻譯兩個 Tooltip 與 enabled／disabled 兩個分支，保留 `${E}`、`${v.tools.length}`，不要把畫面範例中的 `6` 寫成固定文字。
- MCP 執行步驟的標題使用 `prefix:"MCP Tool:"` 加上動態 `serverName`／`toolCall?.name`；只替換固定前綴為 `prefix:"MCP 工具："`，不要翻譯或改動伺服器與工具識別名稱。
- 回覆評價按鈕的 `"Good response"`／`"Bad response"` 是固定 Tooltip 與 `aria-label`，可直接加入 `exact_properties`；若英文出現在模型實際回覆內容（例如 `Skills / Rules`、`Progressive Disclosure`），那是動態內容，不要以全域字串替換處理。
- 回覆列的複製按鈕以 `J?"Copied":"Copy"` 同時提供 `aria-label` 與 Tooltip，必須保留條件判斷並翻譯兩個分支；其他 `title:"Copy"` 詞條不一定會命中這個按鈕。
- 2.12.2 的回覆列、使用者訊息列與還原操作選單另有帶引號的 raw `"Copy"`／`"Copied"` literal；若定點畫面仍顯示 Copy，應加入 quoted exact key，並檢查回覆／使用者兩個 renderer 的未點擊與已點擊狀態。
- 回覆評價送出後的成功提示使用 `u` 條件 expression；一般回饋與重要回饋的兩個英文分支都要翻譯，並以截圖中的短訊息與重要回饋長訊息分別驗證。
- 選取文字的 Quote 浮動按鈕有保留 g／f 快捷鍵參數的兩個 JSX 變體；只替換 Quote 為「引用」，保留快捷鍵內容（如 Ctrl+L）。
- 對話側欄釘選按鈕的 Tooltip 使用 `content:Na?"Unpin":"Pin"`，按鈕無障礙標籤使用 `aria-label:Na?"Unpin conversation":"Pin conversation"`；兩個固定來源都要翻譯，不能只翻選單中的 `label`。
- 模型用量的 `Weekly Limit Remaining`／`Five Hour Limit Remaining` 是後端動態 `displayName`，至少由 quota label 與 quota bucket 兩個 renderer 顯示；兩個來源都要補翻。簡中若 generic exact key 會改寫 map key，lookup key 要使用 JavaScript Unicode escape，讓執行時仍能以英文 displayName 命中中文結果。
- 模型用量的群組標題 `Gemini Models`／`Claude and GPT models` 也有兩個來源：群組標題 renderer 與額度卡片 badge renderer。兩者都要保留英文 lookup key 並映射繁中「Gemini 模型／Claude 與 GPT 模型」、簡中「Gemini 模型／Claude 与 GPT 模型」，不能只補其中一個畫面。
- 模型用量的 `Models within this group: ${models}` 來自後端動態 `description`，2.12.2 在 tooltip 與空群組說明各自渲染；要在 `Dxb` 周邊翻譯完整動態說明並保留 `${models}`。Token 分解類別可能回傳大小寫不同的 `Mcp Tools`，要在 `r.label` 的動態 map 同時處理它與 `MCP Tools`。
- `Models & Usage` 的頁面標題與設定側欄導覽要使用一致詞彙：繁中「模型與使用量」、簡中「模型与使用量」；`View Usage`、`Usage`、Token usage 與動態額度名稱可依按鈕或額度上下文保留「用量／配額」等不同譯法。
- 應用程式設定頁的 `App / General` 分區包含「防止電腦睡眠／保留在選單列」與自動更新開關。`Vwb` 會以 `sectionTitle` 精確比對設定 map 的 `sections[].title`；兩者若被翻成不同值，整個分區會消失。檢查時要比對所有 producer/consumer，並用 validator 確認 `title:\"General\"` 與 `sectionTitle:\"General\"` 的翻譯結果一致。
- `Keep In Menu Bar` 的 label／description 完整片段在 2.12.2 minified bundle 中是同一行；若語言包 key 把 `label` 後的逗號寫成 `,\\n`，即使翻譯內容正確也不會命中。遇到「詞條已存在但畫面仍是英文」，先用 `source.includes(entry.key)` 比對乾淨來源的實際空白，再做雙語建構驗證。
- 聊天輸入框的 `Send message Enter` 來自 `return\`Send message ${Q}\``，不是只使用 `"Send message"` 的 fixed string；要保留 `${Q}` 快捷鍵變數。執行任務時若看到 `Run Task`，先確認它是 `tV` 的動態 prefix/content、generic `stepRenderInfo.titlePrefix`，還是摘要 `titlePrefix`；用 formatter 的精確映射翻譯 `Run Task`／`Running Task`／`Ran Task`／`Task`，不要翻譯動態 task name、command line 或 path。完成摘要的動態格式至少要覆蓋 `Run ${task} finished` 與 `Download ${task} finished`，只翻穩定動詞與 `finished`，保留 task name、command line 或 path。`Searching web`／`Searched web` 以及 `Searching ${target}`／`Searched ${target}` 可能由 `titlePrefix`、`titleParts` 或活動內容組合，必須翻譯穩定狀態詞並保留 `${target}`，不能只翻 `Searching`／`Searched`。輸入框上方的 `1 task running` 來自 `qGb` 的數量模板；要用數量正則處理 `task/tasks`、`subagent(s)`、`subagents/tasks` 與 `running`，保留動態數字並同步驗證雙語輸出。
- 訊息還原流程的 `Undo changes up to this point` 是獨立 Tooltip；`Confirm Undo` 視窗另有 `This undo action will not make any code changes.`、`Confirming this undo action will make the following changes:` 與原始 `Confirm` 按鈕，必須分別加入字典並檢查按下還原後的視窗，不可只翻標題。
- `Queued Messages` 卡片的說明由策略動態選出 `Sends on next turn` 或 `Sends after agent finishes working`；標題翻譯不會涵蓋這兩個 renderer 分支，兩種狀態都要驗證。
- 右側成品空白狀態的來源是 `emptyText:"No artifacts generated"`；要翻譯 default prop，並保留程序名稱、PID、工具名稱與路徑等動態技術內容。
- 分支變更模式的 `All changes since ${l}` 與 `All changes since the branch point` 是兩個獨立來源，必須分別翻譯並保留 `${l}`／分支資訊。
- Commit／Push 的 Tooltip 與停用原因也要完整處理：`Commit staged changes`、`Stage and commit all changes`、動態提交數、`Publish ${a.currentRef} to origin`、`No commits to push`；只翻 `Push` label 不足以涵蓋畫面。
- npm run check 會驗證 wGb 對照表與固定 Allow 標題模板仍包含原始識別文字與目標語言片段；若來源 expression 改版，先更新規則與驗證器，再建構兩種語言。
- Listed 0 tasks 應以活動 formatter 的數量模式翻譯，並一併處理 No active tasks. 與 Found subagents；權限標題的 Allow 翻譯值要保留後置空格，動態 actionDescription、指令、路徑與工具名稱則不改動。
- 右側技能清單、模型用量、設定頁與原生選單；原生內容不是只靠 web bundle 字典完成。

### 完整性盤點與雙語對等檢查

這次 2.12.0 的後續審查顯示，已補上的少數字串不能代表整個介面完成。每次都要對兩個語言包各自從乾淨來源建構，再逐類檢查：

| 類別 | 必查來源或畫面文字 |
|---|---|
| 登入／帳戶 | `Continue with Google`、`Continue with Google Cloud`、`Success, Continuing...`、`Awaiting Authentication...` |
| 執行摘要／狀態 | `Skills Used`、`Worked for ...`、`Analyzed`、`Searched`、`Working..`、`Working...`、`Thinking...`、`Thought Process`、`Thought for ...s`、`const Sib` 單複數表 |
| 模型選擇器 | `Fast`、`Limited time`、`tagTitle`、`tagDescription`；徽章與 Tooltip 分開驗證 |
| 檔案／面板 | `Preview`、`Raw`、`Open File`、`New Terminal`、`Show in File Explorer`、`Open in new tab` |
| 搜尋／載入／空狀態 | 搜尋 placeholder、`Loading ...`、`Waiting for your input`、`No Results`、`No results found` |
| 設定／權限／回饋 | 設定頁標題與說明、`Access rules`、檔案／終端機／MCP 權限、MCP 工具卡片啟用數量與 Tooltip、Remote Control 長說明與錯誤訊息 |
| 工作區／群組／操作 | `Select workspace...`、`New Group`、`Rename Group`、`Group name`、複製／刪除／儲存／取消的文字與 Tooltip |

每個項目都要檢查固定字串、動態 expression 的所有分支、`title`、`aria-label`、placeholder、Tooltip、錯誤及空狀態。簡中要另外做繁中用字檢查；品牌、模型、API、命令與路徑可列入白名單，不要誤改。`tagTitle === "Limited time"` 等比較值、enum、物件 key、CSS／程式識別字、註解與原生字典 key 的英文命中不算畫面遺漏，但任何可到達畫面的英文動態回傳值都算遺漏。

本次審查已確認 `3 folders`、`No (tell the agent what to do instead)`、`Working..`／`Working...` 與 `Thinking...` 有雙語規則；未來不可只驗證這幾項就宣稱完成。`zh-CN.json` 必須獨立補齊與驗收，不能以單張畫面或建構成功推論簡中完整；先執行 `npm run check`，讓 `scripts/validate_locales.js` 比對繁中與簡中 exact key coverage。

### 本輪 2.12.0 補翻紀錄

- `zh-CN` 補齊設定、帳戶、模型用量與混入繁中用字；`Inherit General` 統一為「继承一般设置」。
- `zh-TW` 與 `zh-CN` 都補上搜尋結果計數的動態 renderer，涵蓋搜尋、檔案搜尋與 Moma 結果；分別輸出「項結果」與「个结果」，不能只依賴 `const Sib` 的摘要單位表。
- 保留 `qUb("...");` 受保護第三方區段的原始程式碼。若靜態掃描仍在該區段看到 `result/results`，先確認是否為可見 UI，再找安全的外層處理點，不要解除保護區段。
- 本輪採不部署方式完成 `npm run check`、`node scripts/patcher.js --lang zh-TW` 與 `node scripts/patcher.js --lang zh-CN`；前端及 Electron 語法檢查與 `app.asar.patched` 打包均通過。未重啟或替換正在執行的應用程式，畫面人工驗收仍須標記為 `NOT VERIFIED`。
- 原先 coverage audit 顯示 `zh-TW` 有 3,022 個 unique `exact_properties`，而 `zh-CN` 只有部分既有詞條；這是簡中仍露出大量英文的直接原因。經後續補翻與動態規則增加後，`npm run check` 目前顯示 `zh-TW` 3,052 個、`zh-CN` 3,206 個 unique exact key，簡中已覆蓋全部繁中 key，並保留簡中專用的 2.12.0／2.12.2 規則。
- 2.12.2 已加入正式支援清單；本輪實際以 2.12.2 `app.asar` 完成繁中與簡中不部署建構、Electron 語法檢查與 `app.asar.patched` 打包。安裝檔替換、應用程式重啟與桌面畫面驗收尚未執行，這些項目仍為 `NOT VERIFIED`。
- 同步工具的兩個必要安全條件：key set 使用 `StringComparer.Ordinal`，避免 PowerShell 不分大小寫而漏掉大小寫不同的詞條；`LCMapStringEx` 取值使用 `StringBuilder.ToString(0, $length)`，不可使用完整 buffer，否則短字串後會殘留前一次轉換內容並破壞 JavaScript。
- `npm run check` 現在包含 `scripts/validate_locales.js`；它會解析兩個 JSON、檢查簡中覆蓋全部繁中 unique key、拒絕簡中重複 key，並攔截疑似 `StringBuilder`／轉換器殘留。之後繁中新增任何詞條，都必須先同步簡中再建構。

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

若版本不在目前支援清單，patcher 會提示版本不符並繼續建構／套用流程；不要把它標成已支援，回報時必須列為 `NOT VERIFIED`。建立更新分支或至少保留現有 commit，對照新舊來源的 anchor；只有使用者明確要求部署時才套用。`--allow-version-mismatch` 可作為非目標版本測試的明確標記，但不會提升驗證等級。不要把舊版本的完整解包目錄、舊 scratch 路徑或舊 bundle 複製進公開專案。

確認相容後，才同步更新：

```text
project.json                 -> supportedApplicationVersions
scripts/patcher.js           -> SUPPORTED_APP_VERSIONS
README.md                    -> 支援版本與限制
skills/.../SKILL.md          -> 不變條件（若維護規則改變）
skills/.../references/...    -> 基線、陷阱與驗證結果
```

目前 patcher 以明確的 `SUPPORTED_APP_VERSIONS` 清單支援 2.12.0 與 2.12.2；新增版本時必須同步更新 `project.json`、README、patcher、驗證器與本 Runbook，並重新做兩種語言建構。不要在 patcher 裡累積無法判斷的全域替換條件。

### Phase 2：取得乾淨來源並比對結構

前端來源按 `scripts/patcher.js` 的解析順序處理：明確指定來源優先，其次是使用者的 `.gemini\\antigravity\\web_bundle`、`web_bundle.source`，最後才是安裝目錄現有 bundle。最後一項必須視為可能已漢化的來源並在結果中警告。

原生來源優先使用 `app.asar.backup`。如果它引用 `.unpacked` 而旁邊沒有該資料夾，只有在目前 archive 與備份 archive 版本一致時，才可用同版本的目前 `.unpacked` 建立備份對應資料。若版本不一致，停止並要求乾淨來源。

比對新版本時，搜尋要小範圍、可回讀：

```text
rg -n -F "Preview" <clean-web-bundle>\\main.js
rg -n -F "Limited time" <clean-web-bundle>\\main.js
rg -n -F "Skills Used" <clean-web-bundle>\\main.js
rg -n "tagTitle|tagDescription|Worked for|Thinking time|Working|Compacting|Executing task|const Sib|writeInLabel|writeInPlaceholder" <clean-web-bundle>\\main.js
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

若繁中詞條已先完成，而簡中出現大量缺口，可在確認來源與版本一致後先執行一次機械化同步：

```text
pwsh -NoProfile -File scripts/sync_zh_cn_coverage.ps1
```

此腳本只合併缺少的 `exact_properties` key 並將值轉為簡中；它不會替 AI 判斷上下文、動態文字或專有名詞，因此執行後仍必須檢查簡中用語、執行 `npm run check`，再建構兩種語言。不要用已被污染的 bundle 當同步來源，也不要把同步數量當成人工驗收結果。

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
| 應用程式版本不符 | patcher 偵測到的版本不是目前支援基線 | 保留版本警告並繼續流程；將新版本相容性標為 `NOT VERIFIED`，不要把建構／部署成功當成正式支援 |
| Tooltip 仍是英文 | 只處理了 badge 或標題，沒有處理 description | 尋找 `tagTitle` 與 `tagDescription` 兩個來源並分別驗證 |
| `Fast` 徽章仍顯示英文 | 2.12.0 的 `var zW` renderer 分開輸出 `tagTitle` 與 `tagDescription`，只翻 `Limited time` 會遺漏 `Fast` | 同時補翻徽章與 Tooltip 描述的 `Fast` 分支，並建構兩種語言驗證 |
| 應用程式頁面的睡眠／選單列／自動更新開關消失 | `Vwb` 用 `sectionTitle` 精確查找設定 map；翻譯後它與 `sections[].title` 不一致，查找回傳空值 | 讓同一個來源分區的 `title` 與 `sectionTitle` 使用完全相同的目標語言值，並在 `scripts/validate_locales.js` 加入一致性檢查 |
| `Keep In Menu Bar` 標籤或完整說明仍是英文 | exact key 的換行／空白與 minified bundle 不一致，整條 `label`＋`description` 沒有命中 | 從乾淨來源重新複製完整片段（保留實際空白），驗證產出 bundle 同時包含目標語言 label 與 description |
| `Skills Used` 仍顯示英文 | 區塊標題由動態 `J1` expression 產生；簡中 generic replacement 可能把英文比較值改成目標語言 | 保留英文 runtime lookup key（必要時使用 JavaScript Unicode escape），只翻輸出值為「使用的技能／使用的技能」 |
| 摘要仍顯示 `3 folders` 等英文單位 | 類別單複數由 `const Sib` 對照表即時產生，沒有命中外層摘要模板 | 以完整 `const Sib` 片段加入 `exact_properties`，並檢查檔案、資料夾、搜尋與指令等類別 |
| 權限選項仍顯示 `No (tell the agent what to do instead)` | 自訂回覆的 label／placeholder 不經一般選項文字翻譯函式 | 同時定位並翻譯 `writeInLabel` 與 `writeInPlaceholder`，再驗證組合後的畫面文案 |
| MCP 卡片仍顯示 `6 tools enabled` 或 `Click to disable tool` | 工具數量是 `E`／`v.tools.length` 動態 expression，Tooltip 則是獨立固定字串；只翻固定數字或伺服器標題不會命中 | 重新定位 `B?`${E} tool...enabled`:`${v.tools.length} tool...disabled`` 與兩個 Click Tooltip，保留動態數字並用兩種語言建構驗證 |
| MCP 執行步驟仍顯示 `MCP Tool:` | 標題由固定 prefix 與動態伺服器／工具名稱組合 | 只翻 `prefix:"MCP Tool:"`，保留 `serverName`／`toolCall?.name`，再建構兩種語言 |
| 回覆評價 Tooltip 仍顯示 `Good response`／`Bad response` | 同一固定英文同時作為按鈕 `aria-label` 與 Tooltip 內容 | 翻譯完整 quoted key，並確認兩個出現位置都替換 |
| 回覆列複製按鈕仍顯示 `Copy`／`Copied` | 複製按鈕把兩個狀態放在 `J?"Copied":"Copy"` 條件 expression，與其他複製選單來源不同 | 翻譯條件 expression 的兩個分支，並確認未點擊與已點擊狀態 |
| 點擊回覆評價後仍顯示 `Thanks for your feedback!` | 成功提示由 `u` 條件 expression 在一般／重要回饋兩個分支間切換 | 翻譯完整 expression 並分別驗證短訊息與重要回饋長訊息 |
| 選取文字浮動按鈕仍顯示 `Quote` | Quote 文字位於帶 g 或 f 快捷鍵內容的 JSX 變體，既有 `title:"Quote"` 詞條不會命中 | 翻譯兩個 Quote JSX 變體，保留 g／f 與快捷鍵值 |
| 對話釘選 Tooltip 仍顯示 `Unpin`／`Pin` | 可見 Tooltip 使用 `content:Na?"Unpin":"Pin"`，而選單／工具列已有其他獨立來源 | 翻譯 `content` expression，並一併覆蓋 `aria-label` 的對話版本 |
| 模型用量仍顯示 `Weekly Limit Remaining`／`Five Hour Limit Remaining` | `displayName` 由後端傳入，quota label 與 quota bucket 各有 renderer；簡中 generic replacement 也可能改寫 map lookup key | 同時補翻兩個 renderer；簡中 map key 使用 JS Unicode escape，保留執行時英文 lookup key |
| 右側成品區仍顯示 `No artifacts generated` | 空白狀態來自 `emptyText` default prop，不是「工作產出」標題 | 翻譯 `emptyText:"No artifacts generated"`；不要改動程序名稱、PID、工具名稱或路徑 |
| 分支變更仍顯示 `All changes since ...` | 有帶 `${l}` 的 template 與沒有 merge base 的 branch-point fallback 兩個來源 | 分別翻譯兩個 expression，保留 `${l}` 與分支資訊 |
| Commit／Push Tooltip 或停用原因仍是英文 | Tooltip 含條件分支與動態提交數，`No commits to push` 是另一個 disabled reason | 完整翻譯 staged／all changes、動態 Push／Publish、`No commits to push`，並保留按鈕動態值 |
| 載入狀態仍顯示 `Working..` 或 `Working...` | `Working` 可能是動畫載入 expression 的 fallback，也可能來自狀態選擇器／子代理摘要；全域短詞替換容易誤傷 `Working directory` | 分別定位 `Compacting`／`Working` 載入 expression、`Executing task` 狀態 expression 與完整 `Working...` 字串，再逐一建構驗證 |
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
