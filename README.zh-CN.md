# Antigravity Chinese Toolkit

[繁体中文](README.md) | [简体中文](README.zh-CN.md)

Antigravity Desktop 的中文汉化部署工具，支持繁体中文与简体中文。以语言包为核心，让你可以选择语言后一键应用，并保留一键还原与状态检查。

技术套件／Repository identifier 仍保留 `anti-locale-toolkit`，显示项目名称统一为 **Antigravity Chinese Toolkit**。

## 支持语言

- 繁体中文（`zh-TW`）
- 简体中文（`zh-CN`）

## 支持版本

**支持的应用程序版本：2.12.0、2.12.2**

工具会在部署前检查 Antigravity 的版本；若检测到不在上述清单，会显示「版本不符合当前支持范围」警告后继续构建／应用，但该版本兼容性仍是未验证。若要明确标记为非目标版本测试，可加上 `--allow-version-mismatch`。

## 支持平台

目前仅支持 Windows。

macOS 尚未适配，也未完成 macOS 的构建、应用、还原与进程重启验证；请勿在 macOS 执行 Windows `.bat` 入口。程序目前依赖 `Antigravity.exe`、`taskkill`、Windows 路径与进程管理，因此 macOS 支持状态为 `NOT VERIFIED`。

## 一键使用

1. 确认已安装 Node.js 20 或更新版本。
2. 根据需求双击以下其中一个入口：

- `AntiLocaleToolkit-zh_TW.bat`：检查前置条件后应用繁体中文。
- `AntiLocaleToolkit-zh_CN.bat`：检查前置条件后应用简体中文。
- `AntiLocaleToolkit-Restore.bat`：还原工具建立的官方备份。

这三个入口会把语言／功能固定在文件名与参数中，不再使用语言菜单或未标示语言的 Auto 入口。两个语言入口会在缺少 `asar` 时自动执行 `npm install`，不会替你安装 Node.js 或 Antigravity；所有入口都接受额外命令行参数，例如 `--app-dir`、`--source-web-bundle`。

如果应用或还原前 Antigravity 正在开启，完成后工具会自动重新启动它；如果原本没有开启，工具会维持关闭状态。

第一次执行语言入口会自动安装必要组件。工具会在第一次应用前建立 `app.asar.backup` 与 `web_bundle.backup`，之后可使用 `AntiLocaleToolkit-Restore.bat` 还原官方版本。

## 来源文件

工具不包含 Antigravity 应用程序本体，也不会把用户专属文件提交到项目。以下路径是每台电脑自己的来源候选，不是下载包内预先附带的文件；部署时会依序寻找：

- `%USERPROFILE%\.gemini\antigravity\web_bundle`（若用户已有干净来源）
- Antigravity 安装目录的 `resources\web_bundle.source`
- Antigravity 安装目录的 `resources\web_bundle.backup`（工具第一次应用建立的原始备份）
- Antigravity 安装目录的 `resources\web_bundle`（最后备用，会提示可能已被修改）

因此其他用户下载后不需要拥有 `C:\Users\yx`；工具会把 `%USERPROFILE%` 展开成该用户自己的资料夹。若前两个干净来源都不存在，才会使用安装目录中的 `web_bundle`；若安装文件也没有可用来源，请用 `--source-web-bundle` 指定干净的 `web_bundle`。

如果来源放在其他位置，可用：

```text
node scripts/patcher.js --apply --lang zh-TW --source-web-bundle "D:\\path\\to\\web_bundle"
```

也可以用 `--app-dir` 指定 Antigravity 安装目录。

## 命令行

```text
node scripts/patcher.js --interactive
node scripts/patcher.js --apply --lang zh-TW
node scripts/patcher.js --apply --lang zh-CN
node scripts/patcher.js --restore
node scripts/patcher.js --status
node scripts/patcher.js --preflight
node scripts/patcher.js --auto --lang zh-TW
```

`--preflight` 是只读环境检查；三个 BAT 入口不提供额外菜单，直接执行各自固定的功能。语言入口使用 `--auto`，会先检查并在必要时安装依赖组件，通过后才建立备份、关闭 Antigravity、应用指定语言。

未来新增语言时，只要在 `locales` 新增对应的 JSON 语言包，并以 `--lang` 指定语言代码即可；语言包与部署程序彼此分离，方便持续扩充。

## 翻译维护记录

每次补翻或调整都会记录在 [TRANSLATION_LOG.md](TRANSLATION_LOG.md)，包含干净来源的定位、动态文字保留规则、繁中／简中输出与验证结果。Antigravity 更新后，先查阅台帐再重新定位改版的 bundle，避免重复搜索已知来源。

## 安全与限制

- 应用前会关闭 Antigravity 及其语言服务器，以解除文件锁定。
- 语言入口只自动处理项目依赖组件与指定语言的部署流程；找不到 Antigravity、来源 bundle 或文件权限不足时会停止并列出原因。
- 还原只会使用工具建立的备份，不会清理其他文件夹或修改远程项目。
- Antigravity 更新后可能需要重新执行工具；若版本不是 2.12.0 或 2.12.2，工具会警告后继续，但必须将兼容性标记为 `NOT VERIFIED`，不能把构建或部署成功视为已支持。
