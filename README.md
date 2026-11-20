# 凭据保险箱 / Credential Vault

一个 [DeepSeek Harness](https://github.com/deepseek-ai/DeepSeek-Harness) 侧边栏插件：把账号密码、API Key、恢复码等凭据集中保存在本机，并提供一个 Agent 工具让 Harness 读取。

A sidebar plugin for DeepSeek Harness that keeps accounts, passwords, API keys and recovery codes locally, plus an agent tool so the Harness can read them.

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

## 功能 / Features

- 侧边栏「凭据保险箱」面板，三类凭据各有独立表单：
  - 账号密码：标题 / 账号 / 密码 / 登录网址 / 备注
  - API Key：标题 / 平台 / Key / Base URL / 到期日期 / 备注
  - 其他：标题 / 任意文本（如恢复码、许可证）/ 备注
- 搜索、类型筛选、排序（最近更新 / 名称 / 类型）；大量条目用滚动列表浏览。
- 逐条显示 / 隐藏、复制到剪贴板、编辑、删除。
- **密码生成器**：在账号密码字段旁点「⚙ 生成」，用加密安全随机数（Web Crypto）生成强密码，可设置长度与字符类型、避开易混淆字符，并实时显示强度；可直接填入表单或复制。（仅账号密码类提供，API Key / 其他类不显示）
- **健康审计**：点「🛡 健康审计」扫描全部凭据，列出弱密码 / 空密钥、重复使用、已过期 / 即将到期等问题并按严重程度排序，点击条目可直接跳转编辑。
- 登录网址 / Base URL 字段旁提供「访问」按钮，默认用 DeepSeek Harness 内置浏览器打开。
- 导入 / 导出：把全部凭据导出为 JSON 备份文件，或从备份文件恢复；导入时可选「合并（跳过重复 ID）」或「替换全部」。
- 设置页：访问密码开关、设置 / 修改密码、密保问题重置、闲置自动锁定（可开关、可选时长）、插件版本与检查更新。
- Agent 工具 `dsh_credential_vault_read`：`mode=summary|full`、`limit`、`offset`、`query`、`category`、`revealSecrets`，默认脱敏。Host 端把浏览器同步过来的快照写到 `~/.dsh/dsh-credential-vault/vault.json`（旧版路径 `~/.dsh/credential-vault/vault.json` 会自动迁移）。

## 安全说明 / Security notice

- 浏览器端数据保存在 **localStorage**，Host 端镜像文件是**明文 JSON**：都不加密、不跨设备同步。请勿在公用 / 共享电脑上使用。
- 插件没有网络上传行为；数据只在你本机和本机 Harness 之间流转。
- `dsh_credential_vault_read` 默认把 `password` / `apiKey` / `content` 显示为 `••••••••`，只有显式传 `revealSecrets: true` 才返回明文。
- **导出的备份文件包含明文密码 / API Key**：请像对待密码本身一样妥善保管，用完及时删除；导入仅在本机浏览器内进行。
- Host 工具的注册发生在 Harness 启动时：首次安装后请**重启 Harness 或在插件管理里关闭再启用**该插件。

## 发布 / Publishing

```bash
npm run check        # 发布前自检：client.js 的模块 id 与 cordis.patch.yml 的 name 必须等于包名
npm pack --dry-run   # 核对实际打包的文件清单
npm publish          # publishConfig.access = public；会先自动跑一次 npm run check，不一致则中止
git tag v1.2.3 && git push --tags
```

`client.js` 里 `window.__ModuleLoader__.load({ id })` 的 `id` **必须等于 `package.json` 的 `name`**：DSH 按包名去浏览器模块表里查找，不一致时浏览器端不会挂载，表现为侧边栏入口与设置页整块消失（Host 端仍然正常）。改包名或改 scope 时，三处要同步：`package.json` 的 `name`、`client.js` 的 `id`、`cordis.patch.yml` 的 `name`。

## 许可 / License

MIT
