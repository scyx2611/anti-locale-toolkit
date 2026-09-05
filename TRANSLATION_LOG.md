# AntiLocale Toolkit 翻譯變更台帳

這份台帳是 AntiLocale Toolkit 的可重用翻譯索引。它記錄「乾淨 Antigravity bundle 的來源 anchor」與「語言包實際輸出」之間的關係，讓 Antigravity 更新後可以先重用既有定位，再處理真正改版的來源。

## 維護規則

1. 補翻或調整前，先搜尋本台帳的來源 anchor、動態規則與版本範圍。
2. 若台帳已有相同來源，優先確認新 bundle 是否仍命中；不要重新從整個 `main.js` 掃描猜測。
3. 每次修改 `locales/`、`scripts/patcher.js` 或翻譯驗證器，都要在同一個變更中新增或更新台帳紀錄。
4. 來源 anchor 必須抄自乾淨來源；不要把已翻譯的輸出當成下一次的來源 key。
5. 動態文字必須記錄要保留的變數、任務名稱、命令、路徑或數字；固定文字則記錄 exact key 或完整 expression。
6. 尚未提交的紀錄標示為「未提交」；提交後補上 commit，實際部署與桌面畫面驗收則另外標記，不能混為建構成功。
7. 新版本若使 anchor 移動，保留舊紀錄，新增「舊 anchor → 新 anchor」的遷移紀錄；不要刪除歷史定位。

## 紀錄格式

新增紀錄至少包含：日期、Antigravity 版本、狀態、來源 anchor／expression、固定或動態性質、zh-TW 與 zh-CN 輸出、修改檔案、驗證命令、部署／畫面驗收狀態。

可直接複製以下範本：

```text
### YYYY-MM-DD | Antigravity X.Y.Z | 未提交／<commit>
- 範圍：
- 來源 anchor：
- 類型：固定／動態；需保留的變數：
- zh-TW：
- zh-CN：
- 修改檔案：
- 驗證：
- 部署與畫面驗收：未部署／已部署；NOT VERIFIED 項目：
```

## 可重用來源索引

以下是目前 2.12.2 bundle 中最容易被重新尋找的動態來源。細節規則仍以 `skills/antilocale-maintainer/SKILL.md` 與版本更新 runbook 為準。

| ID | 乾淨來源 anchor／模式 | 類型與保留內容 | zh-TW | zh-CN |
| --- | --- | --- | --- | --- |
| ACT-001 | `function tV({prefix:a,content:b,progressMessage:c,customTitle:e}){if(e)return`；`e=typeof b=="string"` | 活動標題 formatter；保留 `content`、命令、路徑與動態說明 | 由 `zhTwActivityTitle` 處理 | 由 `zhCnActivityTitle` 處理 |
| ACT-002 | `a.match(/^(Run|Download) (.+) finished$/)` | 動態完成狀態；保留 `${task}` 原文 | `執行／下載 ${task} 已完成` | `运行／下载 ${task} 已完成` |
| ACT-003 | activity map 中的 `Run Task`／`Running Task`／`Ran Task`／`Task` | 動態任務前綴；保留後面的任務名稱 | `執行任務`／`執行任務中`／`已執行任務`／`任務` | `运行任务`／`正在运行任务`／`已运行任务`／`任务` |
| ACT-004 | activity map 中的 `Canceled`／`Cancelled` | 動態取消前綴；保留後面的任務名稱、命令或路徑 | `已取消` | `已取消` |
| ACT-005 | `Searching web`、`Searched web`、`Searching (.+)`、`Searched (.+)` | 搜尋狀態；保留 `${target}` | `搜尋網路`、`已搜尋網路`、`搜尋中 ${target}`、`已搜尋 ${target}` | `搜索网络`、`已搜索网络`、`搜索中 ${target}`、`已搜索 ${target}` |
| RUN-001 | `replace(/(\\d+) tasks? running/g, ...)` 與 subagent 變體 | 數量與單複數動態；保留 `${count}` | `${count} 個任務執行中`／子代理變體 | `${count} 个任务运行中`／子代理變體 |
| CHAT-001 | `"Thinking"`、`"Thinking..."` | 短狀態與動畫狀態是兩個來源，不能只補其中一個 | `思考中`／`思考中...` | `思考中`／`思考中...` |
| CHAT-002 | `"Proceeded with"`、`"Auto-proceeded with"` | 自動繼續處理狀態 | `已繼續處理`／`已自動繼續處理` | `已继续处理`／`已自动继续处理` |
| MODEL-001 | `var zW=({option:a})=>{var b=xB();return` | 模型 badge 與 Tooltip 的 `tagTitle`／`tagDescription` 必須同步 | `快速`、`限時提供` | `快速`、`限时提供` |
| MODEL-002 | `var J1=({title:a,titleSuffix:b,count:c,badgeCount:e,actions:f,children:g` | 動態 `Skills Used` 標題；保留英文 runtime lookup key | `使用的技能` | `使用的技能` |
| SETTINGS-001 | `title:"General"` 與 `sectionTitle:"General"` | 設定分區查找值必須使用同一目標語言，否則開關整區消失 | 同值翻譯 | 同值翻譯 |
| QUOTA-001 | quota label／bucket renderer 與 `Weekly Limit Remaining`／`Five Hour Limit Remaining` | 後端 `displayName` 動態 lookup；保留英文查找 key | `每週剩餘額度`／`5 小時剩餘額度` | `每周剩余额度`／`5 小时剩余额度` |

