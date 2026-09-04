const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'locales');

function loadLocale(name) {
  const filePath = path.join(localesDir, `${name}.json`);
  const locale = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!Array.isArray(locale.exact_properties)) {
    throw new Error(`${name}.json 缺少 exact_properties 陣列`);
  }
  if (locale.descriptions !== undefined && !Array.isArray(locale.descriptions)) {
    throw new Error(`${name}.json 的 descriptions 必須是陣列`);
  }
  return locale;
}

function keySet(locale) {
  return new Set(locale.exact_properties.map((entry) => entry.key));
}

function duplicateKeys(locale) {
  const seen = new Set();
  const duplicates = new Set();
  for (const entry of locale.exact_properties) {
    if (seen.has(entry.key)) duplicates.add(entry.key);
    seen.add(entry.key);
  }
  return duplicates;
}

const zhTw = loadLocale('zh-TW');
const zhCn = loadLocale('zh-CN');
const twKeys = keySet(zhTw);
const cnKeys = keySet(zhCn);
const missingInCn = [...twKeys].filter((key) => !cnKeys.has(key));
const cnDuplicates = duplicateKeys(zhCn);

if (missingInCn.length > 0) {
  throw new Error(`zh-CN 缺少 ${missingInCn.length} 個 zh-TW exact_properties 詞條：${missingInCn.slice(0, 10).join(' | ')}`);
}
if (cnDuplicates.size > 0) {
  throw new Error(`zh-CN 有 ${cnDuplicates.size} 個重複 exact_properties key：${[...cnDuplicates].slice(0, 10).join(' | ')}`);
}

const staleBuildArtifacts = [];
for (const [index, entry] of zhCn.exact_properties.entries()) {
  const value = String(entry.val ?? '');
  if (/\u0000|\u0001|\u0002|<System\.Text\.StringBuilder>|LCMapStringEx|<zh-CN>/.test(value)) {
    staleBuildArtifacts.push(index);
  }
}
if (staleBuildArtifacts.length > 0) {
  throw new Error(`zh-CN 有疑似轉換器殘留內容的詞條：${staleBuildArtifacts.slice(0, 10).join(', ')}`);
}

console.log(`AntiLocale Toolkit 語言包檢查通過：zh-TW ${twKeys.size} 個 unique exact_properties；zh-CN ${cnKeys.size} 個，已覆蓋全部繁中詞條`);
