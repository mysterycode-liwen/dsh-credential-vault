window.__ModuleLoader__.load({
  id: '@mysterycode-liwen/dsh-credential-vault',
  factory(require) {
    var React = require('react');
    var h = React.createElement;
    var useState = React.useState;
    var useEffect = React.useEffect;
    var useRef = React.useRef;

    var STORAGE_KEY = '@local/dsh-credential-vault:entries:v1';
    var STORAGE_KEY_LEGACY = '@local/credential-vault:entries:v1';
    var MASK = '••••••••••••';
    var PANEL_ID = 'dsh-credential-vault';
    // Same-origin path served by the Host half (index.js). Relative so it works
    // whatever port the Web GUI is on.
    var API = 'dsh-credential-vault/';
    /** Plugin version shown in Settings; keep in sync with package.json on release. */
    var VERSION = '1.5.3';

    // Compare two semver-ish strings: -1 (left older), 0 (equal), 1 (left newer).
    // Used to decide "update available" against THIS client's version, so the
    // decision can't disagree with the version shown in the UI (host index.js
    // may still hold an older CURRENT_VERSION until Harness is restarted).
    function compareVersions(a, b) {
      function parts(v) {
        var m = String(v || '').trim().replace(/^v/i, '').match(/^(\d+)\.(\d+)\.(\d+)/);
        return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [0, 0, 0];
      }
      var x = parts(a), y = parts(b);
      for (var i = 0; i < 3; i++) {
        if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1;
      }
      return 0;
    }

    var DICTS = {
      en: {
        title: 'Credential vault', subtitle: 'Your accounts, passwords & API keys in one place',
        add: 'Add', items: 'items',
        sort: 'Sort', sortRecent: 'Recently updated', sortTitle: 'Name (A–Z)', sortCategory: 'Type',
        search: 'Search name, account, URL or notes…',
        filterAll: 'All', filterAccount: 'Accounts', filterApikey: 'API keys', filterOther: 'Other',
        filterWechatMp: 'Official Accounts', filterWechatMini: 'Mini Programs', filterSecretKey: 'Secret keys',
        localNotice: 'Stored locally in this browser (localStorage) on this device. Not synced or encrypted — avoid shared / public browsers.',
        show: 'Show', hide: 'Hide', copy: 'Copy', visit: 'Visit', copied: 'Copied to clipboard', copyFail: 'Copy failed — select the text manually',
        visitFail: 'Could not open the browser. Check the URL and try again.',
        visitHint: 'Returning to the conversation to open the browser…',
        edit: 'Edit', delete: 'Delete',
        emptyTitle: 'No credentials yet', emptyText: 'Click “Add” to save your first account, password or API key.',
        emptyFiltered: 'No matches',
        editorNew: 'New credential', editorEdit: 'Edit credential',
        fTitle: 'Name', fTitlePh: 'e.g. GitHub, Google', fTitlePhApikey: 'e.g. OpenAI, AWS, GitHub PAT', fTitlePhOther: 'e.g. Recovery codes, Wi-Fi, License',
        fTitlePhWechatMp: 'e.g. My Official Account', fTitlePhWechatMini: 'e.g. My Mini Program',
        fTitlePhSecretKey: 'e.g. GitHub PAT, service token',
        fCategory: 'Type', formDetails: 'Credentials', moreFields: 'More fields', lessFields: 'Fewer fields',
        fAccount: 'Account / username', fAccountPh: 'user@example.com',
        fPassword: 'Password', fPasswordPh: 'Enter password',
        fUrl: 'Login URL (optional)', fUrlPh: 'https://…',
        fProvider: 'Platform / provider', fProviderPh: 'e.g. OpenAI, Anthropic, AWS',
        fApiKey: 'API key / token', fApiKeyPh: 'sk-… / ghp_… / paste token',
        fEndpoint: 'API endpoint / base URL', fEndpointPh: 'https://api.openai.com/v1',
        fExpiry: 'Expires on (optional)',
        fContent: 'Content / secret', fContentPh: 'Recovery codes, license key, certificate, PIN…',
        fNotes: 'Notes (optional)', fNotesPh: 'Any extra info…',
        fLinks: 'Linked credentials', linkNone: 'No API Key / Key / Other credentials yet', linkMissing: 'Linked credential no longer exists', linkPlaceholder: 'Select credentials…', linkSearch: 'Search by name…', linkSelected: 'selected', linkNoMatch: 'No matching credentials', linkClear: 'Clear',
        fAppId: 'AppID', fAppIdPh: 'wx…',
        fAppSecret: 'AppSecret', fAppSecretPh: 'Application secret',
        fToken: 'Server Token', fTokenPh: 'Token from server config',
        fAesKey: 'EncodingAESKey', fAesKeyPh: '43-char message encryption key',
        fServerUrl: 'Server URL', fServerUrlPh: 'https://… (callback URL)',
        fUploadKey: 'Code upload key', fUploadKeyPh: 'Private key used to upload mini program code',
        fDomains: 'Server domains', fDomainsPh: 'request / socket / upload / download domains',
        fKeyName: 'Key name', fKeyNamePh: 'e.g. access token, webhook secret',
        fKeyValue: 'Secret value', fKeyValuePh: 'Paste the token / secret / password',
        catAccount: 'Account', catApikey: 'API key', catOther: 'Other',
        catWechatMp: 'WeChat Official Account', catWechatMini: 'WeChat Mini Program', catSecretKey: 'Secret key',
        hintAccount: 'For website / app logins — username and password.',
        hintApikey: 'For platform-issued API keys, tokens and endpoints.',
        hintOther: 'For recovery codes, licenses, certificates or any free text.',
        hintWechatMp: 'For WeChat Official Account developer credentials and server config.',
        hintWechatMini: 'For WeChat Mini Program developer credentials and upload key.',
        hintSecretKey: 'For miscellaneous name + value secrets — tokens, secrets, passwords.',
        save: 'Save', cancel: 'Cancel', required: 'Please enter a name',
        confirmDelete: 'Delete this credential? This cannot be undone.',
        saved: 'Saved', deleted: 'Deleted', revealAll: 'Reveal all', hideAll: 'Hide all',
        settingsNav: 'Credential vault',
        secTitle: 'Access password', secDesc: 'Protect the vault with an access password. When enabled, you must enter it to view your credentials.',
        secEnable: 'Require access password', secEnableHint: 'When on, the vault locks on open and after a period of inactivity.',
        secSetPassword: 'Set / change access password', secCurrent: 'Current password', secNew: 'New password', secConfirm: 'Confirm new password',
        secSavePassword: 'Save password', secPasswordOn: 'Access password is enabled', secPasswordOff: 'Access password is disabled',
        secEnabledLocked: 'Access password enabled — the vault is now locked.',
        secDisableHint: 'Enter your current access password to turn this off.', secDisableConfirm: 'Turn off',
        secIdle: 'Auto-lock after inactivity', secIdleHint: 'When on, the vault re-locks after a period of inactivity (requires the access password).',
        secIdleOn: 'Auto-lock is on', secIdleOff: 'Auto-lock is off', secIdleDuration: 'Lock after',
        idleMinute: 'minute', idleMinutes: 'minutes', idleHour: 'hour', idleHours: 'hours',
        secCompleteSetup: 'Before enabling, set a password and a security question so you can recover access.',
        secNeedSetupFirst: 'Set a password and a security question before enabling.',
        secQuestion: 'Security question', secAnswer: 'Security answer', secAnswerHint: 'Used to reset the access password if you forget it. Stored hashed, never shown again.',
        secCustomQuestion: 'Custom question', secSaveQuestion: 'Save security question', secQuestionSet: 'Security question has been set.',
        secQCurrentHint: 'Enter your current access password to change the security question.', secCurrentRequired: 'Please enter your current access password.',
        secSetupRequired: 'Password and security question must both be set.',
        secCurrentWrong: 'Current password is incorrect.', secMismatch: 'Passwords do not match.', secTooShort: 'Password must be at least 4 characters.',
        secAnswerWrong: 'Security answer is incorrect.', secMinLength: 'At least 4 characters.',
        lockTitle: 'Vault locked', lockDesc: 'Enter your access password to view your credentials.',
        unlock: 'Unlock', unlockFail: 'Incorrect password. Try again.', forgot: 'Forgot password?',
        resetTitle: 'Reset access password', resetDesc: 'Answer your security question to choose a new access password.',
        resetAnswer: 'Your answer', resetNewPassword: 'New password', resetConfirm: 'Confirm new password',
        resetSubmit: 'Reset password', resetFail: 'That answer does not match.', resetDone: 'Password has been reset. Please unlock again.',
        resetUnavailable: 'No security question is configured. Restore from a backup or clear this browser\'s site data.',
        lockIdle: 'Locked after inactivity',
        auditTitle: 'Access audit', auditDesc: 'In-memory log of agent reads of your vault metadata. No secrets or plaintext are ever recorded; cleared on restart.',
        auditView: 'View log', auditLoading: 'Loading…', auditTotal: 'Total events', auditEmpty: 'No accesses recorded yet.', auditFail: 'Audit log is unavailable.',
        updateTitle: 'Plugin updates', updateDesc: 'Check whether a newer version of the dsh-credential-vault plugin is available.',
        updateCurrent: 'Current version', updateLatest: 'Latest version', updateCheck: 'Check for updates',
        updateChecking: 'Checking…', updateAvailable: 'A newer version is available:', updateUpToDate: 'You are up to date.',
        updateNoRelease: 'No Release published yet — update check is unavailable.', updateFail: 'Update check failed. Please try again later.',
        updateHow: 'Update via the same way you installed this plugin.',
        upgrade: 'Upgrade', upgrading: 'Upgrading…', upgradeCheckMarket: 'Checking plugin market…',
        upgradeConfirm: 'Upgrade with dshmarket? It uses the same plugin manager that installed this plugin. DeepSeek Harness may need a restart afterwards.',
        upgradeStarted: 'Upgrade started…', upgradePolling: 'Installing…', upgradeNoMarket: 'The plugin market (dshmarket) is not available here. Please update via the way you installed this plugin.',
        upgradeSuccess: 'Upgrade installed.', upgradeRestart: 'Restart DeepSeek Harness to finish.', upgradeFail: 'Upgrade failed: ',
        upgradeTitle: 'Confirm upgrade', upgradeGo: 'Upgrade',
        export: 'Export', import: 'Import',
        exportWarn: 'Exported files contain plaintext passwords and API keys. Keep them safe and delete them when no longer needed.',
        exportDone: 'Backup downloaded', exportFail: 'Export failed', exportEmpty: 'Nothing to export',
        exportTitle: 'Export credentials', exportConfirm: 'Export backup',
        importTitle: 'Import credentials', importHint: 'Imported secrets are stored locally, just like the rest of your vault.',
        importFound: 'Entries in file', importMode: 'Import mode',
        importMerge: 'Merge (keep existing, skip duplicates)',
        importReplace: 'Replace all existing entries',
        importMergeHint: 'Existing entries are kept; entries whose ID already exists are skipped.',
        importReplaceWarn: 'All current entries will be removed and replaced by the file contents. This cannot be undone.',
        importConfirm: 'Import', importDone: 'Import complete',
        importInvalid: 'Invalid backup file', importEmpty: 'No credentials in this file',
        importDetected: 'Detected format', fmtJson: 'JSON', fmtCsv: 'CSV', fmtMd: 'Markdown',
        exportFormat: 'Export format', exportJson: 'JSON backup', exportJsonHint: 'Full fidelity — restores every field exactly (recommended).',
        exportCsv: 'CSV for Excel / WPS', exportCsvHint: 'Chinese headers, readable order, UTF-8 with BOM.',
        exportMd: 'Markdown cards', exportMdHint: 'One card per entry with Chinese labels — clean and readable.',
        exportEncrypted: 'Encrypted backup (password)', exportEncryptedHint: 'Full backup with secrets, sealed by AES-GCM with a password you choose. Import asks for the same password.',
        exportEncryptedGo: 'Encrypt & download', exportEncryptedDone: 'Encrypted backup downloaded — keep your password safe, it cannot be recovered.',
        encPwHint: 'Choose a strong password. It is never stored — losing it means the backup cannot be restored.',
        encPw: 'Encryption password', encPw2: 'Confirm password', encPwShort: 'Use at least 6 characters.',
        encPwMismatch: 'Passwords do not match.', encPwRequired: 'Enter the password.',
        encBusy: 'Working…', encNoCrypto: 'This browser does not support the required encryption (Web Crypto).',
        encDetected: 'Encrypted backup detected', encImportHint: 'Enter the password used when exporting to decrypt this backup.',
        encUnlock: 'Decrypt', encWrongPw: 'Wrong password or corrupted file.',
        genButton: 'Generate password', genField: 'Generate a password for this field',
        genTitle: 'Password generator', genHint: 'Generates a strong random password using your browser’s cryptographic random source. Nothing is stored or sent anywhere.',
        genLength: 'Length', genUpper: 'Uppercase (A–Z)', genLower: 'Lowercase (a–z)', genDigits: 'Digits (0–9)',
        genSymbols: 'Symbols (!@#…)', genAvoidAmbiguous: 'Avoid ambiguous characters (0/O, 1/l)',
        genGenerate: 'Generate', genRegenerate: 'Regenerate', genCopy: 'Copy password', genUse: 'Use this password',
        genError: 'Select at least one character type.', genStrength: 'Strength',
        genWeak: 'Weak', genFair: 'Fair', genStrong: 'Strong',
        auditButton: 'Security audit', auditTitle: 'Security audit',
        auditHint: 'Checks every entry for weak or reused secrets, missing values and expiring keys. The audit runs locally — nothing leaves your device.',
        auditRun: 'Run audit', auditScanning: 'Scanning…', auditClean: 'No issues found. Your vault looks good.',
        auditSummary: 'entries scanned', auditIssues: 'issues found',
        auditWeak: 'Weak password', auditWeakDesc: 'Password is short or too simple.',
        auditReused: 'Reused secret', auditReusedDesc: 'This secret is also used in another entry.',
        auditEmpty: 'Missing secret', auditEmptyDesc: 'This entry has no password / key saved.',
        auditExpired: 'Expired key', auditExpiredDesc: 'The expiry date has passed.',
        auditExpiring: 'Expiring soon', auditExpiringDesc: 'Expires within 30 days.',
        auditEdit: 'Edit', auditHigh: 'High', auditMedium: 'Medium', auditLow: 'Low',
        auditNote: 'Secrets are never shown in the audit — only entry names and issue types.',
        auditFail: 'Audit could not run.'
      },
      zh: {
        title: '凭据保险箱', subtitle: '集中管理你的账号、密码与 API Key',
        add: '新增', items: '条',
        sort: '排序', sortRecent: '最近更新', sortTitle: '名称（A–Z）', sortCategory: '类型',
        search: '搜索名称、账号、网址或备注…',
        filterAll: '全部', filterAccount: '账号密码', filterApikey: 'API Key', filterOther: '其他',
        filterWechatMp: '微信公众号', filterWechatMini: '微信小程序', filterSecretKey: '密钥',
        localNotice: '数据仅保存在本机浏览器的 localStorage 中，不跨设备同步、不加密，请避免在公用/共享浏览器使用。',
        show: '显示', hide: '隐藏', copy: '复制', visit: '访问', copied: '已复制到剪贴板', copyFail: '复制失败，请手动选择文本',
        visitFail: '无法打开浏览器，请检查网址后重试。',
        visitHint: '正在返回对话以打开浏览器…',
        edit: '编辑', delete: '删除',
        emptyTitle: '还没有凭据', emptyText: '点击「新增」保存第一条账号、密码或 API Key。',
        emptyFiltered: '没有匹配项',
        editorNew: '新增凭据', editorEdit: '编辑凭据',
        fTitle: '名称', fTitlePh: '例如：GitHub、Google', fTitlePhApikey: '例如：OpenAI、AWS、GitHub PAT', fTitlePhOther: '例如：恢复码、Wi-Fi、许可证',
        fTitlePhWechatMp: '例如：我的公众号', fTitlePhWechatMini: '例如：我的小程序',
        fTitlePhSecretKey: '例如：GitHub PAT、服务令牌',
        fCategory: '类型', formDetails: '凭据信息', moreFields: '更多字段', lessFields: '收起字段',
        fAccount: '账号 / 用户名', fAccountPh: 'user@example.com',
        fPassword: '密码', fPasswordPh: '输入密码',
        fUrl: '登录网址（可选）', fUrlPh: 'https://…',
        fProvider: '平台 / 服务商', fProviderPh: '例如：OpenAI、Anthropic、AWS',
        fApiKey: 'API Key / 令牌', fApiKeyPh: 'sk-… / ghp_… / 粘贴令牌',
        fEndpoint: 'API 地址 / Base URL', fEndpointPh: 'https://api.openai.com/v1',
        fExpiry: '到期日期（可选）',
        fContent: '内容 / 密钥', fContentPh: '恢复码、许可证、证书、PIN…',
        fNotes: '备注（可选）', fNotesPh: '其他信息…',
        fLinks: '关联凭据', linkNone: '还没有 API Key / 密钥 / 其他凭据', linkMissing: '关联的凭据已不存在', linkPlaceholder: '选择凭据…', linkSearch: '按名称搜索…', linkSelected: '项已选', linkNoMatch: '没有匹配的凭据', linkClear: '清空',
        fAppId: 'AppID', fAppIdPh: 'wx…',
        fAppSecret: 'AppSecret', fAppSecretPh: '应用密钥',
        fToken: '服务器 Token', fTokenPh: '服务器配置里的 Token',
        fAesKey: 'EncodingAESKey', fAesKeyPh: '43 位消息加解密密钥',
        fServerUrl: '服务器地址', fServerUrlPh: 'https://…（回调地址）',
        fUploadKey: '代码上传密钥', fUploadKeyPh: '上传小程序代码用的私钥',
        fDomains: '服务器域名', fDomainsPh: 'request / socket / upload / download 合法域名',
        fKeyName: '密钥名称', fKeyNamePh: '例如：访问令牌、Webhook 密钥',
        fKeyValue: '密钥值', fKeyValuePh: '粘贴令牌 / 密钥 / 口令',
        catAccount: '账号密码', catApikey: 'API Key', catOther: '其他',
        catWechatMp: '微信公众号', catWechatMini: '微信小程序', catSecretKey: '密钥',
        hintAccount: '用于保存网站 / 应用的登录账号与密码。',
        hintApikey: '用于保存平台签发的 API Key、令牌与接口地址。',
        hintOther: '用于保存恢复码、许可证、证书等任意文本。',
        hintWechatMp: '用于保存公众号开发者凭证与服务器配置。',
        hintWechatMini: '用于保存小程序开发者凭证与代码上传密钥。',
        hintSecretKey: '用于保存零散的名称 + 值型密钥：令牌、密钥、口令等。',
        save: '保存', cancel: '取消', required: '请输入名称',
        confirmDelete: '确定删除这条凭据？此操作不可撤销。',
        saved: '已保存', deleted: '已删除', revealAll: '全部显示', hideAll: '全部隐藏',
        settingsNav: '凭据保险箱',
        secTitle: '访问密码', secDesc: '使用访问密码保护保险箱。开启后，需要输入密码才能查看凭据。',
        secEnable: '启用访问密码', secEnableHint: '开启后，保险箱在打开时和无操作一段时间后自动锁定。',
        secSetPassword: '设置 / 修改访问密码', secCurrent: '当前密码', secNew: '新密码', secConfirm: '确认新密码',
        secSavePassword: '保存密码', secPasswordOn: '访问密码已启用', secPasswordOff: '访问密码未启用',
        secEnabledLocked: '访问密码已启用，保险箱现已锁定。',
        secDisableHint: '请输入当前访问密码以关闭此选项。', secDisableConfirm: '关闭访问密码',
        secIdle: '闲置自动锁定', secIdleHint: '开启后，一段时间无操作保险箱会自动重新锁定（需已启用访问密码）。',
        secIdleOn: '自动锁定已开启', secIdleOff: '自动锁定已关闭', secIdleDuration: '锁定时长',
        idleMinute: '分钟', idleMinutes: '分钟', idleHour: '小时', idleHours: '小时',
        secCompleteSetup: '请先设置密码和密保问题，再开启访问密码。',
        secNeedSetupFirst: '请先设置密码和密保问题，再开启此选项。',
        secQuestion: '密保问题', secAnswer: '密保答案', secAnswerHint: '忘记密码时用于重置访问密码。仅保存哈希，不会再次显示。',
        secCustomQuestion: '自定义问题', secSaveQuestion: '保存密保问题', secQuestionSet: '密保问题已设置。',
        secQCurrentHint: '修改密保问题前请输入当前访问密码。', secCurrentRequired: '请输入当前访问密码。',
        secSetupRequired: '密码和密保问题都必须先设置。',
        secCurrentWrong: '当前密码不正确。', secMismatch: '两次输入的密码不一致。', secTooShort: '密码至少 4 个字符。',
        secAnswerWrong: '密保答案不正确。', secMinLength: '至少 4 个字符。',
        lockTitle: '保险箱已锁定', lockDesc: '请输入访问密码以查看凭据。',
        unlock: '解锁', unlockFail: '密码错误，请重试。', forgot: '忘记密码？',
        resetTitle: '重置访问密码', resetDesc: '回答密保问题以设置新的访问密码。',
        resetAnswer: '你的答案', resetNewPassword: '新密码', resetConfirm: '确认新密码',
        resetSubmit: '重置密码', resetFail: '密保答案不匹配。', resetDone: '密码已重置，请重新解锁。',
        resetUnavailable: '尚未设置密保问题。请从备份恢复，或清除此浏览器的站点数据。',
        lockIdle: '因长时间无操作已锁定',
        auditTitle: '访问审计', auditDesc: '记录模型读取保险箱元数据的内存日志，不含任何密钥或明文，重启后清空。',
        auditView: '查看日志', auditLoading: '加载中…', auditTotal: '事件总数', auditEmpty: '暂无访问记录。', auditFail: '访问审计不可用。',
        updateTitle: '插件更新', updateDesc: '检查凭据保险箱插件是否有新版本可用。',
        updateCurrent: '当前版本', updateLatest: '最新版本', updateCheck: '检查更新',
        updateChecking: '检查中…', updateAvailable: '发现新版本：', updateUpToDate: '已是最新版本。',
        updateNoRelease: '仓库尚未发布 Release，暂时无法检查更新。', updateFail: '检查更新失败，请稍后重试。',
        updateHow: '请通过当初安装本插件的相同方式进行更新。',
        upgrade: '升级', upgrading: '升级中…', upgradeCheckMarket: '正在检查插件市场…',
        upgradeConfirm: '使用 dshmarket 升级？它会调用当初安装本插件的同一个插件管理器，升级后可能需要重启 DeepSeek Harness。',
        upgradeStarted: '已开始升级…', upgradePolling: '正在安装…', upgradeNoMarket: '当前不可用插件市场（dshmarket），请通过当初安装本插件的方式进行更新。',
        upgradeSuccess: '升级已安装。', upgradeRestart: '请重启 DeepSeek Harness 以完成升级。', upgradeFail: '升级失败：',
        upgradeTitle: '确认升级', upgradeGo: '立即升级',
        export: '导出', import: '导入',
        exportWarn: '导出的文件包含明文密码和 API Key，请妥善保管并在不需要时删除。',
        exportDone: '备份已下载', exportFail: '导出失败', exportEmpty: '没有可导出的凭据',
        exportTitle: '导出凭据', exportConfirm: '导出备份',
        importTitle: '导入凭据', importHint: '导入的密钥与保险箱其他数据一样仅保存在本机。',
        importFound: '文件中的条目数', importMode: '导入方式',
        importMerge: '合并（保留现有，跳过重复）',
        importReplace: '替换所有现有条目',
        importMergeHint: '保留现有条目；ID 已存在的条目将被跳过。',
        importReplaceWarn: '当前所有条目将被删除并由文件内容替换，此操作不可撤销。',
        importConfirm: '导入', importDone: '导入完成',
        importInvalid: '备份文件无效', importEmpty: '文件中没有凭据',
        importDetected: '识别到的格式', fmtJson: 'JSON', fmtCsv: 'CSV', fmtMd: 'Markdown',
        exportFormat: '导出格式', exportJson: 'JSON 备份', exportJsonHint: '完整保真，可精确恢复全部字段（推荐）。',
        exportCsv: 'CSV（Excel / WPS）', exportCsvHint: '中文表头、常用列在前，UTF-8 BOM 编码。',
        exportMd: 'Markdown 卡片', exportMdHint: '每条凭据一张卡片、中文标签，一目了然。',
        exportEncrypted: '加密备份（密码保护）', exportEncryptedHint: '包含密钥的完整备份，用你设置的密码经 AES-GCM 加密。导入时需输入同一密码。',
        exportEncryptedGo: '加密并下载', exportEncryptedDone: '加密备份已下载 — 请牢记密码，丢失后无法恢复。',
        encPwHint: '请设置高强度密码。密码不会被存储 — 丢失后备份将无法恢复。',
        encPw: '加密密码', encPw2: '确认密码', encPwShort: '密码至少 6 个字符。',
        encPwMismatch: '两次输入的密码不一致。', encPwRequired: '请输入密码。',
        encBusy: '处理中…', encNoCrypto: '当前浏览器不支持所需的加密功能（Web Crypto）。',
        encDetected: '检测到加密备份', encImportHint: '输入导出时设置的密码以解密此备份。',
        encUnlock: '解密', encWrongPw: '密码错误或文件已损坏。',
        genButton: '生成密码', genField: '为此字段生成密码',
        genTitle: '密码生成器', genHint: '使用浏览器的加密随机源生成高强度随机密码，不会存储或上传任何数据。',
        genLength: '长度', genUpper: '大写字母 (A–Z)', genLower: '小写字母 (a–z)', genDigits: '数字 (0–9)',
        genSymbols: '符号 (!@#…)', genAvoidAmbiguous: '排除易混淆字符 (0/O, 1/l)',
        genGenerate: '生成', genRegenerate: '重新生成', genCopy: '复制密码', genUse: '使用此密码',
        genError: '请至少选择一种字符类型。', genStrength: '强度',
        genWeak: '弱', genFair: '中', genStrong: '强',
        auditButton: '健康审计', auditTitle: '健康审计',
        auditHint: '检查每条记录的密码/密钥是否过弱、重复、缺失或即将过期。审计在本地进行，不会上传任何数据。',
        auditRun: '开始审计', auditScanning: '扫描中…', auditClean: '未发现问题，保险箱状态良好。',
        auditSummary: '条记录已扫描', auditIssues: '个问题',
        auditWeak: '弱密码', auditWeakDesc: '密码过短或过于简单。',
        auditReused: '重复使用', auditReusedDesc: '该密钥与另一条记录重复使用。',
        auditEmpty: '缺少密钥', auditEmptyDesc: '该记录未保存密码 / 密钥。',
        auditExpired: '已过期', auditExpiredDesc: '到期日期已过。',
        auditExpiring: '即将过期', auditExpiringDesc: '将在 30 天内过期。',
        auditEdit: '编辑', auditHigh: '高', auditMedium: '中', auditLow: '低',
        auditNote: '审计中不会显示密钥明文，只显示记录名称和问题类型。',
        auditFail: '审计运行失败。'
      }
    };

    // Each credential type owns a DIFFERENT form. The schema drives the editor,
    // the card layout and the search index, so the three types never look alike.
    // type: text | textarea | secret | secretarea | date
    var SCHEMAS = {
      account: [
        { key: 'title', label: 'fTitle', ph: 'fTitlePh', type: 'text', required: true },
        { key: 'username', label: 'fAccount', ph: 'fAccountPh', type: 'text', mono: true },
        { key: 'password', label: 'fPassword', ph: 'fPasswordPh', type: 'secret', mono: true, generatable: true },
        { key: 'url', label: 'fUrl', ph: 'fUrlPh', type: 'text', isUrl: true },
        { key: 'links', label: 'fLinks', type: 'links' },
        { key: 'notes', label: 'fNotes', ph: 'fNotesPh', type: 'textarea' }
      ],
      apikey: [
        { key: 'title', label: 'fTitle', ph: 'fTitlePhApikey', type: 'text', required: true },
        { key: 'provider', label: 'fProvider', ph: 'fProviderPh', type: 'text' },
        { key: 'apiKey', label: 'fApiKey', ph: 'fApiKeyPh', type: 'secret', mono: true },
        { key: 'endpoint', label: 'fEndpoint', ph: 'fEndpointPh', type: 'text', mono: true, isUrl: true },
        { key: 'expiry', label: 'fExpiry', type: 'date' },
        { key: 'notes', label: 'fNotes', ph: 'fNotesPh', type: 'textarea' }
      ],
      secretKey: [
        { key: 'title', label: 'fTitle', ph: 'fTitlePhSecretKey', type: 'text', required: true },
        { key: 'keyName', label: 'fKeyName', ph: 'fKeyNamePh', type: 'text', mono: true },
        { key: 'keyValue', label: 'fKeyValue', ph: 'fKeyValuePh', type: 'secret', mono: true },
        { key: 'notes', label: 'fNotes', ph: 'fNotesPh', type: 'textarea' }
      ],
      other: [
        { key: 'title', label: 'fTitle', ph: 'fTitlePhOther', type: 'text', required: true },
        { key: 'content', label: 'fContent', ph: 'fContentPh', type: 'secretarea', mono: true },
        { key: 'notes', label: 'fNotes', ph: 'fNotesPh', type: 'textarea' }
      ],
      wechatMp: [
        { key: 'title', label: 'fTitle', ph: 'fTitlePhWechatMp', type: 'text', required: true },
        { key: 'appId', label: 'fAppId', ph: 'fAppIdPh', type: 'text', mono: true },
        { key: 'appSecret', label: 'fAppSecret', ph: 'fAppSecretPh', type: 'secret', mono: true },
        { key: 'token', label: 'fToken', ph: 'fTokenPh', type: 'secret', mono: true },
        { key: 'encodingAesKey', label: 'fAesKey', ph: 'fAesKeyPh', type: 'secret', mono: true },
        { key: 'serverUrl', label: 'fServerUrl', ph: 'fServerUrlPh', type: 'text', isUrl: true },
        { key: 'notes', label: 'fNotes', ph: 'fNotesPh', type: 'textarea' }
      ],
      wechatMini: [
        { key: 'title', label: 'fTitle', ph: 'fTitlePhWechatMini', type: 'text', required: true },
        { key: 'appId', label: 'fAppId', ph: 'fAppIdPh', type: 'text', mono: true },
        { key: 'appSecret', label: 'fAppSecret', ph: 'fAppSecretPh', type: 'secret', mono: true },
        { key: 'uploadKey', label: 'fUploadKey', ph: 'fUploadKeyPh', type: 'secretarea', mono: true },
        { key: 'domains', label: 'fDomains', ph: 'fDomainsPh', type: 'textarea' },
        { key: 'notes', label: 'fNotes', ph: 'fNotesPh', type: 'textarea' }
      ]
    };
    // "other" is always the LAST option — both in the type dropdown and in
    // the filter chips. Keep it that way when adding new categories.
    var CATEGORIES = [
      { k: 'account', label: 'catAccount', hint: 'hintAccount' },
      { k: 'apikey', label: 'catApikey', hint: 'hintApikey' },
      { k: 'wechatMp', label: 'catWechatMp', hint: 'hintWechatMp' },
      { k: 'wechatMini', label: 'catWechatMini', hint: 'hintWechatMini' },
      { k: 'secretKey', label: 'catSecretKey', hint: 'hintSecretKey' },
      { k: 'other', label: 'catOther', hint: 'hintOther' }
    ];
    var FILTERS = [
      { k: 'all', label: 'filterAll' },
      { k: 'account', label: 'filterAccount' },
      { k: 'apikey', label: 'filterApikey' },
      { k: 'wechatMp', label: 'filterWechatMp' },
      { k: 'wechatMini', label: 'filterWechatMini' },
      { k: 'secretKey', label: 'filterSecretKey' },
      { k: 'other', label: 'filterOther' }
    ];
    function schemaOf(cat) { return SCHEMAS[cat] || SCHEMAS.account; }
    function isSecretField(f) { return f.type === 'secret' || f.type === 'secretarea'; }
    function isMultilineField(f) { return f.type === 'secretarea' || f.type === 'textarea'; }

    var CSS = [
      '.cv-root{--cv-bg:var(--dsw-alias-bg-base,#fff);--cv-l1:var(--dsw-alias-bg-layer-1,#f6f7f9);--cv-l2:var(--dsw-alias-bg-layer-2,#eceef3);--cv-b1:var(--dsw-alias-border-l1,#e2e5eb);--cv-b2:var(--dsw-alias-border-l2,#c9cfd9);--cv-brand:var(--dsw-alias-brand-primary,#2563eb);--cv-t1:var(--dsw-alias-label-primary,#1d2129);--cv-t2:var(--dsw-alias-label-secondary,#6b7280);--cv-err:var(--dsw-alias-state-error-primary,#dc2626);--cv-ok:var(--dsw-alias-state-success-primary,#16a34a);color:var(--cv-t1);background:var(--cv-bg);font-family:inherit;font-size:14px;min-height:100%;box-sizing:border-box;position:relative}',
      '.cv-root *{box-sizing:border-box}',
      '.cv-wrap{max-width:90%;margin:0 auto;padding:28px 26px 60px}',
      '.cv-head{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}',
      '.cv-head-left{display:flex;align-items:center;gap:14px}',
      '.cv-head-icon{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:var(--cv-l1);border:1px solid var(--cv-b1)}',
      '.cv-title{margin:0;font-size:21px;font-weight:650;letter-spacing:.2px}',
      '.cv-sub{margin:3px 0 0;color:var(--cv-t2);font-size:13px}',
      '.cv-notice{margin-top:18px;padding:10px 14px;border-radius:10px;background:var(--cv-l1);border:1px solid var(--cv-b1);color:var(--cv-t2);font-size:12.5px;line-height:1.6}',
      '.cv-toolbar{margin-top:18px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}',
      '.cv-search{flex:1;min-width:220px;padding:9px 13px;border-radius:9px;border:1px solid var(--cv-b1);background:var(--cv-l1);color:var(--cv-t1);font-size:13px;outline:none}',
      '.cv-search:focus{border-color:var(--cv-brand)}',
      '.cv-chips{display:flex;gap:6px;flex-wrap:wrap}',
      '.cv-chip{padding:7px 12px;border-radius:999px;border:1px solid var(--cv-b1);background:transparent;color:var(--cv-t2);font-size:12.5px;cursor:pointer;transition:background .16s,color .16s,border-color .16s,box-shadow .16s}',
      '.cv-chip:active{transform:scale(.97)}',
      '.cv-chip:hover{background:var(--cv-l2);color:var(--cv-t1)}',
      '.cv-chip-on{background:var(--cv-brand);border-color:var(--cv-brand);color:var(--cv-bg)}',
      '.cv-chip-on:hover{background:var(--cv-brand);border-color:var(--cv-brand);color:var(--cv-bg);box-shadow:0 2px 8px rgba(0,0,0,.18)}',
      '.cv-reveal{display:flex;gap:6px;margin-left:auto}',
      '.cv-sort{display:flex;align-items:center;gap:6px}',
      '.cv-sort-label{color:var(--cv-t2);font-size:12px}',
      '.cv-select{padding:7px 10px;border-radius:8px;border:1px solid var(--cv-b1);background:var(--cv-l1);color:var(--cv-t1);font-size:12.5px;cursor:pointer;outline:none}',
      '.cv-select:focus{border-color:var(--cv-brand)}',
      '.cv-btn{padding:9px 16px;border-radius:9px;border:1px solid var(--cv-b1);background:var(--cv-l1);color:var(--cv-t1);font-size:13px;font-weight:550;cursor:pointer;transition:background .16s,color .16s,border-color .16s,box-shadow .16s,transform .1s}',
      '.cv-btn:hover{background:var(--cv-l2);color:var(--cv-t1);border-color:var(--cv-b2)}',
      '.cv-btn:active{transform:translateY(1px) scale(.98);background:var(--cv-b1)}',
      '.cv-btn-primary{background:var(--cv-brand);border-color:var(--cv-brand);color:var(--cv-bg)}',
      '.cv-btn-primary:hover{background:var(--cv-brand);border-color:var(--cv-brand);color:var(--cv-bg);box-shadow:0 3px 12px rgba(0,0,0,.2)}',
      '.cv-btn-primary:active{transform:translateY(1px) scale(.98);box-shadow:0 1px 4px rgba(0,0,0,.18)}',
      '.cv-btn:disabled{opacity:.55;cursor:not-allowed;transform:none;box-shadow:none}',
      '.cv-io{display:flex;gap:8px;align-items:center}',
      '.cv-import-file{margin:4px 22px 0;padding:10px 12px;border-radius:9px;background:var(--cv-l1);border:1px solid var(--cv-b1);font-size:12.5px;color:var(--cv-t1);overflow-wrap:anywhere}',
      '.cv-import-modes{display:flex;flex-direction:column;gap:10px}',
      '.cv-import-opt{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border:1px solid var(--cv-b1);border-radius:9px;cursor:pointer;background:var(--cv-l1)}',
      '.cv-import-opt input{margin-top:2px;accent-color:var(--cv-brand)}',
      '.cv-import-opt-name{font-size:13px;font-weight:550;color:var(--cv-t1)}',
      '.cv-import-opt-hint{font-size:12px;color:var(--cv-t2);margin-top:3px;line-height:1.45}',
      '.cv-import-warn{color:var(--cv-err);font-weight:550}',
      '.cv-export-opt{width:100%;text-align:left}',
      '.cv-export-icon{font-size:18px;line-height:1.2;flex:0 0 auto}',
      '.cv-mini{padding:4px 9px;border-radius:7px;border:1px solid var(--cv-b1);background:var(--cv-l1);color:var(--cv-t2);font-size:11.5px;cursor:pointer;white-space:nowrap;transition:background .16s,color .16s,border-color .16s,transform .1s}',
      '.cv-mini:hover{color:var(--cv-t1);background:var(--cv-l2);border-color:var(--cv-b2)}',
      '.cv-mini:active{transform:scale(.95);background:var(--cv-b1)}',
      '.cv-count{margin:16px 2px 10px;color:var(--cv-t2);font-size:12.5px}',
      '.cv-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px}',
      '.cv-list-scroll{max-height:62vh;min-height:160px;overflow-y:auto;overflow-x:hidden;margin-top:4px;padding-right:6px;scrollbar-width:thin;scrollbar-color:var(--cv-b2) transparent}',
      '.cv-list-scroll::-webkit-scrollbar{width:9px}',
      '.cv-list-scroll::-webkit-scrollbar-track{background:transparent}',
      '.cv-list-scroll::-webkit-scrollbar-thumb{background:var(--cv-b2);border-radius:8px;border:2px solid var(--cv-bg)}',
      '.cv-list-scroll::-webkit-scrollbar-thumb:hover{background:var(--cv-t2)}',
      '.cv-card{background:var(--cv-l1);border:1px solid var(--cv-b1);border-radius:12px;padding:14px 16px}',
      '.cv-card-head{display:flex;align-items:center;gap:9px;border-bottom:1px solid var(--cv-b1);padding-bottom:10px;margin-bottom:8px}',
      '.cv-badge{font-size:10.5px;font-weight:650;padding:3px 8px;border-radius:6px;white-space:nowrap;background:var(--cv-l2);color:var(--cv-t2)}',
      '.cv-badge-apikey{background:var(--cv-brand);color:var(--cv-bg)}',
      '.cv-badge-account{color:var(--cv-brand)}',
      '.cv-badge-other{background:var(--cv-l2);color:var(--cv-t2)}',
      '.cv-badge-wechatMp{background:#07c160;color:#fff}',
      '.cv-badge-wechatMini{background:#10aec2;color:#fff}',
      '.cv-badge-secretKey{background:#8b5cf6;color:#fff}',
      '.cv-links{margin:10px 0 2px;padding-top:8px;border-top:1px dashed var(--cv-b1)}',
      '.cv-link-chip{display:inline-flex;align-items:center;gap:3px;margin:3px 5px 0 0;padding:4px 9px;border:1px solid var(--cv-b1);border-radius:999px;background:var(--cv-l2);color:var(--cv-brand);font-size:11.5px;cursor:pointer;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.cv-link-chip:hover{border-color:var(--cv-brand)}',
      '.cv-link-picker{position:relative}',
      '.cv-link-picker-top{display:flex;gap:6px;align-items:center}',
      '.cv-link-trigger{flex:1;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 12px;border-radius:9px;border:1px solid var(--cv-b1);background:var(--cv-l1);color:var(--cv-t1);font-size:13px;cursor:pointer;text-align:left}',
      '.cv-link-trigger:hover{border-color:var(--cv-b2)}',
      '.cv-link-trigger-on{border-color:var(--cv-brand)}',
      '.cv-link-caret{color:var(--cv-t2);font-size:11px}',
      '.cv-link-clear{border:none;background:var(--cv-l2);color:var(--cv-t2);border-radius:7px;width:30px;height:30px;cursor:pointer;font-size:16px;line-height:1}',
      '.cv-link-selected{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}',
      '.cv-link-sel-chip{display:inline-flex;align-items:center;gap:3px;padding:4px 6px 4px 9px;border-radius:999px;background:var(--cv-l2);border:1px solid var(--cv-b1);color:var(--cv-brand);font-size:11.5px;max-width:100%}',
      '.cv-link-sel-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px}',
      '.cv-link-sel-x{border:none;background:transparent;color:var(--cv-t2);cursor:pointer;font-size:14px;line-height:1;padding:0 2px}',
      '.cv-link-sel-x:hover{color:var(--cv-err)}',
      '.cv-link-popover{position:absolute;z-index:30;left:0;right:0;top:calc(100% + 6px);padding:9px;border:1px solid var(--cv-b1);border-radius:10px;background:var(--cv-bg);box-shadow:0 8px 24px rgba(0,0,0,.16)}',
      '.cv-link-search{width:100%;padding:8px 10px;font-size:12.5px}',
      '.cv-link-typechips{display:flex;gap:5px;flex-wrap:wrap;margin:8px 0}',
      '.cv-link-typechip{padding:4px 10px;border-radius:999px;border:1px solid var(--cv-b1);background:transparent;color:var(--cv-t2);font-size:11.5px;cursor:pointer}',
      '.cv-link-typechip:hover{background:var(--cv-l2)}',
      '.cv-link-typechip-on{background:var(--cv-brand);border-color:var(--cv-brand);color:var(--cv-bg)}',
      '.cv-link-options{max-height:170px;overflow:auto;border:1px solid var(--cv-b1);border-radius:8px;padding:6px 9px;background:var(--cv-l1)}',
      '.cv-link-opt{display:flex;align-items:center;gap:7px;padding:5px 2px;font-size:12.5px;cursor:pointer}',
      '.cv-link-opt:hover{background:var(--cv-l2)}',
      '.cv-link-empty{font-size:12px;color:var(--cv-t2);padding:8px 2px}',
      '.cv-card-title{font-weight:600;font-size:14.5px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.cv-card-actions{display:flex;gap:4px}',
      '.cv-icon-btn{width:28px;height:28px;border-radius:7px;border:1px solid transparent;background:transparent;color:var(--cv-t2);cursor:pointer;font-size:14px;line-height:1;display:flex;align-items:center;justify-content:center}',
      '.cv-icon-btn:hover{background:var(--cv-l2);color:var(--cv-t1)}',
      '.cv-icon-btn.cv-danger:hover{background:var(--cv-l2);color:var(--cv-err)}',
      '.cv-field{margin:7px 0}',
      '.cv-field-label{font-size:11px;color:var(--cv-t2);margin-bottom:3px;text-transform:uppercase;letter-spacing:.4px}',
      '.cv-field-row{display:flex;align-items:flex-start;gap:6px}',
      '.cv-field-value{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;color:var(--cv-t1)}',
      '.cv-field-multiline{white-space:pre-wrap;overflow-wrap:anywhere;max-height:110px;overflow:auto;line-height:1.5}',
      '.cv-mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12.5px;letter-spacing:.3px}',
      '.cv-masked{letter-spacing:2px;color:var(--cv-t2)}',
      '.cv-empty{grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--cv-t2)}',
      '.cv-empty-icon{display:inline-flex;color:var(--cv-b2);margin-bottom:12px}',
      '.cv-empty h3{margin:0 0 6px;color:var(--cv-t1);font-size:16px}',
      '.cv-empty p{margin:0;font-size:13px}',
      '.cv-modal-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.2);display:flex;align-items:flex-start;justify-content:center;z-index:9999;padding:20px}',
      '.cv-modal{position:sticky;top:50vh;transform:translateY(-50%);width:min(500px,92%);max-width:100%;min-width:0;max-height:90vh;overflow:auto;background:var(--cv-bg);border:1px solid var(--cv-b1);border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.28);outline:none}',
      '.cv-modal.cv-modal-editor{width:min(560px,96%);min-width:0}',
      '.cv-settings .cv-modal{width:min(100%,800px);max-width:100%;min-width:0}',
      // Sidebar panel only: modals are positioned relative to the panel itself
      // (flex-centered inside .cv-root) — the settings-page sticky float is untouched.
      '.cv-panelroot>.cv-modal-backdrop{align-items:center}',
      '.cv-panelroot .cv-modal{position:relative;top:auto;transform:none;min-width:0;max-width:100%;max-height:min(88vh,100%)}',
      '.cv-modal-head{padding:18px 22px 0}',
      '.cv-modal-head h2{margin:0;font-size:17px;font-weight:650}',
      '.cv-modal-hint{margin:5px 22px 0;padding:8px 11px;border-radius:8px;background:var(--cv-l1);border:1px solid var(--cv-b1);color:var(--cv-t2);font-size:12px;line-height:1.5}',
      '.cv-modal-body{padding:14px 22px 6px;display:flex;flex-direction:column;gap:12px}',
      // Editor form: one field per row for a clean, roomy layout.
      '.cv-form-body{display:grid;grid-template-columns:1fr;gap:16px;padding:20px 24px 12px}',
      '.cv-form-body .cv-row-full{grid-column:1 / -1}',
      '.cv-form-body .cv-form-row{gap:8px}',
      '.cv-form-row{display:flex;flex-direction:column;gap:6px;min-width:0;max-width:100%}',
      '.cv-form-label{font-size:12px;color:var(--cv-t2);font-weight:600;letter-spacing:.02em}',
      '.cv-form-label .cv-req{color:var(--cv-err);margin-left:2px}',
      '.cv-form-sep{grid-column:1 / -1;display:flex;align-items:center;gap:10px;margin:4px 0 0;color:var(--cv-t2);font-size:11px;font-weight:650;letter-spacing:.08em;text-transform:uppercase}',
      '.cv-form-sep:after{content:"";flex:1;height:1px;background:var(--cv-b1)}',
      '.cv-more-btn{grid-column:1 / -1;align-self:start;display:inline-flex;align-items:center;gap:5px;padding:6px 10px;border:1px dashed var(--cv-b2);border-radius:8px;background:transparent;color:var(--cv-t2);font-size:12px;font-family:inherit;cursor:pointer}',
      '.cv-more-btn:hover{border-color:var(--cv-brand);color:var(--cv-brand)}',
      '.cv-input{width:100%;max-width:100%;min-width:0;padding:9px 11px;border-radius:9px;border:1px solid var(--cv-b1);background:var(--cv-l1);color:var(--cv-t1);font-size:13px;outline:none;font-family:inherit;box-sizing:border-box}',
      '.cv-input:focus{border-color:var(--cv-brand)}',
      '.cv-textarea{min-height:64px;max-width:100%;resize:vertical;overflow-wrap:anywhere}',
      '.cv-secret-input{display:flex;gap:6px;align-items:stretch}',
      '.cv-secret-input .cv-input{flex:1;min-width:0}',
      '.cv-secret-toggle{flex:none;display:inline-flex;align-items:center;justify-content:center;padding:0 13px;border:1px solid var(--cv-b1);border-radius:9px;background:var(--cv-l1);color:var(--cv-t2);font-size:13px;font-family:inherit;cursor:pointer;white-space:nowrap}',
      '.cv-secret-toggle:hover{background:var(--cv-l2);color:var(--cv-t1)}',
      '.cv-text-security{-webkit-text-security:disc}',
      '.cv-modal-foot{display:flex;justify-content:flex-end;gap:10px;padding:16px 22px 20px}',
      '.cv-toast{position:fixed;top:18px;left:50%;transform:translateX(-50%);background:var(--cv-t1);color:var(--cv-bg);padding:12px 22px;border-radius:12px;font-size:14px;font-weight:600;z-index:10000;box-shadow:0 12px 32px rgba(0,0,0,.3);animation:cv-toast-in .18s ease-out}',
      '@keyframes cv-toast-in{from{opacity:0;transform:translateX(-50%) translateY(-10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}',
      '.cv-lock{min-height:100%;display:flex;align-items:center;justify-content:center;padding:60px 20px}',
      '.cv-lock-card{width:100%;max-width:400px;background:var(--cv-l1);border:1px solid var(--cv-b1);border-radius:18px;padding:32px 30px;text-align:center;box-shadow:0 12px 40px rgba(0,0,0,.12)}',
      '.cv-lock-icon{display:inline-flex;color:var(--cv-brand);margin-bottom:14px}',
      '.cv-lock-card h2{margin:0 0 6px;font-size:19px;font-weight:650}',
      '.cv-lock-card p{margin:0 0 22px;color:var(--cv-t2);font-size:13px;line-height:1.5}',
      '.cv-lock-form{display:flex;flex-direction:column;gap:12px;text-align:left}',
      '.cv-lock-form .cv-input{text-align:left}',
      '.cv-lock-actions{display:flex;flex-direction:column;gap:10px;margin-top:6px}',
      '.cv-lock-actions .cv-btn-primary{width:100%}',
      '.cv-link{background:none;border:none;padding:0;color:var(--cv-brand);font-size:12.5px;cursor:pointer;text-decoration:underline;font-family:inherit}',
      '.cv-link:hover{opacity:.8}',
      '.cv-lock-foot{margin-top:16px;color:var(--cv-t2);font-size:11px;line-height:1.5}',
      '.cv-settings{max-width:90%;margin:0 auto;padding:28px 26px 60px;position:relative}',
      '.cv-settings-head{margin-bottom:8px}',
      '.cv-settings-head h2{margin:0;font-size:18px;font-weight:650}',
      '.cv-settings-head p{margin:5px 0 0;color:var(--cv-t2);font-size:13px;line-height:1.5}',
      '.cv-settings-card{margin-top:20px;background:var(--cv-l1);border:1px solid var(--cv-b1);border-radius:12px;padding:18px 20px}',
      '.cv-settings-card h3{margin:0 0 4px;font-size:15px;font-weight:620}',
      '.cv-settings-card .cv-card-sub{margin:0 0 16px;color:var(--cv-t2);font-size:12.5px;line-height:1.5}',
      '.cv-update-row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}',
      '.cv-update-row .cv-form-label{color:var(--cv-t1);font-size:13px}',
      '.cv-upgrade-status{margin-top:10px;font-size:12.5px;color:var(--cv-t2);line-height:1.6}',
      '.cv-upgrade-status.cv-ok{color:var(--cv-ok)}',
      '.cv-upgrade-status.cv-err{color:var(--cv-err)}',
      '.cv-audit-list{margin-top:10px;max-height:220px;overflow:auto;border:1px solid var(--cv-b1);border-radius:8px}',
      '.cv-audit-row{display:flex;gap:10px;padding:7px 10px;border-bottom:1px solid var(--cv-b1);font-size:12px;line-height:1.4}',
      '.cv-audit-row:last-child{border-bottom:0}',
      '.cv-audit-time{color:var(--cv-t2);white-space:nowrap;font-variant-numeric:tabular-nums}',
      '.cv-audit-detail{color:var(--cv-t1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.cv-switch-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 0;border-top:1px solid var(--cv-b1)}',
      '.cv-switch-row:first-of-type{border-top:none}',
      '.cv-switch-label{font-size:13.5px;font-weight:550}',
      '.cv-switch-hint{font-size:12px;color:var(--cv-t2);margin-top:3px;line-height:1.4}',
      '.cv-switch{position:relative;width:44px;height:25px;flex:none;border-radius:999px;border:1px solid var(--cv-b2);background:var(--cv-l2);cursor:pointer;transition:background .15s,border-color .15s;padding:0}',
      '.cv-switch[aria-checked="true"]{background:var(--cv-brand);border-color:var(--cv-brand)}',
      '.cv-switch-knob{position:absolute;top:2px;left:2px;width:19px;height:19px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:transform .15s}',
      '.cv-switch[aria-checked="true"] .cv-switch-knob{transform:translateX(19px)}',
      '.cv-status{margin-top:12px;font-size:12.5px;color:var(--cv-ok)}',
      '.cv-note{margin-top:10px;padding:9px 12px;border-radius:9px;font-size:13px;font-weight:550;display:flex;gap:8px;align-items:flex-start;animation:cv-note-in .18s ease-out}',
      '.cv-note-ok{background:rgba(34,197,94,.12);color:var(--cv-ok);border:1px solid rgba(34,197,94,.4)}',
      '.cv-note-err{background:rgba(239,68,68,.12);color:var(--cv-err);border:1px solid rgba(239,68,68,.4)}',
      '@keyframes cv-note-in{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}',
      '.cv-field-error{color:var(--cv-err);font-size:12px;margin-top:2px}',
      '.cv-enc-fields{display:flex;flex-direction:column;gap:8px;margin:14px 22px 4px;padding:13px;border-radius:9px;background:var(--cv-l1);border:1px solid var(--cv-b1)}',
      '.cv-settings-fields{display:flex;flex-direction:column;gap:12px;margin-top:12px}',
      // Password generator
      '.cv-gen-secret{display:flex;gap:6px;align-items:stretch}',
      '.cv-gen-secret .cv-input{flex:1;min-width:0}',
      '.cv-gen-btn{flex:none;padding:0 12px;border:1px solid var(--cv-b1);border-radius:9px;background:var(--cv-l1);color:var(--cv-brand);font-size:12.5px;font-family:inherit;cursor:pointer;white-space:nowrap;transition:background .16s,border-color .16s,transform .1s}',
      '.cv-gen-btn:hover{background:var(--cv-l2);color:var(--cv-brand)}',
      '.cv-gen-btn:active{transform:scale(.95);background:var(--cv-b1)}',
      '.cv-gen-preview{margin-top:6px;padding:12px 14px;border-radius:10px;background:var(--cv-l1);border:1px solid var(--cv-b1);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:15px;letter-spacing:.5px;overflow-wrap:anywhere;user-select:all}',
      '.cv-gen-opts{display:grid;grid-template-columns:1fr 1fr;gap:8px 14px}',
      '.cv-gen-check{display:flex;align-items:center;gap:7px;font-size:12.5px;color:var(--cv-t1);cursor:pointer}',
      '.cv-gen-check input{accent-color:var(--cv-brand);margin:0}',
      '.cv-gen-strength{font-weight:650}',
      '.cv-gen-strength.cv-weak{color:var(--cv-err)}',
      '.cv-gen-strength.cv-fair{color:#b45309}',
      '.cv-gen-strength.cv-strong{color:var(--cv-ok)}',
      '.cv-gen-bar{height:5px;border-radius:4px;background:var(--cv-l2);margin-top:5px;overflow:hidden}',
      '.cv-gen-bar span{display:block;height:100%;border-radius:4px;transition:width .2s}',
      '.cv-gen-bar .cv-weak{background:var(--cv-err)}',
      '.cv-gen-bar .cv-fair{background:#b45309}',
      '.cv-gen-bar .cv-strong{background:var(--cv-ok)}',
      // Security audit
      '.cv-audit-summary{display:flex;gap:18px;flex-wrap:wrap;padding:12px 14px;border-radius:10px;background:var(--cv-l1);border:1px solid var(--cv-b1);font-size:13px}',
      '.cv-audit-summary b{font-size:16px;color:var(--cv-t1)}',
      '.cv-audit-clean{padding:20px;text-align:center;color:var(--cv-ok);font-size:13.5px;font-weight:550}',
      '.cv-audit-list{margin-top:6px;display:flex;flex-direction:column;gap:8px;max-height:46vh;overflow-y:auto;scrollbar-width:thin}',
      '.cv-audit-item{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border:1px solid var(--cv-b1);border-radius:9px;background:var(--cv-l1)}',
      '.cv-audit-sev{flex:none;font-size:10.5px;font-weight:650;padding:2px 7px;border-radius:6px;white-space:nowrap;align-self:center}',
      '.cv-audit-sev.cv-high{background:var(--cv-err);color:#fff}',
      '.cv-audit-sev.cv-medium{background:#b45309;color:#fff}',
      '.cv-audit-sev.cv-low{background:var(--cv-brand);color:#fff}',
      '.cv-audit-body{flex:1;min-width:0}',
      '.cv-audit-name{font-size:13px;font-weight:600;color:var(--cv-t1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.cv-audit-desc{font-size:12px;color:var(--cv-t2);margin-top:2px;line-height:1.4}',
      '.cv-audit-note{margin:12px 22px 0;font-size:11.5px;color:var(--cv-t2);line-height:1.5}'
    ].join('\n');

    // Migrate entries saved by the earlier single-form version.
    function normalize(e) {
      var n = Object.assign({}, e);
      n.category = n.category || 'account';
      if (n.secret != null && n.password == null && n.apiKey == null && n.content == null) {
        if (n.category === 'apikey') n.apiKey = n.secret;
        else if (n.category === 'other') n.content = n.secret;
        else if (n.category === 'secretKey') n.keyValue = n.secret;
        else n.password = n.secret;
      }
      if (n.category === 'apikey') {
        if (n.provider == null && n.username) n.provider = n.username;
        if (n.endpoint == null && n.url) n.endpoint = n.url;
      }
      // Links are credential IDs. Accept arrays, the human-readable "Title(id)"
      // form used in CSV/Markdown exports, and the legacy comma-separated form.
      if (Array.isArray(n.links)) {
        n.links = n.links.map(function (x) { return String(x); }).filter(Boolean);
      } else if (typeof n.links === 'string' && n.links.trim()) {
        var ids = [], lm, lre = /[（(]([^()）]+)[)）]/g;
        while ((lm = lre.exec(n.links)) !== null) ids.push(lm[1].trim());
        n.links = ids.length ? ids : n.links.split(/[,，、]/).map(function (x) { return x.trim(); }).filter(Boolean);
      } else {
        delete n.links;
      }
      return sanitize(n);
    }
    function loadEntries() {
      try {
        var raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          // One-time migration from the pre-rename storage key.
          raw = window.localStorage.getItem(STORAGE_KEY_LEGACY);
          if (raw) { try { window.localStorage.setItem(STORAGE_KEY, raw); } catch (e) {} }
        }
        if (!raw) return [];
        var arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr.map(normalize) : [];
      } catch (e) { return []; }
    }
    function saveEntries(arr) {
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); } catch (e) {}
      syncToHost(arr);
    }

    // ---- Cross-plugin encrypted bridge (ECDH P-256 + AES-GCM) ------------
    // Other plugins (e.g. dsh-mail) need a real secret from the vault. The Host
    // process only has a metadata snapshot, so the only place that can answer
    // is this browser client. We publish a same-document bridge object that
    // speaks an encrypted, one-time-session protocol; nothing here touches the
    // Host route and nothing persists. Registered on window in apply(); if this
    // plugin is not installed, the object simply never exists and consumers
    // detect that via isAvailable() and silently no-op.
    var BRIDGE_KEY = '@mysterycode-liwen/dsh-credential-vault/bridge/v1';
    var bridgeSessions = {};   // sessionId -> { key, used, expires }
    function bridgeB64u(bytes) {
      var s = '';
      for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
      return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    function bridgeUnb64u(str) {
      var b = String(str).replace(/-/g, '+').replace(/_/g, '/');
      while (b.length % 4) b += '=';
      var bin = atob(b), out = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out;
    }
    function bridgeEnc(str) { return new TextEncoder().encode(str); }
    function bridgeDec(bytes) { return new TextDecoder().decode(bytes); }
    function bridgeDerive(s, priv, peerJwk) {
      return s.importKey('jwk', peerJwk, { name: 'ECDH', namedCurve: 'P-256' }, false, [])
        .then(function (pub) { return s.deriveBits({ name: 'ECDH', public: pub }, priv, 256); })
        .then(function (bits) { return s.importKey('raw', bits, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']); });
    }
    function bridgeSeal(s, key, obj) {
      var iv = new Uint8Array(12);
      window.crypto.getRandomValues(iv);
      return s.encrypt({ name: 'AES-GCM', iv: iv }, key, bridgeEnc(JSON.stringify(obj)))
        .then(function (ct) {
          return { iv: bridgeB64u(iv), ciphertext: bridgeB64u(new Uint8Array(ct)) };
        });
    }
    function bridgeOpen(s, key, payload) {
      if (!payload || typeof payload.iv !== 'string' || typeof payload.ciphertext !== 'string') {
        return Promise.reject(new Error('BAD_CIPHERTEXT'));
      }
      return s.decrypt({ name: 'AES-GCM', iv: bridgeUnb64u(payload.iv) }, key, bridgeUnb64u(payload.ciphertext))
        .then(function (plain) { return JSON.parse(bridgeDec(new Uint8Array(plain))); });
    }
    function newBridge() {
      var s = (window.crypto && window.crypto.subtle) || null;
      return {
        version: 1,
        hello: function () {
          if (!s) return Promise.reject(new Error('NO_CRYPTO'));
          return s.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])
            .then(function (kp) {
              var id = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
              return s.exportKey('jwk', kp.publicKey).then(function (pubJwk) {
                bridgeSessions[id] = { keyPair: kp, used: false, expires: Date.now() + 60000 };
                return { sessionId: id, publicKeyJwk: pubJwk };
              });
            });
        },
        query: function (req) {
          if (!s) return Promise.resolve({ error: 'NO_CRYPTO' });
          if (!req || !req.sessionId || !req.publicKeyJwk) {
            return Promise.resolve({ error: 'BAD_REQUEST' });
          }
          var sess = bridgeSessions[req.sessionId];
          if (!sess) return Promise.resolve({ error: 'UNKNOWN_SESSION' });
          if (sess.expires < Date.now()) {
            delete bridgeSessions[req.sessionId];
            return Promise.resolve({ error: 'SESSION_EXPIRED' });
          }
          if (sess.used) return Promise.resolve({ error: 'SESSION_USED' });
          // One-time session: consume immediately, even if decryption later fails.
          sess.used = true;
          try { delete bridgeSessions[req.sessionId]; } catch (e) {}
          var sharedKey = null;
          return bridgeDerive(s, sess.keyPair.privateKey, req.publicKeyJwk)
            .then(function (key) { sharedKey = key; return bridgeOpen(s, key, req); })
            .then(function (criteria) {
              var cat = criteria && criteria.category ? criteria.category : 'all';
              var title = criteria && typeof criteria.title === 'string' ? criteria.title.toLowerCase() : '';
              var limit = criteria && criteria.limit ? Math.min(Number(criteria.limit) || 100, 500) : 100;
              var all = loadEntries();          // REAL entries incl. secrets, from localStorage
              var SECRET_KEYS = ['password', 'apiKey', 'content', 'appSecret', 'token',
                'encodingAesKey', 'uploadKey', 'keyValue'];
              var out = [];
              for (var i = 0; i < all.length && out.length < limit; i++) {
                var e = all[i];
                if (cat !== 'all' && e.category !== cat) continue;
                if (title && String(e.title || '').toLowerCase().indexOf(title) < 0) continue;
                var item = {};
                Object.keys(e).forEach(function (k) { item[k] = e[k]; });
                // Belt-and-braces: only known secret keys are included; all are
                // real values because the consumer authenticated with the AES key.
                SECRET_KEYS.forEach(function (k) {
                  if (typeof e[k] === 'string') item[k] = e[k];
                });
                out.push(item);
              }
              return bridgeSeal(s, sharedKey, { entries: out });
            })
            .then(function (sealed) { return sealed; })
            .catch(function () { return { error: 'DECRYPT_FAILED' }; });
        }
      };
    }
    function registerBridge() {
      try {
        if (!window[BRIDGE_KEY]) window[BRIDGE_KEY] = newBridge();
      } catch (e) {}
    }
    // Mirror only METADATA to the Host so the Harness/Agent can discover which
    // credentials exist via dsh_credential_vault_read. Plaintext secrets stay in
    // this browser's localStorage and are NEVER sent to the Host process. The
    // Host independently re-sanitizes every entry, so this is defense in depth.
    // Fire-and-forget: the browser stays usable even if the Host route is down.
    // Large vaults: DEBOUNCE so a burst of edits results in one POST, not dozens
    // of multi-megabyte payloads. A trailing timer always flushes the latest data.
    var MIRROR_FIELDS = ['id', 'title', 'category', 'username', 'provider', 'keyName', 'url', 'endpoint', 'expiry',
      'appId', 'serverUrl', 'domains', 'notes', 'links', 'createdAt', 'updatedAt'];
    var MIRROR_SECRETS = ['password', 'apiKey', 'content', 'appSecret', 'token', 'encodingAesKey', 'uploadKey', 'keyValue'];
    function toEnvelope(entry) {
      var out = {};
      MIRROR_FIELDS.forEach(function (k) {
        var v = entry[k];
        if (typeof v === 'string' || typeof v === 'number') out[k] = v;
      });
      // Placeholder only — the real value never leaves this browser.
      MIRROR_SECRETS.forEach(function (k) {
        if (typeof entry[k] === 'string' && entry[k] !== '') out[k] = MASK;
      });
      return out;
    }
    var syncTimer = null;
    var SYNC_DELAY = 400;
    function syncToHost(arr, immediate) {
      if (typeof window.fetch !== 'function') return;
      function send() {
        syncTimer = null;
        try {
          var envelope = arr.map(toEnvelope);
          window.fetch(API + 'entries', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'content-type': 'application/json', accept: 'application/json' },
            body: JSON.stringify({ entries: envelope })
          }).catch(function () {});
        } catch (e) {}
      }
      if (syncTimer !== null) { window.clearTimeout(syncTimer); syncTimer = null; }
      if (immediate) { send(); return; }
      syncTimer = window.setTimeout(send, SYNC_DELAY);
    }
    function uid() {
      return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    }

    // ---- Password generator ---------------------------------------------
    var GEN_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var GEN_LOWER = 'abcdefghijklmnopqrstuvwxyz';
    var GEN_DIGITS = '0123456789';
    var GEN_SYMBOLS = '!@#$%^&*()-_=+[]{};:,.?/';
    var GEN_AMBIGUOUS = '0O1lI|`\'\";:';
    // Uniform random integer in [0, max) using rejection sampling, so every
    // character is equally likely (no modulo bias).
    function secureRandomInt(max) {
      var crypto = (typeof window !== 'undefined' && window.crypto) || (typeof globalThis !== 'undefined' && globalThis.crypto);
      if (!crypto || !crypto.getRandomValues) throw new Error('no-crypto');
      var limit = Math.floor(4294967296 / max) * max; // 2^32 rounded down to a multiple of max
      var buf = new Uint32Array(1);
      var v;
      do { crypto.getRandomValues(buf); v = buf[0]; } while (v >= limit);
      return v % max;
    }
    function shuffleChars(arr) {
      for (var i = arr.length - 1; i > 0; i--) {
        var j = secureRandomInt(i + 1);
        var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
      }
      return arr;
    }
    // opts: {length, upper, lower, digits, symbols, avoidAmbiguous}
    function generatePassword(opts) {
      var sets = [];
      if (opts.upper) sets.push(GEN_UPPER);
      if (opts.lower) sets.push(GEN_LOWER);
      if (opts.digits) sets.push(GEN_DIGITS);
      if (opts.symbols) sets.push(GEN_SYMBOLS);
      if (sets.length === 0) return null;
      var pool = sets.join('');
      if (opts.avoidAmbiguous) {
        pool = pool.split('').filter(function (c) { return GEN_AMBIGUOUS.indexOf(c) === -1; }).join('');
      }
      if (!pool) return null;
      var len = Math.max(4, Math.min(128, Number(opts.length) || 16));
      var out = [];
      // Guarantee at least one character from every selected class.
      sets.forEach(function (set) {
        var s = opts.avoidAmbiguous ? set.split('').filter(function (c) { return GEN_AMBIGUOUS.indexOf(c) === -1; }).join('') : set;
        if (s) out.push(s[secureRandomInt(s.length)]);
      });
      while (out.length < len) out.push(pool[secureRandomInt(pool.length)]);
      return shuffleChars(out.slice(0, len)).join('');
    }
    // Entropy estimate in bits -> strength tier.
    function passwordStrength(pw) {
      if (!pw) return { tier: 'weak', bits: 0 };
      var pool = 0;
      if (/[a-z]/.test(pw)) pool += 26;
      if (/[A-Z]/.test(pw)) pool += 26;
      if (/[0-9]/.test(pw)) pool += 10;
      if (/[^A-Za-z0-9]/.test(pw)) pool += 28;
      if (!pool) pool = 10;
      var bits = Math.round(pw.length * (Math.log(pool) / Math.LN2));
      var tier = bits < 45 ? 'weak' : (bits < 65 ? 'fair' : 'strong');
      return { tier: tier, bits: bits };
    }

    // ---- Security audit --------------------------------------------------
    function secretOf(e) {
      var cat = e.category || 'account';
      if (cat === 'apikey') return String(e.apiKey || '');
      if (cat === 'other') return String(e.content || '');
      if (cat === 'secretKey') return String(e.keyValue || '');
      return String(e.password || '');
    }
    function runAudit(entries) {
      var issues = [];
      var bySecret = {};
      // Count reuse of non-empty secrets across entries.
      entries.forEach(function (e) {
        var s = secretOf(e);
        if (!s) return;
        (bySecret[s] = bySecret[s] || []).push(e.id);
      });
      var now = Date.now();
      var DAY = 24 * 60 * 60 * 1000;
      entries.forEach(function (e) {
        var cat = e.category || 'account';
        var s = secretOf(e);
        var name = e.title || '—';
        function add(kind, sev) {
          issues.push({ id: e.id, name: name, category: cat, kind: kind, severity: sev });
        }
        if (!s) { add('auditEmpty', 'high'); return; }
        // Weak: short, or only a single character class with length < 12.
        if (s.length < 8 || passwordStrength(s).tier === 'weak') add('auditWeak', s.length < 6 ? 'high' : 'medium');
        // Reused secret (appears in more than one distinct entry).
        if (bySecret[s] && bySecret[s].length > 1) add('auditReused', 'high');
        // Expiry checks for API keys.
        if (e.expiry) {
          var t = Date.parse(e.expiry);
          if (!isNaN(t)) {
            if (t < now) add('auditExpired', 'medium');
            else if (t - now < 30 * DAY) add('auditExpiring', 'low');
          }
        }
      });
      var order = { high: 0, medium: 1, low: 2 };
      issues.sort(function (a, b) { return order[a.severity] - order[b.severity]; });
      return { scanned: entries.length, issues: issues };
    }

    // ---- Backup: export / import ----------------------------------------
    // The backup is a plain JSON file so it is portable. It deliberately
    // contains the real secret values (masked data would be useless to restore).
    var BACKUP_FORMAT = 'dsh-credential-vault-backup';
    var BACKUP_VERSION = 1;
    function buildBackup(arr) {
      return {
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        app: 'dsh-credential-vault',
        entries: arr.map(function (e) { return normalize(e); })
      };
    }
    function downloadText(text, mime, filename) {
      try {
        var blob = new Blob([text], { type: mime });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { try { URL.revokeObjectURL(url); } catch (e) {} }, 1000);
        return true;
      } catch (e) { return false; }
    }
    function stampNow() {
      var d = new Date();
      function pad(n) { return n < 10 ? '0' + n : '' + n; }
      return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes());
    }
    var EXPORT_COLS = ['id', 'title', 'category', 'username', 'password', 'url', 'provider', 'apiKey', 'endpoint', 'expiry', 'content', 'keyName', 'keyValue',
      'appId', 'appSecret', 'token', 'encodingAesKey', 'serverUrl', 'uploadKey', 'domains',
      'notes', 'links', 'createdAt', 'updatedAt'];

    // ---- Human-readable labels ------------------------------------------------
    // CSV/Markdown use Chinese labels for people; every label maps back to its
    // exact field name so an exported file still round-trips without data loss.
    var FIELD_LABELS = {
      id: 'ID', title: '标题', category: '类型', username: '用户名', password: '密码',
      url: '网址', provider: '服务商', apiKey: 'API Key', endpoint: '接口地址',
      expiry: '有效期', content: '内容', keyName: '密钥名称', keyValue: '密钥值',
      appId: 'AppID', appSecret: 'AppSecret', token: '服务器Token', encodingAesKey: 'EncodingAESKey',
      serverUrl: '服务器地址', uploadKey: '代码上传密钥', domains: '服务器域名',
      notes: '备注', links: '关联凭据', createdAt: '创建时间', updatedAt: '更新时间'
    };
    var LABEL_FIELDS = {};
    Object.keys(FIELD_LABELS).forEach(function (k) { LABEL_FIELDS[FIELD_LABELS[k]] = k; });
    var CATEGORY_LABELS = { account: '账号', apikey: 'API Key', secretKey: '密钥', other: '其他', wechatMp: '微信公众号', wechatMini: '微信小程序' };
    var LABEL_CATEGORIES = {};
    Object.keys(CATEGORY_LABELS).forEach(function (k) { LABEL_CATEGORIES[CATEGORY_LABELS[k]] = k; });
    LABEL_CATEGORIES['通用密钥'] = 'secretKey'; // legacy exports before the rename
    // Only export fields that belong to the entry's type. A record may carry
    // stale fields from a past type change (e.g. an API Key with leftover
    // username/password/url); those must not leak into readable exports.
    var VISIBLE_FIELDS = {
      account: ['title', 'username', 'password', 'url', 'links', 'notes'],
      apikey: ['title', 'provider', 'apiKey', 'endpoint', 'expiry', 'notes'],
      secretKey: ['title', 'keyName', 'keyValue', 'notes'],
      other: ['title', 'content', 'notes'],
      wechatMp: ['title', 'appId', 'appSecret', 'token', 'encodingAesKey', 'serverUrl', 'notes'],
      wechatMini: ['title', 'appId', 'appSecret', 'uploadKey', 'domains', 'notes']
    };
    function fieldsFor(cat) { return VISIBLE_FIELDS[cat] || VISIBLE_FIELDS.account; }
    // Strip fields that do not belong to the entry's type. Applied inside
    // normalize(), so stale fields (e.g. an API Key carrying username/password/
    // url from a past type change) are removed everywhere data enters the app:
    // loading from localStorage, importing, and exporting. Technical columns
    // (id / category / timestamps) stay for identity and ordering.
    function sanitize(e) {
      var keep = fieldsFor(e.category).concat(['id', 'category', 'createdAt', 'updatedAt']);
      var out = {};
      keep.forEach(function (k) { if (e[k] !== undefined) out[k] = e[k]; });
      return out;
    }

    // CSV helpers (RFC 4180): quote fields containing comma / quote / newline,
    // double embedded quotes. The file carries a UTF-8 BOM so Excel/WPS show
    // Chinese characters correctly when opened by double-click.
    function csvEscape(v) {
      var s = v == null ? '' : String(v);
      return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }
    function csvDate(v) {
      if (v == null || v === '') return '';
      var d = new Date(Number(v));
      return isNaN(d.getTime()) ? String(v) : d.toISOString();
    }
    // Render links as "Linked title(id)" so exports stay readable AND re-importable.
    function formatLinks(links, arr) {
      if (!Array.isArray(links) || !links.length) return '';
      return links.map(function (id) {
        var target = arr.filter(function (x) { return x.id === id; })[0];
        return target && target.title ? target.title + '(' + id + ')' : String(id);
      }).join('、');
    }
    // CSV shows the fields people actually read first; technical columns
    // (ID / timestamps) go last. Import maps by header label, so order is safe.
    var CSV_COLS = ['title', 'category', 'username', 'password', 'url', 'provider',
      'apiKey', 'endpoint', 'expiry', 'content', 'keyName', 'keyValue',
      'appId', 'appSecret', 'token', 'encodingAesKey', 'serverUrl', 'uploadKey', 'domains',
      'notes', 'links', 'id', 'createdAt', 'updatedAt'];
    function buildCsv(arr) {
      var lines = [CSV_COLS.map(function (c) { return csvEscape(FIELD_LABELS[c] || c); }).join(',')];
      arr.forEach(function (e) {
        var n = normalize(e);
        var visible = fieldsFor(n.category);
        lines.push(CSV_COLS.map(function (c) {
          // Technical columns stay for lossless import; business columns that
          // do not belong to this type are left blank.
          if (visible.indexOf(c) < 0 && c !== 'id' && c !== 'category' && c !== 'createdAt' && c !== 'updatedAt') return '';
          var v = (c === 'createdAt' || c === 'updatedAt') ? csvDate(n[c]) : n[c];
          if (c === 'links') v = formatLinks(n.links, arr);
          if (c === 'category') v = CATEGORY_LABELS[v] || v;
          return csvEscape(v);
        }).join(','));
      });
      return '\uFEFF' + lines.join('\r\n');
    }
    function csvParse(text) {
      var s = String(text || '').replace(/^\uFEFF/, '');
      var rows = [], row = [], field = '', i = 0, inQ = false;
      while (i < s.length) {
        var c = s.charAt(i);
        if (inQ) {
          if (c === '"') {
            if (s.charAt(i + 1) === '"') { field += '"'; i += 2; continue; }
            inQ = false; i++; continue;
          }
          field += c; i++; continue;
        }
        if (c === '"') { inQ = true; i++; continue; }
        if (c === ',') { row.push(field); field = ''; i++; continue; }
        if (c === '\r') { i++; continue; }
        if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
        field += c; i++;
      }
      if (field !== '' || row.length) { row.push(field); rows.push(row); }
      return rows;
    }
    function parseCsv(text) {
      var rows = csvParse(text);
      if (rows.length < 2) throw new Error('shape');
      var rawHeader = rows[0].map(function (x) { return String(x).trim(); });
      // Accept both the new Chinese header and the legacy English one.
      var header = rawHeader.map(function (h) { return LABEL_FIELDS[h] || h; });
      if (header.indexOf('title') === -1) throw new Error('shape');
      var out = [];
      for (var r = 1; r < rows.length; r++) {
        var cells = rows[r];
        if (cells.length === 1 && !String(cells[0]).trim()) continue;
        var e = {};
        header.forEach(function (h, i2) { if (h) e[h] = cells[i2] != null ? cells[i2] : ''; });
        if (e.category) e.category = LABEL_CATEGORIES[e.category] || e.category;
        ['createdAt', 'updatedAt'].forEach(function (k) {
          var v = e[k];
          if (v != null && v !== '') {
            if (/^\d+$/.test(String(v))) e[k] = Number(v);
            else { var ms = Date.parse(v); if (!isNaN(ms)) e[k] = ms; }
          }
        });
        out.push(normalize(e));
      }
      return out;
    }

    // Markdown card helpers. Each credential is a small card with a Chinese
    // two-column table; an embedded HTML comment keeps the full original data
    // so import stays lossless even though the visible part is human-friendly.
    function mdEscape(v) {
      return String(v == null ? '' : v)
        .replace(/\\/g, '\\\\').replace(/\|/g, '\\|')
        .replace(/\r/g, '\\r').replace(/\n/g, '\\n');
    }
    function mdDecode(s) {
      var out = '', i = 0;
      while (i < s.length) {
        if (s.substr(i, 4) === '<br>') { out += '\n'; i += 4; continue; }
        if (s.charAt(i) === '\\' && i + 1 < s.length) {
          var c = s.charAt(i + 1);
          if (c === 'n') { out += '\n'; i += 2; continue; }
          if (c === 'r') { out += '\r'; i += 2; continue; }
          if (c === '|') { out += '|'; i += 2; continue; }
          if (c === '\\') { out += '\\'; i += 2; continue; }
        }
        out += s.charAt(i); i++;
      }
      return out;
    }
    function mdSplitRow(line) {
      var s = String(line).trim();
      if (s.charAt(0) === '|') s = s.slice(1);
      if (s.charAt(s.length - 1) === '|') s = s.slice(0, -1);
      var cells = [], cur = '', i = 0;
      while (i < s.length) {
        if (s.charAt(i) === '\\' && i + 1 < s.length) { cur += s.charAt(i) + s.charAt(i + 1); i += 2; continue; }
        if (s.charAt(i) === '|') { cells.push(cur); cur = ''; i++; continue; }
        cur += s.charAt(i); i++;
      }
      cells.push(cur);
      return cells.map(function (x) { return mdDecode(x.replace(/^ /, '').replace(/ $/, '')); });
    }
    // Cell text for the visible card table: escape pipes/backslashes, and show
    // real newlines as <br> so multi-line notes stay readable in a table.
    function mdCell(v) {
      return String(v == null ? '' : v)
        .replace(/\\/g, '\\\\').replace(/\|/g, '\\|')
        .replace(/\r/g, '').replace(/\n/g, '<br>');
    }
    function buildMarkdown(arr) {
      var lines = ['# 凭据保险箱 / Credential Vault', '',
        '导出时间：' + new Date().toISOString() + ' · 共 ' + arr.length + ' 条', '',
        '> 每条凭据下方的 HTML 注释保存了完整原始数据（含 ID、时间戳等），导入时优先读取以保证无损还原。请勿删除这些注释。', ''];
      arr.forEach(function (e, i) {
        var n = normalize(e);
        lines.push('## ' + (i + 1) + '. ' + mdCell(n.title || '(无标题)'));
        lines.push('');
        // Encode < and > so the JSON can never terminate the HTML comment early.
        var data = JSON.stringify(n).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
        lines.push('<!-- cv:' + data + ' -->');
        lines.push('');
        lines.push('| 字段 | 内容 |');
        lines.push('| --- | --- |');
        lines.push('| 类型 | ' + mdCell(CATEGORY_LABELS[n.category] || n.category || '账号') + ' |');
        fieldsFor(n.category).forEach(function (c) {
          if (c === 'title') return;
          var v = n[c];
          if (c === 'links') v = formatLinks(n.links, arr);
          if (v == null || v === '') return;
          lines.push('| ' + (FIELD_LABELS[c] || c) + ' | ' + mdCell(v) + ' |');
        });
        lines.push('');
        lines.push('---');
        lines.push('');
      });
      return lines.join('\n');
    }
    function parseMarkdown(text) {
      var lines = String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/);
      // Preferred path: the embedded <!-- cv:{...} --> comment is lossless.
      var fromComment = [];
      lines.forEach(function (line) {
        var m = /<!--\s*cv:(\{[\s\S]*?\})\s*-->/.exec(line);
        if (m) { try { fromComment.push(normalize(JSON.parse(m[1]))); } catch (e) {} }
      });
      if (fromComment.length) return fromComment;

      // Legacy wide table from earlier exports: keep supporting old files.
      var hIdx = -1;
      for (var i = 0; i < lines.length - 1; i++) {
        if (/^\s*\|/.test(lines[i]) && /title/.test(lines[i]) &&
            /^\s*\|/.test(lines[i + 1]) && /-/.test(lines[i + 1])) { hIdx = i; break; }
      }
      if (hIdx >= 0) {
        var header = mdSplitRow(lines[hIdx]).map(function (h) { return LABEL_FIELDS[h] || h; });
        if (header.indexOf('title') !== -1) {
          var out = [];
          for (var r = hIdx + 2; r < lines.length; r++) {
            var line = lines[r];
            if (!/^\s*\|/.test(line)) continue;
            var cells = mdSplitRow(line);
            var e = {};
            header.forEach(function (h, i2) { if (h) e[h] = cells[i2] != null ? cells[i2] : ''; });
            ['createdAt', 'updatedAt'].forEach(function (k) {
              if (e[k] != null && e[k] !== '' && /^\d+$/.test(String(e[k]))) e[k] = Number(e[k]);
            });
            out.push(normalize(e));
          }
          return out;
        }
      }

      // Fallback: hand-edited cards whose comment was removed — read 字段/内容 tables.
      var cards = [], curCard = null, inTable = false;
      lines.forEach(function (line) {
        var h = /^##\s+(?:\d+\.\s*)?(.*)$/.exec(line);
        if (h) {
          curCard = { title: h[1].trim() === '(无标题)' ? '' : h[1].trim(), fields: {} };
          cards.push(curCard); inTable = false; return;
        }
        if (!curCard) return;
        if (/^\|\s*字段\s*\|\s*内容\s*\|?\s*$/.test(line)) { inTable = true; return; }
        if (inTable && /^\s*\|/.test(line)) {
          var cells = mdSplitRow(line);
          if (cells.length >= 2 && !/^-+$/.test(cells[0].replace(/\s/g, ''))) {
            var key = LABEL_FIELDS[cells[0].trim()] || cells[0].trim();
            curCard.fields[key] = cells.slice(1).join(' ');
          }
        } else if (!line.trim()) { inTable = false; }
      });
      return cards.map(function (c, i) {
        var e = { id: 'import-' + Date.now() + '-' + i, title: c.title };
        Object.keys(c.fields).forEach(function (k) {
          e[k] = k === 'category' ? (LABEL_CATEGORIES[c.fields[k]] || c.fields[k]) : c.fields[k];
        });
        return normalize(e);
      });
    }

    // Auto-detect the format and return { entries, fmt } or throw a known error.
    function parseImport(text) {
      var s = String(text || '').replace(/^\uFEFF/, '');
      var t = s.trim();
      if (!t) throw new Error('empty');
      if (t.charAt(0) === '{' || t.charAt(0) === '[') return { entries: parseBackup(t), fmt: 'json' };
      if (/<!--\s*cv:/.test(s) || /\|\s*字段\s*\|/.test(s)) return { entries: parseMarkdown(t), fmt: 'md' };
      var lines = t.split(/\r?\n/);
      for (var li = 0; li < lines.length; li++) {
        if (/^\s*\|/.test(lines[li]) && /title/.test(lines[li])) return { entries: parseMarkdown(t), fmt: 'md' };
      }
      var first = lines[0] || '';
      if (first.indexOf(',') !== -1 &&
          (/\bid\b/.test(first) || /ID/.test(first)) &&
          (/title/.test(first) || /标题/.test(first))) return { entries: parseCsv(t), fmt: 'csv' };
      throw new Error('parse');
    }
    function exportBackup(arr) {
      if (!arr || arr.length === 0) return false;
      return downloadText(JSON.stringify(buildBackup(arr), null, 2), 'application/json;charset=utf-8', '凭据保险箱-' + stampNow() + '.json');
    }
    function exportEntries(arr, fmt) {
      if (!arr || arr.length === 0) return false;
      if (fmt === 'csv') return downloadText(buildCsv(arr), 'text/csv;charset=utf-8', '凭据保险箱-' + stampNow() + '.csv');
      if (fmt === 'md') return downloadText(buildMarkdown(arr), 'text/markdown;charset=utf-8', '凭据保险箱-' + stampNow() + '.md');
      return exportBackup(arr);
    }
    // Encrypted export: full backup (secrets included) sealed with a password.
    // Async because key derivation is Web Crypto. Resolves true on download.
    function exportEncrypted(arr, password) {
      if (!arr || arr.length === 0) return Promise.resolve(false);
      return encryptBackup(arr, password).then(function (envelope) {
        return downloadText(JSON.stringify(envelope, null, 2), 'application/json;charset=utf-8',
          '凭据保险箱-加密-' + stampNow() + '.vault.json');
      });
    }
    // Returns entries array or throws a recognisable error (JSON backups only).
    function parseBackup(text) {
      var data;
      try { data = JSON.parse(text); } catch (e) { throw new Error('parse'); }
      // An encrypted envelope is not a plain backup — surface a clear signal so
      // the import UI can prompt for the password instead of treating it as data.
      if (data && data.format === ENC_FORMAT) throw new Error('ENCRYPTED');
      var arr = null;
      if (data && Array.isArray(data.entries)) arr = data.entries;
      else if (Array.isArray(data)) arr = data; // tolerate a bare array
      if (!arr) throw new Error('shape');
      return arr.filter(function (e) { return e && typeof e === 'object'; }).map(normalize);
    }

    // ---- Encrypted backup (PBKDF2 + AES-GCM, Web Crypto) ------------------
    // The whole plaintext backup (secrets included) is encrypted with a key
    // derived from a user-supplied password. Nothing about the password or the
    // plaintext is stored in this file; losing the password means losing the
    // backup. Uses only platform Web Crypto — no third-party libraries.
    var ENC_FORMAT = 'dsh-credential-vault-encrypted';
    var ENC_VERSION = 1;
    var KDF_ITERATIONS = 210000;
    function bytesToB64(bytes) {
      var out = '';
      var chunk = 0x8000;
      for (var i = 0; i < bytes.length; i += chunk) {
        var part = Array.prototype.slice.call(bytes, i, Math.min(i + chunk, bytes.length));
        out += String.fromCharCode.apply(null, part);
      }
      return btoa(out);
    }
    function b64ToBytes(b64) {
      var s = atob(String(b64));
      var out = new Uint8Array(s.length);
      for (var i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
      return out;
    }
    function deriveEncKey(password, salt, iterations) {
      var subtle = window.crypto && window.crypto.subtle;
      if (!subtle) return Promise.reject(new Error('NO_CRYPTO'));
      var enc = new TextEncoder();
      return subtle.importKey('raw', enc.encode(String(password)), 'PBKDF2', false, ['deriveKey'])
        .then(function (baseKey) {
          return subtle.deriveKey(
            { name: 'PBKDF2', salt: salt, iterations: iterations, hash: 'SHA-256' },
            baseKey,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
          );
        });
    }
    // Resolve to a JSON-serialisable encrypted envelope.
    function encryptBackup(arr, password) {
      if (!password || !String(password)) return Promise.reject(new Error('EMPTY_PASSWORD'));
      var subtle = window.crypto && window.crypto.subtle;
      if (!subtle || !window.crypto.getRandomValues) return Promise.reject(new Error('NO_CRYPTO'));
      var plaintext = JSON.stringify(buildBackup(arr));
      var salt = new Uint8Array(16), iv = new Uint8Array(12);
      window.crypto.getRandomValues(salt);
      window.crypto.getRandomValues(iv);
      return deriveEncKey(password, salt, KDF_ITERATIONS).then(function (key) {
        return subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, new TextEncoder().encode(plaintext));
      }).then(function (buf) {
        return {
          format: ENC_FORMAT, version: ENC_VERSION, kdf: 'PBKDF2-SHA256',
          iterations: KDF_ITERATIONS,
          salt: bytesToB64(salt), iv: bytesToB64(iv), cipherText: bytesToB64(new Uint8Array(buf))
        };
      });
    }
    // Resolve to an entries array (decrypted + normalised), or reject with a
    // recognisable error: WRONG_PASSWORD / NOT_ENCRYPTED / NO_CRYPTO.
    function decryptBackup(envelope, password) {
      if (!envelope || envelope.format !== ENC_FORMAT) return Promise.reject(new Error('NOT_ENCRYPTED'));
      if (!password || !String(password)) return Promise.reject(new Error('EMPTY_PASSWORD'));
      var subtle = window.crypto && window.crypto.subtle;
      if (!subtle) return Promise.reject(new Error('NO_CRYPTO'));
      var salt = b64ToBytes(envelope.salt), iv = b64ToBytes(envelope.iv);
      var cipher = b64ToBytes(envelope.cipherText);
      var iterations = envelope.iterations || KDF_ITERATIONS;
      return deriveEncKey(password, salt, iterations).then(function (key) {
        return subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, cipher);
      }).then(function (buf) {
        return parseBackup(new TextDecoder().decode(buf));
      }).catch(function (e) {
        if (e && (e.message === 'NOT_ENCRYPTED' || e.message === 'EMPTY_PASSWORD' || e.message === 'NO_CRYPTO')) throw e;
        throw new Error('WRONG_PASSWORD');
      });
    }
    // Detect an encrypted envelope in raw imported text. Returns the envelope
    // object or null.
    function detectEncrypted(text) {
      try {
        var data = JSON.parse(String(text || '').replace(/^\uFEFF/, ''));
        return data && data.format === ENC_FORMAT ? data : null;
      } catch (e) { return null; }
    }
    // ---- Access-password security store ---------------------------------
    var SEC_KEY = '@local/dsh-credential-vault:security:v1';
    var SEC_KEY_LEGACY = '@local/credential-vault:security:v1';
    var IDLE_MS = 15 * 60 * 1000; // fallback duration when idleMs is absent
    var DEFAULT_SECURITY = { enabled: false, salt: '', passwordHash: null, question: null, answerHash: null, idleEnabled: false, idleMs: IDLE_MS };
    var securityCache = null;
    var securityListeners = [];
    var unlockedAt = 0; // 0 = locked; timestamp = last successful unlock

    function loadSecurity() {
      try {
        var raw = window.localStorage.getItem(SEC_KEY);
        if (!raw) {
          // One-time migration from the pre-rename storage key.
          raw = window.localStorage.getItem(SEC_KEY_LEGACY);
          if (raw) { try { window.localStorage.setItem(SEC_KEY, raw); } catch (e) {} }
        }
        if (!raw) return Object.assign({}, DEFAULT_SECURITY);
        var s = JSON.parse(raw);
        return Object.assign({}, DEFAULT_SECURITY, s || {});
      } catch (e) { return Object.assign({}, DEFAULT_SECURITY); }
    }
    function getSecurity() {
      if (!securityCache) securityCache = loadSecurity();
      return securityCache;
    }
    function saveSecurity(s) {
      securityCache = s;
      try { window.localStorage.setItem(SEC_KEY, JSON.stringify(s)); } catch (e) {}
      securityListeners.forEach(function (fn) { try { fn(); } catch (e) {} });
    }
    function subscribeSecurity(fn) {
      securityListeners.push(fn);
      return function () {
        var i = securityListeners.indexOf(fn);
        if (i >= 0) securityListeners.splice(i, 1);
      };
    }
    function makeSalt() {
      try {
        var bytes = new Uint8Array(16);
        window.crypto.getRandomValues(bytes);
        var out = '';
        for (var i = 0; i < bytes.length; i++) out += ('0' + bytes[i].toString(16)).slice(-2);
        return out;
      } catch (e) {
        return Date.now().toString(36) + Math.random().toString(36).slice(2);
      }
    }
    function simpleHash(s) {
      var h = 5381;
      for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
      return (h >>> 0).toString(16);
    }
    function hashValue(text) {
      try {
        if (window.crypto && window.crypto.subtle && window.crypto.subtle.digest && typeof TextEncoder !== 'undefined') {
          var data = new TextEncoder().encode(String(text));
          return window.crypto.subtle.digest('SHA-256', data).then(function (buf) {
            var bytes = new Uint8Array(buf), out = '';
            for (var i = 0; i < bytes.length; i++) out += ('0' + bytes[i].toString(16)).slice(-2);
            return 'sha256$' + out;
          }).catch(function () { return 'simple$' + simpleHash(text); });
        }
      } catch (e) {}
      return Promise.resolve('simple$' + simpleHash(text));
    }
    function hashWithSalt(salt, value) { return hashValue(salt + ':' + value); }
    function normalizeAnswer(s) { return String(s == null ? '' : s).trim().toLowerCase(); }
    function verifyPassword(sec, input) {
      if (!sec || !sec.passwordHash) return Promise.resolve(false);
      return hashWithSalt(sec.salt, input).then(function (h) { return h === sec.passwordHash; });
    }
    function verifyAnswer(sec, input) {
      if (!sec || !sec.answerHash) return Promise.resolve(false);
      return hashWithSalt(sec.salt, normalizeAnswer(input)).then(function (h) { return h === sec.answerHash; });
    }
    function isVaultLocked() {
      var sec = getSecurity();
      if (!sec.enabled) return false;
      if (!unlockedAt) return true;
      // Auto-lock only when the feature is on; otherwise an unlocked vault stays unlocked.
      if (sec.idleEnabled) {
        var limit = sec.idleMs || IDLE_MS;
        if (Date.now() - unlockedAt > limit) { unlockedAt = 0; return true; }
      }
      return false;
    }
    function markUnlocked() { unlockedAt = Date.now(); }
    function lockVault() { unlockedAt = 0; }
    function noteActivity() {
      var sec = getSecurity();
      if (sec.enabled && sec.idleEnabled && unlockedAt) unlockedAt = Date.now();
    }
    function hasSetup() {
      var sec = getSecurity();
      return !!(sec.passwordHash && sec.question && sec.answerHash);
    }
    var SECURITY_QUESTIONS = [
      { k: 'pet', en: 'What was the name of your first pet?', zh: '你第一只宠物的名字是什么？' },
      { k: 'school', en: 'What was the name of your primary school?', zh: '你就读的第一所学校叫什么名字？' },
      { k: 'city', en: 'In which city were you born?', zh: '你在哪个城市出生？' },
      { k: 'mother', en: 'What is your mother’s maiden name?', zh: '你母亲的姓名是什么？' },
      { k: 'custom', en: 'Custom question…', zh: '自定义问题…' }
    ];

    function detectLang(svc) {
      if (svc) {
        try {
          var snap = typeof svc.getLocale === 'function' ? svc.getLocale()
            : (typeof svc.getSnapshot === 'function' ? svc.getSnapshot() : null);
          if (snap) {
            var id = snap.id || snap.locale || snap.lang || snap.language || (typeof snap === 'string' ? snap : null);
            if (id) return String(id).toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en';
          }
        } catch (e) {}
      }
      try { return String(navigator.language || '').toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en'; }
      catch (e) { return 'en'; }
    }
    function searchText(e) {
      var parts = [e.title || ''];
      schemaOf(e.category).forEach(function (f) {
        if (f.key === 'title' || isSecretField(f)) return;
        if (e[f.key]) parts.push(e[f.key]);
      });
      return parts.join(' ').toLowerCase();
    }
    function emptyDraft(cat) {
      return {
        id: '', title: '', category: cat || 'account',
        username: '', password: '', url: '',
        provider: '', apiKey: '', endpoint: '', expiry: '',
        content: '', keyName: '', keyValue: '',
        links: [],
        appId: '', appSecret: '', token: '', encodingAesKey: '', serverUrl: '', uploadKey: '', domains: '',
        notes: ''
      };
    }

    var layout = null, locale = null, lang0 = 'en';
    var sidebarRight = null, ctxRef = null;
    function tr(k) { return (DICTS[lang0] && DICTS[lang0][k]) || DICTS.en[k] || k; }

    function Shield(size) {
      var s = size || 20;
      return h('svg', { viewBox: '0 0 64 64', width: s, height: s, 'aria-hidden': true, style: { display: 'block' } },
        h('path', { d: 'M32 6 L52 13 V30 C52 43 43 52 32 58 C21 52 12 43 12 30 V13 Z', fill: 'currentColor', opacity: 0.14 }),
        h('path', { d: 'M32 6 L52 13 V30 C52 43 43 52 32 58 C21 52 12 43 12 30 V13 Z', fill: 'none', stroke: 'currentColor', strokeWidth: 3, strokeLinejoin: 'round' }),
        h('circle', { cx: 32, cy: 27, r: 4.6, fill: 'currentColor' }),
        h('rect', { x: 29.4, y: 30, width: 5.2, height: 11, rx: 2.6, fill: 'currentColor' })
      );
    }

    function PanelIcon(props) {
      var onClick = function (e) {
        if (props && typeof props.onClick === 'function') { try { props.onClick(e); } catch (_) {} }
        try { if (layout && typeof layout.selectPanel === 'function') layout.selectPanel(PANEL_ID); } catch (_) {}
      };
      return h('span', {
        className: 'cv-rail-icon', title: tr('title'), role: 'button', tabIndex: 0,
        onClick: onClick,
        onKeyDown: function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e); } },
        style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, color: 'var(--dsw-alias-label-primary, #1d2129)', cursor: 'pointer' }
      }, Shield(20));
    }

    function looksLikeUrl(v) { return /^https?:\/\//i.test(String(v || '').trim()); }
    function copyToClipboard(text) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(String(text));
      } catch (e) {}
      return Promise.reject(new Error('no-clipboard'));
    }

    function Field(props) {
      var t = props.t;
      var isSecret = !!props.secret;
      var revealed = !!props.revealed;
      var display = (isSecret && !revealed) ? MASK : (props.value || '');
      var masked = isSecret && !revealed;
      var visitable = !!props.isUrl && looksLikeUrl(props.value);
      return h('div', { className: 'cv-field' },
        h('div', { className: 'cv-field-label' }, t(props.label)),
        h('div', { className: 'cv-field-row' },
          h('span', {
            className: 'cv-field-value' + (props.mono ? ' cv-mono' : '') + (masked ? ' cv-masked' : '') + (props.multiline ? ' cv-field-multiline' : ''),
            title: masked ? '' : (props.value || '')
          }, display || '—'),
          visitable ? h('button', { className: 'cv-mini', onClick: function () { props.onVisit(props.value); }, title: t('visit') }, t('visit')) : null,
          isSecret ? h('button', { className: 'cv-mini', onClick: props.onToggle, title: revealed ? t('hide') : t('show') }, revealed ? t('hide') : t('show')) : null,
          props.value ? h('button', { className: 'cv-mini', onClick: function () { props.onCopy(props.value); }, title: t('copy') }, t('copy')) : null
        )
      );
    }

    function Card(props) {
      var e = props.entry, t = props.t;
      var cat = e.category || 'account';
      var catMeta = CATEGORIES.filter(function (c) { return c.k === cat; })[0];
      var catLabel = catMeta ? t(catMeta.label) : t('catAccount');
      var linkChips = Array.isArray(e.links) && e.links.length ? e.links.map(function (id) {
        var target = (props.entries || []).filter(function (x) { return x.id === id; })[0];
        if (!target) return null;
        var tc = CATEGORIES.filter(function (c) { return c.k === target.category; })[0];
        return h('button', {
          key: id, className: 'cv-link-chip', title: target.title,
          onClick: function () { props.onGo(id); }
        }, '🔗 ' + target.title + (tc ? ' · ' + t(tc.label) : ''));
      }).filter(Boolean) : [];
      return h('div', { className: 'cv-card' },
        h('div', { className: 'cv-card-head' },
          h('span', { className: 'cv-badge cv-badge-' + cat }, catLabel),
          h('span', { className: 'cv-card-title', title: e.title }, e.title),
          h('div', { className: 'cv-card-actions' },
            h('button', { className: 'cv-icon-btn', onClick: props.onEdit, title: t('edit'), 'aria-label': t('edit') }, '✎'),
            h('button', { className: 'cv-icon-btn cv-danger', onClick: props.onDelete, title: t('delete'), 'aria-label': t('delete') }, '🗑')
          )
        ),
        h('div', { className: 'cv-card-body' },
          schemaOf(cat).slice(1).map(function (f) {
            if (f.key === 'links') return null;
            if (!e[f.key]) return null;
            return h(Field, {
              key: f.key, t: t, label: f.label, value: e[f.key],
              mono: !!f.mono, secret: isSecretField(f), multiline: isMultilineField(f), isUrl: !!f.isUrl,
              revealed: !!props.revealed, onToggle: props.onToggle, onCopy: props.onCopy, onVisit: props.onVisit
            });
          }),
          linkChips.length ? h('div', { className: 'cv-links' },
            h('div', { className: 'cv-field-label' }, t('fLinks')), linkChips) : null
        )
      );
    }

    function EditorModal(props) {
      var d = props.draft, t = props.t, onChange = props.onChange;
      var ss = useState(false), showSecret = ss[0], setShowSecret = ss[1];
      var cat = d.category || 'account';
      var meta = CATEGORIES.filter(function (c) { return c.k === cat; })[0] || CATEGORIES[0];
      var fields = schemaOf(cat);

      // Only the essential fields show by default; the rest fold behind a
      // "More fields" toggle so short forms stay short and long forms compact.
      var PRIMARY_KEYS = { title: 1, username: 1, password: 1, apiKey: 1, appId: 1, appSecret: 1, content: 1, keyName: 1, keyValue: 1, links: 1 };
      var primary = fields.filter(function (f) { return PRIMARY_KEYS[f.key]; });
      var secondary = fields.filter(function (f) { return !PRIMARY_KEYS[f.key]; });
      var hasSecondary = secondary.some(function (f) { return !!d[f.key]; });
      var moreState = useState(hasSecondary), showMore = moreState[0], setShowMore = moreState[1];
      // Link picker: dropdown with search + type filter (account "linked credentials").
      var lkOpenState = useState(false), linksOpen = lkOpenState[0], setLinksOpen = lkOpenState[1];
      var lkQueryState = useState(''), linkQuery = lkQueryState[0], setLinkQuery = lkQueryState[1];
      var lkTypeState = useState('all'), linkType = lkTypeState[0], setLinkType = lkTypeState[1];
      var lkRef = useRef(null);
      useEffect(function () {
        if (!linksOpen) return;
        function onDoc(ev) { if (lkRef.current && !lkRef.current.contains(ev.target)) setLinksOpen(false); }
        document.addEventListener('mousedown', onDoc);
        return function () { document.removeEventListener('mousedown', onDoc); };
      }, [linksOpen]);

      function baseInput(f, extra) {
        return Object.assign({
          className: 'cv-input', value: d[f.key] || '',
          placeholder: f.ph ? t(f.ph) : '',
          autoFocus: !!f.required,
          onChange: function (ev) { onChange(f.key, ev.target.value); }
        }, extra || {});
      }
      // Multiline fields and long values get a full row; everything else pairs up.
      var WIDE_KEYS = { content: 1, notes: 1, endpoint: 1, serverUrl: 1, uploadKey: 1, domains: 1, encodingAesKey: 1, links: 1 };
      function isWide(f) { return f.type === 'textarea' || f.type === 'secretarea' || !!WIDE_KEYS[f.key]; }
      function renderField(f) {
        var control;
        if (f.type === 'links') {
          var candidates = (props.entries || []).filter(function (x) {
            return x.id !== d.id && ['apikey', 'secretKey', 'other'].indexOf(x.category) >= 0;
          });
          var selected = Array.isArray(d.links) ? d.links : [];
          function toggleLink(id) {
            var next = selected.indexOf(id) >= 0
              ? selected.filter(function (lid) { return lid !== id; })
              : selected.concat([id]);
            onChange('links', next);
          }
          var typeOpts = [
            { k: 'all', label: 'filterAll' },
            { k: 'apikey', label: 'filterApikey' },
            { k: 'secretKey', label: 'filterSecretKey' },
            { k: 'other', label: 'filterOther' }
          ];
          var shown = candidates.filter(function (x) {
            if (linkType !== 'all' && x.category !== linkType) return false;
            var q = linkQuery.trim().toLowerCase();
            return !q || String(x.title || '').toLowerCase().indexOf(q) >= 0;
          });
          control = h('div', { className: 'cv-link-picker', ref: lkRef },
            h('div', { className: 'cv-link-picker-top' },
              h('button', {
                type: 'button', className: 'cv-link-trigger' + (linksOpen ? ' cv-link-trigger-on' : ''),
                onClick: function () { setLinksOpen(!linksOpen); }
              },
                h('span', null, selected.length ? (selected.length + ' ' + t('linkSelected')) : t('linkPlaceholder')),
                h('span', { className: 'cv-link-caret' }, linksOpen ? '▴' : '▾')
              ),
              selected.length ? h('button', {
                type: 'button', className: 'cv-link-clear', title: t('linkClear'),
                onClick: function () { onChange('links', []); }
              }, '×') : null
            ),
            selected.length ? h('div', { className: 'cv-link-selected' },
              selected.map(function (id) {
                var tgt = candidates.filter(function (x) { return x.id === id; })[0];
                var label = tgt ? tgt.title : t('linkMissing');
                return h('span', { key: id, className: 'cv-link-sel-chip', title: label },
                  h('span', { className: 'cv-link-sel-text' }, '🔗 ' + label),
                  h('button', {
                    type: 'button', className: 'cv-link-sel-x', title: t('linkClear'),
                    onClick: function () { toggleLink(id); }
                  }, '×')
                );
              })
            ) : null,
            linksOpen ? h('div', { className: 'cv-link-popover' },
              h('input', {
                className: 'cv-input cv-link-search', type: 'text',
                placeholder: t('linkSearch'), value: linkQuery,
                onChange: function (ev) { setLinkQuery(ev.target.value); }
              }),
              h('div', { className: 'cv-link-typechips' },
                typeOpts.map(function (o) {
                  return h('button', {
                    type: 'button', key: o.k,
                    className: 'cv-link-typechip' + (linkType === o.k ? ' cv-link-typechip-on' : ''),
                    onClick: function () { setLinkType(o.k); }
                  }, t(o.label));
                })
              ),
              h('div', { className: 'cv-link-options' },
                shown.length ? shown.map(function (x) {
                  var checked = selected.indexOf(x.id) >= 0;
                  var cm = CATEGORIES.filter(function (c) { return c.k === x.category; })[0];
                  return h('label', { key: x.id, className: 'cv-link-opt' },
                    h('input', { type: 'checkbox', checked: checked, onChange: function () { toggleLink(x.id); } }),
                    h('span', null, x.title + (cm ? ' · ' + t(cm.label) : ''))
                  );
                }) : h('span', { className: 'cv-link-empty' }, t('linkNoMatch'))
              )
            ) : null
          );
        } else if (f.type === 'text' || f.type === 'date') {
          control = h('input', baseInput(f, { type: f.type === 'date' ? 'date' : 'text' }));
        } else if (f.type === 'textarea') {
          control = h('textarea', baseInput(f, { className: 'cv-input cv-textarea' }));
        } else if (f.type === 'secret') {
          control = h('div', { className: 'cv-secret-input' },
            h('input', baseInput(f, { type: showSecret ? 'text' : 'password' })),
            (f.generatable && typeof props.onGenerate === 'function') ? h('button', { type: 'button', className: 'cv-gen-btn', title: t('genField'), onClick: function () { props.onGenerate(f.key); } }, '⚙ ' + t('genButton')) : null,
            h('button', { type: 'button', className: 'cv-secret-toggle', onClick: function () { setShowSecret(!showSecret); } }, showSecret ? t('hide') : t('show'))
          );
        } else if (f.type === 'secretarea') {
          control = h('div', { className: 'cv-secret-input' },
            h('textarea', baseInput(f, {
              className: 'cv-input cv-textarea cv-mono' + (showSecret ? '' : ' cv-text-security'),
              spellCheck: false
            })),
            (f.generatable && typeof props.onGenerate === 'function') ? h('button', { type: 'button', className: 'cv-gen-btn', title: t('genField'), onClick: function () { props.onGenerate(f.key); } }, '⚙ ' + t('genButton')) : null,
            h('button', { type: 'button', className: 'cv-secret-toggle', onClick: function () { setShowSecret(!showSecret); } }, showSecret ? t('hide') : t('show'))
          );
        }
        return h('label', { key: f.key, className: 'cv-form-row' + (isWide(f) ? ' cv-row-full' : '') },
          h('span', { className: 'cv-form-label' }, t(f.label), f.required ? h('span', { className: 'cv-req' }, '*') : null),
          control
        );
      }

      return h('div', { className: 'cv-modal-backdrop', onMouseDown: function (e) { if (e.target === e.currentTarget) props.onCancel(); } },
        h('div', {
          className: 'cv-modal cv-modal-editor', role: 'dialog', 'aria-modal': 'true', 'aria-label': t(props.titleKey), tabIndex: -1,
          onKeyDown: function (e) { if (e.key === 'Escape') props.onCancel(); }
        },
          h('div', { className: 'cv-modal-head' }, h('h2', null, t(props.titleKey) + ' · ' + t(meta.label))),
          h('div', { className: 'cv-modal-hint' }, t(meta.hint)),
          h('div', { className: 'cv-form-body' },
            h('label', { className: 'cv-form-row cv-row-full' },
              h('span', { className: 'cv-form-label' }, t('fCategory')),
              h('select', { className: 'cv-input', value: cat, onChange: function (ev) { onChange('category', ev.target.value); } },
                CATEGORIES.map(function (c) { return h('option', { key: c.k, value: c.k }, t(c.label)); })
              )
            ),
            h('div', { className: 'cv-form-sep' }, t('formDetails')),
            primary.map(renderField),
            secondary.length ? (showMore ? secondary.map(renderField) : null) : null,
            secondary.length && !showMore ? h('button', {
              type: 'button', className: 'cv-more-btn',
              onClick: function () { setShowMore(true); }
            }, '▾ ' + t('moreFields') + ' (' + secondary.length + ')') : null,
            secondary.length && showMore ? h('button', {
              type: 'button', className: 'cv-more-btn',
              onClick: function () { setShowMore(false); }
            }, '▴ ' + t('lessFields')) : null
          ),
          h('div', { className: 'cv-modal-foot' },
            h('button', { className: 'cv-btn', onClick: props.onCancel }, t('cancel')),
            h('button', { className: 'cv-btn cv-btn-primary', onClick: props.onSave }, t('save'))
          )
        )
      );
    }

    // IME-friendly masked input: a plain text field styled with
    // -webkit-text-security so Chinese/Japanese input methods can compose
    // (type="password" disables IME composition in Chromium/Electron).
    function SecretInput(props) {
      var showState = useState(false);
      var show = showState[0], setShow = showState[1];
      return h('div', { className: 'cv-secret-input' },
        h('input', {
          className: 'cv-input' + (show ? '' : ' cv-text-security'),
          type: 'text',
          autoComplete: 'off',
          spellCheck: false,
          autoFocus: props.autoFocus,
          value: props.value,
          placeholder: props.placeholder,
          onChange: props.onChange,
          onKeyDown: props.onKeyDown
        }),
        h('button', { type: 'button', className: 'cv-secret-toggle', onClick: function () { setShow(!show); } },
          show ? props.t('hide') : props.t('show'))
      );
    }

    function ResetModal(props) {
      var t = props.t;
      var answerState = useState(''), answer = answerState[0], setAnswer = answerState[1];
      var pwState = useState(''), pw = pwState[0], setPw = pwState[1];
      var cfState = useState(''), cf = cfState[0], setCf = cfState[1];
      var errState = useState(''), err = errState[0], setErr = errState[1];
      var sec = getSecurity();
      var hasAnswer = !!(sec && sec.answerHash);
      function submit() {
        if (!hasAnswer) { setErr(t('resetUnavailable')); return; }
        if (!cf || cf !== pw) { setErr(t('secMismatch')); return; }
        if (!pw || String(pw).length < 4) { setErr(t('secTooShort')); return; }
        verifyAnswer(sec, answer).then(function (ok) {
          if (!ok) { setErr(t('resetFail')); return; }
          var s = Object.assign({}, getSecurity());
          s.salt = s.salt || makeSalt();
          return hashWithSalt(s.salt, pw).then(function (h) {
            s.passwordHash = h;
            saveSecurity(s);
            props.onDone();
          });
        }).catch(function () { setErr(t('resetFail')); });
      }
      return h('div', { className: 'cv-modal-backdrop', onMouseDown: function (e) { if (e.target === e.currentTarget) props.onCancel(); } },
        h('div', { className: 'cv-modal', role: 'dialog', 'aria-modal': 'true', tabIndex: -1,
          onKeyDown: function (e) { if (e.key === 'Escape') props.onCancel(); } },
          h('div', { className: 'cv-modal-head' }, h('h2', null, t('resetTitle'))),
          h('div', { className: 'cv-modal-body' },
            h('p', { className: 'cv-card-sub' }, t('resetDesc')),
            hasAnswer ? h('label', { className: 'cv-form-row' },
              h('span', { className: 'cv-form-label' }, (sec.question && sec.question.label) || sec.question || t('secQuestion')),
              h(SecretInput, { t: t, autoFocus: true, value: answer, placeholder: t('resetAnswer'), onChange: function (ev) { setAnswer(ev.target.value); setErr(''); } })
            ) : h('p', { className: 'cv-field-error' }, t('resetUnavailable')),
            h('label', { className: 'cv-form-row' },
              h('span', { className: 'cv-form-label' }, t('resetNewPassword')),
              h(SecretInput, { t: t, value: pw, placeholder: t('secMinLength'), onChange: function (ev) { setPw(ev.target.value); setErr(''); } })
            ),
            h('label', { className: 'cv-form-row' },
              h('span', { className: 'cv-form-label' }, t('resetConfirm')),
              h(SecretInput, { t: t, value: cf, onChange: function (ev) { setCf(ev.target.value); setErr(''); },
                onKeyDown: function (e) { if (e.key === 'Enter') submit(); } })
            ),
            err ? h('div', { className: 'cv-field-error', role: 'alert' }, err) : null
          ),
          h('div', { className: 'cv-modal-foot' },
            h('button', { className: 'cv-btn', onClick: props.onCancel }, t('cancel')),
            h('button', { className: 'cv-btn cv-btn-primary', onClick: submit }, t('resetSubmit'))
          )
        )
      );
    }

    function ConfirmModal(props) {
      var t = props.t;
      var msg = Array.isArray(props.message)
        ? props.message.map(function (line, i) { return h('div', { key: i }, line); })
        : props.message;
      return h('div', { className: 'cv-modal-backdrop', onMouseDown: function (e) { if (e.target === e.currentTarget) props.onCancel(); } },
        h('div', { className: 'cv-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': props.title, tabIndex: -1,
          onKeyDown: function (e) { if (e.key === 'Escape') props.onCancel(); } },
          h('div', { className: 'cv-modal-head' }, h('h2', null, props.title)),
          h('div', { className: 'cv-modal-hint' }, msg),
          h('div', { className: 'cv-modal-foot' },
            h('button', { className: 'cv-btn', onClick: props.onCancel }, t('cancel')),
            h('button', { className: 'cv-btn cv-btn-primary', onClick: props.onConfirm }, props.confirmLabel)
          )
        )
      );
    }

    function ImportModal(props) {
      var t = props.t;
      var fileState = useState(null), fileInfo = fileState[0], setFileInfo = fileState[1];
      var entriesState = useState(null), pending = entriesState[0], setPending = entriesState[1];
      var modeState = useState('merge'), mode = modeState[0], setMode = modeState[1];
      var errState = useState(''), err = errState[0], setErr = errState[1];
      var inputRef = useState({})[0];
      var detectedState = useState(''), detected = detectedState[0], setDetected = detectedState[1];
      var encState = useState(null), encEnv = encState[0], setEncEnv = encState[1];
      var encPwState = useState(''), encPw = encPwState[0], setEncPw = encPwState[1];
      var encBusyState = useState(false), encBusy = encBusyState[0], setEncBusy = encBusyState[1];

      function onFile(ev) {
        var f = ev.target.files && ev.target.files[0];
        if (!f) return;
        setErr(''); setPending(null); setDetected(''); setEncEnv(null); setEncPw('');
        setFileInfo({ name: f.name, size: f.size });
        if (typeof FileReader === 'undefined') { setErr(t('importInvalid')); return; }
        var reader = new FileReader();
        reader.onload = function () {
          var text = String(reader.result || '');
          var env = detectEncrypted(text);
          if (env) { setEncEnv(env); setDetected('enc'); return; }
          try {
            var res = parseImport(text);
            setPending(res.entries);
            setDetected(res.fmt);
            if (res.entries.length === 0) setErr(t('importEmpty'));
          } catch (e) { setErr(t('importInvalid')); setPending(null); }
        };
        reader.onerror = function () { setErr(t('importInvalid')); setPending(null); };
        reader.readAsText(f, 'utf-8');
      }
      function decrypt() {
        if (!encEnv) return;
        if (!encPw) { setErr(t('encPwRequired')); return; }
        setErr(''); setEncBusy(true);
        decryptBackup(encEnv, encPw).then(function (arr) {
          setEncBusy(false);
          setPending(arr); setEncEnv(null); setEncPw(''); setDetected('json');
          if (arr.length === 0) setErr(t('importEmpty'));
        }).catch(function (e) {
          setEncBusy(false);
          var m = e && e.message;
          setErr(m === 'WRONG_PASSWORD' ? t('encWrongPw') : m === 'NO_CRYPTO' ? t('encNoCrypto') : t('importInvalid'));
        });
      }
      function submit() {
        if (!pending || pending.length === 0) { setErr(t('importEmpty')); return; }
        props.onImport(pending, mode);
      }
      return h('div', { className: 'cv-modal-backdrop', onMouseDown: function (e) { if (e.target === e.currentTarget) props.onCancel(); } },
        h('div', { className: 'cv-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('importTitle'), tabIndex: -1,
          onKeyDown: function (e) { if (e.key === 'Escape') props.onCancel(); } },
          h('div', { className: 'cv-modal-head' }, h('h2', null, t('importTitle'))),
          h('div', { className: 'cv-modal-hint' }, t('importHint')),
          h('div', { className: 'cv-modal-body' },
            h('input', {
              ref: function (el) { inputRef.el = el; },
              type: 'file', accept: '.json,.csv,.md,.markdown,application/json,text/csv,text/markdown', style: { display: 'none' },
              onChange: onFile
            }),
            h('button', { type: 'button', className: 'cv-btn', onClick: function () { if (inputRef.el) inputRef.el.click(); } },
              fileInfo ? '📄 ' + fileInfo.name : t('import')),
            fileInfo ? h('div', { className: 'cv-import-file' },
              encEnv ? t('encDetected')
                : t('importFound') + '：' + (pending ? pending.length : '…') +
                  (detected ? ' · ' + t('importDetected') + '：' + t('fmt' + detected.charAt(0).toUpperCase() + detected.slice(1)) : '')) : null,
            encEnv ? h('div', { className: 'cv-enc-fields' },
              h('div', { className: 'cv-card-sub' }, t('encImportHint')),
              h('input', { type: 'password', className: 'cv-input', placeholder: t('encPw'), value: encPw, autoComplete: 'off',
                onChange: function (e) { setEncPw(e.target.value); },
                onKeyDown: function (e) { if (e.key === 'Enter') decrypt(); } })
            ) : null,
            encEnv ? null : h('div', { className: 'cv-form-label' }, t('importMode')),
            encEnv ? null : h('div', { className: 'cv-import-modes' },
              h('label', { className: 'cv-import-opt' },
                h('input', { type: 'radio', name: 'cv-import-mode', checked: mode === 'merge', onChange: function () { setMode('merge'); } }),
                h('div', null,
                  h('div', { className: 'cv-import-opt-name' }, t('importMerge')),
                  h('div', { className: 'cv-import-opt-hint' }, t('importMergeHint'))
                )
              ),
              h('label', { className: 'cv-import-opt' + (mode === 'replace' ? ' cv-import-warn' : '') },
                h('input', { type: 'radio', name: 'cv-import-mode', checked: mode === 'replace', onChange: function () { setMode('replace'); } }),
                h('div', null,
                  h('div', { className: 'cv-import-opt-name' }, t('importReplace')),
                  h('div', { className: 'cv-import-opt-hint' }, t('importReplaceWarn'))
                )
              )
            ),
            err ? h('div', { className: 'cv-field-error', role: 'alert' }, err) : null
          ),
          h('div', { className: 'cv-modal-foot' },
            h('button', { className: 'cv-btn', onClick: props.onCancel }, t('cancel')),
            encEnv
              ? h('button', { className: 'cv-btn cv-btn-primary', disabled: encBusy, onClick: decrypt }, encBusy ? t('encBusy') : t('encUnlock'))
              : h('button', { className: 'cv-btn cv-btn-primary', disabled: !pending || pending.length === 0, onClick: submit }, t('importConfirm'))
          )
        )
      );
    }

    function ExportModal(props) {
      var t = props.t;
      var encState = useState(false), enc = encState[0], setEnc = encState[1];
      var pwState = useState(''), pw = pwState[0], setPw = pwState[1];
      var pw2State = useState(''), pw2 = pw2State[0], setPw2 = pw2State[1];
      var errState = useState(''), err = errState[0], setErr = errState[1];
      var busyState = useState(false), busy = busyState[0], setBusy = busyState[1];
      var fmts = [
        { k: 'enc', name: 'exportEncrypted', hint: 'exportEncryptedHint', icon: '🔐' },
        { k: 'json', name: 'exportJson', hint: 'exportJsonHint', icon: '📦' },
        { k: 'csv', name: 'exportCsv', hint: 'exportCsvHint', icon: '📊' },
        { k: 'md', name: 'exportMd', hint: 'exportMdHint', icon: '📝' }
      ];
      function pick(f) {
        if (f.k !== 'enc') { props.onPick(f.k); return; }
        setErr(''); setEnc(true);
      }
      function doEncrypted() {
        if (!pw || pw.length < 6) { setErr(t('encPwShort')); return; }
        if (pw !== pw2) { setErr(t('encPwMismatch')); return; }
        setErr(''); setBusy(true);
        props.onEncrypted(pw).then(function (ok) {
          setBusy(false);
          if (ok) { setPw(''); setPw2(''); props.onDone(); }
          else setErr(t('exportFail'));
        }).catch(function (e) {
          setBusy(false);
          setErr(e && e.message === 'NO_CRYPTO' ? t('encNoCrypto') : t('exportFail'));
        });
      }
      return h('div', { className: 'cv-modal-backdrop', onMouseDown: function (e) { if (e.target === e.currentTarget) props.onCancel(); } },
        h('div', { className: 'cv-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('exportTitle'), tabIndex: -1,
          onKeyDown: function (e) { if (e.key === 'Escape') props.onCancel(); } },
          h('div', { className: 'cv-modal-head' }, h('h2', null, t('exportTitle'))),
          h('div', { className: 'cv-modal-hint' }, t('exportWarn')),
          h('div', { className: 'cv-modal-body' },
            h('div', { className: 'cv-form-label' }, t('exportFormat')),
            h('div', { className: 'cv-import-modes' }, fmts.map(function (f) {
              return h('button', { type: 'button', key: f.k, className: 'cv-import-opt cv-export-opt', onClick: function () { pick(f); } },
                h('span', { className: 'cv-export-icon' }, f.icon),
                h('div', null,
                  h('div', { className: 'cv-import-opt-name' }, t(f.name)),
                  h('div', { className: 'cv-import-opt-hint' }, t(f.hint))
                )
              );
            })),
            enc ? h('div', { className: 'cv-enc-fields' },
              h('div', { className: 'cv-card-sub' }, t('encPwHint')),
              h('input', { type: 'password', className: 'cv-input', placeholder: t('encPw'), value: pw, autoComplete: 'new-password', onChange: function (e) { setPw(e.target.value); } }),
              h('input', { type: 'password', className: 'cv-input', placeholder: t('encPw2'), value: pw2, autoComplete: 'new-password', onChange: function (e) { setPw2(e.target.value); } })
            ) : null,
            err ? h('div', { className: 'cv-field-error', role: 'alert' }, err) : null
          ),
          h('div', { className: 'cv-modal-foot' },
            h('button', { className: 'cv-btn', onClick: props.onCancel }, t('cancel')),
            enc ? h('button', { className: 'cv-btn cv-btn-primary', disabled: busy, onClick: doEncrypted }, busy ? t('encBusy') : t('exportEncryptedGo')) : null
          )
        )
      );
    }

    function LockScreen(props) {
      var t = props.t;
      var pwState = useState(''), pw = pwState[0], setPw = pwState[1];
      var errState = useState(''), err = errState[0], setErr = errState[1];
      var resetState = useState(false), resetting = resetState[0], setResetting = resetState[1];
      function submit() {
        verifyPassword(getSecurity(), pw).then(function (ok) {
          if (ok) { markUnlocked(); props.onUnlocked(); }
          else { setErr(t('unlockFail')); setPw(''); }
        });
      }
      return h('div', { className: 'cv-root' },
        h('style', null, CSS),
        h('div', { className: 'cv-lock' },
          h('div', { className: 'cv-lock-card' },
            h('div', { className: 'cv-lock-icon' }, Shield(38)),
            h('h2', null, t('lockTitle')),
            h('p', null, t('lockDesc')),
            h('div', { className: 'cv-lock-form' },
              h(SecretInput, { t: t, autoFocus: true, value: pw, placeholder: t('secCurrent'),
                onChange: function (ev) { setPw(ev.target.value); setErr(''); },
                onKeyDown: function (e) { if (e.key === 'Enter') submit(); } }),
              err ? h('div', { className: 'cv-field-error', role: 'alert' }, err) : null,
              h('div', { className: 'cv-lock-actions' },
                h('button', { className: 'cv-btn cv-btn-primary', onClick: submit }, t('unlock')),
                hasSetup() ? h('button', { className: 'cv-link', onClick: function () { setResetting(true); } }, t('forgot')) : null
              )
            ),
            h('div', { className: 'cv-lock-foot' }, t('secAnswerHint'))
          )
        ),
        resetting ? h(ResetModal, { t: t, onCancel: function () { setResetting(false); }, onDone: function () { setResetting(false); setErr(''); setPw(''); } }) : null
      );
    }

    function SettingsSection(props) {
      var langState = useState(function () { return detectLang(locale); });
      var lang = langState[0], setLang = langState[1];
      function t(k) { return (DICTS[lang] && DICTS[lang][k]) || DICTS.en[k] || k; }
      var secState = useState(function () { return Object.assign({}, getSecurity()); });
      var sec = secState[0], setSec = secState[1];
      function refresh() { setSec(Object.assign({}, getSecurity())); }
      useEffect(function () { return subscribeSecurity(refresh); }, []);
      useEffect(function () {
        if (locale && typeof locale.subscribe === 'function') {
          var un = null;
          try { un = locale.subscribe(function () { setLang(detectLang(locale)); }); } catch (e) {}
          return function () { try { if (un) un(); } catch (e) {} };
        }
      }, []);
      var pwState = useState(''), pw = pwState[0], setPw = pwState[1];
      var currentState = useState(''), current = currentState[0], setCurrent = currentState[1];
      var confirmState = useState(''), confirm = confirmState[0], setConfirm = confirmState[1];
      var disablePwState = useState(''), disablePw = disablePwState[0], setDisablePw = disablePwState[1];
      var qState = useState(function () { return (getSecurity().question && getSecurity().question.k) || 'pet'; });
      var q = qState[0], setQ = qState[1];
      var customQState = useState(''), customQ = customQState[0], setCustomQ = customQState[1];
      var answerState = useState(''), answer = answerState[0], setAnswer = answerState[1];
      var qCurrentState = useState(''), qCurrent = qCurrentState[0], setQCurrent = qCurrentState[1];
      var msgState = useState(null), msg = msgState[0], setMsg = msgState[1];
      var updateState = useState(null), updateInfo = updateState[0], setUpdateInfo = updateState[1];
      var checkingState = useState(false), checking = checkingState[0], setChecking = checkingState[1];
      var upgradingState = useState(false), upgrading = upgradingState[0], setUpgrading = upgradingState[1];
      var upgradeMsgState = useState(null), upgradeMsg = upgradeMsgState[0], setUpgradeMsg = upgradeMsgState[1];
      var upgradeConfirmState = useState(null), upgradeConfirmDlg = upgradeConfirmState[0], setUpgradeConfirmDlg = upgradeConfirmState[1];
      var auditState = useState(null), auditData = auditState[0], setAudit = auditState[1];
      var auditLoadingState = useState(false), auditLoading = auditLoadingState[0], setAuditLoading = auditLoadingState[1];
      var pollRef = useRef(null);
      // Inline card messages: shown inside the settings card where the action
      // happened, so feedback lands exactly where the user is looking.
      function notify(area, text, kind) { setMsg({ area: area, text: text, kind: kind || 'ok' }); }
      useEffect(function () {
        if (!msg) return;
        var id = setTimeout(function () { setMsg(null); }, 4000);
        return function () { clearTimeout(id); };
      }, [msg]);
      // Clear any running poll timer when the settings page unmounts.
      useEffect(function () {
        return function () { if (pollRef.current) { clearTimeout(pollRef.current); pollRef.current = null; } };
      }, []);

      function fetchAudit() {
        if (auditLoading) return;
        setAuditLoading(true);
        window.fetch(API + 'audit', { credentials: 'same-origin', headers: { accept: 'application/json' } })
          .then(function (r) { return r.json(); })
          .then(function (body) { setAudit(body && body.ok === true ? body : { ok: false, events: [], total: 0 }); })
          .catch(function () { setAudit({ ok: false, events: [], total: 0 }); })
          .then(function () { setAuditLoading(false); });
      }
      function checkUpdate() {
        if (checking) return;
        setChecking(true);
        setUpdateInfo(null);
        window.fetch(API + 'update-check', { credentials: 'same-origin', headers: { accept: 'application/json' } })
          .then(function (r) { return r.json(); })
          .then(function (body) {
            if (!body || body.ok !== true) {
              var msg = body && body.error ? body.error : t('updateFail');
              setUpdateInfo({ ok: false, error: msg });
              return;
            }
            // Recompute against THIS client's version so the "new version"
            // verdict always agrees with the version number shown in the UI.
            // The host's CURRENT_VERSION may be stale until Harness restarts.
            body.updateAvailable = compareVersions(VERSION, body.latestVersion) < 0;
            setUpdateInfo(body);
          })
          .catch(function () { setUpdateInfo({ ok: false, error: t('updateFail') }); })
          .then(function () { setChecking(false); });
      }

      // Upgrade goes through dshmarket's documented public update API v1 — the
      // plugin market drives the same package manager that installed this plugin,
      // so we never spawn a package manager ourselves.
      function marketFetchJson(url, init) {
        return window.fetch(url, Object.assign({ credentials: 'same-origin', headers: { accept: 'application/json' } }, init || {}))
          .then(function (r) { return r.json(); });
      }

      function pollOperation(operationId) {
        marketFetchJson('dsh-market/api/v1/operations?operationId=' + encodeURIComponent(operationId) + '&_=' + Date.now())
          .then(function (body) {
            var op = body && body.operation;
            if (!op) { setUpgradeMsg({ kind: 'err', text: t('upgradeFail') + 'operation not found' }); setUpgrading(false); return; }
            var state = op.state;
            if (state === 'succeeded') {
              var installed = op.installedVersion || '';
              var restart = op.outcome && op.outcome.restartRequired;
              setUpgradeMsg({ kind: 'ok', text: t('upgradeSuccess') + (installed ? '（' + installed + '）' : '') + (restart ? ' ' + t('upgradeRestart') : '') });
              setUpgrading(false);
              setUpdateInfo(null);
              checkUpdate();
              return;
            }
            if (state === 'failed' || state === 'cancelled' || state === 'rolled-back') {
              var failure = op.failure || {};
              setUpgradeMsg({ kind: 'err', text: t('upgradeFail') + (failure.message || failure.code || state) });
              setUpgrading(false);
              return;
            }
            // queued / running: keep polling
            var phase = op.progress && op.progress.phase ? ' · ' + op.progress.phase : '';
            setUpgradeMsg({ kind: '', text: t('upgradePolling') + phase });
            pollRef.current = setTimeout(function () { pollOperation(operationId); }, 1200);
          })
          .catch(function () {
            setUpgradeMsg({ kind: 'err', text: t('upgradeFail') + 'network' });
            setUpgrading(false);
          });
      }

      function startUpgrade() {
        if (upgrading) return;
        setUpgradeConfirmDlg({
          title: t('upgradeTitle'), message: t('upgradeConfirm'), confirmLabel: t('upgradeGo'),
          onConfirm: function () { setUpgradeConfirmDlg(null); runUpgrade(); }
        });
      }

      function runUpgrade() {
        setUpgrading(true);
        setUpgradeMsg({ kind: '', text: t('upgradeCheckMarket') });
        // Discover the market API and feature-detect the mutation endpoint.
        marketFetchJson('dsh-market/api/v1/capabilities')
          .then(function (cap) {
            if (!cap || cap.schema !== 'dsh-market/update-api/v1' || !(cap.features && cap.features.update)) {
              throw new Error('no-market');
            }
            setUpgradeMsg({ kind: '', text: t('upgradeStarted') });
            return marketFetchJson(cap.endpoints.updates, {
              method: 'POST',
              headers: { accept: 'application/json', 'content-type': 'application/json' },
              body: JSON.stringify({ packageName: 'dsh-credential-vault' })
            });
          })
          .then(function (res) {
            var op = res && res.operation;
            if (res && res.schema === 'dsh-market/update-api/v1' && op && op.operationId) {
              if (op.state === 'succeeded') {
                setUpgradeMsg({ kind: 'ok', text: t('upgradeSuccess') + ' ' + t('upgradeRestart') });
                setUpgrading(false);
                setUpdateInfo(null); checkUpdate();
                return;
              }
              if (op.state === 'failed' || op.state === 'cancelled' || op.state === 'rolled-back') {
                var f = op.failure || {};
                setUpgradeMsg({ kind: 'err', text: t('upgradeFail') + (f.message || f.code || op.state) });
                setUpgrading(false);
                return;
              }
              setUpgradeMsg({ kind: '', text: t('upgradePolling') });
              pollOperation(op.operationId);
              return;
            }
            var err = (res && (res.error || (res.failure && res.failure.message))) || t('upgradeFail');
            if (/not installed|404/i.test(String(err))) err = t('upgradeNoMarket');
            setUpgradeMsg({ kind: 'err', text: t('upgradeFail') + err });
            setUpgrading(false);
          })
          .catch(function (e) {
            var msg = e && e.message === 'no-market' ? t('upgradeNoMarket') : t('upgradeFail') + (e && e.message ? e.message : '');
            setUpgradeMsg({ kind: 'err', text: msg });
            setUpgrading(false);
          });
      }

      function setPassword() {
        if (!pw || String(pw).length < 4) { notify('password', t('secTooShort'), 'err'); return; }
        if (pw !== confirm) { notify('password', t('secMismatch'), 'err'); return; }
        var s = Object.assign({}, getSecurity());
        function commit() {
          s.salt = s.salt || makeSalt();
          return hashWithSalt(s.salt, pw).then(function (h) {
            s.passwordHash = h;
            saveSecurity(s);
            refresh(); setPw(''); setConfirm(''); notify('password', t('secPasswordOn'));
          });
        }
        if (s.passwordHash) {
          verifyPassword(s, current).then(function (ok) {
            if (!ok) { notify('password', t('secCurrentWrong'), 'err'); return; }
            return commit();
          });
        } else commit();
      }
      function saveQuestion() {
        if (!answer) { notify('question', t('secAnswer'), 'err'); return; }
        var s = Object.assign({}, getSecurity());
        var chosen = SECURITY_QUESTIONS.filter(function (x) { return x.k === q; })[0] || SECURITY_QUESTIONS[0];
        var label = q === 'custom' ? (customQ || '') : (chosen[lang] || chosen.en);
        if (q === 'custom' && !customQ.trim()) { notify('question', t('secQuestion'), 'err'); return; }
        // Once a question is set, changing it must be authorized with the current access password.
        function commit() {
          hashWithSalt(s.salt || (s.salt = makeSalt()), normalizeAnswer(answer)).then(function (h) {
            s.question = { k: q, label: label };
            s.answerHash = h;
            saveSecurity(s);
            refresh(); setAnswer(''); setQCurrent(''); notify('question', t('secQuestionSet'));
          });
        }
        if (s.passwordHash && s.question && s.answerHash) {
          if (!qCurrent) { notify('question', t('secCurrentRequired'), 'err'); return; }
          verifyPassword(s, qCurrent).then(function (ok) {
            if (!ok) { notify('question', t('secCurrentWrong'), 'err'); return; }
            return commit();
          });
        } else commit();
      }
      function toggleEnabled() {
        if (!sec.enabled && !hasSetup()) { notify('enable', t('secNeedSetupFirst'), 'err'); return; }
        var enabling = !sec.enabled;
        if (!enabling) {
          // Disabling the access password must be confirmed with the current password.
          if (!disablePw) { notify('enable', t('secDisableHint'), 'err'); return; }
          verifyPassword(getSecurity(), disablePw).then(function (ok) {
            if (!ok) { notify('enable', t('secCurrentWrong'), 'err'); return; }
            var s = Object.assign({}, getSecurity(), { enabled: false });
            lockVault();
            saveSecurity(s);
            setDisablePw('');
            refresh();
            notify('enable', t('secPasswordOff'));
          });
          return;
        }
        // Enabling must lock immediately so the password actually protects the vault.
        var s = Object.assign({}, getSecurity(), { enabled: true });
        lockVault();
        saveSecurity(s);
        refresh();
        notify('enable', t('secEnabledLocked'));
      }
      function toggleIdle() {
        var enabling = !sec.idleEnabled;
        if (enabling && !sec.enabled) { notify('idle', t('secNeedSetupFirst'), 'err'); return; }
        var s = Object.assign({}, getSecurity(), { idleEnabled: enabling });
        if (enabling) {
          // Turning auto-lock on locks the vault right away so the policy takes effect.
          lockVault();
          if (!s.idleMs) s.idleMs = IDLE_MS;
        }
        saveSecurity(s);
        refresh();
        notify('idle', t(enabling ? 'secIdleOn' : 'secIdleOff'));
      }
      function setIdleMs(ms) {
        var s = Object.assign({}, getSecurity(), { idleMs: ms });
        saveSecurity(s);
        refresh();
      }

      var questionLabel = sec.question ? (sec.question.label || t('secQuestion')) : null;
      var qNeedsCurrent = !!(sec.passwordHash && sec.question && sec.answerHash);
      // Inline note inside the card where the action happened (kind: 'ok'|'err').
      function CardNote(area) {
        if (!msg || msg.area !== area) return null;
        var err = msg.kind === 'err';
        return h('div', { className: 'cv-note ' + (err ? 'cv-note-err' : 'cv-note-ok'), role: 'status' },
          h('span', null, err ? '⚠' : '✓'), h('span', null, msg.text));
      }
      return h('div', { className: 'cv-root' },
        h('style', null, CSS),
        h('div', { className: 'cv-settings' },
          h('div', { className: 'cv-settings-head' },
            h('h2', null, t('secTitle')),
            h('p', null, t('secDesc'))
          ),
          h('div', { className: 'cv-settings-card' },
            h('h3', null, t('secEnable')),
            h('div', { className: 'cv-switch-row' },
              h('div', null,
                h('div', { className: 'cv-switch-label' }, t('secEnable')),
                h('div', { className: 'cv-switch-hint' }, t('secEnableHint'))
              ),
              h('button', { type: 'button', className: 'cv-switch', role: 'switch', 'aria-checked': sec.enabled ? 'true' : 'false',
                'aria-label': t('secEnable'), onClick: toggleEnabled },
                h('span', { className: 'cv-switch-knob' })
              )
            ),
            h('div', { className: 'cv-status' + (sec.enabled ? '' : ' cv-switch-hint') }, sec.enabled ? '✓ ' + t('secPasswordOn') : t('secPasswordOff')),
            CardNote('enable'),
            sec.enabled ? h('div', { className: 'cv-settings-fields', style: { marginTop: 12 } },
              h('p', { className: 'cv-card-sub', style: { marginTop: 0 } }, t('secDisableHint')),
              h(SecretInput, { t: t, value: disablePw, placeholder: t('secCurrent'), onChange: function (ev) { setDisablePw(ev.target.value); },
                onKeyDown: function (e) { if (e.key === 'Enter') toggleEnabled(); } }),
              h('div', null, h('button', { type: 'button', className: 'cv-btn', onClick: toggleEnabled }, t('secDisableConfirm')))
            ) : null,
            !hasSetup() ? h('p', { className: 'cv-card-sub', style: { marginTop: 12, marginBottom: 0 } }, t('secCompleteSetup')) : null
          ),
          h('div', { className: 'cv-settings-card' },
            h('h3', null, t('secIdle')),
            h('div', { className: 'cv-switch-row' },
              h('div', null,
                h('div', { className: 'cv-switch-label' }, t('secIdle')),
                h('div', { className: 'cv-switch-hint' }, t('secIdleHint'))
              ),
              h('button', { type: 'button', className: 'cv-switch', role: 'switch', 'aria-checked': sec.idleEnabled ? 'true' : 'false',
                'aria-label': t('secIdle'), onClick: toggleIdle },
                h('span', { className: 'cv-switch-knob' })
              )
            ),
            h('div', { className: 'cv-status' + (sec.idleEnabled ? '' : ' cv-switch-hint') }, sec.idleEnabled ? '✓ ' + t('secIdleOn') : t('secIdleOff')),
            CardNote('idle'),
            sec.idleEnabled ? h('label', { className: 'cv-form-row', style: { marginTop: 10 } },
              h('span', { className: 'cv-form-label' }, t('secIdleDuration')),
              h('select', { className: 'cv-input', value: String(sec.idleMs || IDLE_MS), onChange: function (ev) { setIdleMs(Number(ev.target.value)); } },
                h('option', { value: String(1 * 60 * 1000) }, '1 ' + t('idleMinute')),
                h('option', { value: String(5 * 60 * 1000) }, '5 ' + t('idleMinutes')),
                h('option', { value: String(15 * 60 * 1000) }, '15 ' + t('idleMinutes')),
                h('option', { value: String(30 * 60 * 1000) }, '30 ' + t('idleMinutes')),
                h('option', { value: String(60 * 60 * 1000) }, '1 ' + t('idleHour')),
                h('option', { value: String(4 * 60 * 60 * 1000) }, '4 ' + t('idleHours'))
              )
            ) : null
          ),
          h('div', { className: 'cv-settings-card' },
            h('h3', null, t('secSetPassword')),
            h('p', { className: 'cv-card-sub' }, sec.passwordHash ? t('secNew') : t('secCompleteSetup')),
            h('div', { className: 'cv-settings-fields' },
              sec.passwordHash ? h('label', { className: 'cv-form-row' },
                h('span', { className: 'cv-form-label' }, t('secCurrent')),
                h(SecretInput, { t: t, value: current, onChange: function (ev) { setCurrent(ev.target.value); } })
              ) : null,
              h('label', { className: 'cv-form-row' },
                h('span', { className: 'cv-form-label' }, sec.passwordHash ? t('secNew') : t('secNew')),
                h(SecretInput, { t: t, value: pw, placeholder: t('secMinLength'), onChange: function (ev) { setPw(ev.target.value); } })
              ),
              h('label', { className: 'cv-form-row' },
                h('span', { className: 'cv-form-label' }, t('secConfirm')),
                h(SecretInput, { t: t, value: confirm, onChange: function (ev) { setConfirm(ev.target.value); },
                  onKeyDown: function (e) { if (e.key === 'Enter') setPassword(); } })
              ),
              h('div', null, h('button', { className: 'cv-btn cv-btn-primary', onClick: setPassword }, t('secSavePassword'))),
              CardNote('password')
            )
          ),
          h('div', { className: 'cv-settings-card' },
            h('h3', null, t('secQuestion')),
            h('p', { className: 'cv-card-sub' }, qNeedsCurrent ? t('secQCurrentHint') : t('secAnswerHint')),
            questionLabel ? h('div', { className: 'cv-status' }, '✓ ' + t('secQuestionSet') + '：' + questionLabel) : null,
            h('div', { className: 'cv-settings-fields' },
              qNeedsCurrent ? h('label', { className: 'cv-form-row' },
                h('span', { className: 'cv-form-label' }, t('secCurrent')),
                h(SecretInput, { t: t, value: qCurrent, placeholder: t('secCurrent'), onChange: function (ev) { setQCurrent(ev.target.value); } })
              ) : null,
              h('label', { className: 'cv-form-row' },
                h('span', { className: 'cv-form-label' }, t('secQuestion')),
                h('select', { className: 'cv-input', value: q, onChange: function (ev) { setQ(ev.target.value); } },
                  SECURITY_QUESTIONS.map(function (x) { return h('option', { key: x.k, value: x.k }, x[lang] || x.en); })
                )
              ),
              q === 'custom' ? h('label', { className: 'cv-form-row' },
                h('span', { className: 'cv-form-label' }, t('secCustomQuestion')),
                h('input', { className: 'cv-input', type: 'text', value: customQ, onChange: function (ev) { setCustomQ(ev.target.value); } })
              ) : null,
              h('label', { className: 'cv-form-row' },
                h('span', { className: 'cv-form-label' }, t('secAnswer')),
                h(SecretInput, { t: t, value: answer, placeholder: t('secAnswer'), onChange: function (ev) { setAnswer(ev.target.value); } })
              ),
              h('div', null, h('button', { className: 'cv-btn', onClick: saveQuestion }, t('secSaveQuestion'))),
              CardNote('question')
            )
          ),
          h('div', { className: 'cv-settings-card' },
            h('h3', null, t('auditTitle')),
            h('p', { className: 'cv-card-sub' }, t('auditDesc')),
            h('div', { className: 'cv-update-row' },
              h('button', { type: 'button', className: 'cv-btn', disabled: auditLoading, onClick: fetchAudit }, auditLoading ? t('auditLoading') : t('auditView'))
            ),
            auditData ? h('div', { style: { marginTop: 10 } },
              auditData.ok !== true
                ? h('p', { className: 'cv-card-sub', style: { margin: 0 } }, t('auditFail'))
                : (auditData.events && auditData.events.length > 0
                  ? h('div', { className: 'cv-audit-list' }, auditData.events.slice().reverse().map(function (ev, i) {
                      var detail = ev.tool || ev.action || '-';
                      if (ev.query) detail += ' · ' + ev.query;
                      if (typeof ev.count === 'number') detail += ' · ' + ev.count;
                      return h('div', { className: 'cv-audit-row', key: i },
                        h('span', { className: 'cv-audit-time' }, String(ev.at || '').replace('T', ' ').replace('Z', '')),
                        h('span', { className: 'cv-audit-detail' }, detail)
                      );
                    }))
                  : h('p', { className: 'cv-card-sub', style: { margin: 0 } }, t('auditEmpty'))),
              h('p', { className: 'cv-card-sub', style: { marginTop: 8, marginBottom: 0 } }, t('auditTotal') + '：' + (auditData.total || 0))
            ) : null
          ),
          h('div', { className: 'cv-settings-card' },
            h('h3', null, t('updateTitle')),
            h('p', { className: 'cv-card-sub' }, t('updateDesc')),
            h('div', { className: 'cv-update-row' },
              h('span', { className: 'cv-form-label' }, t('updateCurrent') + '：' + VERSION),
              h('button', { type: 'button', className: 'cv-btn', disabled: checking, onClick: checkUpdate }, checking ? t('updateChecking') : t('updateCheck'))
            ),
            updateInfo ? h('div', { className: 'cv-card-sub', style: { marginTop: 10, marginBottom: 0 } },
              updateInfo.ok === true
                ? (updateInfo.updateAvailable
                  ? t('updateAvailable') + ' ' + updateInfo.latestVersion + ' — ' + t('updateHow') + ' ' + updateInfo.releaseUrl
                  : t('updateUpToDate') + '（' + t('updateLatest') + '：' + updateInfo.latestVersion + '）')
                : (/release|404/i.test(String(updateInfo.error)) ? t('updateNoRelease') : t('updateFail'))
            ) : null,
            updateInfo && updateInfo.ok === true && updateInfo.updateAvailable
              ? h('div', { className: 'cv-update-row', style: { marginTop: 10 } },
                  h('button', { type: 'button', className: 'cv-btn cv-btn-primary', disabled: upgrading, onClick: startUpgrade }, upgrading ? t('upgrading') : t('upgrade'))
                )
              : null,
            upgradeMsg ? h('div', { className: 'cv-upgrade-status' + (upgradeMsg.kind === 'ok' ? ' cv-ok' : upgradeMsg.kind === 'err' ? ' cv-err' : ''), role: 'status' }, upgradeMsg.text) : null
          ),
          upgradeConfirmDlg ? h(ConfirmModal, {
            t: t, title: upgradeConfirmDlg.title, message: upgradeConfirmDlg.message, confirmLabel: upgradeConfirmDlg.confirmLabel,
            onConfirm: upgradeConfirmDlg.onConfirm, onCancel: function () { setUpgradeConfirmDlg(null); }
          }) : null
        )
      );
    }

    function SettingsIcon(props) {
      return h('span', { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, color: 'var(--dsw-alias-label-primary, #1d2129)' } }, Shield(18));
    }

    // ---- Password generator modal ---------------------------------------
    function PasswordGeneratorModal(props) {
      var t = props.t;
      var lenState = useState(16), length = lenState[0], setLength = lenState[1];
      var upperState = useState(true), upper = upperState[0], setUpper = upperState[1];
      var lowerState = useState(true), lower = lowerState[0], setLower = lowerState[1];
      var digitsState = useState(true), digits = digitsState[0], setDigits = digitsState[1];
      var symbolsState = useState(true), symbols = symbolsState[0], setSymbols = symbolsState[1];
      var avoidState = useState(true), avoid = avoidState[0], setAvoid = avoidState[1];
      var valueState = useState(''), value = valueState[0], setValue = valueState[1];
      var errState = useState(''), err = errState[0], setErr = errState[1];

      function regen() {
        var pw = generatePassword({ length: length, upper: upper, lower: lower, digits: digits, symbols: symbols, avoidAmbiguous: avoid });
        if (!pw) { setErr(t('genError')); setValue(''); return; }
        setErr(''); setValue(pw);
      }
      function doUse() {
        if (!value) { regen(); return; }
        props.onUse(value);
      }
      var strength = value ? passwordStrength(value) : null;
      var strengthLabel = strength ? (strength.tier === 'strong' ? t('genStrong') : strength.tier === 'fair' ? t('genFair') : t('genWeak')) : '';
      return h('div', { className: 'cv-modal-backdrop', onMouseDown: function (e) { if (e.target === e.currentTarget) props.onCancel(); } },
        h('div', { className: 'cv-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('genTitle'), tabIndex: -1,
          onKeyDown: function (e) { if (e.key === 'Escape') props.onCancel(); } },
          h('div', { className: 'cv-modal-head' }, h('h2', null, t('genTitle'))),
          h('div', { className: 'cv-modal-hint' }, t('genHint')),
          h('div', { className: 'cv-modal-body' },
            h('label', { className: 'cv-form-row' },
              h('span', { className: 'cv-form-label' }, t('genLength') + '：' + length),
              h('input', { className: 'cv-input', type: 'range', min: 4, max: 64, value: length,
                onChange: function (ev) { setLength(Number(ev.target.value)); } })
            ),
            h('div', { className: 'cv-gen-opts' },
              h('label', { className: 'cv-gen-check' }, h('input', { type: 'checkbox', checked: upper, onChange: function (ev) { setUpper(ev.target.checked); } }), t('genUpper')),
              h('label', { className: 'cv-gen-check' }, h('input', { type: 'checkbox', checked: lower, onChange: function (ev) { setLower(ev.target.checked); } }), t('genLower')),
              h('label', { className: 'cv-gen-check' }, h('input', { type: 'checkbox', checked: digits, onChange: function (ev) { setDigits(ev.target.checked); } }), t('genDigits')),
              h('label', { className: 'cv-gen-check' }, h('input', { type: 'checkbox', checked: symbols, onChange: function (ev) { setSymbols(ev.target.checked); } }), t('genSymbols')),
              h('label', { className: 'cv-gen-check', style: { gridColumn: '1 / -1' } }, h('input', { type: 'checkbox', checked: avoid, onChange: function (ev) { setAvoid(ev.target.checked); } }), t('genAvoidAmbiguous'))
            ),
            value ? h('div', null,
              h('div', { className: 'cv-gen-preview' }, value),
              h('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 } },
                h('span', { className: 'cv-form-label' }, t('genStrength') + '：'),
                h('span', { className: 'cv-gen-strength cv-' + strength.tier }, strengthLabel + ' (' + strength.bits + ' bit)')
              ),
              h('div', { className: 'cv-gen-bar' }, h('span', { className: strength.tier, style: { width: (strength.bits < 45 ? 33 : strength.bits < 65 ? 66 : 100) + '%' } }))
            ) : null,
            err ? h('div', { className: 'cv-field-error', role: 'alert' }, err) : null
          ),
          h('div', { className: 'cv-modal-foot' },
            h('button', { className: 'cv-btn', onClick: props.onCancel }, t('cancel')),
            value ? h('button', { className: 'cv-btn', onClick: function () { copyToClipboard(value).then(function () { if (props.onCopied) props.onCopied(); }).catch(function () {}); } }, t('genCopy')) : null,
            value ? h('button', { className: 'cv-btn', onClick: regen }, t('genRegenerate')) : null,
            h('button', { className: 'cv-btn cv-btn-primary', onClick: doUse }, value ? t('genUse') : t('genGenerate'))
          )
        )
      );
    }

    // ---- Security audit modal -------------------------------------------
    function AuditModal(props) {
      var t = props.t;
      var resultState = useState(null), result = resultState[0], setResult = resultState[1];
      var scanningState = useState(false), scanning = scanningState[0], setScanning = scanningState[1];
      var errState = useState(''), scanErr = errState[0], setScanErr = errState[1];
      function run() {
        setScanning(true);
        setScanErr('');
        try {
          // Run synchronously: a deferred setState may not repaint in the
          // embedded client runtime, which made the audit look like it never ran.
          setResult(runAudit(props.entries));
        } catch (e) {
          setResult(null);
          setScanErr(String((e && e.message) || e || t('auditFail')));
        }
        setScanning(false);
      }
      // Auto-run as soon as the panel opens so results are visible immediately.
      useEffect(function () { run(); }, []);
      function sevLabel(s) { return s === 'high' ? t('auditHigh') : s === 'medium' ? t('auditMedium') : t('auditLow'); }
      return h('div', { className: 'cv-modal-backdrop', onMouseDown: function (e) { if (e.target === e.currentTarget) props.onCancel(); } },
        h('div', { className: 'cv-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('auditTitle'), tabIndex: -1,
          onKeyDown: function (e) { if (e.key === 'Escape') props.onCancel(); } },
          h('div', { className: 'cv-modal-head' }, h('h2', null, t('auditTitle'))),
          h('div', { className: 'cv-modal-hint' }, t('auditHint')),
          h('div', { className: 'cv-modal-body' },
            scanErr ? h('div', { className: 'cv-audit-clean', style: { color: 'var(--cv-err)' } }, scanErr) : null,
            result ? h('div', { className: 'cv-audit-summary' },
              h('span', null, h('b', null, result.scanned), ' ' + t('auditSummary')),
              h('span', null, h('b', null, result.issues.length), ' ' + t('auditIssues'))
            ) : null,
            result && result.issues.length === 0 ? h('div', { className: 'cv-audit-clean' }, '✓ ' + t('auditClean')) : null,
            result && result.issues.length > 0 ? h('div', { className: 'cv-audit-list' },
              result.issues.map(function (issue, i) {
                return h('div', { className: 'cv-audit-item', key: i },
                  h('span', { className: 'cv-audit-sev cv-' + issue.severity }, sevLabel(issue.severity)),
                  h('div', { className: 'cv-audit-body' },
                    h('div', { className: 'cv-audit-name' }, issue.name),
                    h('div', { className: 'cv-audit-desc' }, t(issue.kind) + ' — ' + t(issue.kind + 'Desc'))
                  ),
                  h('button', { className: 'cv-mini', onClick: function () { props.onEdit(issue.id); } }, t('auditEdit'))
                );
              })
            ) : null,
            result ? h('p', { className: 'cv-audit-note' }, 'ⓘ ', t('auditNote')) : null
          ),
          h('div', { className: 'cv-modal-foot' },
            h('button', { className: 'cv-btn', onClick: props.onCancel }, t('cancel')),
            h('button', { className: 'cv-btn cv-btn-primary', disabled: scanning, onClick: run }, scanning ? t('auditScanning') : (result ? t('auditRun') : t('auditRun')))
          )
        )
      );
    }

    function VaultPanel() {
      var langState = useState(function () { return detectLang(locale); });
      var lang = langState[0], setLang = langState[1];
      function t(k) { return (DICTS[lang] && DICTS[lang][k]) || DICTS.en[k] || k; }

      var entriesState = useState([]), entries = entriesState[0], setEntries = entriesState[1];
      var loadedState = useState(false), loaded = loadedState[0], setLoaded = loadedState[1];
      var queryState = useState(''), query = queryState[0], setQuery = queryState[1];
      var filterState = useState('all'), filter = filterState[0], setFilter = filterState[1];
      var sortState = useState('recent'), sort = sortState[0], setSort = sortState[1];
      var revealedState = useState({}), revealed = revealedState[0], setRevealed = revealedState[1];
      var editingState = useState(null), editing = editingState[0], setEditing = editingState[1];
      var toastState = useState(''), toast = toastState[0], setToast = toastState[1];
      var secRevState = useState(0), secRev = secRevState[0], setSecRev = secRevState[1];
      var importState = useState(false), importing = importState[0], setImporting = importState[1];
      var exportState = useState(false), exporting = exportState[0], setExporting = exportState[1];
      var genState = useState(null), genTarget = genState[0], setGenTarget = genState[1];
      var auditState = useState(false), auditing = auditState[0], setAuditing = auditState[1];
      var confirmState = useState(null), confirmDlg = confirmState[0], setConfirmDlg = confirmState[1];

      useEffect(function () {
        var initial = loadEntries();
        setEntries(initial);
        setLoaded(true);
        syncToHost(initial, true); // seed the Host snapshot on mount (immediate)
      }, []);
      useEffect(function () {
        return subscribeSecurity(function () { setSecRev(function (n) { return n + 1; }); });
      }, []);
      // Idle auto-lock: reset the last-activity timestamp on real user activity,
      // and tick once a second so the lock gate is re-evaluated when the timeout ends.
      useEffect(function () {
        var events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'];
        var last = 0;
        function activity() {
          var now = Date.now();
          if (now - last < 1000) return; // throttle; timestamp is in-memory and cheap
          last = now;
          noteActivity();
        }
        events.forEach(function (ev) { window.addEventListener(ev, activity, { passive: true }); });
        var tick = setInterval(function () { setSecRev(function (n) { return n + 1; }); }, 1000);
        return function () {
          events.forEach(function (ev) { window.removeEventListener(ev, activity, { passive: true }); });
          clearInterval(tick);
        };
      }, []);
      useEffect(function () { if (loaded) saveEntries(entries); }, [entries, loaded]);
      useEffect(function () {
        if (locale && typeof locale.subscribe === 'function') {
          var un = null;
          try { un = locale.subscribe(function () { setLang(detectLang(locale)); }); } catch (e) {}
          return function () { try { if (un) un(); } catch (e) {} };
        }
      }, []);
      useEffect(function () {
        if (!toast) return;
        var id = setTimeout(function () { setToast(''); }, 2200);
        return function () { clearTimeout(id); };
      }, [toast]);

      function copyText(text) {
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(String(text)).then(
              function () { setToast(t('copied')); },
              function () { setToast(t('copyFail')); }
            );
          } else { setToast(t('copyFail')); }
        } catch (e) { setToast(t('copyFail')); }
      }
      function visitUrl(url) {
        var target = String(url || '').trim();
        if (!looksLikeUrl(target)) { setToast(t('visitFail')); return; }
        var sr = sidebarRight || (typeof ctxRef !== 'undefined' && ctxRef && ctxRef.get ? ctxRef.get('sidebarRight') : null);
        var lay = layout || (typeof ctxRef !== 'undefined' && ctxRef && ctxRef.get ? ctxRef.get('layout') : null);
        // The vault is a keyed main panel that replaces the Conversation, so the
        // sidebar-right controller has no mounted session surface while we are
        // selected; openTab() throws in that state. Return to the Conversation
        // first, then retry until the surface is mounted (bounded to ~1.2s).
        try { if (lay && typeof lay.selectPanel === 'function') lay.selectPanel(null); } catch (e) {}
        setToast(t('visitHint'));
        var attempts = 0;
        function openWhenReady() {
          var right = sr || (typeof ctxRef !== 'undefined' && ctxRef && ctxRef.get ? ctxRef.get('sidebarRight') : null);
          try {
            if (right && typeof right.openTab === 'function') {
              right.openTab('browser', { params: { url: target } });
              return;
            }
          } catch (e) {}
          if (++attempts < 12) { setTimeout(openWhenReady, 100); return; }
          try {
            var w = window.open(target, '_blank', 'noopener,noreferrer');
            if (!w) setToast(t('visitFail'));
          } catch (e) { setToast(t('visitFail')); }
        }
        setTimeout(openWhenReady, 50);
      }
      function toggleReveal(id) {
        setRevealed(function (prev) { var n = Object.assign({}, prev); n[id] = !n[id]; return n; });
      }
      function revealAll() { var n = {}; entries.forEach(function (e) { n[e.id] = true; }); setRevealed(n); }
      function hideAll() { setRevealed({}); }
      function allRevealed() { return entries.length > 0 && entries.every(function (e) { return !!revealed[e.id]; }); }
      function toggleAll() { if (allRevealed()) hideAll(); else revealAll(); }
      function openNew() {
        setEditing({ mode: 'new', draft: emptyDraft(filter !== 'all' ? filter : 'account') });
      }
      function openEdit(e) { setEditing({ mode: 'edit', draft: Object.assign(emptyDraft(e.category), e) }); }
      function setDraftField(field, value) {
        setEditing(function (prev) {
          var nd = Object.assign({}, prev.draft); nd[field] = value;
          return { mode: prev.mode, draft: nd };
        });
      }
      function saveDraft() {
        var d = editing.draft;
        if (!d.title || !String(d.title).trim()) { setToast(t('required')); return; }
        var item = Object.assign({}, d, {
          id: editing.mode === 'new' ? uid() : (d.id || uid()),
          title: String(d.title).trim(),
          category: d.category || 'account',
          createdAt: editing.mode === 'new' ? Date.now() : (d.createdAt || Date.now()),
          updatedAt: Date.now()
        });
        setEntries(function (prev) {
          if (editing.mode === 'new') return prev.concat([item]);
          return prev.map(function (x) { return x.id === item.id ? item : x; });
        });
        setEditing(null); setToast(t('saved'));
      }
      function delEntry(id) {
        if (!window.confirm(t('confirmDelete'))) return;
        setEntries(function (prev) {
          return prev.filter(function (x) { return x.id !== id; }).map(function (x) {
            if (!Array.isArray(x.links) || x.links.indexOf(id) < 0) return x;
            return Object.assign({}, x, { links: x.links.filter(function (lid) { return lid !== id; }) });
          });
        });
        setToast(t('deleted'));
      }
      function doExport() {
        if (entries.length === 0) { setToast(t('exportEmpty')); return; }
        setExporting(true);
      }
      function pickExport(fmt) {
        setExporting(false);
        var ok = exportEntries(entries, fmt);
        setToast(ok ? t('exportDone') : t('exportFail'));
      }
      function doImport(incoming, mode) {
        setEntries(function (prev) {
          if (mode === 'replace') return incoming.map(function (e) {
            var n = Object.assign({}, e); n.id = n.id || uid(); return n;
          });
          var byId = {};
          prev.forEach(function (e) { byId[e.id] = true; });
          var added = incoming.filter(function (e) {
            var id = e.id || uid();
            if (byId[id]) return false;
            byId[id] = true; return true;
          }).map(function (e) { return Object.assign({}, e, { id: e.id || uid() }); });
          return prev.concat(added);
        });
        setImporting(false);
        setToast(t('importDone'));
      }
      function useGeneratedPassword(pw) {
        if (genTarget && genTarget.field) setDraftField(genTarget.field, pw);
        setGenTarget(null);
        setToast(t('copied'));
      }
      function goToEntry(id) {
        var target = entries.filter(function (x) { return x.id === id; })[0];
        if (!target) { setToast(t('linkMissing')); return; }
        setFilter('all');
        setQuery(target.title || '');
      }
      function auditEditEntry(id) {
        var e = entries.filter(function (x) { return x.id === id; })[0];
        setAuditing(false);
        if (e) openEdit(e);
      }

      var q = String(query).trim().toLowerCase();
      var list = entries.filter(function (e) {
        if (filter !== 'all' && (e.category || 'account') !== filter) return false;
        if (!q) return true;
        return searchText(e).indexOf(q) !== -1;
      });
      if (sort === 'title') {
        list.sort(function (a, b) { return String(a.title || '').localeCompare(String(b.title || '')); });
      } else if (sort === 'category') {
        list.sort(function (a, b) {
          var c = String(a.category || '').localeCompare(String(b.category || ''));
          return c !== 0 ? c : String(a.title || '').localeCompare(String(b.title || ''));
        });
      } else {
        list.sort(function (a, b) { return (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0); });
      }

      // Access-password gate: read secRev so lock changes re-render.
      if (isVaultLocked()) {
        return h(LockScreen, { t: t, idle: false, onUnlocked: function () { setSecRev(function (n) { return n + 1; }); } });
      }

      return h('div', { className: 'cv-root cv-panelroot' },
        h('style', null, CSS),
        h('div', { className: 'cv-wrap' },
          h('div', { className: 'cv-head' },
            h('div', { className: 'cv-head-left' },
              h('div', { className: 'cv-head-icon', style: { color: 'var(--cv-brand)' } }, Shield(30)),
              h('div', null,
                h('h1', { className: 'cv-title' }, t('title')),
                h('p', { className: 'cv-sub' }, t('subtitle'))
              )
            ),
            h('div', { className: 'cv-io' },
              h('button', { className: 'cv-btn', onClick: function () { setAuditing(true); } }, '🛡 ' + t('auditButton')),
              h('button', { className: 'cv-btn', onClick: doExport }, t('export')),
              h('button', { className: 'cv-btn', onClick: function () { setImporting(true); } }, t('import')),
              h('button', { className: 'cv-btn cv-btn-primary', onClick: openNew }, '+ ' + t('add'))
            )
          ),
          h('div', { className: 'cv-notice' }, 'ⓘ ', t('localNotice')),
          h('div', { className: 'cv-toolbar' },
            h('input', { className: 'cv-search', placeholder: t('search'), value: query, onChange: function (ev) { setQuery(ev.target.value); } }),
            h('div', { className: 'cv-chips' }, FILTERS.map(function (f) {
              return h('button', { key: f.k, className: 'cv-chip' + (filter === f.k ? ' cv-chip-on' : ''), onClick: function () { setFilter(f.k); } }, t(f.label));
            })),
            h('div', { className: 'cv-sort' },
              h('span', { className: 'cv-sort-label' }, t('sort')),
              h('select', { className: 'cv-select', value: sort, onChange: function (ev) { setSort(ev.target.value); } },
                h('option', { value: 'recent' }, t('sortRecent')),
                h('option', { value: 'title' }, t('sortTitle')),
                h('option', { value: 'category' }, t('sortCategory'))
              )
            ),
            h('div', { className: 'cv-reveal' },
              h('button', { className: 'cv-mini', onClick: toggleAll }, allRevealed() ? t('hideAll') : t('revealAll'))
            )
          ),
          h('div', { className: 'cv-count' }, list.length + ' ' + t('items')),
          h('div', { className: 'cv-list-scroll' },
            h('div', { className: 'cv-list' },
              list.length === 0
                ? h('div', { className: 'cv-empty' },
                    h('div', { className: 'cv-empty-icon' }, Shield(44)),
                    h('h3', null, entries.length === 0 ? t('emptyTitle') : t('emptyFiltered')),
                    h('p', null, entries.length === 0 ? t('emptyText') : t('search'))
                  )
                : list.map(function (e) {
                    return h(Card, {
                      key: e.id, entry: e, t: t, revealed: !!revealed[e.id],
                      entries: entries, onGo: goToEntry,
                      onToggle: function () { toggleReveal(e.id); },
                      onEdit: function () { openEdit(e); },
                      onDelete: function () { delEntry(e.id); },
                      onCopy: copyText,
                      onVisit: visitUrl
                    });
                  })
            )
          )
        ),
        editing ? h(EditorModal, {
          t: t, draft: editing.draft, titleKey: editing.mode === 'new' ? 'editorNew' : 'editorEdit',
          entries: entries,
          onChange: setDraftField, onSave: saveDraft, onCancel: function () { setEditing(null); },
          onGenerate: function (field) { setGenTarget({ field: field }); }
        }) : null,
        importing ? h(ImportModal, {
          t: t, onImport: doImport, onCancel: function () { setImporting(false); }
        }) : null,
        exporting ? h(ExportModal, {
          t: t, onPick: pickExport, onCancel: function () { setExporting(false); },
          onEncrypted: function (pw) { return exportEncrypted(entries, pw); },
          onDone: function () { setExporting(false); setToast(t('exportEncryptedDone')); }
        }) : null,
        auditing ? h(AuditModal, {
          t: t, entries: entries, onEdit: auditEditEntry, onCancel: function () { setAuditing(false); }
        }) : null,
        genTarget ? h(PasswordGeneratorModal, {
          t: t, onUse: useGeneratedPassword, onCopied: function () { setToast(t('copied')); },
          onCancel: function () { setGenTarget(null); }
        }) : null,
        confirmDlg ? h(ConfirmModal, {
          t: t, title: confirmDlg.title, message: confirmDlg.message, confirmLabel: confirmDlg.confirmLabel,
          onConfirm: confirmDlg.onConfirm, onCancel: function () { setConfirmDlg(null); }
        }) : null,
        toast ? h('div', { className: 'cv-toast', role: 'status' }, toast) : null
      );
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        registerBridge();
        ctxRef = ctx;
        layout = (ctx.get && ctx.get('layout')) || null;
        locale = (ctx.get && ctx.get('locale')) || null;
        sidebarRight = (ctx.get && ctx.get('sidebarRight')) || null;
        lang0 = detectLang(locale);
        if (locale && typeof locale.register === 'function') {
          try { locale.register('@local/dsh-credential-vault/ui', { en: DICTS.en, zh: DICTS.zh }); } catch (e) {}
        }
        ctx.slots.inject('sidebar.panellist', function () {
          return ctx.slots.register({ name: 'sidebar.panellist', id: PANEL_ID, order: 20, label: tr('title') }, PanelIcon);
        });
        ctx.slots.inject('main', function () {
          return ctx.slots.register({ name: 'main', key: PANEL_ID }, VaultPanel);
        });
        ctx.slots.inject('settings.section', function () {
          return ctx.slots.register(
            { name: 'settings.section', id: PANEL_ID, order: 30, label: function () { return tr('title'); } },
            SettingsSection
          );
        });
        ctx.slots.inject('settings.section.icon', function () {
          return ctx.slots.register({ name: 'settings.section.icon', id: PANEL_ID }, SettingsIcon);
        });
      }
    };
  }
});
