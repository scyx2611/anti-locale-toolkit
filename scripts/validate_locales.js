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

function assertEntryWithKeyPrefixContains(localeName, locale, keyPrefix, fragments) {
  const entry = locale.exact_properties.find((candidate) => candidate.key.startsWith(keyPrefix));
  if (!entry) {
    throw new Error(localeName + '.json 缺少必要動態詞條前綴：' + keyPrefix);
  }
  const value = String(entry.val ?? '');
  const missing = fragments.filter((fragment) => !value.includes(fragment));
  if (missing.length > 0) {
    throw new Error(localeName + '.json 動態詞條 ' + keyPrefix + ' 缺少翻譯內容：' + missing.join(' | '));
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
const artifactsEmptyKey = 'emptyText:e="No artifacts generated"';
assertEntryContains('zh-TW', zhTw, artifactsEmptyKey, ['emptyText:e="尚未產生成品"']);
assertEntryContains('zh-CN', zhCn, artifactsEmptyKey, ['emptyText:e="尚未生成产物"']);
const modelBadgeRendererPrefix = 'var zW=({option:a})=>{var b=xB();return';
assertEntryWithKeyPrefixContains('zh-TW', zhTw, modelBadgeRendererPrefix, [
  'a.tagTitle==="Fast"?"快速"',
  'a.tagTitle==="Limited time"?"限時提供"',
  'a.tagDescription==="Fast"?"快速"',
  'a.tagDescription==="Limited time"?"限時提供"',
]);
assertEntryWithKeyPrefixContains('zh-CN', zhCn, modelBadgeRendererPrefix, [
  'a.tagTitle==="Fast"?"快速"',
  'a.tagTitle==="Limited time"?"限时提供"',
  'a.tagDescription==="Fast"?"快速"',
  'a.tagDescription==="Limited time"?"限时提供"',
]);
const modelSkillsTitlePrefix = 'var J1=({title:a,titleSuffix:b,count:c,badgeCount:e,actions:f,children:g,collapsible:h=!1';
const runtimeSkillsTitleKey = 'a=a==="'+ String.fromCharCode(92) + 'u0053kills Used"?';
assertEntryWithKeyPrefixContains('zh-TW', zhTw, modelSkillsTitlePrefix, [
  runtimeSkillsTitleKey + '"使用的技能":a;',
]);
assertEntryWithKeyPrefixContains('zh-CN', zhCn, modelSkillsTitlePrefix, [
  runtimeSkillsTitleKey + '"使用的技能":a;',
]);
const quotaLabelKey = 'label:z.createElement("span",{className:e?"text-secondary-foreground":""},a)';
const quotaBucketKey = 'z.createElement("span",{className:"text-foreground truncate"},\nm.displayName)';
for (const key of [quotaLabelKey, quotaBucketKey]) {
  assertEntryContains('zh-TW', zhTw, key, ['Weekly Limit Remaining', 'Five Hour Limit Remaining']);
  assertEntryContains('zh-CN', zhCn, key, ['\\u0057eekly Limit Remaining', '\\u0046ive Hour Limit Remaining']);
}
const codeTick = String.fromCharCode(96);
const dollar = '$';
const branchSubtitleKey = 'subtitle:l?' + codeTick + 'All changes since ' + dollar + '{l}' + codeTick;
assertEntryContains('zh-TW', zhTw, branchSubtitleKey, ['subtitle:l?' + codeTick + '自 ' + dollar + '{l} 起的所有變更' + codeTick]);
assertEntryContains('zh-CN', zhCn, branchSubtitleKey, ['subtitle:l?' + codeTick + '自 ' + dollar + '{l} 以来的所有更改' + codeTick]);
assertEntryContains('zh-TW', zhTw, '"All changes since the branch point"', ['"自分支起點以來的所有變更"']);
assertEntryContains('zh-CN', zhCn, '"All changes since the branch point"', ['"自分支起点以来的所有更改"']);
const commitTooltipKey = 'tooltip:(a?.stagedChanges?.length??0)>0?"Commit staged changes":"Stage and commit all changes"';
assertEntryContains('zh-TW', zhTw, commitTooltipKey, ['tooltip:(a?.stagedChanges?.length??0)>0?"提交已暫存的變更":"暫存並提交所有變更"']);
assertEntryContains('zh-CN', zhCn, commitTooltipKey, ['tooltip:(a?.stagedChanges?.length??0)>0?"提交已暂存的更改":"暂存并提交所有更改"']);
assertEntryContains('zh-TW', zhTw, '"No commits to push"', ['"沒有可推送的提交"']);
assertEntryContains('zh-CN', zhCn, '"No commits to push"', ['"没有可推送的提交"']);
const pushCommitTooltipKey = codeTick + 'Push ' + dollar + '{c} commit' + dollar + '{c===1?"":"s"} to ' + dollar + '{b}' + codeTick;
assertEntryContains('zh-TW', zhTw, pushCommitTooltipKey, [codeTick + '推送 ' + dollar + '{c} 個提交至 ' + dollar + '{b}' + codeTick]);
assertEntryContains('zh-CN', zhCn, pushCommitTooltipKey, [codeTick + '推送 ' + dollar + '{c} 个提交到 ' + dollar + '{b}' + codeTick]);
const publishTooltipKey = codeTick + 'Publish ' + dollar + '{a.currentRef} to origin' + codeTick;
assertEntryContains('zh-TW', zhTw, publishTooltipKey, [codeTick + '將 ' + dollar + '{a.currentRef} 發布至 origin' + codeTick]);
assertEntryContains('zh-CN', zhCn, publishTooltipKey, [codeTick + '将 ' + dollar + '{a.currentRef} 发布到 origin' + codeTick]);
assertEntryContains('zh-TW', zhTw, ':"Push"', [':"推送"']);
assertEntryContains('zh-CN', zhCn, ':"Push"', [':"推送"']);
const conversationPinTooltipKey = 'content:Na?"Unpin":"Pin"';
assertEntryContains('zh-TW', zhTw, conversationPinTooltipKey, ['content:Na?"取消置頂":"置頂"']);
assertEntryContains('zh-CN', zhCn, conversationPinTooltipKey, ['content:Na?"取消置顶":"置顶"']);
const conversationPinAriaKey = '"aria-label":Na?"Unpin conversation":"Pin conversation"';
assertEntryContains('zh-TW', zhTw, conversationPinAriaKey, ['"aria-label":Na?"取消置頂對話":"置頂對話"']);
assertEntryContains('zh-CN', zhCn, conversationPinAriaKey, ['"aria-label":Na?"取消置顶对话":"置顶对话"']);
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
