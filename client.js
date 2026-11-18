window.__ModuleLoader__.load({
  id: 'dsh-credential-vault',
  factory(require) {
    var React = require('react');
    var h = React.createElement;
    var useState = React.useState;
    var useEffect = React.useEffect;
    var useRef = React.useRef;

    var STORAGE_KEY = '@local/credential-vault:entries:v1';
    var MASK = '••••••••••••';
    var PANEL_ID = 'credential-vault';
    // Same-origin path served by the Host half (index.js). Relative so it works
    // whatever port the Web GUI is on.
    var API = 'credential-vault/';
    /** Plugin version shown in Settings; keep in sync with package.json on release. */
    var VERSION = '1.0.3';

    var DICTS = {
      en: {
        title: 'Credential vault', subtitle: 'Your accounts, passwords & API keys in one place',
        add: 'Add', items: 'items',
        sort: 'Sort', sortRecent: 'Recently updated', sortTitle: 'Name (A–Z)', sortCategory: 'Type',
        search: 'Search name, account, URL or notes…',
        filterAll: 'All', filterAccount: 'Accounts', filterApikey: 'API keys', filterOther: 'Other',
        localNotice: 'Stored locally in this browser (localStorage) on this device. Not synced or encrypted — avoid shared / public browsers.',
        show: 'Show', hide: 'Hide', copy: 'Copy', copied: 'Copied to clipboard', copyFail: 'Copy failed — select the text manually',
        edit: 'Edit', delete: 'Delete',
        emptyTitle: 'No credentials yet', emptyText: 'Click “Add” to save your first account, password or API key.',
        emptyFiltered: 'No matches',
        editorNew: 'New credential', editorEdit: 'Edit credential',
        fTitle: 'Name', fTitlePh: 'e.g. GitHub, Google', fTitlePhApikey: 'e.g. OpenAI, AWS, GitHub PAT', fTitlePhOther: 'e.g. Recovery codes, Wi-Fi, License',
        fCategory: 'Type',
        fAccount: 'Account / username', fAccountPh: 'user@example.com',
        fPassword: 'Password', fPasswordPh: 'Enter password',
        fUrl: 'Login URL (optional)', fUrlPh: 'https://…',
        fProvider: 'Platform / provider', fProviderPh: 'e.g. OpenAI, Anthropic, AWS',
        fApiKey: 'API key / token', fApiKeyPh: 'sk-… / ghp_… / paste token',
        fEndpoint: 'API endpoint / base URL', fEndpointPh: 'https://api.openai.com/v1',
        fExpiry: 'Expires on (optional)',
        fContent: 'Content / secret', fContentPh: 'Recovery codes, license key, certificate, PIN…',
        fNotes: 'Notes (optional)', fNotesPh: 'Any extra info…',
        catAccount: 'Account', catApikey: 'API key', catOther: 'Other',
        hintAccount: 'For website / app logins — username and password.',
        hintApikey: 'For platform-issued API keys, tokens and endpoints.',
        hintOther: 'For recovery codes, licenses, certificates or any free text.',
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
        updateTitle: 'Plugin updates', updateDesc: 'Check whether a newer version of the credential-vault plugin is available.',
        updateCurrent: 'Current version', updateLatest: 'Latest version', updateCheck: 'Check for updates',
        updateChecking: 'Checking…', updateAvailable: 'A newer version is available:', updateUpToDate: 'You are up to date.',
        updateNoRelease: 'No Release published yet — update check is unavailable.', updateFail: 'Update check failed. Please try again later.',
        updateHow: 'Update via the same way you installed this plugin.',
        upgrade: 'Upgrade', upgrading: 'Upgrading…', upgradeCheckMarket: 'Checking plugin market…',
        upgradeConfirm: 'Upgrade with dshmarket? It uses the same plugin manager that installed this plugin. DeepSeek Harness may need a restart afterwards.',
        upgradeStarted: 'Upgrade started…', upgradePolling: 'Installing…', upgradeNoMarket: 'The plugin market (dshmarket) is not available here. Please update via the way you installed this plugin.',
        upgradeSuccess: 'Upgrade installed.', upgradeRestart: 'Restart DeepSeek Harness to finish.', upgradeFail: 'Upgrade failed: ',
        export: 'Export', import: 'Import',
        exportWarn: 'The backup file contains plaintext passwords and API keys. Keep it safe and delete it when no longer needed. Continue?',
        exportDone: 'Backup downloaded', exportFail: 'Export failed', exportEmpty: 'Nothing to export',
        importTitle: 'Import credentials', importHint: 'Imported secrets are stored locally, just like the rest of your vault.',
        importFound: 'Entries in file', importMode: 'Import mode',
        importMerge: 'Merge (keep existing, skip duplicates)',
        importReplace: 'Replace all existing entries',
        importMergeHint: 'Existing entries are kept; entries whose ID already exists are skipped.',
        importReplaceWarn: 'All current entries will be removed and replaced by the file contents. This cannot be undone.',
        importConfirm: 'Import', importDone: 'Import complete',
        importInvalid: 'Invalid backup file', importEmpty: 'No credentials in this file'
      },
      zh: {
        title: '凭据保险箱', subtitle: '集中管理你的账号、密码与 API Key',
        add: '新增', items: '条',
        sort: '排序', sortRecent: '最近更新', sortTitle: '名称（A–Z）', sortCategory: '类型',
        search: '搜索名称、账号、网址或备注…',
        filterAll: '全部', filterAccount: '账号密码', filterApikey: 'API Key', filterOther: '其他',
        localNotice: '数据仅保存在本机浏览器的 localStorage 中，不跨设备同步、不加密，请避免在公用/共享浏览器使用。',
        show: '显示', hide: '隐藏', copy: '复制', copied: '已复制到剪贴板', copyFail: '复制失败，请手动选择文本',
        edit: '编辑', delete: '删除',
        emptyTitle: '还没有凭据', emptyText: '点击「新增」保存第一条账号、密码或 API Key。',
        emptyFiltered: '没有匹配项',
        editorNew: '新增凭据', editorEdit: '编辑凭据',
        fTitle: '名称', fTitlePh: '例如：GitHub、Google', fTitlePhApikey: '例如：OpenAI、AWS、GitHub PAT', fTitlePhOther: '例如：恢复码、Wi-Fi、许可证',
        fCategory: '类型',
        fAccount: '账号 / 用户名', fAccountPh: 'user@example.com',
        fPassword: '密码', fPasswordPh: '输入密码',
        fUrl: '登录网址（可选）', fUrlPh: 'https://…',
        fProvider: '平台 / 服务商', fProviderPh: '例如：OpenAI、Anthropic、AWS',
        fApiKey: 'API Key / 令牌', fApiKeyPh: 'sk-… / ghp_… / 粘贴令牌',
        fEndpoint: 'API 地址 / Base URL', fEndpointPh: 'https://api.openai.com/v1',
        fExpiry: '到期日期（可选）',
        fContent: '内容 / 密钥', fContentPh: '恢复码、许可证、证书、PIN…',
        fNotes: '备注（可选）', fNotesPh: '其他信息…',
        catAccount: '账号密码', catApikey: 'API Key', catOther: '其他',
        hintAccount: '用于保存网站 / 应用的登录账号与密码。',
        hintApikey: '用于保存平台签发的 API Key、令牌与接口地址。',
        hintOther: '用于保存恢复码、许可证、证书等任意文本。',
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
        updateTitle: '插件更新', updateDesc: '检查凭据保险箱插件是否有新版本可用。',
        updateCurrent: '当前版本', updateLatest: '最新版本', updateCheck: '检查更新',
        updateChecking: '检查中…', updateAvailable: '发现新版本：', updateUpToDate: '已是最新版本。',
        updateNoRelease: '仓库尚未发布 Release，暂时无法检查更新。', updateFail: '检查更新失败，请稍后重试。',
        updateHow: '请通过当初安装本插件的相同方式进行更新。',
        upgrade: '升级', upgrading: '升级中…', upgradeCheckMarket: '正在检查插件市场…',
        upgradeConfirm: '使用 dshmarket 升级？它会调用当初安装本插件的同一个插件管理器，升级后可能需要重启 DeepSeek Harness。',
        upgradeStarted: '已开始升级…', upgradePolling: '正在安装…', upgradeNoMarket: '当前不可用插件市场（dshmarket），请通过当初安装本插件的方式进行更新。',
        upgradeSuccess: '升级已安装。', upgradeRestart: '请重启 DeepSeek Harness 以完成升级。', upgradeFail: '升级失败：',
        export: '导出', import: '导入',
        exportWarn: '备份文件包含明文密码和 API Key，请妥善保管并在不需要时删除。是否继续？',
        exportDone: '备份已下载', exportFail: '导出失败', exportEmpty: '没有可导出的凭据',
        importTitle: '导入凭据', importHint: '导入的密钥与保险箱其他数据一样仅保存在本机。',
        importFound: '文件中的条目数', importMode: '导入方式',
        importMerge: '合并（保留现有，跳过重复）',
        importReplace: '替换所有现有条目',
        importMergeHint: '保留现有条目；ID 已存在的条目将被跳过。',
        importReplaceWarn: '当前所有条目将被删除并由文件内容替换，此操作不可撤销。',
        importConfirm: '导入', importDone: '导入完成',
        importInvalid: '备份文件无效', importEmpty: '文件中没有凭据'
      }
    };

    // Each credential type owns a DIFFERENT form. The schema drives the editor,
    // the card layout and the search index, so the three types never look alike.
    // type: text | textarea | secret | secretarea | date
    var SCHEMAS = {
      account: [
        { key: 'title', label: 'fTitle', ph: 'fTitlePh', type: 'text', required: true },
        { key: 'username', label: 'fAccount', ph: 'fAccountPh', type: 'text', mono: true },
        { key: 'password', label: 'fPassword', ph: 'fPasswordPh', type: 'secret', mono: true },
        { key: 'url', label: 'fUrl', ph: 'fUrlPh', type: 'text' },
        { key: 'notes', label: 'fNotes', ph: 'fNotesPh', type: 'textarea' }
      ],
      apikey: [
        { key: 'title', label: 'fTitle', ph: 'fTitlePhApikey', type: 'text', required: true },
        { key: 'provider', label: 'fProvider', ph: 'fProviderPh', type: 'text' },
        { key: 'apiKey', label: 'fApiKey', ph: 'fApiKeyPh', type: 'secret', mono: true },
        { key: 'endpoint', label: 'fEndpoint', ph: 'fEndpointPh', type: 'text', mono: true },
        { key: 'expiry', label: 'fExpiry', type: 'date' },
        { key: 'notes', label: 'fNotes', ph: 'fNotesPh', type: 'textarea' }
      ],
      other: [
        { key: 'title', label: 'fTitle', ph: 'fTitlePhOther', type: 'text', required: true },
        { key: 'content', label: 'fContent', ph: 'fContentPh', type: 'secretarea', mono: true },
        { key: 'notes', label: 'fNotes', ph: 'fNotesPh', type: 'textarea' }
      ]
    };
    var CATEGORIES = [
      { k: 'account', label: 'catAccount', hint: 'hintAccount' },
      { k: 'apikey', label: 'catApikey', hint: 'hintApikey' },
      { k: 'other', label: 'catOther', hint: 'hintOther' }
    ];
    var FILTERS = [
      { k: 'all', label: 'filterAll' },
      { k: 'account', label: 'filterAccount' },
      { k: 'apikey', label: 'filterApikey' },
      { k: 'other', label: 'filterOther' }
    ];
    function schemaOf(cat) { return SCHEMAS[cat] || SCHEMAS.account; }
    function isSecretField(f) { return f.type === 'secret' || f.type === 'secretarea'; }
    function isMultilineField(f) { return f.type === 'secretarea' || f.type === 'textarea'; }

    var CSS = [
      '.cv-root{--cv-bg:var(--dsw-alias-bg-base,#fff);--cv-l1:var(--dsw-alias-bg-layer-1,#f6f7f9);--cv-l2:var(--dsw-alias-bg-layer-2,#eceef3);--cv-b1:var(--dsw-alias-border-l1,#e2e5eb);--cv-b2:var(--dsw-alias-border-l2,#c9cfd9);--cv-brand:var(--dsw-alias-brand-primary,#2563eb);--cv-t1:var(--dsw-alias-label-primary,#1d2129);--cv-t2:var(--dsw-alias-label-secondary,#6b7280);--cv-err:var(--dsw-alias-state-error-primary,#dc2626);--cv-ok:var(--dsw-alias-state-success-primary,#16a34a);color:var(--cv-t1);background:var(--cv-bg);font-family:inherit;font-size:14px;min-height:100%;box-sizing:border-box}',
      '.cv-root *{box-sizing:border-box}',
      '.cv-wrap{max-width:940px;margin:0 auto;padding:28px 26px 60px}',
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
      '.cv-chip{padding:7px 12px;border-radius:999px;border:1px solid var(--cv-b1);background:transparent;color:var(--cv-t2);font-size:12.5px;cursor:pointer}',
      '.cv-chip:hover{background:var(--cv-l2);color:var(--cv-t1)}',
      '.cv-chip-on{background:var(--cv-brand);border-color:var(--cv-brand);color:var(--cv-bg)}',
      '.cv-chip-on:hover{background:var(--cv-brand);border-color:var(--cv-brand);color:var(--cv-bg);box-shadow:0 2px 8px rgba(0,0,0,.18)}',
      '.cv-reveal{display:flex;gap:6px;margin-left:auto}',
      '.cv-sort{display:flex;align-items:center;gap:6px}',
      '.cv-sort-label{color:var(--cv-t2);font-size:12px}',
      '.cv-select{padding:7px 10px;border-radius:8px;border:1px solid var(--cv-b1);background:var(--cv-l1);color:var(--cv-t1);font-size:12.5px;cursor:pointer;outline:none}',
      '.cv-select:focus{border-color:var(--cv-brand)}',
      '.cv-btn{padding:9px 16px;border-radius:9px;border:1px solid var(--cv-b1);background:var(--cv-l1);color:var(--cv-t1);font-size:13px;font-weight:550;cursor:pointer}',
      '.cv-btn:hover{background:var(--cv-l2);color:var(--cv-t1)}',
      '.cv-btn-primary{background:var(--cv-brand);border-color:var(--cv-brand);color:var(--cv-bg)}',
      '.cv-btn-primary:hover{background:var(--cv-brand);border-color:var(--cv-brand);color:var(--cv-bg);box-shadow:0 3px 12px rgba(0,0,0,.2)}',
      '.cv-io{display:flex;gap:8px;align-items:center}',
      '.cv-import-file{margin:4px 22px 0;padding:10px 12px;border-radius:9px;background:var(--cv-l1);border:1px solid var(--cv-b1);font-size:12.5px;color:var(--cv-t1);overflow-wrap:anywhere}',
      '.cv-import-modes{display:flex;flex-direction:column;gap:10px}',
      '.cv-import-opt{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border:1px solid var(--cv-b1);border-radius:9px;cursor:pointer;background:var(--cv-l1)}',
      '.cv-import-opt input{margin-top:2px;accent-color:var(--cv-brand)}',
      '.cv-import-opt-name{font-size:13px;font-weight:550;color:var(--cv-t1)}',
      '.cv-import-opt-hint{font-size:12px;color:var(--cv-t2);margin-top:3px;line-height:1.45}',
      '.cv-import-warn{color:var(--cv-err);font-weight:550}',
      '.cv-mini{padding:4px 9px;border-radius:7px;border:1px solid var(--cv-b1);background:var(--cv-l1);color:var(--cv-t2);font-size:11.5px;cursor:pointer;white-space:nowrap}',
      '.cv-mini:hover{color:var(--cv-t1);background:var(--cv-l2)}',
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
      '.cv-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px}',
      '.cv-modal{width:100%;max-width:480px;max-height:90vh;overflow:auto;background:var(--cv-bg);border:1px solid var(--cv-b1);border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.28);outline:none}',
      '.cv-modal-head{padding:18px 22px 0}',
      '.cv-modal-head h2{margin:0;font-size:17px;font-weight:650}',
      '.cv-modal-hint{margin:5px 22px 0;padding:8px 11px;border-radius:8px;background:var(--cv-l1);border:1px solid var(--cv-b1);color:var(--cv-t2);font-size:12px;line-height:1.5}',
      '.cv-modal-body{padding:14px 22px 6px;display:flex;flex-direction:column;gap:12px}',
      '.cv-form-row{display:flex;flex-direction:column;gap:5px}',
      '.cv-form-label{font-size:12px;color:var(--cv-t2)}',
      '.cv-input{width:100%;padding:9px 11px;border-radius:9px;border:1px solid var(--cv-b1);background:var(--cv-l1);color:var(--cv-t1);font-size:13px;outline:none;font-family:inherit}',
      '.cv-input:focus{border-color:var(--cv-brand)}',
      '.cv-textarea{min-height:64px;resize:vertical}',
      '.cv-secret-input{display:flex;gap:6px;align-items:stretch}',
      '.cv-secret-input .cv-input{flex:1;min-width:0}',
      '.cv-secret-toggle{flex:none;display:inline-flex;align-items:center;justify-content:center;padding:0 13px;border:1px solid var(--cv-b1);border-radius:9px;background:var(--cv-l1);color:var(--cv-t2);font-size:13px;font-family:inherit;cursor:pointer;white-space:nowrap}',
      '.cv-secret-toggle:hover{background:var(--cv-l2);color:var(--cv-t1)}',
      '.cv-text-security{-webkit-text-security:disc}',
      '.cv-modal-foot{display:flex;justify-content:flex-end;gap:10px;padding:16px 22px 20px}',
      '.cv-toast{position:fixed;bottom:26px;left:50%;transform:translateX(-50%);background:var(--cv-t1);color:var(--cv-bg);padding:10px 18px;border-radius:10px;font-size:13px;z-index:10000;box-shadow:0 8px 24px rgba(0,0,0,.2)}',
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
      '.cv-settings{max-width:820px;margin:0 auto;padding:28px 26px 60px}',
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
      '.cv-switch-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 0;border-top:1px solid var(--cv-b1)}',
      '.cv-switch-row:first-of-type{border-top:none}',
      '.cv-switch-label{font-size:13.5px;font-weight:550}',
      '.cv-switch-hint{font-size:12px;color:var(--cv-t2);margin-top:3px;line-height:1.4}',
      '.cv-switch{position:relative;width:44px;height:25px;flex:none;border-radius:999px;border:1px solid var(--cv-b2);background:var(--cv-l2);cursor:pointer;transition:background .15s,border-color .15s;padding:0}',
      '.cv-switch[aria-checked="true"]{background:var(--cv-brand);border-color:var(--cv-brand)}',
      '.cv-switch-knob{position:absolute;top:2px;left:2px;width:19px;height:19px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:transform .15s}',
      '.cv-switch[aria-checked="true"] .cv-switch-knob{transform:translateX(19px)}',
      '.cv-status{margin-top:12px;font-size:12.5px;color:var(--cv-ok)}',
      '.cv-field-error{color:var(--cv-err);font-size:12px;margin-top:2px}',
      '.cv-settings-fields{display:flex;flex-direction:column;gap:12px;margin-top:12px}'
    ].join('\n');

    // Migrate entries saved by the earlier single-form version.
    function normalize(e) {
      var n = Object.assign({}, e);
      n.category = n.category || 'account';
      if (n.secret != null && n.password == null && n.apiKey == null && n.content == null) {
        if (n.category === 'apikey') n.apiKey = n.secret;
        else if (n.category === 'other') n.content = n.secret;
        else n.password = n.secret;
      }
      if (n.category === 'apikey') {
        if (n.provider == null && n.username) n.provider = n.username;
        if (n.endpoint == null && n.url) n.endpoint = n.url;
      }
      return n;
    }
    function loadEntries() {
      try {
        var raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        var arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr.map(normalize) : [];
      } catch (e) { return []; }
    }
    function saveEntries(arr) {
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); } catch (e) {}
      syncToHost(arr);
    }
    // Mirror the vault to the Host so the Harness/Agent can read it via the
    // credential_vault_read tool. Fire-and-forget: the browser stays usable
    // even if the Host route is unavailable; localStorage is still authoritative.
    // Large vaults: DEBOUNCE so a burst of edits results in one POST, not dozens
    // of multi-megabyte payloads. A trailing timer always flushes the latest data.
    var syncTimer = null;
    var SYNC_DELAY = 400;
    function syncToHost(arr, immediate) {
      if (typeof window.fetch !== 'function') return;
      function send() {
        syncTimer = null;
        try {
          window.fetch(API + 'entries', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'content-type': 'application/json', accept: 'application/json' },
            body: JSON.stringify({ entries: arr })
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
    function exportBackup(arr) {
      if (!arr || arr.length === 0) return false;
      try {
        var payload = JSON.stringify(buildBackup(arr), null, 2);
        var blob = new Blob([payload], { type: 'application/json;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        var d = new Date();
        function pad(n) { return n < 10 ? '0' + n : '' + n; }
        var stamp = d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes());
        a.href = url;
        a.download = 'credential-vault-' + stamp + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { try { URL.revokeObjectURL(url); } catch (e) {} }, 1000);
        return true;
      } catch (e) { return false; }
    }
    // Returns { entries: [...] } or throws a recognisable error.
    function parseBackup(text) {
      var data;
      try { data = JSON.parse(text); } catch (e) { throw new Error('parse'); }
      var arr = null;
      if (data && Array.isArray(data.entries)) arr = data.entries;
      else if (Array.isArray(data)) arr = data; // tolerate a bare array
      if (!arr) throw new Error('shape');
      var clean = arr.filter(function (e) { return e && typeof e === 'object'; }).map(normalize);
      return clean;
    }

    // ---- Access-password security store ---------------------------------
    var SEC_KEY = '@local/credential-vault:security:v1';
    var IDLE_MS = 15 * 60 * 1000; // fallback duration when idleMs is absent
    var DEFAULT_SECURITY = { enabled: false, salt: '', passwordHash: null, question: null, answerHash: null, idleEnabled: false, idleMs: IDLE_MS };
    var securityCache = null;
    var securityListeners = [];
    var unlockedAt = 0; // 0 = locked; timestamp = last successful unlock

    function loadSecurity() {
      try {
        var raw = window.localStorage.getItem(SEC_KEY);
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
        content: '', notes: ''
      };
    }

    var layout = null, locale = null, lang0 = 'en';
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

    function Field(props) {
      var t = props.t;
      var isSecret = !!props.secret;
      var revealed = !!props.revealed;
      var display = (isSecret && !revealed) ? MASK : (props.value || '');
      var masked = isSecret && !revealed;
      return h('div', { className: 'cv-field' },
        h('div', { className: 'cv-field-label' }, t(props.label)),
        h('div', { className: 'cv-field-row' },
          h('span', {
            className: 'cv-field-value' + (props.mono ? ' cv-mono' : '') + (masked ? ' cv-masked' : '') + (props.multiline ? ' cv-field-multiline' : ''),
            title: masked ? '' : (props.value || '')
          }, display || '—'),
          isSecret ? h('button', { className: 'cv-mini', onClick: props.onToggle, title: revealed ? t('hide') : t('show') }, revealed ? t('hide') : t('show')) : null,
          props.value ? h('button', { className: 'cv-mini', onClick: function () { props.onCopy(props.value); }, title: t('copy') }, t('copy')) : null
        )
      );
    }

    function Card(props) {
      var e = props.entry, t = props.t;
      var cat = e.category || 'account';
      var catLabel = cat === 'apikey' ? t('catApikey') : (cat === 'other' ? t('catOther') : t('catAccount'));
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
            if (!e[f.key]) return null;
            return h(Field, {
              key: f.key, t: t, label: f.label, value: e[f.key],
              mono: !!f.mono, secret: isSecretField(f), multiline: isMultilineField(f),
              revealed: !!props.revealed, onToggle: props.onToggle, onCopy: props.onCopy
            });
          })
        )
      );
    }

    function EditorModal(props) {
      var d = props.draft, t = props.t, onChange = props.onChange;
      var ss = useState(false), showSecret = ss[0], setShowSecret = ss[1];
      var cat = d.category || 'account';
      var meta = CATEGORIES.filter(function (c) { return c.k === cat; })[0] || CATEGORIES[0];
      var fields = schemaOf(cat);

      function baseInput(f, extra) {
        return Object.assign({
          className: 'cv-input', value: d[f.key] || '',
          placeholder: f.ph ? t(f.ph) : '',
          autoFocus: !!f.required,
          onChange: function (ev) { onChange(f.key, ev.target.value); }
        }, extra || {});
      }
      function renderField(f) {
        var control;
        if (f.type === 'text' || f.type === 'date') {
          control = h('input', baseInput(f, { type: f.type === 'date' ? 'date' : 'text' }));
        } else if (f.type === 'textarea') {
          control = h('textarea', baseInput(f, { className: 'cv-input cv-textarea' }));
        } else if (f.type === 'secret') {
          control = h('div', { className: 'cv-secret-input' },
            h('input', baseInput(f, { type: showSecret ? 'text' : 'password' })),
            h('button', { type: 'button', className: 'cv-secret-toggle', onClick: function () { setShowSecret(!showSecret); } }, showSecret ? t('hide') : t('show'))
          );
        } else if (f.type === 'secretarea') {
          control = h('div', { className: 'cv-secret-input' },
            h('textarea', baseInput(f, {
              className: 'cv-input cv-textarea cv-mono' + (showSecret ? '' : ' cv-text-security'),
              spellCheck: false
            })),
            h('button', { type: 'button', className: 'cv-secret-toggle', onClick: function () { setShowSecret(!showSecret); } }, showSecret ? t('hide') : t('show'))
          );
        }
        return h('label', { key: f.key, className: 'cv-form-row' },
          h('span', { className: 'cv-form-label' }, t(f.label)),
          control
        );
      }

      return h('div', { className: 'cv-modal-backdrop', onMouseDown: function (e) { if (e.target === e.currentTarget) props.onCancel(); } },
        h('div', {
          className: 'cv-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': t(props.titleKey), tabIndex: -1,
          onKeyDown: function (e) { if (e.key === 'Escape') props.onCancel(); }
        },
          h('div', { className: 'cv-modal-head' }, h('h2', null, t(props.titleKey) + ' · ' + t(meta.label))),
          h('div', { className: 'cv-modal-hint' }, t(meta.hint)),
          h('div', { className: 'cv-modal-body' },
            h('label', { className: 'cv-form-row' },
              h('span', { className: 'cv-form-label' }, t('fCategory')),
              h('select', { className: 'cv-input', value: cat, onChange: function (ev) { onChange('category', ev.target.value); } },
                CATEGORIES.map(function (c) { return h('option', { key: c.k, value: c.k }, t(c.label)); })
              )
            ),
            fields.map(renderField)
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

    function ImportModal(props) {
      var t = props.t;
      var fileState = useState(null), fileInfo = fileState[0], setFileInfo = fileState[1];
      var entriesState = useState(null), pending = entriesState[0], setPending = entriesState[1];
      var modeState = useState('merge'), mode = modeState[0], setMode = modeState[1];
      var errState = useState(''), err = errState[0], setErr = errState[1];
      var inputRef = useState({})[0];

      function onFile(ev) {
        var f = ev.target.files && ev.target.files[0];
        if (!f) return;
        setErr(''); setPending(null);
        setFileInfo({ name: f.name, size: f.size });
        if (typeof FileReader === 'undefined') { setErr(t('importInvalid')); return; }
        var reader = new FileReader();
        reader.onload = function () {
          try {
            var clean = parseBackup(String(reader.result || ''));
            setPending(clean);
            if (clean.length === 0) setErr(t('importEmpty'));
          } catch (e) { setErr(t('importInvalid')); setPending(null); }
        };
        reader.onerror = function () { setErr(t('importInvalid')); setPending(null); };
        reader.readAsText(f, 'utf-8');
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
              type: 'file', accept: '.json,application/json', style: { display: 'none' },
              onChange: onFile
            }),
            h('button', { type: 'button', className: 'cv-btn', onClick: function () { if (inputRef.el) inputRef.el.click(); } },
              fileInfo ? '📄 ' + fileInfo.name : t('import')),
            fileInfo ? h('div', { className: 'cv-import-file' },
              t('importFound') + '：' + (pending ? pending.length : '…')) : null,
            h('div', { className: 'cv-form-label' }, t('importMode')),
            h('div', { className: 'cv-import-modes' },
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
            h('button', { className: 'cv-btn cv-btn-primary', disabled: !pending || pending.length === 0, onClick: submit }, t('importConfirm'))
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
      var toastState = useState(''), toast = toastState[0], setToast = toastState[1];
      var updateState = useState(null), updateInfo = updateState[0], setUpdateInfo = updateState[1];
      var checkingState = useState(false), checking = checkingState[0], setChecking = checkingState[1];
      var upgradingState = useState(false), upgrading = upgradingState[0], setUpgrading = upgradingState[1];
      var upgradeMsgState = useState(null), upgradeMsg = upgradeMsgState[0], setUpgradeMsg = upgradeMsgState[1];
      var pollRef = useRef(null);
      useEffect(function () {
        if (!toast) return;
        var id = setTimeout(function () { setToast(''); }, 2600);
        return function () { clearTimeout(id); };
      }, [toast]);
      // Clear any running poll timer when the settings page unmounts.
      useEffect(function () {
        return function () { if (pollRef.current) { clearTimeout(pollRef.current); pollRef.current = null; } };
      }, []);

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
        if (!window.confirm(t('upgradeConfirm'))) return;
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
        if (!pw || String(pw).length < 4) { setToast(t('secTooShort')); return; }
        if (pw !== confirm) { setToast(t('secMismatch')); return; }
        var s = Object.assign({}, getSecurity());
        function commit() {
          s.salt = s.salt || makeSalt();
          return hashWithSalt(s.salt, pw).then(function (h) {
            s.passwordHash = h;
            saveSecurity(s);
            refresh(); setPw(''); setConfirm(''); setToast(t('secPasswordOn'));
          });
        }
        if (s.passwordHash) {
          verifyPassword(s, current).then(function (ok) {
            if (!ok) { setToast(t('secCurrentWrong')); return; }
            return commit();
          });
        } else commit();
      }
      function saveQuestion() {
        if (!answer) { setToast(t('secAnswer')); return; }
        var s = Object.assign({}, getSecurity());
        var chosen = SECURITY_QUESTIONS.filter(function (x) { return x.k === q; })[0] || SECURITY_QUESTIONS[0];
        var label = q === 'custom' ? (customQ || '') : (chosen[lang] || chosen.en);
        if (q === 'custom' && !customQ.trim()) { setToast(t('secQuestion')); return; }
        // Once a question is set, changing it must be authorized with the current access password.
        function commit() {
          hashWithSalt(s.salt || (s.salt = makeSalt()), normalizeAnswer(answer)).then(function (h) {
            s.question = { k: q, label: label };
            s.answerHash = h;
            saveSecurity(s);
            refresh(); setAnswer(''); setQCurrent(''); setToast(t('secQuestionSet'));
          });
        }
        if (s.passwordHash && s.question && s.answerHash) {
          if (!qCurrent) { setToast(t('secCurrentRequired')); return; }
          verifyPassword(s, qCurrent).then(function (ok) {
            if (!ok) { setToast(t('secCurrentWrong')); return; }
            return commit();
          });
        } else commit();
      }
      function toggleEnabled() {
        if (!sec.enabled && !hasSetup()) { setToast(t('secNeedSetupFirst')); return; }
        var enabling = !sec.enabled;
        if (!enabling) {
          // Disabling the access password must be confirmed with the current password.
          if (!disablePw) { setToast(t('secDisableHint')); return; }
          verifyPassword(getSecurity(), disablePw).then(function (ok) {
            if (!ok) { setToast(t('secCurrentWrong')); return; }
            var s = Object.assign({}, getSecurity(), { enabled: false });
            lockVault();
            saveSecurity(s);
            setDisablePw('');
            refresh();
            setToast(t('secPasswordOff'));
          });
          return;
        }
        // Enabling must lock immediately so the password actually protects the vault.
        var s = Object.assign({}, getSecurity(), { enabled: true });
        lockVault();
        saveSecurity(s);
        refresh();
        setToast(t('secEnabledLocked'));
      }
      function toggleIdle() {
        var enabling = !sec.idleEnabled;
        if (enabling && !sec.enabled) { setToast(t('secNeedSetupFirst')); return; }
        var s = Object.assign({}, getSecurity(), { idleEnabled: enabling });
        if (enabling) {
          // Turning auto-lock on locks the vault right away so the policy takes effect.
          lockVault();
          if (!s.idleMs) s.idleMs = IDLE_MS;
        }
        saveSecurity(s);
        refresh();
        setToast(t(enabling ? 'secIdleOn' : 'secIdleOff'));
      }
      function setIdleMs(ms) {
        var s = Object.assign({}, getSecurity(), { idleMs: ms });
        saveSecurity(s);
        refresh();
      }

      var questionLabel = sec.question ? (sec.question.label || t('secQuestion')) : null;
      var qNeedsCurrent = !!(sec.passwordHash && sec.question && sec.answerHash);
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
              h('div', null, h('button', { className: 'cv-btn cv-btn-primary', onClick: setPassword }, t('secSavePassword')))
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
              h('div', null, h('button', { className: 'cv-btn', onClick: saveQuestion }, t('secSaveQuestion')))
            )
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
          toast ? h('div', { className: 'cv-toast', role: 'status' }, toast) : null
        )
      );
    }

    function SettingsIcon(props) {
      return h('span', { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, color: 'var(--dsw-alias-label-primary, #1d2129)' } }, Shield(18));
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
        setEntries(function (prev) { return prev.filter(function (x) { return x.id !== id; }); });
        setToast(t('deleted'));
      }
      function doExport() {
        if (entries.length === 0) { setToast(t('exportEmpty')); return; }
        if (!window.confirm(t('exportWarn'))) return;
        setToast(exportBackup(entries) ? t('exportDone') : t('exportFail'));
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

      return h('div', { className: 'cv-root' },
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
                      onToggle: function () { toggleReveal(e.id); },
                      onEdit: function () { openEdit(e); },
                      onDelete: function () { delEntry(e.id); },
                      onCopy: copyText
                    });
                  })
            )
          )
        ),
        editing ? h(EditorModal, {
          t: t, draft: editing.draft, titleKey: editing.mode === 'new' ? 'editorNew' : 'editorEdit',
          onChange: setDraftField, onSave: saveDraft, onCancel: function () { setEditing(null); }
        }) : null,
        importing ? h(ImportModal, {
          t: t, onImport: doImport, onCancel: function () { setImporting(false); }
        }) : null,
        toast ? h('div', { className: 'cv-toast', role: 'status' }, toast) : null
      );
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        layout = (ctx.get && ctx.get('layout')) || null;
        locale = (ctx.get && ctx.get('locale')) || null;
        lang0 = detectLang(locale);
        if (locale && typeof locale.register === 'function') {
          try { locale.register('@local/credential-vault/ui', { en: DICTS.en, zh: DICTS.zh }); } catch (e) {}
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
