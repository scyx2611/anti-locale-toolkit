# Antigravity Chinese Toolkit

Antigravity Desktop 的多語言漢化部署工具。以語言包為核心，讓你可以選擇語言後一鍵套用，並保留一鍵還原與狀態檢查。

技術套件／Repository identifier 仍保留 `anti-locale-toolkit`，顯示專案名稱統一為 **Antigravity Chinese Toolkit**。

## 支援版本

**支援的應用程式版本：2.12.0、2.12.2**

工具會在部署前檢查 Antigravity 的版本；若偵測到不在上述清單，會顯示「版本不符合目前支援範圍」警告後繼續建構／套用，但該版本相容性仍是未驗證。若要明確標記為非目標版本測試，可加上 `--allow-version-mismatch`。

## 支援平台

目前僅支援 Windows。

macOS 尚未適配，也未完成 macOS 的建構、套用、還原與程序重啟驗證；請勿在 macOS 執行 Windows `.bat` 入口。程式目前依賴 `Antigravity.exe`、`taskkill`、Windows 路徑與程序管理，因此 macOS 支援狀態為 `NOT VERIFIED`。

## 一鍵使用

1. 確認已安裝 Node.js 20 或更新版本。
2. 依需求雙擊以下其中一個入口：

- `AntiLocaleToolkit-zh_TW.bat`：檢查前置條件後套用繁體中文。
- `AntiLocaleToolkit-zh_CN.bat`：檢查前置條件後套用簡體中文。
- `AntiLocaleToolkit-Restore.bat`：還原工具建立的官方備份。

這三個入口會把語言／功能固定在檔名與參數中，不再使用語言選單或未標示語言的 Auto 入口。兩個語言入口會在缺少 `asar` 時自動執行 `npm install`，不會替你安裝 Node.js 或 Antigravity；所有入口都接受額外命令列參數，例如 `--app-dir`、`--source-web-bundle`。

如果套用或還原前 Antigravity 正在開啟，完成後工具會自動重新啟動它；如果原本沒有開啟，工具會維持關閉狀態。

第一次執行語言入口會自動安裝必要元件。工具會在第一次套用前建立 `app.asar.backup` 與 `web_bundle.backup`，之後可使用 `AntiLocaleToolkit-Restore.bat` 還原官方版本。

## 來源檔案

工具不包含 Antigravity 應用程式本體，也不會把使用者專屬檔案提交到專案。以下路徑是每台電腦自己的來源候選，不是下載包內預先附帶的檔案；部署時會依序尋找：

- `%USERPROFILE%\.gemini\antigravity\web_bundle`（若使用者已有乾淨來源）
- Antigravity 安裝目錄的 `resources\web_bundle.source`
- Antigravity 安裝目錄的 `resources\web_bundle.backup`（工具第一次套用建立的原始備份）
- Antigravity 安裝目錄的 `resources\web_bundle`（最後備援，會提示可能已被修改）

因此其他使用者下載後不需要擁有 `C:\Users\yx`；工具會把 `%USERPROFILE%` 展開成該使用者自己的資料夾。若前兩個乾淨來源都不存在，才會使用安裝目錄中的 `web_bundle`；若安裝檔也沒有可用來源，請用 `--source-web-bundle` 指定乾淨的 `web_bundle`。

如果來源放在其他位置，可用：

```text
node scripts/patcher.js --apply --lang zh-TW --source-web-bundle "D:\\path\\to\\web_bundle"
```

也可以用 `--app-dir` 指定 Antigravity 安裝目錄。

## 命令列

```text
node scripts/patcher.js --interactive
node scripts/patcher.js --apply --lang zh-TW
node scripts/patcher.js --apply --lang zh-CN
node scripts/patcher.js --restore
node scripts/patcher.js --status
node scripts/patcher.js --preflight
node scripts/patcher.js --auto --lang zh-TW
```

`--preflight` 是唯讀環境檢查；三個 BAT 入口不提供額外選單，直接執行各自固定的功能。語言入口使用 `--auto`，會先檢查並在必要時安裝相依元件，通過後才建立備份、關閉 Antigravity、套用指定語言。

未來新增語言時，只要在 `locales` 新增對應的 JSON 語言包，並以 `--lang` 指定語言代碼即可；語言包與部署程式彼此分離，方便持續擴充。

## 翻譯維護紀錄

每次補翻或調整都會記錄在 [TRANSLATION_LOG.md](TRANSLATION_LOG.md)，包含乾淨來源的定位、動態文字保留規則、繁中／簡中輸出與驗證結果。Antigravity 更新後，先查閱台帳再重新定位改版的 bundle，避免重複搜尋已知來源。

## 安全與限制

- 套用前會關閉 Antigravity 及其語言伺服器，以解除檔案鎖定。
- 語言入口只自動處理專案相依元件與指定語言的部署流程；找不到 Antigravity、來源 bundle 或檔案權限不足時會停止並列出原因。
- 還原只會使用工具建立的備份，不會清理其他資料夾或修改遠端專案。
- Antigravity 更新後可能需要重新執行工具；若版本不是 2.12.0 或 2.12.2，工具會警告後繼續，但必須將相容性標記為 `NOT VERIFIED`，不能把建構或部署成功視為已支援。
