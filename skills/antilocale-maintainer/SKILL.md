---
name: antilocale-maintainer
description: Maintain and extend AntiLocale Toolkit localization for Antigravity Desktop, especially after an application version update or when a translated UI string is missing.
---

# AntiLocale Toolkit AI 版本維護 Skill

這個 Skill 用於維護本專案的 Antigravity Desktop 多語言部署工具。它適用於新增語言、補翻譯、修補版本更新後的介面、檢查部署失敗，以及確認語言切換仍可安全還原。

## 目標與執行契約

目標不是只找出英文，而是讓 AI 能完成「盤點來源 → 判斷版本 → 更新字典與 patcher → 建構驗證 →（獲得授權後）部署 → 回報證據」的完整閉環。

- 先讀取本 Skill 與 [版本更新維護流程](references/version-update-runbook.md)，再開始修改；不要只依賴歷史對話或截圖記憶。
- 先檢查 Git 分支、HEAD、工作樹與實際安裝檔；保留既有使用者修改，不執行 `reset --hard`、`clean` 或無關檔案刪除。
- 「建構成功」、「部署成功」、「應用程式成功啟動」與「畫面人工驗收」是四種不同證據，回報時必須分開。
- 使用者只要求維護或建構時，不要自行套用到正在使用的應用程式；只有明確要求部署時才關閉程序、替換檔案與自動重啟。
- 版本、來源或備份狀態不明時停止在可恢復狀態，指出缺少的證據與下一個安全動作；不要用舊的 scratch 目錄猜測新版本。

## 重要不變條件

- 目前支援的應用程式版本是 **2.12.0**。版本資訊必須同步檢查 `project.json`、`README.md` 與 `scripts/patcher.js`；字典檔內的 `version` 是字典自身資料，不可誤當成應用程式版本。
- 不把 Antigravity 的 `app.asar`、完整 `main.js`、解包目錄或使用者專屬來源檔提交到公開 Repository。工具只提交部署程式、語言包、維護 Skill 與必要文件。
- 語言包放在 `locales/`，部署程式應使用語言代碼載入它們；不要為每種語言複製一份整套 patcher。
- 來源必須來自使用者目前安裝的應用程式或明確指定的乾淨來源。不要回退到舊的臨時工作目錄，也不要把上一個語言的已修改 bundle 當成乾淨來源而默默覆蓋。
- 前端 `main.js` 中 `qUb("...");` 包住的區段是受保護的第三方程式碼；只在非受保護區段套用字典，以免破壞 JavaScript。
- 套用前保留 `app.asar.backup` 與 `web_bundle.backup`。不要使用 Git reset、廣泛清理或刪除使用者備份來「修復」部署問題。
- 部署前記錄 Antigravity 是否正在執行；只有原本已開啟時，部署或還原完成後才自動重新啟動，不要無條件啟動使用者未開啟的軟體。

## 維護流程

1. 先確認安裝目錄、目前 `app.asar`、備份 archive、`.unpacked` 目錄與前端來源，並讀取實際 `package.json` 版本。
2. 若應用程式不是 2.12.0，先停止並說明不相容；只有使用者明確要求測試其他版本時，才使用 `--allow-version-mismatch`。
3. 將新文字加入相應語言包。固定文字放 `exact_properties`；描述或完整片段放 `descriptions`；動態 JSX/React 文字要修補其產生值與 Tooltip，不只修畫面上第一個出現位置。
4. 先做不部署的建構：`npm run check`，再分別執行 `node scripts/patcher.js --lang zh-TW` 與 `node scripts/patcher.js --lang zh-CN`。確認前端與 Electron 原生腳本語法都通過。
5. 只有在使用者要求實際套用時，才執行 `AntiLocaleToolkit.bat` 或 `node scripts/patcher.js --apply --lang <language>`；這會關閉 Antigravity 及 language server，並替換安裝檔。
6. 建構成功不等於桌面流程已驗證。若能啟動應用程式，另外檢查實際選單、模型選擇器、技能區塊、回饋頁與還原流程；無法啟動時要明確標記為未驗證。