## 本輪未提交紀錄

### 2026-09-06 | Antigravity 2.12.2 | 未提交

- 範圍：補齊活動狀態與自動繼續狀態，並修正取消任務狀態。
- 來源 anchor：
  - `"Thinking"`：與既有 `"Thinking..."` 分開處理。
  - `"Proceeded with"`、`"Auto-proceeded with"`：固定狀態文字。
  - activity formatter 的 `"Run Task":`：在 `tV` helper 注入後，以共同 anchor 加入 `Canceled`／`Cancelled` map，避免全域替換破壞錯誤處理或取消 token。
- 類型：前兩項為固定狀態；`Canceled`／`Cancelled` 為動態前綴，後面的任務名稱、命令與路徑原樣保留。
- zh-TW：`思考中`、`已繼續處理`、`已自動繼續處理`、`已取消`。
- zh-CN：`思考中`、`已继续处理`、`已自动继续处理`、`已取消`。
- 修改檔案：`locales/zh-TW.json`、`locales/zh-CN.json`、`scripts/validate_locales.js`。
- 驗證：`npm run check`；`node scripts/patcher.js --lang zh-TW`；`node scripts/patcher.js --lang zh-CN`；兩種輸出均通過前端／Electron 語法檢查與 `app.asar.patched` 打包，產出 bundle 確認包含 `"Canceled":"已取消"` 與 `"Cancelled":"已取消"`。
- 部署與畫面驗收：未部署；桌面實際畫面仍為 `NOT VERIFIED`。

## 已提交歷史索引

這些 commit 是台帳建立前的既有維護紀錄；新的變更不可只依賴 commit message，仍要依上方格式留下來源定位。

| 日期 | Commit | 範圍 |
| --- | --- | --- |
| 2026-09-06 | `ddf22bc` | Copy Command／Copied tooltip |
| 2026-09-05 | `dfeee45` | active goal 狀態 |
| 2026-09-05 | `83f0a8a` | Timed／動態活動完成狀態 |
| 2026-09-05 | `ccd5d99` | undo、copy 與確認視窗 |
| 2026-09-05 | `5749f90` | 動態活動與設定頁 |
| 2026-09-05 | `96ae6d9` | Antigravity 2.12.2 基線 |
| 2026-09-04 | `0660e2c` | Fast／Skills Used |
| 2026-09-04 | `8d8300f` | feedback confirmation |
| 2026-09-04 | `d8dc940` | 簡體中文 coverage |
| 2026-09-04 | `8ddc8e2` | Thinking 狀態 |
| 2026-09-04 | `c1f5658` | Working 狀態 |
| 2026-09-04 | `94bfcb7` | 動態資料夾與權限 |
