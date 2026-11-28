# 凭据保险箱 / Credential Vault

[![npm version](https://img.shields.io/npm/v/@mysterycode-liwen/dsh-credential-vault.svg)](https://www.npmjs.com/package/@mysterycode-liwen/dsh-credential-vault)
[![license](https://img.shields.io/npm/l/@mysterycode-liwen/dsh-credential-vault.svg)](LICENSE)
[![DeepSeek Harness plugin](https://img.shields.io/badge/DeepSeek%20Harness-plugin-4C6EF5)](https://github.com/deepseek-ai/DeepSeek-Harness)

一个 [DeepSeek Harness](https://github.com/deepseek-ai/DeepSeek-Harness) 侧边栏插件：把账号密码、API Key、恢复码等凭据集中保存在本机，并提供一个 Agent 工具让 Harness 读取。

A sidebar plugin for DeepSeek Harness that keeps accounts, passwords, API keys and recovery codes locally, plus an agent tool so the Harness can read them.

> 数据只留在本机：凭据明文只存在浏览器 `localStorage`，不上传、不同步。**Host 端只接收脱敏元数据，不落盘、不保存明文**。请勿在公用电脑上使用。

## 目录

- [安装](#安装--install)
- [快速上手](#快速上手--quick-start)
- [功能](#功能--features)
- [Agent 工具](#agent-工具--agent-tool)
- [安全说明](#安全说明--security-notice)
- [常见问题](#常见问题--faq)
- [更新日志](#更新日志--changelog)
- [发布](#发布--publishing)
- [许可](#许可--license)

## 安装 / Install

从 npm 安装（推荐）：

```bash
dsh plugin --profile desktop add @mysterycode-liwen/dsh-credential-vault
```

npm 页面：<https://www.npmjs.com/package/@mysterycode-liwen/dsh-credential-vault>

也可以在 DeepSeek Harness 的「设置 → 插件 → 插件市场」中搜索 `credential vault`（市场索引刷新后可见）。

固定到某个提交从源码安装：

```bash
dsh plugin --profile desktop add github:mysterycode-liwen/dsh-credential-vault
```

从本地目录安装（开发用）：

```bash
dsh plugin --profile desktop add link:E:/deepseek-harness/dsh-credential-vault
```

安装后可检查实际装上的版本：

```bash
dsh plugin --profile desktop why @mysterycode-liwen/dsh-credential-vault
```

> ⚠️ npm 上还有一个**不带 scope 的** `dsh-credential-vault`，那是别人的同名包，与本项目无关。请认准 `@mysterycode-liwen/dsh-credential-vault`。

## 快速上手 / Quick start

1. 安装（见上）→ 重启 DeepSeek Harness（或在本插件卡片上关闭再启用）。
2. 侧边栏点「凭据保险箱」，用「＋」新增条目；先用「账号密码」类录一条试试。
3. 到「设置 → 凭据保险箱」决定是否开启访问密码与闲置自动锁定。
4. 想让 Agent 读凭据时，直接让它调用 `dsh_credential_vault_read`；默认只返回脱敏视图。

## 功能 / Features

- 侧边栏「凭据保险箱」面板，三类凭据各有独立表单：
  - **账号密码**：标题 / 账号 / 密码 / 登录网址 / 备注
  - **API Key**：标题 / 平台 / Key / Base URL / 到期日期 / 备注
  - **其他**：标题 / 任意文本（如恢复码、许可证）/ 备注
- 搜索、类型筛选、排序（最近更新 / 名称 / 类型）；大量条目用滚动列表浏览。
- 逐条显示 / 隐藏、复制到剪贴板、编辑、删除。
- **密码生成器**：在账号密码字段旁点「⚙ 生成」，用加密安全随机数（Web Crypto）生成强密码，可设置长度与字符类型、避开易混淆字符，并实时显示强度；可直接填入表单或复制。（仅账号密码类提供，API Key / 其他类不显示）
- **健康审计**：点「🛡 健康审计」扫描全部凭据，列出弱密码 / 空密钥、重复使用、已过期 / 即将到期等问题并按严重程度排序，点击条目可直接跳转编辑。
- 登录网址 / Base URL 字段旁提供「访问」按钮，默认用 DeepSeek Harness 内置浏览器打开。
- 导入 / 导出：可把全部凭据导出为 **加密备份 / JSON 备份 / CSV（Excel、WPS 可直接打开）/ Markdown 卡片**四种格式。**加密备份**用你设置的密码经 AES-GCM 加密全部明文，需密码才能导入，适合备份 / 迁移；JSON 保留全部字段（明文）；CSV 用中文表头、常用列在前（明文）；Markdown 每条凭据一张中文卡片（明文）。导入时自动识别格式，遇到加密备份会提示输入密码解密，并可选「合并（跳过重复 ID）」或「替换全部」。四种格式均可无损导回。
- 设置页：访问密码开关、设置 / 修改密码、密保问题重置、闲置自动锁定（可开关、可选时长）、**访问审计**（查看模型读取元数据的内存日志）、插件版本与检查更新。

## Agent 工具 / Agent tool

工具名：`dsh_credential_vault_read`

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `mode` | `"summary"` \| `"full"` | `summary` 只返回 id / 标题 / 分类 / 账号 / 平台 / 到期时间，用于先摸清有哪些条目；默认 `full` |
| `query` | string | 按标题、账号、平台、URL、备注做不区分大小写的子串过滤 |
| `category` | `"all"` \| `"account"` \| `"apikey"` \| `"other"` | 只返回某一类，默认 `all` |
| `limit` / `offset` | number | 分页，默认 20 条一页；条目多时先看 summary 再翻页 |
| `revealSecrets` | boolean | **已废弃、无效**；保留仅为兼容旧调用。任何情况下密码 / API Key / 文本正文都只返回 `••••••••` |

**安全边界**：浏览器同步给 Host 的是**脱敏元数据**（标题 / 分类 / 账号 / 平台 / URL / 备注等），密码 / API Key / 正文在浏览器端就被替换成 `••••••••`，明文从不进入模型上下文。Host 端也**不落盘**——快照只在内存中，重启后清空，等浏览器重新连接再同步。因此该工具只能用来「知道有哪些凭据」，不能用来「取明文」；需要看明文请到侧边栏面板操作。每次工具读取都会记入内存审计日志，可在设置页「访问审计」查看，或本机访问 `GET /dsh-credential-vault/audit`。

## 安全说明 / Security notice

- 明文只存在浏览器 **localStorage**，不加密、不跨设备同步；Host 端**没有磁盘镜像**，快照仅存内存、重启即清空。请勿在公用 / 共享电脑上使用。
- 插件没有网络上传行为；浏览器→Host 的同步也只传脱敏元数据，密钥明文不出浏览器。
- `dsh_credential_vault_read` 永远把 `password` / `apiKey` / `content` 显示为 `••••••••`；`revealSecrets` 参数已失效，明文不会进入模型上下文。
- **加密备份导出**用你设置的密码（PBKDF2-SHA256 派生密钥 + AES-GCM）加密全部明文，文件里不含明文；密码不会被存储，丢失则无法恢复，请务必牢记。导入时在本机浏览器内解密。
- **完整导出（JSON / CSV / Markdown）包含明文密码 / API Key**：请像对待密码本身一样妥善保管，用完及时删除；跨平台 / 异地备份优先用加密备份。导入仅在本机浏览器内进行。
- 访问审计为**内存环形日志**（最多 200 条），只记录工具名 / 操作 / 查询条件 / 条数等元数据，不含明文，重启后清空。
- Host 工具的注册发生在 Harness 启动时：首次安装后请**重启 Harness 或在插件管理里关闭再启用**该插件。
- 访问密码与闲置锁定是**界面层**保护；明文仍在浏览器 localStorage 中，如需驱动器级加密请用 BitLocker / FileVault 之类的手段。

## 常见问题 / FAQ

**装上了，但侧边栏和设置里都找不到？**
八成是浏览器端模块没挂载。`client.js` 里 `window.__ModuleLoader__.load({ id })` 的 `id` **必须等于 `package.json` 的 `name`**，DSH 是按包名去浏览器模块表里查的。装完先重启 DSH；仍然没有就运行 `npm run check`（见 [发布](#发布--publishing)）。

**Agent 说没有 `dsh_credential_vault_read` 这个工具？**
Host 侧工具在 Harness 启动时注册。重启 Harness，或在插件管理里把本插件关闭再启用。

**数据存在哪？换机器/重装会丢吗？**
明文只存在浏览器 `localStorage`；Host 端只有内存中的脱敏快照（重启即清空，不再有 `vault.json` 镜像文件）。换机器不会自动带过去，请用「导出 → 加密备份」生成加密文件（记好密码），再到新机器导入并输入同一密码解密。

**导出该选哪种格式？Excel 打开 CSV 会乱码吗？**
- **加密备份（推荐用于备份 / 迁移）**：全部明文用你设置的密码经 AES-GCM 加密，文件内不含明文；密码不存储、丢失不可恢复。导入时输入同一密码解密，无损还原。
- **JSON**：字段最完整，含明文，适合本机短期中转（妥善保管，用完删除）。
- **CSV**：带 UTF-8 BOM，Excel / WPS 双击即可正确显示中文；中文表头、常用列在前，ID / 时间戳等放在最后，适合表格查看与批量编辑（含明文）。
- **Markdown**：每条凭据一张卡片、中文标签两列表，空字段自动省略，方便阅读、贴到文档或做版本管理；完整数据以 HTML 注释内嵌，导入时无损还原（含明文）。
导入时会自动识别加密备份 / JSON / CSV / Markdown 四种格式（也兼容旧版英文表头的 CSV 与宽表格 Markdown）；加密备份会先提示输入密码，无需手动选择格式。

**支持多设备同步吗？**
不支持，也不打算支持——本插件的定位就是「不上云的本机保险箱」。

**npm 上的 `dsh-credential-vault` 是这个项目吗？**
不是。那是另一个作者的包。本项目只发布在 `@mysterycode-liwen/dsh-credential-vault` 这个 scope 下。

## 更新日志 / Changelog

### 1.7.0 — 2026-11-28 — 凭据按插件授权可见

- 新增：每条凭据可设置「可访问插件」——在编辑器里为凭据授权指定插件（🔌 标签），卡片底部会显示授权对象。
- 新增：加密桥接接口支持调用方身份（`callerId`）；保险箱只把「明确授权给该插件」的凭据返回给它，其余一律不可见（默认对所有插件不可见）。
- 改进：CSV / Markdown 导出新增「可访问插件」列，导出内容与界面一致。
- 改进：通用客户端模块 `bridge/vault-bridge-client.js` 新增 `callerId` 选项（接入方需显式声明自己的插件 ID 才能读到授权凭据）。

### 1.6.1 — 2026-11-28 — 密钥值卡片自动换行

- 改进：「密钥」类型的密钥值在卡片上自动换行，长密钥不再被省略号截断。

### 1.6.0 — 2026-11-28 — 跨插件加密数据接口

- 新增：浏览器内加密桥接 API（ECDH P-256 + AES-GCM，一次性会话），供本人开发的其它插件安全读取凭据——调用方需持有凭据保险箱插件，未安装时自动空转、不影响使用。
- 新增：通用客户端模块模板 `bridge/vault-bridge-client.js`（零依赖、随包发布），其它插件复制即可接入；支持按标题/类型查询真实密钥值。
- 新增：授权方 dsh-mail 已接入，「邮箱授权码」可从保险箱一键填入。

### 1.5.3 — 2026-11-28 — 关联凭据改为可搜索下拉框

- **关联凭据编辑器改为下拉多选框**：点击展开浮层，顶部可按名称实时搜索；提供「全部 / API Key / 密钥 / 其他」类型筛选 chips，快速定位目标凭据。
- **已选更直观**：已关联项以 chip 展示在触发框下方可逐个移除，并支持一键清空；点击外部自动收起浮层。
- 数据格式与 1.5.2 完全一致，旧数据/导出文件无需迁移。

### 1.5.2 — 2026-11-28 — 账号关联凭据与类型改名

- **账号可关联其它凭据**：账号类型新增「关联凭据」字段，编辑时多选已有的 API Key / 密钥 / 其他凭据（不含账号自身）；卡片上以可点击标签展示，点击直接跳转定位。
- **关联无损**：关联关系随 JSON / CSV / Markdown 三格式无损导回（显示为 `标题(id)`），删除凭据时自动清理其它条目对它的引用，不留死链。
- **「通用密钥」改名为「密钥」**：界面显示名全部更新，内部类型 key 保持 `secretKey`；旧导出文件中的「通用密钥」标签仍兼容识别。

### 1.5.1 — 2026-11-28 — 新增「通用密钥」类型

- **新增凭据类型「通用密钥」**（`secretKey`）：标题 + 密钥名称 + 密钥值 + 备注，适合保存零散的 token / secret / 口令，密钥值默认脱敏。
- **安全链路同步**：密钥值纳入 Host 脱敏、浏览器镜像掩码、安全审计与加密导出范围；工具 `category` 过滤新增 `secretKey`。
- **导入导出同步**：新增「密钥名称 / 密钥值」中文字段与 Card 展示，JSON / CSV / Markdown 三格式往返无损。

### 1.5.0 — 2026-11-26 — 微信开发凭据类型与表单改版

- **新增两种凭据类型**：微信公众号（`wechatMp`）与微信小程序（`wechatMini`），字段包含 AppID、AppSecret、Token / EncodingAESKey、服务器地址、上传密钥、服务器域名等；密钥类字段默认脱敏。
- **类型排序**：「其他」始终排在类型列表最后。
- **表单改版**：编辑表单改为每个字段独占一行的单列布局，次要字段折叠到「更多字段」，弹窗与输入框自适应窄容器。
- **安全字段同步扩展**：新增的微信密钥字段纳入 Host 脱敏与加密导出范围，测试覆盖新类型的导入 / 导出 / 脱敏往返。

### 1.4.3 — 2026-11-23 — 安全加固

- **明文不再落盘**：移除 Host 端 `vault.json` 镜像与相关迁移逻辑，内存快照重启即清空。
- **脱敏同步**：浏览器→Host 只传元数据，密码 / API Key / 正文在浏览器端即替换为 `••••••••`；Host 端再次强制脱敏（纵深防御）。
- **工具只读元数据**：`dsh_credential_vault_read` 永不返回明文，`revealSecrets` 参数失效；系统提示同步说明。
- **关闭调试端点**：`GET /entries` 返回 404，不再暴露 Host 内存快照。
- **访问审计**：内存环形日志（最多 200 条，无明文），设置页可查看，或本机 `GET /dsh-credential-vault/audit`。
- **加密导出 / 解密导入**：新增「加密备份」导出格式，用密码经 PBKDF2-SHA256（21 万次迭代）派生 AES-GCM 密钥加密全部明文；导入时自动识别并提示输入密码解密，密码错误 / 文件损坏给出明确提示。文件不含明文，密码不存储、丢失不可恢复。

### 1.4.2 — 2026-11-22

- **字段过滤**：导入 / 加载 / 导出时统一按凭据类型清理字段，API Key 记录若残留账号类的「用户名 / 密码 / 网址」会被自动剔除，不再出现在卡片或导出文件中。
- 清理在 `normalize()` 里统一完成：从 localStorage 加载、三种格式导入、导出渲染都走同一入口；合法字段（ID / 类型 / 时间戳）保留，无损导回不变。
- 新增回归测试：验证脏 API Key 记录经 JSON / CSV / Markdown 导入后脏字段被清除、真字段保留。

### 1.4.1 — 2026-11-22

- **可读性改进**：Markdown 导出由超宽表格改为每条凭据一张卡片、中文标签两列表、空字段省略、类型显示为「账号 / API Key / 其他」，一目了然。
- CSV 导出改为中文表头、常用列在前，类型中文化，时间戳转为易读的 ISO 格式。
- 两种格式在保持可读的同时仍可无损导回（Markdown 以 HTML 注释内嵌完整数据）；导入兼容旧版英文表头 CSV 与宽表格 Markdown。
- 自动识别逻辑同步更新，新增「无注释的手改卡片」回退解析。

### 1.4.0 — 2026-11-22

- 导入 / 导出支持三种格式：**JSON 备份**（完整字段）、**CSV**（UTF-8 BOM，Excel / WPS 双击即开）、**Markdown 表格**（可读、易复制与版本管理）。
- 导出时弹窗选择格式；导入时自动识别文件格式，无需手动指定。
- 三种格式均通过无损往返测试（含逗号、引号、换行、管道符、反斜杠与中文）。
- 新增 `npm run check` 之外的 `node scripts/test-formats.mjs` 便于回归验证。

### 1.3.0 — 2026-11-20

- 重新发布到 npm，`latest` 指向本版本。
- 包名统一为 `@mysterycode-liwen/dsh-credential-vault`：`package.json` 的 `name`、`client.js` 的模块 `id`、`cordis.patch.yml` 的 `name` 三处一致。
- 补上许可证文件与 `publishConfig.access = "public"`。
- 新增 `npm run check`（`scripts/check-package.mjs`）并在 `prepublishOnly` 中自动执行，防止再次出现「包名与模块 id 不一致」导致插件静默消失。

### 1.2.x

- 1.2.0 之前在 GitHub 上以仓库标签发布；1.2.1 / 1.2.2 / 1.2.3 曾短暂出现在 npm，随后整包被删除。
- 这几个版本号按 npm 规则**永久作废**，请勿尝试安装；需要历史版本请从 git 标签取源码。

## 发布 / Publishing

```bash
npm run check        # 发布前自检：client.js 的模块 id 与 cordis.patch.yml 的 name 必须等于包名
npm pack --dry-run   # 核对实际打包的文件清单
npm publish          # publishConfig.access = public；会先自动跑一次 npm run check，不一致则中止
git tag v1.5.2 && git push --tags
```

`client.js` 里 `window.__ModuleLoader__.load({ id })` 的 `id` **必须等于 `package.json` 的 `name`**：DSH 按包名去浏览器模块表里查找，不一致时浏览器端不会挂载，表现为侧边栏入口与设置页整块消失（Host 端仍然正常）。改包名或改 scope 时，三处要同步：`package.json` 的 `name`、`client.js` 的 `id`、`cordis.patch.yml` 的 `name`。

进阶：可以用 `npm stage publish` + `npm stage approve <stage-id>` 把「打包」和「2FA 证明」拆成两步；`approve` / `reject` 需要交互式 2FA，绕过 2FA 的 granular token 无权执行。

## 许可 / License

MIT © 2026 李文（GitHub [@mysterycode-liwen](https://github.com/mysterycode-liwen)）

本项目由 李文 独立开发。你可以自由使用、修改、分发、商用乃至闭源再分发，唯一义务是在副本或重要部分中保留上面的版权声明与本许可声明；软件按「原样」提供，不含任何明示或暗示的担保。完整条款见 [LICENSE](LICENSE)。