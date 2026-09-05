/**
 * Antigravity Client i18n Patcher
 * 專為 Google Antigravity 2.12.0、2.12.2 桌面客戶端打造的多語言部署工具
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawn } = require('child_process');
const readline = require('readline');

const CLI_ARGS = process.argv.slice(2);
const PROJECT_DIR = path.resolve(__dirname, '..');
const LOCALES_DIR = path.join(PROJECT_DIR, 'locales');
const PROJECT_NAME = 'AntiLocale Toolkit';
const SUPPORTED_APP_VERSIONS = Object.freeze(['2.12.0', '2.12.2']);
const SUPPORTED_APP_VERSION = SUPPORTED_APP_VERSIONS[SUPPORTED_APP_VERSIONS.length - 1];

function formatSupportedVersions() {
  return SUPPORTED_APP_VERSIONS.join('、');
}

function getOption(name, fallback = '') {
  const inline = CLI_ARGS.find((arg) => arg.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = CLI_ARGS.indexOf(name);
  return index >= 0 && CLI_ARGS[index + 1] ? CLI_ARGS[index + 1] : fallback;
}

function normalizeLanguage(lang = 'zh-TW') {
  const raw = String(lang).trim().replaceAll('_', '-');
  if (!raw) return 'zh-TW';
  const lower = raw.toLowerCase();
  if (lower === 'zh-tw') return 'zh-TW';
  if (lower === 'zh-cn') return 'zh-CN';
  return raw;
}

const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || '', 'AppData', 'Local');
const APP_DIR = path.resolve(
  getOption('--app-dir') || process.env.ANTIGRAVITY_APP_DIR || path.join(localAppData, 'Programs', 'Antigravity')
);
const RESOURCES_DIR = path.join(APP_DIR, 'resources');
const ASAR_PATH = path.join(RESOURCES_DIR, 'app.asar');
const BACKUP_ASAR_PATH = path.join(RESOURCES_DIR, 'app.asar.backup');
const WEB_BUNDLE_DIR = path.join(RESOURCES_DIR, 'web_bundle');
const WEB_BUNDLE_BACKUP_DIR = path.join(RESOURCES_DIR, 'web_bundle.backup');
const WEB_BUNDLE_DISABLED_DIR = path.join(RESOURCES_DIR, 'web_bundle.disabled');

const RUN_DIR = path.join(os.tmpdir(), 'AntiLocaleToolkit', `run-${process.pid}`);
const TEMP_EXTRACT_DIR = path.join(RUN_DIR, 'extracted_app');
const TEMP_WEB_BUNDLE_DIR = path.join(RUN_DIR, 'web_bundle');
const PATCHED_ASAR_PATH = path.join(RUN_DIR, 'app.asar.patched');

function resolveLanguageFile(lang) {
  const normalized = normalizeLanguage(lang);
  const candidates = [
    path.join(LOCALES_DIR, `${normalized}.json`),
    path.join(LOCALES_DIR, `${normalized.toLowerCase()}.json`),
    path.join(LOCALES_DIR, `dict_${normalized.toLowerCase().replace('-', '_')}.json`),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0];
}

// 載入字典
function loadDict(lang = 'zh-tw') {
  const dictPath = resolveLanguageFile(lang);
  if (!fs.existsSync(dictPath)) {
    throw new Error(`找不到字典檔案: ${dictPath}`);
  }
  return JSON.parse(fs.readFileSync(dictPath, 'utf8'));
}

const LANGUAGE_LABELS = {
  'zh-TW': '繁體中文(TW)',
  'zh-CN': '简体中文',
};

function listLanguagePacks() {
  if (!fs.existsSync(LOCALES_DIR)) return [];
  return fs.readdirSync(LOCALES_DIR)
    .filter((fileName) => fileName.toLowerCase().endsWith('.json'))
    .map((fileName) => fileName.slice(0, -5))
    .sort((left, right) => {
      const order = ['zh-TW', 'zh-CN'];
      const leftIndex = order.indexOf(normalizeLanguage(left));
      const rightIndex = order.indexOf(normalizeLanguage(right));
      if (leftIndex >= 0 || rightIndex >= 0) {
        return (leftIndex < 0 ? 99 : leftIndex) - (rightIndex < 0 ? 99 : rightIndex);
      }
      return left.localeCompare(right);
    });
}

function languageLabel(lang) {
  const normalized = normalizeLanguage(lang);
  return LANGUAGE_LABELS[normalized] || normalized;
}

function loadAsarModule() {
  try {
    return require('asar');
  } catch (_) {
    return null;
  }
}

function getArchiveVersion(archivePath) {
  const asar = loadAsarModule();
  if (!asar || !fs.existsSync(archivePath)) return null;
  try {
    const packageJson = asar.extractFile(archivePath, 'package.json').toString('utf8');
    return JSON.parse(packageJson).version || null;
  } catch (_) {
    return null;
  }
}

function getVersionCompatibility(version) {
  return {
    supported: SUPPORTED_APP_VERSIONS.includes(version),
    expected: [...SUPPORTED_APP_VERSIONS],
    detected: version || null,
  };
}

function assertSupportedVersion(version, context = '應用程式') {
  const compatibility = getVersionCompatibility(version);
  const detectedLabel = compatibility.detected || '無法判定';
  console.log('支援的應用程式版本：' + formatSupportedVersions());
  console.log('偵測到' + context + '版本：' + detectedLabel);
  if (compatibility.supported) return compatibility;

  const mismatchMessage =
    context + '版本不符合目前支援範圍。目前支援版本為 ' + formatSupportedVersions() +
    '，偵測到 ' + detectedLabel + '。';
  if (CLI_ARGS.includes('--allow-version-mismatch')) {
    console.warn('警告：' + mismatchMessage + '已使用 --allow-version-mismatch，將繼續執行。');
  } else {
    console.warn('警告：' + mismatchMessage + '工具將繼續提供建構與套用流程，但此版本尚未完整驗證。');
    console.warn('如要明確標記為非目標版本測試，可加上 --allow-version-mismatch。');
  }
  return compatibility;
}


function isWebBundleDirectory(candidate) {
  return Boolean(candidate && fs.existsSync(path.join(candidate, 'main.js')));
}

function resolveSourceWebBundle() {
  const explicit = getOption('--source-web-bundle') || process.env.ANTIGRAVITY_WEB_BUNDLE;
  const userProfile = process.env.USERPROFILE || '';
  const candidates = [
    explicit,
    path.join(userProfile, '.gemini', 'antigravity', 'web_bundle'),
    path.join(RESOURCES_DIR, 'web_bundle.source'),
    WEB_BUNDLE_DIR,
  ].filter(Boolean);
  const resolved = candidates.find(isWebBundleDirectory);
  if (!resolved) {
    throw new Error(
      '找不到來源 web_bundle。請提供 --source-web-bundle <資料夾>，或將乾淨的 web_bundle 放到 ' +
        '%USERPROFILE%\\.gemini\\antigravity\\web_bundle。'
    );
  }
  if (path.resolve(resolved) === path.resolve(WEB_BUNDLE_DIR)) {
    console.warn('警告：目前只能找到已安裝的 web_bundle，若它已經漢化，切換語言可能保留先前文字。');
  }
  return resolved;
}

function runAsar(args) {
  const asarCli = path.join(PROJECT_DIR, 'node_modules', 'asar', 'bin', 'asar.js');
  if (!fs.existsSync(asarCli)) {
    throw new Error('找不到 asar 建構元件，請先執行 AntiLocaleToolkit.bat 或 npm install。');
  }
  execFileSync(process.execPath, [asarCli, ...args], { stdio: 'inherit', windowsHide: true });
}

function checkJavaScript(filePath) {
  execFileSync(process.execPath, ['--check', filePath], { stdio: 'inherit', windowsHide: true });
}

function prepareRunDirectory() {
  if (fs.existsSync(RUN_DIR)) {
    fs.rmSync(RUN_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(RUN_DIR, { recursive: true });
}

function prepareNativeWorkspace() {
  fs.mkdirSync(RUN_DIR, { recursive: true });
  if (fs.existsSync(TEMP_EXTRACT_DIR)) {
    fs.rmSync(TEMP_EXTRACT_DIR, { recursive: true, force: true });
  }
  if (fs.existsSync(PATCHED_ASAR_PATH)) {
    fs.rmSync(PATCHED_ASAR_PATH, { force: true });
  }
}

// 關閉相關進程
function killAntigravityProcesses() {
  console.log('正在嘗試關閉 Antigravity 進程以解除檔案鎖定...');
  for (const imageName of ['Antigravity.exe', 'language_server.exe']) {
    try {
      execFileSync('taskkill', ['/F', '/IM', imageName], { stdio: 'ignore', windowsHide: true });
    } catch (_) {
      // 忽略找不到進程的錯誤，仍繼續處理其他進程。
    }
  }
  const start = Date.now();
  while (Date.now() - start < 1500) {}
  console.log('Antigravity 進程已關閉。');
}

function isAntigravityRunning() {
  try {
    const output = execFileSync(
      'tasklist',
      ['/FI', 'IMAGENAME eq Antigravity.exe', '/FO', 'CSV', '/NH'],
      { encoding: 'utf8', windowsHide: true }
    );
    return output.split(/\r?\n/).some((line) => line.trim().toLowerCase().startsWith('"antigravity.exe"'));
  } catch (_) {
    return false;
  }
}

function startAntigravity() {
  const executablePath = path.join(APP_DIR, 'Antigravity.exe');
  if (!fs.existsSync(executablePath)) {
    throw new Error(`找不到 Antigravity 執行檔：${executablePath}`);
  }
  const child = spawn(executablePath, [], {
    detached: true,
    stdio: 'ignore',
    windowsHide: false,
  });
  child.unref();
  console.log('已自動重新開啟 Antigravity。');
}

function reopenIfPreviouslyRunning(wasRunning) {
  if (!wasRunning) return false;
  try {
    startAntigravity();
    return true;
  } catch (err) {
    console.warn(`補丁已完成，但自動重新開啟失敗：${err.message}`);
    console.warn('請手動開啟 Antigravity。');
    return false;
  }
}

// 狀態檢查
function checkStatus() {
  console.log('\n====================================================');
  console.log('       Antigravity 客戶端漢化狀態檢查');
  console.log('====================================================');
  console.log(`支援的應用程式版本：${formatSupportedVersions()}`);
  console.log(`安裝目錄: ${APP_DIR}`);
  console.log(`app.asar 存在: ${fs.existsSync(ASAR_PATH) ? '是' : '否'}`);
  console.log(`原版備份存在: ${fs.existsSync(BACKUP_ASAR_PATH) ? '是' : '否'}`);
  console.log(`web_bundle 漢化包存在: ${fs.existsSync(WEB_BUNDLE_DIR) ? '是' : '否'}`);
  console.log(`web_bundle 備份存在: ${fs.existsSync(WEB_BUNDLE_BACKUP_DIR) ? '是' : '否'}`);
  console.log(`web_bundle.disabled (已停用包): ${fs.existsSync(WEB_BUNDLE_DISABLED_DIR) ? '是' : '否'}`);
  console.log(`目前 app.asar 版本：${getArchiveVersion(ASAR_PATH) || '無法判定'}`);
  console.log(`備份 app.asar 版本：${getArchiveVersion(BACKUP_ASAR_PATH) || '無法判定'}`);
  console.log('====================================================\n');
}

// 還原原版
function restore(autoKill = true) {
  console.log('\n正在執行還原程序...');
  if (!fs.existsSync(BACKUP_ASAR_PATH)) {
    console.error('錯誤：找不到備份檔案 app.asar.backup，無法自動還原！');
    return false;
  }
  const wasRunning = autoKill && isAntigravityRunning();
  if (autoKill) {
    killAntigravityProcesses();
  }
  try {
    fs.copyFileSync(BACKUP_ASAR_PATH, ASAR_PATH);
    console.log('成功還原官方原版 app.asar！');
    if (fs.existsSync(WEB_BUNDLE_DIR)) {
      if (fs.existsSync(WEB_BUNDLE_DISABLED_DIR)) {
        fs.rmSync(WEB_BUNDLE_DISABLED_DIR, { recursive: true, force: true });
      }
      fs.renameSync(WEB_BUNDLE_DIR, WEB_BUNDLE_DISABLED_DIR);
      console.log('已停用 web_bundle 漢化包目錄（重命名為 web_bundle.disabled）。');
    }
    console.log('\n====================================================');
    console.log(' 🎉 已完整還原至官方原版英文狀態！');
    console.log('====================================================\n');
    reopenIfPreviouslyRunning(wasRunning);
    return true;
  } catch (err) {
    console.error('還原失敗：', err.message);
    console.error('若為檔案鎖定，請手動確認工作管理員中已無 Antigravity 進程。');
    return false;
  }
}

// 將字典詞條轉成前端可能使用的 Unicode 跳脫形式。
function toUnicodeEscapedSource(value) {
  let result = '';
  for (const char of value) {
    const codePoint = char.codePointAt(0);
    if (codePoint <= 0x7f) {
      result += char;
    } else if (codePoint <= 0xffff) {
      result += `\\u${codePoint.toString(16).padStart(4, '0')}`;
    } else {
      const adjusted = codePoint - 0x10000;
      const high = 0xd800 + (adjusted >> 10);
      const low = 0xdc00 + (adjusted & 0x3ff);
      result += `\\u${high.toString(16).padStart(4, '0')}\\u${low.toString(16).padStart(4, '0')}`;
    }
  }
  return result;
}

// 處理以單引號包住、或在字串內容中跳脫雙引號的前端來源形式。
function escapeQuotesForSource(value) {
  return value.split('"').join('\\' + '"');
}

function toQuotedSourceVariants(value) {
  const variants = new Set([value]);
  const escapedOuterQuotes = escapeQuotesForSource(value);
  if (escapedOuterQuotes !== value) {
    variants.add(escapedOuterQuotes);
  }
  const firstQuote = value.indexOf(':"');
  const lastQuote = value.lastIndexOf('"');
  if (firstQuote >= 0 && lastQuote > firstQuote + 1) {
    const bodyStart = firstQuote + 2;
    const body = value.slice(bodyStart, lastQuote).replaceAll('"', '\\"');
    variants.add(value.slice(0, bodyStart) + body + value.slice(lastQuote));
  } else if (value.startsWith('"') && value.endsWith('"') && value.length > 1) {
    const body = value.slice(1, -1);
    variants.add("'" + body.replaceAll("'", "\\'") + "'");
  }
  return variants;
}

function replacementForSource(value, sourceKey) {
  if (sourceKey.length > 1 && sourceKey.startsWith("'") && sourceKey.endsWith("'") && value.startsWith('"') && value.endsWith('"')) {
    const body = value.slice(1, -1).split("'").join('\\' + "'");
    return "'" + body + "'";
  }
  return sourceKey.includes('\\' + '"') ? escapeQuotesForSource(value) : value;
}

function sourceKeyVariants(value) {
  const variants = new Set();
  for (const quoted of toQuotedSourceVariants(value)) {
    variants.add(quoted);
    variants.add(toUnicodeEscapedSource(quoted));
  }
  return variants;
}

// main.js 內含以 qUb("...") 封裝的第三方 ELK 程式碼。這些內容不是使用者介面，
// 而且直接替換其中的字串可能破壞外層 JavaScript 字串，因此保留整段原文不處理。
function splitProtectedWebBundleRegions(code) {
  const segments = [];
  let cursor = 0;
  let searchFrom = 0;

  while (true) {
    const start = code.indexOf('qUb("', searchFrom);
    if (start < 0) break;

    let end = -1;
    let escaped = false;
    for (let index = start + 5; index < code.length - 2; index += 1) {
      const char = code[index];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === '"' && code[index + 1] === ')' && code[index + 2] === ';') {
        end = index + 1;
        break;
      }
    }

    if (end < 0) break;
    if (start > cursor) {
      segments.push({ protected: false, text: code.slice(cursor, start) });
    }
    segments.push({ protected: true, text: code.slice(start, end) });
    cursor = end;
    searchFrom = end;
  }

  if (cursor < code.length) {
    segments.push({ protected: false, text: code.slice(cursor) });
  }
  return segments;
}

// 構建 Web Bundle
function buildWebBundle(lang = 'zh-tw', sourceOverride = null) {
  const normalizedLang = normalizeLanguage(lang);
  console.log(`正在構建前端漢化資源包 (${normalizedLang})...`);
  const dict = loadDict(lang);

  const sourceWebBundle = sourceOverride || resolveSourceWebBundle();
  prepareRunDirectory();

  fs.mkdirSync(TEMP_WEB_BUNDLE_DIR, { recursive: true });

  const files = ['index.html', 'jetbox.css', 'compiled_tailwind.css', 'prism_bundle.js'];
  for (const f of files) {
    const src = path.join(sourceWebBundle, f);
    const dest = path.join(TEMP_WEB_BUNDLE_DIR, f);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  }

  const rawMainJsPath = path.join(sourceWebBundle, 'main.js');
  console.log(`正在讀取前端主程式 ${rawMainJsPath} (${(fs.statSync(rawMainJsPath).size / 1024 / 1024).toFixed(2)} MB)...`);
  let code = fs.readFileSync(rawMainJsPath, 'utf8');

  let replaceCount = 0;
  const webBundleSegments = splitProtectedWebBundleRegions(code);

  // 先替換較長、較具體的片段，避免通用詞條提前消耗掉上下文詞條。
  const exactProperties = [...dict.exact_properties].sort((a, b) => b.key.length - a.key.length);
  for (const item of exactProperties) {
    // 部分前端字串會把非 ASCII 字元編碼成 \\uXXXX；同一詞條同時支援兩種來源形式。
    for (const sourceKey of sourceKeyVariants(item.key)) {
      for (const segment of webBundleSegments) {
        if (segment.protected) continue;
        const occurrences = segment.text.split(sourceKey).length - 1;
        if (occurrences > 0) {
          segment.text = segment.text.split(sourceKey).join(replacementForSource(item.val, sourceKey));
          replaceCount += occurrences;
        }
      }
    }
  }

  code = webBundleSegments.map((segment) => segment.text).join('');

  if (dict.descriptions) {
    for (const item of dict.descriptions) {
      const occurrences = code.split(item.from).length - 1;
      if (occurrences > 0) {
        code = code.split(item.from).join(item.to);
        replaceCount += occurrences;
      }
    }
  }

  console.log(`前端 main.js 成功替換詞條數: ${replaceCount}`);

  const outputMainJsPath = path.join(TEMP_WEB_BUNDLE_DIR, 'main.js');
  fs.writeFileSync(outputMainJsPath, code, 'utf8');

  console.log('正在校驗前端腳本語法...');
  checkJavaScript(outputMainJsPath);
  console.log('前端腳本語法校驗 100% 通過！');
  return TEMP_WEB_BUNDLE_DIR;
}

function prepareBackupUnpackedDirectory() {
  const backupUnpackedDir = `${BACKUP_ASAR_PATH}.unpacked`;
  const currentUnpackedDir = `${ASAR_PATH}.unpacked`;
  if (fs.existsSync(backupUnpackedDir)) return true;
  if (!fs.existsSync(currentUnpackedDir)) return false;

  const backupVersion = getArchiveVersion(BACKUP_ASAR_PATH);
  const currentVersion = getArchiveVersion(ASAR_PATH);
  if (backupVersion && currentVersion && backupVersion !== currentVersion) {
    return false;
  }

  console.log('正在建立原版 archive 所需的 .unpacked 資料，以便保留乾淨的原生來源...');
  fs.cpSync(currentUnpackedDir, backupUnpackedDir, { recursive: true });
  return true;
}

// 構建漢化版 app.asar
function buildAsar(lang = 'zh-tw') {
  const normalizedLang = normalizeLanguage(lang);
  console.log(`正在準備修改原生 Electron 主程式 (${normalizedLang})...`);
  const dict = loadDict(lang);
  prepareNativeWorkspace();

  const missingNativeSections = [];
  if (!dict.overlay || typeof dict.overlay['Loading Antigravity'] !== 'string') missingNativeSections.push('overlay');
  if (!dict.native_menu || typeof dict.native_menu !== 'object') missingNativeSections.push('native_menu');
  if (!dict.tray || typeof dict.tray !== 'object') missingNativeSections.push('tray');
  if (missingNativeSections.length > 0) {
    throw new Error(`字典缺少原生介面區段: ${missingNativeSections.join(', ')}`);
  }

  const explicitSourceExtractDir = getOption('--source-extracted-app') || process.env.ANTIGRAVITY_EXTRACTED_APP;
  let sourceExtractDir = explicitSourceExtractDir;
  if (!sourceExtractDir) {
    let sourceArchive = fs.existsSync(BACKUP_ASAR_PATH) ? BACKUP_ASAR_PATH : ASAR_PATH;
    if (sourceArchive === BACKUP_ASAR_PATH && !fs.existsSync(`${BACKUP_ASAR_PATH}.unpacked`)) {
      if (prepareBackupUnpackedDirectory()) {
        console.log('已準備使用原版 app.asar 與對應的 .unpacked 資料。');
      } else {
        console.warn('找不到備份 archive 對應的 .unpacked 目錄，改用目前 app.asar 建構補丁。');
        sourceArchive = ASAR_PATH;
      }
    }

    sourceExtractDir = sourceExtractDir || TEMP_EXTRACT_DIR;
    console.log(`正在從 ${sourceArchive} 解包原生程式...`);
    runAsar(['extract', sourceArchive, sourceExtractDir]);
  }
  if (!fs.existsSync(sourceExtractDir)) {
    throw new Error(`來源解包目錄不存在: ${sourceExtractDir}`);
  }

  const detectedVersion = (() => {
    try {
      const packageJsonPath = path.join(sourceExtractDir, 'package.json');
      return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')).version || null;
    } catch (_) {
      return null;
    }
  })();
  assertSupportedVersion(detectedVersion);

  if (path.resolve(sourceExtractDir) !== path.resolve(TEMP_EXTRACT_DIR)) {
    fs.cpSync(sourceExtractDir, TEMP_EXTRACT_DIR, { recursive: true });
    sourceExtractDir = TEMP_EXTRACT_DIR;
  }

  // 1. 修改 languageServer.js 以啟用 --web_bundle_path
  const lsJsPath = path.join(TEMP_EXTRACT_DIR, 'dist', 'languageServer.js');
  let lsCode = fs.readFileSync(lsJsPath, 'utf8');
  const anchor = "'--enable_sidecars',";
  const injection = `
            '--enable_sidecars',
            ...(fs.existsSync(path_1.default.join(process.resourcesPath, 'web_bundle'))
                ? ['--web_bundle_path', path_1.default.join(process.resourcesPath, 'web_bundle')]
                : []),`;

  if (lsCode.includes(anchor) && !lsCode.includes('--web_bundle_path')) {
    lsCode = lsCode.replace(anchor, injection);
    fs.writeFileSync(lsJsPath, lsCode, 'utf8');
    console.log('成功在 languageServer.js 注入 --web_bundle_path 支援！');
  }

  // 2. 漢化 loadingOverlay.js
  const overlayJsPath = path.join(TEMP_EXTRACT_DIR, 'dist', 'loadingOverlay.js');
  let overlayCode = fs.readFileSync(overlayJsPath, 'utf8');
  const overlayFrom = '<div class="text">Loading Antigravity</div>';
  const overlayTo = `<div class="text">${dict.overlay['Loading Antigravity'] || '正在載入 Antigravity...'}</div>`;
  if (overlayCode.includes(overlayFrom)) {
    overlayCode = overlayCode.replace(overlayFrom, overlayTo);
    fs.writeFileSync(overlayJsPath, overlayCode, 'utf8');
    console.log('成功漢化 loadingOverlay.js 載入文字！');
  }

  // 3. 漢化 menu.js
  const menuJsPath = path.join(TEMP_EXTRACT_DIR, 'dist', 'menu.js');
  let menuCode = fs.readFileSync(menuJsPath, 'utf8');

  const menuInject = `
const i18nMenuDict = ${JSON.stringify(dict.native_menu)};
function applyMenuI18n(menu) {
    if (!menu || !menu.items) return;
    for (const item of menu.items) {
        if (item.label && i18nMenuDict[item.label]) {
            item.label = i18nMenuDict[item.label];
        }
        if (item.submenu) {
            applyMenuI18n(item.submenu);
        }
    }
}
`;
  if (menuCode.includes('const i18nMenuDict =')) {
    menuCode = menuCode.replace(
      /const i18nMenuDict = [\\s\\S]*?;\\r?\\nfunction applyMenuI18n/,
      `const i18nMenuDict = ${JSON.stringify(dict.native_menu)};\nfunction applyMenuI18n`
    );
    fs.writeFileSync(menuJsPath, menuCode, 'utf8');
    console.log('已更新原生選單語言包！');
  } else {
    menuCode = menuInject + menuCode;
    menuCode = menuCode.replace(
      'electron_1.Menu.setApplicationMenu(menu);',
      'applyMenuI18n(menu);\n    electron_1.Menu.setApplicationMenu(menu);'
    );
    fs.writeFileSync(menuJsPath, menuCode, 'utf8');
    console.log('成功在 menu.js 注入全量選單漢化處理！');
  }

  // 4. 漢化 updater.js 更新提示彈窗
  const updaterJsPath = path.join(TEMP_EXTRACT_DIR, 'dist', 'updater.js');
  let updaterCode = fs.readFileSync(updaterJsPath, 'utf8');
  const updateDialog = dict.native_update_dialog || {};
  const updateDialogTitle = updateDialog['Check for Updates'] || dict.native_menu['Check for Updates'] || 'Check for Updates';
  const updateDialogMessage = updateDialog['No updates available'] || 'No updates available';
  const updateDialogOk = updateDialog.OK || 'OK';
  updaterCode = updaterCode
    .replaceAll("title: 'Check for Updates'", `title: ${JSON.stringify(updateDialogTitle)}`)
    .replaceAll("message: 'No updates available'", `message: ${JSON.stringify(updateDialogMessage)}`)
    .replaceAll("buttons: ['OK']", `buttons: [${JSON.stringify(updateDialogOk)}]`);
  fs.writeFileSync(updaterJsPath, updaterCode, 'utf8');
  console.log('成功漢化 updater.js 更新提示彈窗！');

  // 5. 漢化 tray.js
  const trayJsPath = path.join(TEMP_EXTRACT_DIR, 'dist', 'tray.js');
  let trayCode = fs.readFileSync(trayJsPath, 'utf8');
  if (dict.tray) {
    const noAgents = JSON.stringify(dict.tray['No agents running'] || '沒有執行中的代理');
    const singularAgent = JSON.stringify(dict.tray['agent running'] || '個代理執行中');
    const pluralAgents = JSON.stringify(dict.tray['agents running'] || singularAgent);
    const templateTick = String.fromCharCode(96);
    const countExpression = templateTick + '$' + '{count}' + templateTick;
    const originalCountBlock = [
      'countItem.label =',
      '                (count > 0 ? ' + countExpression + " : 'No') +",
      "                    ' agent' +",
      "                    (count === 1 ? '' : 's') +",
      "                    ' running';",
    ].join('\n');
    const localizedCountBlock = [
      'countItem.label = count > 0',
      '    ? ' + templateTick + '$' + '{count}' + '$' + '{count === 1 ? ' + singularAgent + ' : ' + pluralAgents + '}' + templateTick,
      '    : ' + noAgents + ';',
    ].join('\n');
    if (trayCode.includes(originalCountBlock)) {
      trayCode = trayCode.replace(originalCountBlock, localizedCountBlock);
    } else {
      console.warn('找不到托盤代理計數原始片段，未修改計數文字。');
    }
    fs.writeFileSync(trayJsPath, trayCode, 'utf8');
    console.log('成功漢化 tray.js 托盤狀態文字！');
  }

  // 6. 漢化 main.js 中的 Tray actions
  const mainJsPath = path.join(TEMP_EXTRACT_DIR, 'dist', 'main.js');
  let mainCode = fs.readFileSync(mainJsPath, 'utf8');
  if (dict.tray) {
    mainCode = mainCode.replace("label: 'No agents running'", `label: '${dict.tray['No agents running']}'`);
    mainCode = mainCode.replace("label: `Open ${electron_1.app.getName()}`", `label: \`${dict.tray['Open Antigravity'] || '開啟 Antigravity'}\``);
    mainCode = mainCode.replace("label: 'Quit'", `label: '${dict.tray['Quit'] || '結束'}'`);
    fs.writeFileSync(mainJsPath, mainCode, 'utf8');
    console.log('成功漢化 main.js 中的原生系統匣選單項目！');
  }

  console.log('正在校驗修改後的 Electron 代碼語法...');
  checkJavaScript(lsJsPath);
  checkJavaScript(menuJsPath);
  checkJavaScript(overlayJsPath);
  checkJavaScript(updaterJsPath);
  checkJavaScript(trayJsPath);
  checkJavaScript(mainJsPath);
  console.log('Electron 主進程代碼語法校驗 100% 通過！');

  console.log(`正在打包新 asar 檔案至 ${PATCHED_ASAR_PATH}...`);
  runAsar(['pack', TEMP_EXTRACT_DIR, PATCHED_ASAR_PATH, '--unpack-dir', 'node_modules/chrome-devtools-mcp']);
  console.log(`成功打包 app.asar.patched (${(fs.statSync(PATCHED_ASAR_PATH).size / 1024 / 1024).toFixed(2)} MB)！`);
  return PATCHED_ASAR_PATH;
}

function ensureAsarBackup() {
  if (!fs.existsSync(ASAR_PATH)) {
    throw new Error(`找不到 Antigravity app.asar：${ASAR_PATH}`);
  }
  if (!fs.existsSync(BACKUP_ASAR_PATH)) {
    console.log(`正在備份原版 app.asar 至 ${BACKUP_ASAR_PATH}...`);
    fs.copyFileSync(ASAR_PATH, BACKUP_ASAR_PATH);
    console.log('原版備份完成！');
  } else {
    console.log('偵測到原版備份已存在，跳過備份。');
  }
}

function ensureWebBundleBackup(sourceWebBundle) {
  if (fs.existsSync(WEB_BUNDLE_BACKUP_DIR)) {
    console.log('偵測到 web_bundle 原始備份，跳過備份。');
    return;
  }
  if (!isWebBundleDirectory(sourceWebBundle)) {
    throw new Error(`無法建立 web_bundle 備份，來源不存在：${sourceWebBundle}`);
  }
  console.log(`正在建立 web_bundle 原始備份至 ${WEB_BUNDLE_BACKUP_DIR}...`);
  fs.cpSync(sourceWebBundle, WEB_BUNDLE_BACKUP_DIR, { recursive: true });
  console.log('web_bundle 原始備份完成！');
}

// 一鍵套用部署
function applyPatch(lang = 'zh-tw', autoKill = true) {
  const normalizedLang = normalizeLanguage(lang);
  console.log(`\n=== 開始套用漢化補丁 [語言: ${normalizedLang}] ===\n`);
  ensureAsarBackup();
  const sourceWebBundle = resolveSourceWebBundle();
  ensureWebBundleBackup(sourceWebBundle);
  const wasRunning = autoKill && isAntigravityRunning();

  const builtWebBundle = buildWebBundle(normalizedLang, sourceWebBundle);
  const builtAsar = buildAsar(lang);

  if (autoKill) {
    killAntigravityProcesses();
  }

  console.log(`正在替換 app.asar...`);
  try {
    fs.copyFileSync(builtAsar, ASAR_PATH);
    console.log('app.asar 替換成功！');
  } catch (err) {
    console.warn('\n【注意】app.asar 目前仍被鎖定。');
    console.warn('請手動至工作管理員中完全關閉 Antigravity 客戶端後再重試。\n');
    return false;
  }

  console.log(`正在部署前端漢化包至 ${WEB_BUNDLE_DIR}...`);
  if (fs.existsSync(WEB_BUNDLE_DIR)) {
    fs.rmSync(WEB_BUNDLE_DIR, { recursive: true, force: true });
  }
  fs.cpSync(builtWebBundle, WEB_BUNDLE_DIR, { recursive: true });
  console.log('前端漢化包部署完成！');

  const reopened = reopenIfPreviouslyRunning(wasRunning);
  console.log('\n====================================================');
  console.log(' 🎉 Antigravity 客戶端漢化成功套用！');
  console.log(wasRunning && reopened ? ' 原本已開啟，已自動重新啟動 Antigravity。' : wasRunning ? ' 原本已開啟，請手動重新開啟 Antigravity。' : ' 原本未開啟，維持關閉狀態。');
  console.log('====================================================\n');
  return true;
}

function runInteractiveAction(action) {
  try {
    action();
  } catch (err) {
    console.error(`\n執行失敗：${err.message}`);
    console.error('請確認 Antigravity 版本、來源 web_bundle 與檔案權限後再試。');
  }
}

// 互動式命令行介面
function runInteractive() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  const languagePacks = listLanguagePacks();
  const restoreChoice = languagePacks.length + 1;
  const statusChoice = languagePacks.length + 2;

  function showMenu() {
    console.clear();
    console.log('====================================================');
    console.log(`       ${PROJECT_NAME}`);
    console.log('====================================================');
    console.log(`支援的應用程式版本：${formatSupportedVersions()}`);
    console.log('');
    languagePacks.forEach((lang, index) => {
      console.log(`  [${index + 1}] ${languageLabel(lang)}`);
    });
    console.log(`  [${restoreChoice}] 還原`);
    console.log(`  [${statusChoice}] 狀態`);
    console.log('  [0] 離開');
    console.log('');
    console.log('====================================================');
    rl.question(`請輸入選項 [0-${statusChoice}]: `, (answer) => {
      const choice = answer.trim();
      const languageIndex = Number(choice) - 1;
      if (Number.isInteger(languageIndex) && languageIndex >= 0 && languageIndex < languagePacks.length) {
        runInteractiveAction(() => applyPatch(languagePacks[languageIndex], true));
        waitEnter();
      } else if (choice === String(restoreChoice)) {
        runInteractiveAction(() => restore(true));
        waitEnter();
      } else if (choice === String(statusChoice)) {
        runInteractiveAction(checkStatus);
        waitEnter();
      } else if (choice === '0') {
        rl.close();
      } else {
        showMenu();
      }
    });
  }

  function waitEnter() {
    rl.question('\n按 Enter 鍵返回主選單...', () => {
      showMenu();
    });
  }

  showMenu();
}

function main() {
  const args = CLI_ARGS;

  if (args.includes('--interactive') || args.includes('-i')) {
    runInteractive();
    return;
  }

  const lang = normalizeLanguage(getOption('--lang', 'zh-TW'));

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`${PROJECT_NAME}`);
    console.log(`支援的應用程式版本：${formatSupportedVersions()}`);
    console.log('');
    console.log('用法：');
    console.log('  node scripts/patcher.js --interactive');
    console.log('  node scripts/patcher.js --apply --lang zh-TW');
    console.log('  node scripts/patcher.js --apply --lang zh-CN');
    console.log('  node scripts/patcher.js --restore');
    console.log('  node scripts/patcher.js --status');
    console.log('');
    console.log('選用參數：--app-dir、--source-web-bundle、--source-extracted-app');
    console.log('版本不符時會先顯示警告並繼續；可用 --allow-version-mismatch 明確標記為非目標版本測試');
    return;
  }

  if (args.includes('--status')) {
    checkStatus();
    return;
  }

  if (args.includes('--restore')) {
    restore(true);
    return;
  }

  if (args.includes('--apply')) {
    applyPatch(lang, true);
    return;
  }

  console.log(`\n=== 開始執行 Antigravity 客戶端漢化構建 [語言: ${lang}] ===\n`);
  buildWebBundle(lang);
  buildAsar(lang);
  console.log('\n構建完成！若要套用到客戶端，請加上 --apply 參數，或使用 -i 進入互動選單。');
}

module.exports = {
  SUPPORTED_APP_VERSIONS,
  SUPPORTED_APP_VERSION,
  getVersionCompatibility,
  assertSupportedVersion,
};

if (require.main === module) {
  main();
}