## 這次版本的實際經驗

- `Preview`、`Raw`、`Skills Used`、`Fast`、`Limited time`、`Open File`、`New Terminal` 等文字分散在固定字串、動態標題與 Tooltip，不能只搜尋一次畫面文字。
- `New Preview` 在 2.12.0 的目前來源使用 `z.createElement("span",null,"New Preview")`，舊版／另一個 bundle 變體可能使用 `y`；若只加入其中一個精確 expression，另一個語言包或目前畫面仍可能遺漏。遇到 minifier 變數變化時，應從乾淨來源重新定位，不要改成無上下文的全域短詞替換。
- `Limited time` 至少有模型徽章的 `tagTitle` 與資訊圖示 Tooltip 的 `tagDescription` 兩個來源；只翻譯徽章會留下 Tooltip 英文。`Fast` 也有相同的徽章與 Tooltip 關係。
- `Skills Used` 是動態區塊標題；更新字典時要定位實際產生標題的 expression，而不是只加入一般固定字串。
- `Worked for 1m`、`Thinking time 2s`、`Analyzed ...` 等執行紀錄由回應元件即時產生，必須以動態來源或模板處理；`2s` 等時間單位不能只依賴固定畫面搜尋。
- `Working..` 的載入提示是 `Working` 基本文字加上獨立的動畫點元件，不是完整的固定字串；另有狀態選擇器與子代理摘要使用 `Working...`。要定位完整 expression 後翻譯，不能對 `Working` 做全域替換，否則會誤傷 `Working directory` 等內容。
- `Thinking...` 是另一個獨立的脈動載入提示；它和 `Thinking` 狀態、`Thinking time 2s` 時間文字來源不同，三者都要分別檢查。
- 執行摘要中的 `folders` 等項目不是直接輸出的固定字串，而是由 `const Sib` 的單複數對照表產生；若只翻譯摘要外層模板，仍會留下 `3 folders`。更新時要檢查整張對照表，並確認檔案、資料夾、搜尋、指令等類別都能輸出目標語言。
- 搜尋結果數量另有多個動態 JSX renderer，會直接組合 `result/results`（例如搜尋結果、檔案結果與 Moma 結果）；不能只翻 `const Sib` 或單一 `f===1` 分支。要以完整 expression 處理 `f`、`v`、`p`、`m` 等計數，並在 `zh-TW` 使用「項結果」、`zh-CN` 使用「个结果」。位於 `qUb("...");` 受保護第三方區段的 `result/results` 命中不可為了翻譯而解除保護，應先確認它是否真的可見，再尋找安全的外層處理點。
- 權限確認的自訂回覆選項由 `writeInLabel` 與 `writeInPlaceholder` 組合，和一般 `AskQuestionOption` 的 `text` 不是同一個來源；補翻 `No (tell the agent what to do instead)` 時要同時檢查這兩個欄位。
- 靜態檔案檢查只能證明字典與語法正確，不能證明 Electron 啟動、程序關閉、檔案鎖定解除或畫面實際顯示正確。報告結果時分開描述這些證據層級。

## 完整性盤點與雙語對等門檻

「已漢化」必須對 `zh-TW` 與 `zh-CN` 分別成立；一種語言建構成功或某個畫面已翻譯，不能推論另一種語言也完成。每次版本更新、補翻或回報完成前，都要從乾淨來源各建構一次，並逐項檢查以下 UI 類別：

- 登入與帳戶：`Continue with Google`、`Continue with Google Cloud`、`Success, Continuing...`、`Awaiting Authentication...`。
- 執行摘要與狀態：`Skills Used`、`Worked for ...`、`Analyzed`、`Searched`、`Working..`、`Working...`、`Thinking...`、`Thought Process`、`Thought for ...s`，以及 `const Sib` 產生的檔案／資料夾／搜尋／指令數量。
- 模型選擇器：`Fast`、`Limited time` 及其 `tagDescription` Tooltip；徽章和 Tooltip 必須分開驗證。
- 檔案與面板：`Preview`、`Raw`、`Open File`、`New Terminal`、`Show in File Explorer`、`Open in new tab`。
- 搜尋、載入與空狀態：搜尋框 placeholder、`Loading ...`、`Waiting for your input`、`No Results`、`No results found`。
- 設定、權限與回饋：設定頁標題／說明、`Access rules`、檔案／終端機／MCP 權限、Remote Control 回饋長說明與錯誤訊息。
- 工作區、群組與操作：`Select workspace...`、`New Group`、`Rename Group`、`Group name`、複製／刪除／儲存／取消等按鈕及 Tooltip。

