export const SUPPORTED_LOCALES = Object.freeze(['en', 'zh-CN', 'zh-TW']);

export function normalizeLocale(value, fallback = 'zh-TW') {
  const locale = String(value || '').trim().replace('_', '-').toLowerCase();
  if (locale === 'en' || locale.startsWith('en-')) return 'en';
  if (['zh-cn', 'zh-hans', 'zh-sg'].includes(locale)) return 'zh-CN';
  if (locale === 'zh' || ['zh-tw', 'zh-hant', 'zh-hk', 'zh-mo'].includes(locale)) return 'zh-TW';
  return SUPPORTED_LOCALES.includes(fallback) ? fallback : 'zh-TW';
}

const en = {
  appTitle: 'Conversation Tree', loadingPrompts: 'Reading local prompts…', switchProject: 'Switch Codex project',
  switchMainChat: 'Switch main chat', appearance: 'Plugin appearance', themeAuto: '◐ Auto', themeLight: '☀ Light',
  themeDark: '● Dark', refresh: '↻ Refresh', mainline: 'Mainline', returnMainline: 'Return to mainline ↗',
  canvasAria: 'Conversation tree; hold and drag blank space to pan the canvas',
  emptyTree: 'No prompts yet. Send the first message to grow the first node.', selectedPrompt: 'Selected prompt',
  rename: 'Rename', copyPrompt: 'Copy prompt', nativeNavigation: 'Native navigation · Desktop bridge',
  nativeNavigationTitle: 'Triggered through the Codex native prompt rail by the desktop bridge', zeroNodes: '0 nodes',
  polling: 'Reading local history every 3 seconds', diagnosticsSummary: 'Capabilities and limitations',
  diagnosticsOne: 'Clicking a node first opens its chat, then the desktop bridge invokes the native Codex prompt rail. Creating a branch switches to the new chat; returning to the mainline works the same way. Start Codex with the dedicated launcher to use the desktop bridge. Branches share the working directory.',
  diagnosticsTwo: 'The panel shows the selected mainline, branches created by this plugin, and their native descendant branches. Node titles initially use a short excerpt and can be renamed.',
  waitingHost: 'Waiting for host connection', exploreBranch: 'EXPLORE A BRANCH', branchFromHere: 'Create a branch here',
  name: 'Name', branchPlaceholder: 'Example: compare approaches', cancel: 'Cancel', createBranch: 'Create branch',
  operationIncomplete: 'The operation did not complete', missingPanelData: 'The host did not return panel data (_meta.tree)',
  localConnectionFailed: 'Local connection failed', switchedTree: 'Switched project and conversation tree.',
  locating: 'Locating the corresponding prompt…', switchedAndQueued: 'Switched chat and sent the navigation request.',
  queuedNavigation: 'Sent the navigation request to the desktop bridge.', openChatRequested: 'Asked Codex to open the chat.',
  alreadyCurrentChat: 'Already in the current chat.', retryNode: ' Click the node to retry; do not create the branch again.',
  unspecifiedProject: 'Unspecified project', count: '{nodes} prompts · {branches} branches', synced: 'Synced {time}',
  detailHint: 'The selected prompt appears below. When Codex is started with the desktop bridge, clicking a node triggers native prompt navigation.{suffix}',
  notBranchable: ' This node is not the final prompt of a completed turn.', emptyBranchMeta: 'New branch · Waiting for first prompt',
  mainlineMeta: 'Mainline', branchMeta: 'Branch', completed: 'Completed', interrupted: 'In progress or interrupted',
  createBranchShort: '＋ Create branch', forkAria: 'Create a branch from “{title}”', dragNode: 'Drag node',
  dragAria: 'Drag “{title}”', renameTitle: 'Rename this node', forkTitle: 'Create a branch here',
  renameDescription: 'Change the title shown in the tree. The original prompt stays unchanged.',
  forkDescription: 'Create an independent chat from the completed turn containing “{title}”. The host opens the new chat; continue in the native composer. The working directory is shared.',
  saveName: 'Save name', createIndependentChat: 'Create independent chat', createdBranch: 'Created “🌿 {name}”.',
  promptCopied: 'Prompt copied.', clipboardDenied: 'The host did not allow clipboard access; select the original text above to copy it.',
  refreshed: 'Loaded the latest local chats and project list.', previewDiagnostic: 'Environment: local browser preview (not the native plugin panel)\nData: real local Codex history\nNative prompt navigation: desktop bridge required',
  panelUpdated: 'Conversation Tree panel data was updated.', panelResource: 'Conversation Tree panel', listTrees: 'List conversation trees',
  switchTree: 'Switch conversation tree', updateTree: 'Update conversation tree', renameNode: 'Rename node',
  locatePrompt: 'Locate prompt', preparePromptLocation: 'Prepare prompt navigation', createIndependentBranch: 'Create independent conversation branch',
  invalidChatId: 'Invalid chat ID', unnamedChat: 'Unnamed chat', rootChatMissing: 'This mainline chat was not found; it may have been deleted or may be a branch.',
  noChats: 'No Codex chats were found. Create a chat in any project, then reopen Conversation Tree.',
  configMissingRoot: 'No mainline chat ID is configured. Run the setup wizard or edit {path}.', userConfig: 'the user configuration file',
  activeSyncFailed: 'Active chat sync failed: {message}', staleBranchCleanupFailed: '{name}: could not remove the deleted branch relationship ({message})',
  nativeBranch: 'Native branch', nativeBranchSyncFailed: 'Native branch sync failed: {message}', currentConversation: 'Current conversation',
  nodeNotFound: 'Node not found', invalidTitle: 'The title must contain 1–60 characters', missingNativeLocation: 'This node is missing native navigation data',
  nativePromptMissing: 'The prompt could not be found by native Codex navigation. Switch to the corresponding chat and try again.',
  bridgeDisconnected: 'The desktop bridge is not connected. Fully quit Codex, then reopen it with the “Codex Conversation Tree” desktop shortcut.',
  forkBusy: 'The previous branch is still being created', forkOnlyCompleted: 'A branch can only be created from the final prompt of a completed turn',
  invalidBranchName: 'Enter a branch name containing 1–60 characters', forkSaveFailed: 'The branch was created ({id}), but its tree relationship could not be saved: {message}. Do not create it again.',
  forkRenameFailed: 'The branch was created, but it could not be named. Chat ID: {id}',
  forkRefreshFailed: 'The branch was created ({id}), but refresh failed: {message}. Use Refresh and do not create it again.',
  attachmentOnly: '(This prompt contains only images or attachments)', attachmentTitle: 'Image or attachment',
  branchBoundaryMissing: 'The branch source turn is not present in history; linking stopped to avoid showing an incorrect relationship.',
};

