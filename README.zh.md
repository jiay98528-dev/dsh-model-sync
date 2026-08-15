<p align="center">
  <img src="assets/logo.svg" width="88" alt="dsh-model-sync logo">
</p>

<h1 align="center">dsh-model-sync</h1>

<p align="center">
  <a href="README.md">English</a> · 中文
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/dsh-model-sync"><img alt="npm" src="https://img.shields.io/npm/v/dsh-model-sync?color=4D6BFE"></a>
  <a href="https://github.com/topics/dsh-plugin"><img alt="dsh-plugin" src="https://img.shields.io/badge/topic-dsh--plugin-4D6BFE"></a>
  <a href="https://awesome-dsh-plugin.com"><img alt="Awesome DSH Plugin" src="https://awesome-dsh-plugin.com/badge.svg"></a>
  <a href="LICENSE"><img alt="MIT" src="https://img.shields.io/badge/license-MIT-111827"></a>
</p>

<p align="center">
  把各提供方线上模型列表写进 DeepSeek Harness settings 的插件。输入框圆环只跟当前会话正在用的模型，套餐读 5 小时和 7 天窗口，按量读相对上次充值的剩余余额。窗口和加量包同时存在时，图标只画窗口，加量包留在悬停卡里。
</p>

<p align="center">
  <img src="assets/banner.svg" alt="dsh-model-sync 横幅" width="100%">
</p>

一共占用两页设置，分别是自动获取对应供应商的模型 ID 和各个模型的用量详情。**模型同步**把提供方线上的新模型 id 写入 settings，导航是同步箭头。**用量详情**会列出各家窗口、累计次数和 API 余额。重置写成倒计时，例如 `2 天 3 小时后重置`。5 小时和 7 天各占一行。界面中英双语，跟随 DSH 语言设置。

## 效果

| | 中文 | English |
|---|---|---|
| 模型同步 | ![设置中文](assets/demo-settings-zh.png) | ![设置英文](assets/demo-settings-en.png) |
| 用量详情 | ![用量中文](assets/demo-usage-zh.png) | ![用量英文](assets/demo-usage-en.png) |
| 输入框 | ![圆环中文](assets/demo-composer-zh.png) | ![圆环英文](assets/demo-composer-en.png) |

拥有双重限额的模型用两层圆环计数，分别代表 5 小时和 7 天限额。进度条颜色会跟随剩余额度变化。

## 安装

包已上架 npm。

```sh
dsh plugin --profile web add dsh-model-sync
```

GitHub 源同样带预构建 `lib/`，不用开 `allowBuilds`。

```sh
dsh plugin --profile web add github:jiay98528-dev/dsh-model-sync
```

