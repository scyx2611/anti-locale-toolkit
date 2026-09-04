param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

Set-StrictMode -Version Latest

$twPath = Join-Path $ProjectRoot 'locales\zh-TW.json'
$cnPath = Join-Path $ProjectRoot 'locales\zh-CN.json'

if (-not ('ChineseMap' -as [type])) {
  Add-Type -TypeDefinition @'
using System;
using System.Text;
using System.Runtime.InteropServices;

public static class ChineseMap {
  [DllImport("kernel32.dll", CharSet = CharSet.Unicode)]
  public static extern int LCMapStringEx(
    string locale,
    uint flags,
    string source,
    int sourceLength,
    StringBuilder destination,
    int destinationLength,
    IntPtr version,
    IntPtr reserved,
    IntPtr sortHandle);
}
'@
}

function Convert-ToSimplified([string]$Text) {
  if ($null -eq $Text -or $Text.Length -eq 0) {
    return $Text
  }

  $capacity = [Math]::Max(256, ($Text.Length * 2) + 2)
  $destination = [Text.StringBuilder]::new($capacity)
  $length = [ChineseMap]::LCMapStringEx(
    'zh-CN',
    0x02000000,
    $Text,
    $Text.Length,
    $destination,
    $destination.Capacity,
    [IntPtr]::Zero,
    [IntPtr]::Zero,
    [IntPtr]::Zero)

  if ($length -gt 0) {
    return $destination.ToString(0, $length)
  }
  return $Text
}

function Normalize-CnText([string]$Text) {
  if ($null -eq $Text) {
    return $Text
  }

  $normalized = Convert-ToSimplified $Text
  $phraseMap = @(
    @('什麽', '什么'),
    @('麽', '么'),
    @('於', '于'),
    @('全域', '全局'),
    @('後續', '后续'),
    @('後', '后'),
    @('排程', '计划'),
    @('区段', '部分'),
    @('闲置', '空闲'),
    @('外挂模组', '插件模块'),
    @('外挂', '插件'),
    @('扩充功能', '扩展功能'),
    @('扩充', '扩展'),
    @('伺服器', '服务器'),
    @('远端', '远程'),
    @('即时', '实时'),
    @('回圈', '循环'),
    @('核准', '批准'),
    @('审查', '审核'),
    @('资讯', '信息'),
    @('资料夹', '文件夹'),
    @('资料库', '数据库'),
    @('资料表', '数据表'),
    @('资料', '数据'),
    @('网域', '域名'),
    @('網頁', '网页'),
    @('页签', '标签页'),
    @('页面', '页面'),
    @('栏位', '字段'),
    @('透过', '通过'),
    @('呼叫', '调用'),
    @('使用者', '用户'),
    @('个人化', '个性化'),
    @('终端机指令', '终端命令'),
    @('终端机', '终端'),
    @('指令', '命令'),
    @('快速键', '快捷键'),
    @('斜线', '斜杠'),
    @('计划', '计划'),
    @('连结', '链接'),
    @('新增', '新建'),
    @('建立', '创建'),
    @('回报', '报告'),
    @('讯息', '消息'),
    @('连线', '连接'),
    @('变更', '更改'),
    @('储存', '保存'),
    @('读取', '读取'),
    @('写入', '写入'),
    @('选项', '选项'),
    @('内嵌', '内嵌'),
    @('互动', '互动'),
    @('视觉化', '可视化'),
    @('控制项', '控件'),
    @('标示', '标记'),
    @('登出', '退出登录'),
    @('登入', '登录'),
    @('帐单', '账单'),
    @('帐户', '账户'),
    @('一律', '始终'),
    @('着重', '注重'),
    @('适用于', '适用于'),
    @('优先考量', '优先考虑'),
    @('档案总管', '文件资源管理器'),
    @('檔案總管', '文件资源管理器'),
    @('应用程式', '应用程序'),
    @('應用程式', '应用程序'),
    @('资料夹', '文件夹'),
    @('資料夾', '文件夹'),
    @('资料库', '数据库'),
    @('資料庫', '数据库'),
    @('资料表', '数据表'),
    @('資料表', '数据表'),
    @('档案', '文件'),
    @('檔案', '文件'),
    @('专案', '项目'),
    @('專案', '项目'),
    @('设定', '设置'),
    @('設定', '设置'),
    @('网路', '网络'),
    @('網路', '网络'),
    @('程式', '程序'),
    @('检视', '查看'),
    @('檢視', '查看'),
    @('开启', '打开'),
    @('開啟', '打开'),
    @('载入', '加载'),
    @('載入', '加载'),
    @('搜寻', '搜索'),
    @('搜尋', '搜索'),
    @('外挂', '插件'),
    @('外掛', '插件'),
    @('自订', '自定义'),
    @('自訂', '自定义'),
    @('回馈', '反馈'),
    @('回饋', '反馈'),
    @('帐户', '账户'),
    @('帳戶', '账户'),
    @('额度', '配额'),
    @('執行個體', '实例'),
    @('执行个体', '实例'),
    @('撷取', '提取'),
    @('擷取', '提取'),
    @('连线', '连接'),
    @('連線', '连接'),
    @('讯息', '消息'),
    @('訊息', '消息'),
    @('传送', '发送'),
    @('傳送', '发送'),
    @('重设', '重置'),
    @('重設', '重置'),
    @('储存', '保存'),
    @('儲存', '保存'),
    @('预设', '默认'),
    @('預設', '默认'),
    @('视窗', '窗口'),
    @('視窗', '窗口'),
    @('选单', '菜单'),
    @('選單', '菜单')
  )

  foreach ($pair in $phraseMap) {
    $normalized = $normalized.Replace($pair[0], $pair[1])
  }

  return $normalized.Replace('zhTw', 'zhCn').Replace('ZhTw', 'ZhCn')
}

$tw = Get-Content -LiteralPath $twPath -Raw -Encoding UTF8 | ConvertFrom-Json
$cn = Get-Content -LiteralPath $cnPath -Raw -Encoding UTF8 | ConvertFrom-Json
$existing = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)

foreach ($entry in $cn.exact_properties) {
  [void]$existing.Add($entry.key)
  $entry.val = Normalize-CnText $entry.val
  if ($entry.PSObject.Properties.Name -contains 'description') {
    $entry.description = Normalize-CnText $entry.description
  }
}

$added = 0
foreach ($entry in $tw.exact_properties) {
  if ($existing.Contains($entry.key)) {
    continue
  }

  $newEntry = [ordered]@{
    key = $entry.key
    val = Normalize-CnText $entry.val
  }
  if ($entry.PSObject.Properties.Name -contains 'description') {
    $newEntry.description = Normalize-CnText $entry.description
  }
  $cn.exact_properties += [pscustomobject]$newEntry
  [void]$existing.Add($entry.key)
  $added++
}

$utf8NoBom = [Text.UTF8Encoding]::new($false)
$json = $cn | ConvertTo-Json -Depth 100
[IO.File]::WriteAllText($cnPath, $json, $utf8NoBom)

Write-Output "Merged $added missing zh-TW exact_properties entries into zh-CN.json."
Write-Output "zh-CN exact_properties count: $($cn.exact_properties.Count)"