const zhCN = {
  appTitle:'对话树',loadingPrompts:'读取本地提示词…',switchProject:'切换 Codex 项目',switchMainChat:'切换主线聊天',appearance:'插件外观',themeAuto:'◐ 自动',themeLight:'☀ 浅色',themeDark:'● 深色',refresh:'↻ 更新',mainline:'主线',returnMainline:'回到主线 ↗',canvasAria:'对话树；按住空白处可移动画布',emptyTree:'还没有提示词。发送第一则消息后，这里会长出第一个节点。',selectedPrompt:'选中的提示词',rename:'重新命名',copyPrompt:'复制提示词',nativeNavigation:'原生定位 · 桌面桥接',nativeNavigationTitle:'由桌面桥接触发 Codex 原生提示词导航条',zeroNodes:'0 个节点',polling:'每 3 秒读取本地历史',diagnosticsSummary:'能力与限制',diagnosticsOne:'点击节点会先请求打开所属聊天，再由桌面桥接触发 Codex 原生导航条。创建分支后会切换到新聊天，回到主线亦同。桌面桥接需要使用专用启动器启动 Codex。分支共用工作目录。',diagnosticsTwo:'目前显示设置的主线、插件创建的分支，以及它们的原生后代分支。节点标题先使用原文短句，可手动改名。',waitingHost:'等待宿主连接',exploreBranch:'探索分支',branchFromHere:'从这里创建分支',name:'名称',branchPlaceholder:'例如：比较两种方案',cancel:'取消',createBranch:'创建分支',operationIncomplete:'操作未完成',missingPanelData:'宿主未返回面板数据（_meta.tree）',localConnectionFailed:'本地连接失败',switchedTree:'已切换项目与对话树。',locating:'正在定位对应提示词…',switchedAndQueued:'已切换聊天并发送定位指令。',queuedNavigation:'已将定位指令发送至桌面桥接器。',openChatRequested:'已向 Codex 请求打开聊天。',alreadyCurrentChat:'已在当前聊天。',retryNode:' 可点击节点重试，无需再次创建分支。',unspecifiedProject:'未指定项目',count:'{nodes} 个提示词 · {branches} 条分支',synced:'已同步 {time}',detailHint:'下方为所选提示词；使用桌面桥接启动 Codex 后，点击节点会触发原生导航条定位。{suffix}',notBranchable:' 此节点尚不符合已完成回合分支条件。',emptyBranchMeta:'新分支 · 等待第一则提示词',mainlineMeta:'主线',branchMeta:'分支',completed:'已完成',interrupted:'进行中或已中断',createBranchShort:'＋ 创建分支',forkAria:'从“{title}”创建分支',dragNode:'拖动节点',dragAria:'拖动“{title}”',renameTitle:'为节点换个名字',forkTitle:'从这里创建分支',renameDescription:'修改树上的标题，原始提示词保持不变。',forkDescription:'从“{title}”所在的已完成回合创建独立聊天。创建后通过宿主打开新聊天，再直接在聊天框输入。工作目录共用。',saveName:'保存名称',createIndependentChat:'创建独立聊天',createdBranch:'已创建“🌿 {name}”。',promptCopied:'提示词已复制。',clipboardDenied:'宿主未开放剪贴板；可直接选择上方原文复制。',refreshed:'已读取最新的本地对话与项目列表。',previewDiagnostic:'环境：本地浏览器预览（不是原生插件面板）\n数据：真实本地 Codex 历史\n原生消息跳转：需要桌面桥接',panelUpdated:'对话树面板数据已更新。',panelResource:'对话树面板',listTrees:'列出可用对话树',switchTree:'切换对话树',updateTree:'更新对话树',renameNode:'修改节点名称',locatePrompt:'定位提示词',preparePromptLocation:'准备提示词定位',createIndependentBranch:'创建独立对话分支',invalidChatId:'无效的对话 ID',unnamedChat:'未命名对话',rootChatMissing:'找不到这个主线聊天；它可能已被删除或属于分支',noChats:'找不到可用的 Codex 聊天。请先在任一项目创建聊天，再重新打开对话树。',configMissingRoot:'尚未设置主线对话 ID。请运行安装向导，或编辑 {path}。',userConfig:'用户设置文件',activeSyncFailed:'活动聊天同步失败：{message}',staleBranchCleanupFailed:'{name}：已删除的分支无法清理本地关系（{message}）',nativeBranch:'原生分支',nativeBranchSyncFailed:'原生分支同步失败：{message}',currentConversation:'当前对话',nodeNotFound:'找不到节点',invalidTitle:'标题需介于 1–60 个字符',missingNativeLocation:'此节点缺少原生定位数据',nativePromptMissing:'Codex 原生导航中找不到这个提示词；请确认已切换到对应聊天后再重试',bridgeDisconnected:'桌面桥接器未连接。请完全退出 Codex，再使用桌面的“Codex 对话树”快捷方式重新打开。',forkBusy:'上一个分支仍在创建中',forkOnlyCompleted:'只能从已完成回合的最后一则提示词创建分支',invalidBranchName:'请输入 1–60 个字符的分支名称',forkSaveFailed:'分支已创建（{id}），但保存树关系失败：{message}。请勿重试创建。',forkRenameFailed:'分支已创建，但命名未成功。对话 ID：{id}',forkRefreshFailed:'分支已创建（{id}），但刷新失败：{message}。请使用更新按钮，勿重复创建。',attachmentOnly:'（此提示词只有图片或附件）',attachmentTitle:'图片或附件',branchBoundaryMissing:'分支的来源回合不在历史中；停止连接以免显示错误关系。'
};

