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

function assertEntryContains(localeName, locale, key, fragments) {
  const entry = locale.exact_properties.find((candidate) => candidate.key === key);
  if (!entry) {
    throw new Error(localeName + '.json 缺少必要權限詞條：' + key);
  }
  const value = String(entry.val ?? '');
  const missing = fragments.filter((fragment) => !value.includes(fragment));
  if (missing.length > 0) {
    throw new Error(localeName + '.json 權限詞條 ' + key + ' 缺少翻譯內容：' + missing.join(' | '));
  }
}

const zhTw = loadLocale('zh-TW');
const zhCn = loadLocale('zh-CN');
const twKeys = keySet(zhTw);
const cnKeys = keySet(zhCn);
const missingInCn = [...twKeys].filter((key) => !cnKeys.has(key));
const cnDuplicates = duplicateKeys(zhCn);

const permissionActionMapKey = 'wGb={read_file:"read access to this path",write_file:"write access to this path",read_url:"reading this URL",execute_url:"executing actions on this URL",command:"running this command",unsandboxed:"running this command outside the sandbox",mcp:"using this MCP tool"}';
assertEntryContains('zh-TW', zhTw, permissionActionMapKey, [
  'read_file:"讀取此路徑"',
  'mcp:"使用此 MCP 工具"',
]);
assertEntryContains('zh-CN', zhCn, permissionActionMapKey, [
  'read_file:"读取此路径"',
  'mcp:"使用此 MCP 工具"',
]);
assertEntryContains('zh-TW', zhTw, 'Allow \u0024{Z}?', ['允許 \u0024{Z}？']);
assertEntryContains('zh-CN', zhCn, 'Allow \u0024{Z}?', ['允许 \u0024{Z}？']);
assertEntryContains('zh-TW', zhTw, 'Save rule to always allow \u0024{Z}?', ['儲存規則以一律允許 \u0024{Z}？']);
assertEntryContains('zh-CN', zhCn, 'Save rule to always allow \u0024{Z}?', ['保存规则以始终允许 \u0024{Z}？']);
assertEntryContains('zh-TW', zhTw, '"Yes, and always allow"', ['"是，並一律允許"']);
assertEntryContains('zh-CN', zhCn, '"Yes, and always allow"', ['"是，并始终允许"']);
assertEntryContains('zh-TW', zhTw, 'a;return ({', [
  'Listed ([0-9]+) tasks?',
  '列出 $1 個任務',
  '沒有作用中的任務。',
  '找到子代理',
]);
assertEntryContains('zh-CN', zhCn, 'a;return ({', [
  'Listed ([0-9]+) tasks?',
  '列出 $1 个任务',
  '没有活动任务。',
  '找到子代理',
]);

const mcpToolsCountKey = 'B?`${E} tool${E!==1?"s":""} enabled`:`${v.tools.length} tool${v.tools.length!==1?"s":""} disabled`';
const mcpToolPrefixKey = 'prefix:"MCP Tool:"';
assertEntryContains('zh-TW', zhTw, mcpToolPrefixKey, ['prefix:"MCP 工具："']);
assertEntryContains('zh-CN', zhCn, mcpToolPrefixKey, ['prefix:"MCP 工具："']);
assertEntryContains('zh-TW', zhTw, '"Good response"', ['"回覆良好"']);
assertEntryContains('zh-TW', zhTw, '"Bad response"', ['"回覆不佳"']);
assertEntryContains('zh-CN', zhCn, '"Good response"', ['"回复良好"']);
assertEntryContains('zh-CN', zhCn, '"Bad response"', ['"回复不佳"']);
const copyButtonStateKey = 'J?"Copied":"Copy"';
assertEntryContains('zh-TW', zhTw, copyButtonStateKey, ['J?"已複製":"複製"']);
assertEntryContains('zh-CN', zhCn, copyButtonStateKey, ['J?"已复制":"复制"']);
const quoteButtonKey = 'z.createElement("span",null,"Quote"),z.createElement("span",{className:"text-xs opacity-50"},g)';
const quoteButtonWithShortcutKey = 'z.createElement("span",{className:"text-xs"},"Quote"),f&&z.createElement("span",{className:"text-xs opacity-50"},f)';
assertEntryContains('zh-TW', zhTw, quoteButtonKey, ['z.createElement("span",null,"引用")']);
assertEntryContains('zh-TW', zhTw, quoteButtonWithShortcutKey, ['z.createElement("span",{className:"text-xs"},"引用")']);
assertEntryContains('zh-CN', zhCn, quoteButtonKey, ['z.createElement("span",null,"引用")']);
assertEntryContains('zh-CN', zhCn, quoteButtonWithShortcutKey, ['z.createElement("span",{className:"text-xs"},"引用")']);
const feedbackConfirmationKey = 'u?"Thanks for helping make Gemini better! This is a critical part of evaluating and improving our models.":"Thanks for your feedback!"';
assertEntryContains('zh-TW', zhTw, feedbackConfirmationKey, ['u?"感謝您協助讓 Gemini 變得更好！這是評估及改進我們的模型的重要部分。":"感謝您的意見反映！"']);
assertEntryContains('zh-CN', zhCn, feedbackConfirmationKey, ['u?"感谢您帮助 Gemini 变得更好！这是评估和改进我们的模型的重要部分。":"感谢您的意见反馈！"']);
assertEntryContains('zh-TW', zhTw, 'Click to disable tool', ['按一下以停用工具']);
assertEntryContains('zh-TW', zhTw, 'Click to enable tool', ['按一下以啟用工具']);
assertEntryContains('zh-TW', zhTw, mcpToolsCountKey, ['已啟用 ${E} 個工具', '已停用 ${v.tools.length} 個工具']);
assertEntryContains('zh-CN', zhCn, 'Click to disable tool', ['点击以停用工具']);
assertEntryContains('zh-CN', zhCn, 'Click to enable tool', ['点击以启用工具']);
assertEntryContains('zh-CN', zhCn, mcpToolsCountKey, ['已启用 ${E} 个工具', '已停用 ${v.tools.length} 个工具']);

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