装完重启 `dsh web`，刷新页面，打开 **设置 → 模型同步**。插件市场列表见 [awesome-dsh-plugin](https://awesome-dsh-plugin.com)。

包自带 cordis.patch.yml 补丁（`dsh.bundle`），客户端声明 `dsh.client.immediately: true`，装上即生效，不用手动改配置。

## 功能开关

关闭任一内置功能时，host 插件仍保持加载，因此 API 和两个独立设置页都会保留。这两个页面只注册在设置主侧栏，不会重复出现在 **设置 → 插件** 中。

| 开关 | `cordis.patch.yml` 字段 | 关闭后的行为 |
|---|---|---|
| 模型同步 | `model-sync.config.enabled` | 停止在线发现和写入模型；用量功能继续工作 |
| 模型用量查询 | `model-sync.config.usageEnabled` | 停止额度请求和基准重置，并隐藏输入框圆环；模型同步继续工作 |
| 可选 `sub-model-access` | `sub-model-access.disabled` | 只卸载这个可选插件 |

`sub-model-access` 是可选插件。未安装或 bundle 未提供对应 patch entry 时，界面会隐藏它的开关，也不会抛出 missing-entry 错误；必需 entry 缺失仍会正常报错。

## 使用

### 模型同步

1. 打开 **设置 → 模型同步**。
2. 列表空就点 **刷新**。
3. 每张卡片列出提供方 id、`baseURL` 和模型芯片。蓝框是 settings 里还没有的 id，点 **应用 N 个新模型** 写进 `llm-pi-ai.providers.<id>.models`。
4. “模型同步”使用独立的整行开关；安装了 `sub-model-access` 时，它会另外显示在 **可选插件** 中，并写入 cordis.patch.yml 的 loader disabled 标志。

MiniMax、Kimi Coding、OpenAI Codex 没有 OpenAI `/models` 端点，插件用 catalog 里的已知 id。

### 用量详情

1. 打开 **设置 → 用量详情**。
2. 每家列出 5 小时和 7 天窗口，各占一行，带剩余百分比、厂商累计次数、重置倒计时和彩色进度条。
3. 按量行显示 `当前 / 基准`，首采把当时余额当基准。要把插件启用前已经花掉的部分算进百分比，点 **以当前余额为基准**，余额行还会记录基准时间。
4. 页面每 60 秒自动刷新，也可以点 **刷新** 立即拉一次。
5. 本页的“模型用量查询”开关可以独立关闭额度请求和输入框圆环，不影响模型同步功能。

### 对话圆环

1. 照常选模型。
2. 圆环在模型名右侧、上下文进度条左侧，只跟当前会话的模型，换模型圆环跟着变。
3. 悬停圆环打开详情卡，标题是当前会话的 `提供方 / 模型`。每个窗口一行，写剩余百分比和重置倒计时，例如 `5 小时    剩余 100% · 2 小时 15 分后重置`。
4. 其它提供方的额度在用量详情页里。

## 额度从哪来

| 提供方 | 图标 | 接口 |
|---|---|---|
| `openai-codex` | 5h / 7d | `chatgpt.com/backend-api/wham/usage` |
| `kimi-coding` | 5h / 7d，加量包在悬停卡 | `api.kimi.com/coding/v1/usages` |
| `zai` | 5h / 7d | `api.z.ai/api/monitor/usage/quota/limit` |
| `minimax-cn` | 5h / 7d | `api.minimaxi.com/v1/api/openplatform/coding_plan/remains` |
| `xai` | 7d | grok.com gRPC-web，移植自 CC Switch |
| `deepseek-official` | 余额对照上次充值 | `api.deepseek.com/user/balance` |
| `xiaomi` | 无数据 | 无公开套餐接口 |

DeepSeek 按量基准写在 `$DSH_HOME/profiles/<profile>/model-sync.baseline.json`。读数高于已存基准，按充值处理，基准重置为新读数。

## 配置

```yaml
- id: model-sync
  name: dsh-model-sync
  config:
    enabled: true
    usageEnabled: true
    profile: web
    pollMs: 60000
```

| 字段 | 默认 | 含义 |
|---|---|---|
| `enabled` | `true` | 启用模型发现和写入新模型 id |
| `usageEnabled` | `true` | 启用额度采集、用量详情数据和输入框圆环 |
| `profile` | `web` | 读写哪个 `$DSH_HOME/profiles/<name>` |
| `pollMs` | `60000` | 轮询间隔参数，最小 `5000`。页面当前每 60 秒刷新额度 |

### 从旧版 disabled 覆盖中恢复

旧版开关可能写入下面的配置。它会卸载 host 插件，导致设置页和 JSON API 一起消失：

```yaml
- id: model-sync
  disabled: true
```

请改成功能级配置，再重启 `dsh web`：

```yaml
- id: model-sync
  config:
    enabled: false
    usageEnabled: true
```

升级后，两个内置功能只会写入 `config.enabled` 和 `config.usageEnabled`；loader 级 `disabled` 只用于可选插件。

## 说明

- Host 代码在 `node_modules` 里。改完并 `pnpm build` 后重启 `dsh web`，只改前端刷新页面即可。
- 额度请求使用 DSH 里已存的凭据，插件不单独存密钥。
- 圆环位置绑定 DSH 0.1.0-rc.6 的 composer 类名。
- 变更记录见 [CHANGELOG.md](CHANGELOG.md)。

## 许可

MIT