const zhTW = {
  appTitle:'對話樹',loadingPrompts:'讀取本機提示詞…',switchProject:'切換 Codex 項目',switchMainChat:'切換主線聊天',appearance:'插件外觀',themeAuto:'◐ 自動',themeLight:'☀ 淺色',themeDark:'● 深色',refresh:'↻ 更新',mainline:'主線',returnMainline:'回到主線 ↗',canvasAria:'對話樹；按住空白處可移動畫布',emptyTree:'還沒有提示詞。發送第一則訊息後，這裡會長出第一個節點。',selectedPrompt:'選中的提示詞',rename:'重新命名',copyPrompt:'複製提示詞',nativeNavigation:'原生定位 · 桌面橋接',nativeNavigationTitle:'由桌面橋接觸發 Codex 原生提示詞導覽條',zeroNodes:'0 個節點',polling:'每 3 秒讀取本機歷史',diagnosticsSummary:'能力與限制',diagnosticsOne:'點節點會先請求開啟所屬聊天，再由桌面橋接觸發 Codex 原生導覽條。建立分支後會切換到新聊天，回到主線亦同。桌面橋接需要使用專用啟動器啟動 Codex。分支共用工作目錄。',diagnosticsTwo:'目前顯示設定的主線、插件建立的分支，以及它們的原生後代分支。節點標題先使用原文短句，可手動改名。',waitingHost:'等待宿主連接',exploreBranch:'探索分支',branchFromHere:'從這裡建立分支',name:'名稱',branchPlaceholder:'例如：比較兩種方案',cancel:'取消',createBranch:'建立分支',operationIncomplete:'操作未完成',missingPanelData:'宿主未回傳面板資料（_meta.tree）',localConnectionFailed:'本機連線失敗',switchedTree:'已切換項目與對話樹。',locating:'正在定位對應提示詞…',switchedAndQueued:'已切換聊天並送出定位指令。',queuedNavigation:'已將定位指令送至桌面橋接器。',openChatRequested:'已向 Codex 請求開啟聊天。',alreadyCurrentChat:'已在目前聊天。',retryNode:' 可點節點重試開啟，無須再次建立分支。',unspecifiedProject:'未指定項目',count:'{nodes} 個提示詞 · {branches} 條支線',synced:'已同步 {time}',detailHint:'下方為所選提示詞；使用桌面橋接啟動 Codex 後，點節點會觸發原生導覽條定位。{suffix}',notBranchable:' 此節點尚不符合已完成回合分支條件。',emptyBranchMeta:'新支線 · 等待第一則提示詞',mainlineMeta:'主線',branchMeta:'支線',completed:'已完成',interrupted:'進行中或已中斷',createBranchShort:'＋ 建立分支',forkAria:'從「{title}」建立分支',dragNode:'拖曳節點',dragAria:'拖曳「{title}」',renameTitle:'為節點換個名字',forkTitle:'從這裡建立分支',renameDescription:'修改樹上的標題，原始提示詞保持不變。',forkDescription:'從「{title}」所在的已完成回合建立獨立聊天。建立後透過宿主開啟新聊天，再直接在聊天框輸入。工作目錄共用。',saveName:'保存名稱',createIndependentChat:'建立獨立聊天',createdBranch:'已建立「🌿 {name}」。',promptCopied:'提示詞已複製。',clipboardDenied:'宿主未開放剪貼簿；可直接選取上方原文複製。',refreshed:'已讀取最新的本機對話與項目清單。',previewDiagnostic:'環境：本機瀏覽器預覽（不是原生插件面板）\n資料：真實本機 Codex 歷史\n原生訊息跳轉：需要桌面橋接',panelUpdated:'對話樹面板資料已更新。',panelResource:'對話樹面板',listTrees:'列出可用對話樹',switchTree:'切換對話樹',updateTree:'更新對話樹',renameNode:'修改節點名稱',locatePrompt:'定位提示詞',preparePromptLocation:'準備提示詞定位',createIndependentBranch:'建立獨立對話分支',invalidChatId:'無效的對話 ID',unnamedChat:'未命名對話',rootChatMissing:'找不到這個主線聊天；它可能已被刪除或屬於分支',noChats:'找不到可用的 Codex 聊天。請先在任一項目建立聊天，再重新開啟對話樹。',configMissingRoot:'尚未設定主線對話 ID。請執行安裝精靈，或編輯 {path}。',userConfig:'使用者設定檔',activeSyncFailed:'活動聊天同步失敗：{message}',staleBranchCleanupFailed:'{name}：已刪除的分支無法清理本機關係（{message}）',nativeBranch:'原生分支',nativeBranchSyncFailed:'原生分支同步失敗：{message}',currentConversation:'目前對話',nodeNotFound:'找不到節點',invalidTitle:'標題需介於 1–60 個字',missingNativeLocation:'此節點缺少原生定位資料',nativePromptMissing:'Codex 原生導航中找不到這個提示詞；請確認已切換到對應聊天後再重試',bridgeDisconnected:'桌面橋接器未連接。請完全退出 Codex，再使用桌面的「Codex 對話樹」捷徑重新開啟。',forkBusy:'上一個分支仍在建立中',forkOnlyCompleted:'只能從已完成回合的最後一則提示詞建立分支',invalidBranchName:'請輸入 1–60 個字的分支名稱',forkSaveFailed:'分支已建立（{id}），但保存樹關係失敗：{message}。請勿重試建立。',forkRenameFailed:'分支已建立，但命名未成功。對話 ID：{id}',forkRefreshFailed:'分支已建立（{id}），但刷新失敗：{message}。請使用更新按鈕，勿重複建立。',attachmentOnly:'（此提示詞只有圖片或附件）',attachmentTitle:'圖片或附件',branchBoundaryMissing:'分支的來源回合不在歷史中；停止連線以免顯示錯誤關係。'
};

const dictionaries = { en, 'zh-CN': zhCN, 'zh-TW': zhTW };

export function missingTranslationKeys(locale) {
  const normalized = normalizeLocale(locale);
  const expected = Object.keys(en);
  return expected.filter(key => !Object.prototype.hasOwnProperty.call(dictionaries[normalized], key));
}

export function translate(locale, key, variables = {}) {
  const normalized = normalizeLocale(locale);
  const template = dictionaries[normalized]?.[key] ?? dictionaries['zh-TW'][key] ?? dictionaries.en[key] ?? key;
  return String(template).replace(/\{(\w+)\}/g, (_, name) => variables[name] ?? `{${name}}`);
}
