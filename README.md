# AntiLocale Toolkit

Antigravity Desktop 的多語言漢化部署工具。以語言包為核心，讓你可以選擇語言後一鍵套用，並保留一鍵還原與狀態檢查。

## 支援版本

**支援的應用程式版本：2.12.0、2.12.2**

工具會在部署前檢查 Antigravity 的版本；若偵測到不在上述清單，會顯示「版本不符合目前支援範圍」警告後繼續建構／套用，但該版本相容性仍是未驗證。若要明確標記為非目標版本測試，可加上 `--allow-version-mismatch`。

## 一鍵使用

1. 確認已安裝 Node.js 20 或更新版本。
2. 雙擊 `AntiLocaleToolkit.bat`。
3. 選擇繁體中文、簡體中文、還原或狀態檢查。

如果套用或還原前 Antigravity 正在開啟，完成後工具會自動重新啟動它；如果原本沒有開啟，工具會維持關閉狀態。

第一次執行會自動安裝必要元件。工具會在第一次套用前建立 `app.asar.backup` 與 `web_bundle.backup`，之後可從選單還原官方版本。

## 來源檔案

工具不包含 Antigravity 應用程式本體，也不會把使用者專屬檔案提交到專案。以下路徑是每台電腦自己的來源候選，不是下載包內預先附帶的檔案；部署時會依序尋找：

- `%USERPROFILE%\.gemini\antigravity\web_bundle`（若使用者已有乾淨來源）
- Antigravity 安裝目錄的 `resources\web_bundle.source`
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
```

未來新增語言時，只要在 `locales` 新增對應的 JSON 語言包，並以 `--lang` 指定語言代碼即可；語言包與部署程式彼此分離，方便持續擴充。

## 安全與限制

- 套用前會關閉 Antigravity 及其語言伺服器，以解除檔案鎖定。
- 還原只會使用工具建立的備份，不會清理其他資料夾或修改遠端專案。
- Antigravity 更新後可能需要重新執行工具；若版本不是 2.12.0 或 2.12.2，工具會警告後繼續，但必須將相容性標記為 `NOT VERIFIED`，不能把建構或部署成功視為已支援。