每個候選都要確認固定字串、動態 expression 的所有分支，以及 `title`、`aria-label`、placeholder、Tooltip、錯誤／空狀態；只翻畫面上第一次看到的文字不算完成。簡中還要檢查輸出不可混入繁中用字（例如「執行、權限、錯誤、目錄」），但保留品牌、模型、API、命令與路徑等專有名詞。

靜態掃描命中英文不等於畫面遺漏：`tagTitle === "Limited time"` 這類比較值、enum、物件 key、CSS／程式識別字、註解與原生字典 key 可以保留；只有能到達可見文字、`title`、`aria-label`、placeholder 或 Tooltip 的值才列為未翻譯。反過來，若畫面仍顯示英文，即使它是動態回傳值，也必須追到產生來源修補。

本次 2.12.0 盤點確認 `3 folders`、自訂 `No (tell the agent what to do instead)`、`Working..`／`Working...` 與 `Thinking...` 已有雙語規則；仍未完成的候選不能從清單中直接忽略，必須在下一次補翻後重新建構驗證。簡中完整性要以詞條 key 對等檢查為準，不可只看某幾張畫面或建構是否成功。

本輪 2.12.0 補翻已同步處理兩種語言的搜尋結果計數（包含畫面中的 `14 results`／`1 result` 類型）、檔案搜尋與 Moma 結果 renderer；簡中另外清理設定、帳戶、模型用量與混入的繁中用字，並統一將 `Inherit General` 顯示為「继承一般设置」。同一輪也重新確認 `Preview`／`Raw`／`New Preview`、`Open File`／`New Terminal`、模型徽章 Tooltip、執行時間秒數與動態資料夾數量。這些變更完成後，兩個語言包都必須重新做不部署建構；原生 Electron 與受保護第三方程式碼的靜態命中仍要依可見性判斷，不能把靜態掃描結果直接當成畫面驗收。

本輪另完成繁中到簡中的覆蓋率修復：原先 `zh-TW` 有 3,022 個 unique `exact_properties`，簡中只有部分詞條；現在 `zh-CN` 有 3,177 個 unique 詞條，已覆蓋全部 3,022 個繁中 key，並保留簡中專用的 2.12.0 動態規則。`npm run check` 會執行 `scripts/validate_locales.js`，只要繁中新增 key 而簡中未同步，檢查就會失敗。

`scripts/sync_zh_cn_coverage.ps1` 只作為繁中詞條同步的機械化起點，執行後仍要人工檢查簡中用語與動態 expression。它必須使用大小寫敏感的 key set；PowerShell 預設 hashtable 不分大小寫，會漏掉 `New Conversation`／`New conversation` 這類不同 key。Windows `LCMapStringEx` 轉換也必須使用回傳長度 `ToString(0, $length)`，否則 `StringBuilder` 舊內容會黏到翻譯後的 JavaScript，並由 `node --check` 攔截。

進行版本更新或較大的維護時，請讀取 [版本更新維護流程](references/version-update-runbook.md)，其中記錄來源選擇、字典定位、驗證矩陣與這次 2.12.0 維護的具體陷阱。

## AI 交付格式

完成維護後，至少回報：實際偵測到的應用程式版本、修改的語言包／程式檔、執行過的檢查、是否實際部署、是否啟動應用程式，以及仍標記為 `NOT VERIFIED` 的項目。若公開 Repository 有變更，再列出 commit 與遠端分支；沒有得到發布授權時不要自行 push。
