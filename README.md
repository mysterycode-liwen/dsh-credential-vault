# 凭据保险箱 / Credential Vault

[![npm version](https://img.shields.io/npm/v/@mysterycode-liwen/dsh-credential-vault.svg)](https://www.npmjs.com/package/@mysterycode-liwen/dsh-credential-vault)
[![license](https://img.shields.io/npm/l/@mysterycode-liwen/dsh-credential-vault.svg)](LICENSE)
[![DeepSeek Harness plugin](https://img.shields.io/badge/DeepSeek%20Harness-plugin-4C6EF5)](https://github.com/deepseek-ai/DeepSeek-Harness)

一个 [DeepSeek Harness](https://github.com/deepseek-ai/DeepSeek-Harness) 侧边栏插件：把账号密码、API Key、恢复码等凭据集中保存在本机，并提供一个 Agent 工具让 Harness 读取。

A sidebar plugin for DeepSeek Harness that keeps accounts, passwords, API keys and recovery codes locally, plus an agent tool so the Harness can read them.

> 数据只留在本机：浏览器 `localStorage` + 本地镜像文件，不上传、不同步、不加密存储。请勿在公用电脑上使用。

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
- 导入 / 导出：可把全部凭据导出为 **JSON 备份 / CSV（Excel、WPS 可直接打开）/ Markdown 卡片**三种格式，或从这三种格式的文件恢复；导入时自动识别格式，并可选「合并（跳过重复 ID）」或「替换全部」。JSON 保留全部字段；CSV 用中文表头、常用列在前；Markdown 每条凭据一张中文卡片，方便阅读。三种格式均可无损导回。
- 设置页：访问密码开关、设置 / 修改密码、密保问题重置、闲置自动锁定（可开关、可选时长）、插件版本与检查更新。

## Agent 工具 / Agent tool

工具名：`dsh_credential_vault_read`

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `mode` | `"summary"` \| `"full"` | `summary` 只返回 id / 标题 / 分类 / 账号 / 平台 / 到期时间，用于先摸清有哪些条目；默认 `full` |
| `query` | string | 按标题、账号、平台、URL、备注做不区分大小写的子串过滤 |
| `category` | `"all"` \| `"account"` \| `"apikey"` \| `"other"` | 只返回某一类，默认 `all` |
| `limit` / `offset` | number | 分页，默认 20 条一页；条目多时先看 summary 再翻页 |
| `revealSecrets` | boolean | 默认 `false`，密码 / API Key / 文本正文显示为 `••••••••`；只有显式传 `true` 且 `mode="full"` 才返回明文 |

Host 端把浏览器同步过来的快照写到 `~/.dsh/dsh-credential-vault/vault.json`（旧版路径 `~/.dsh/credential-vault/vault.json` 会自动迁移）。

## 安全说明 / Security notice

- 浏览器端数据保存在 **localStorage**，Host 端镜像文件是**明文 JSON**：都不加密、不跨设备同步。请勿在公用 / 共享电脑上使用。
- 插件没有网络上传行为；数据只在你本机和本机 Harness 之间流转。
- `dsh_credential_vault_read` 默认把 `password` / `apiKey` / `content` 显示为 `••••••••`，只有显式传 `revealSecrets: true` 才返回明文。
- **导出的文件（JSON / CSV / Markdown）都包含明文密码 / API Key**：请像对待密码本身一样妥善保管，用完及时删除；导入仅在本机浏览器内进行。CSV / Markdown 尤其容易被随手分享或提交到版本库，导出前请确认用途。
- Host 工具的注册发生在 Harness 启动时：首次安装后请**重启 Harness 或在插件管理里关闭再启用**该插件。
- 访问密码与闲置锁定是**界面层**保护，不改变磁盘上明文存储这一事实；需要磁盘加密请用 BitLocker / FileVault 之类的手段。

## 常见问题 / FAQ

**装上了，但侧边栏和设置里都找不到？**
八成是浏览器端模块没挂载。`client.js` 里 `window.__ModuleLoader__.load({ id })` 的 `id` **必须等于 `package.json` 的 `name`**，DSH 是按包名去浏览器模块表里查的。装完先重启 DSH；仍然没有就运行 `npm run check`（见 [发布](#发布--publishing)）。

**Agent 说没有 `dsh_credential_vault_read` 这个工具？**
Host 侧工具在 Harness 启动时注册。重启 Harness，或在插件管理里把本插件关闭再启用。

**数据存在哪？换机器/重装会丢吗？**
浏览器端在 `localStorage`，Host 端镜像在 `~/.dsh/dsh-credential-vault/vault.json`。换机器不会自动带过去，请先用「导出」生成 JSON / CSV / Markdown 文件再导入（推荐用 JSON，字段最完整）。

**导出该选哪种格式？Excel 打开 CSV 会乱码吗？**
- **JSON**：字段最完整，换机器 / 完整备份首选。
- **CSV**：带 UTF-8 BOM，Excel / WPS 双击即可正确显示中文；中文表头、常用列在前，ID / 时间戳等放在最后，适合表格查看与批量编辑。
- **Markdown**：每条凭据一张卡片、中文标签两列表，空字段自动省略，方便阅读、贴到文档或做版本管理；完整数据以 HTML 注释内嵌，导入时无损还原。
导入时会自动识别这三种格式（也兼容旧版英文表头的 CSV 与宽表格 Markdown），无需手动选择。

**支持多设备同步吗？**
不支持，也不打算支持——本插件的定位就是「不上云的本机保险箱」。

**npm 上的 `dsh-credential-vault` 是这个项目吗？**
不是。那是另一个作者的包。本项目只发布在 `@mysterycode-liwen/dsh-credential-vault` 这个 scope 下。

## 更新日志 / Changelog

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
git tag v1.4.1 && git push --tags
```

`client.js` 里 `window.__ModuleLoader__.load({ id })` 的 `id` **必须等于 `package.json` 的 `name`**：DSH 按包名去浏览器模块表里查找，不一致时浏览器端不会挂载，表现为侧边栏入口与设置页整块消失（Host 端仍然正常）。改包名或改 scope 时，三处要同步：`package.json` 的 `name`、`client.js` 的 `id`、`cordis.patch.yml` 的 `name`。

进阶：可以用 `npm stage publish` + `npm stage approve <stage-id>` 把「打包」和「2FA 证明」拆成两步；`approve` / `reject` 需要交互式 2FA，绕过 2FA 的 granular token 无权执行。

## 许可 / License

MIT © 2026 李文（GitHub [@mysterycode-liwen](https://github.com/mysterycode-liwen)）

本项目由 李文 独立开发。你可以自由使用、修改、分发、商用乃至闭源再分发，唯一义务是在副本或重要部分中保留上面的版权声明与本许可声明；软件按「原样」提供，不含任何明示或暗示的担保。完整条款见 [LICENSE](LICENSE)。