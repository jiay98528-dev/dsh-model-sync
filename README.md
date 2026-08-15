# @agentteam/model-sync

[![Awesome DSH Plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

English | [中文](#中文)

Sync live provider model lists into DeepSeek Harness `llm-pi-ai` settings, and show 5-hour / 7-day quota rings beside the composer.

Settings → **模型同步** lists every configured provider (enable/disable this plugin, discover new model ids, apply them, inspect quotas). The composer rings follow only the **current session** model.

## Install

```sh
dsh plugin --profile web add github:jiay98528-dev/dsh-model-sync
```

Restart `dsh web`, then refresh the page. The package declares `dsh.bundle` and ships prebuilt `lib/`, so git install does not need `allowBuilds`.

## What you get

- Discover models from each configured provider. Catalog-only protocols (MiniMax, Kimi Coding, OpenAI Codex) fall back to the known catalog ids instead of a red `/models` error.
- Apply newly seen ids into `llm-pi-ai.providers.*.models`.
- Quota collectors (ported from [CC Switch](https://github.com/farion1231/cc-switch) plan APIs):

  | Provider | Source |
  |---|---|
  | `openai-codex` | `chatgpt.com/backend-api/wham/usage` |
  | `kimi-coding` | `api.kimi.com/coding/v1/usages` |
  | `zai` | `api.z.ai/api/monitor/usage/quota/limit` |
  | `minimax-cn` | `api.minimaxi.com/v1/api/openplatform/coding_plan/remains` |
  | `xai` | no public 5h/7d window yet |

- Composer: inner ring = 5h, outer ring = 7d; hover shows `provider / model`. API-billed balances use last recharge as 100% vs current remaining.

## Config

Override in the profile `cordis.patch.yml` by id `model-sync`:

| Field | Default | Meaning |
|---|---|---|
| `profile` | `web` | Which `$DSH_HOME/profiles/<name>` to read/write |
| `pollMs` | `60000` | Quota refresh interval (minimum 5000) |

## Notes

- The Web client sets `dsh.client.immediately: true` so the settings section and composer rings mount without another package injecting them.
- Host code lives under `node_modules`; after you change and rebuild this package, restart `dsh web`. A page refresh is enough for client-only edits.
- Quota calls use credentials already stored in DSH (and Codex `account_id` from `~/.codex/auth.json`). Tokens are not logged.

## License

MIT

---

## 中文

把各提供方线上模型列表同步进 DeepSeek Harness 的 `llm-pi-ai` 设置，并在输入框旁显示 5 小时 / 7 天额度圆环。

设置 → **模型同步** 展示全部已配置提供方（启停本插件、发现并写入新模型、查看额度）。对话里的圆环只跟**当前会话**正在用的模型。

## 安装

```sh
dsh plugin --profile web add github:jiay98528-dev/dsh-model-sync
```

重启 `dsh web`，再刷新页面。包已声明 `dsh.bundle` 并带预构建 `lib/`，从 GitHub 安装不需要 `allowBuilds`。

## 能做什么

- 按已配置提供方发现模型。没有 OpenAI `/models` 的协议（MiniMax、Kimi Coding、OpenAI Codex）回落到 catalog id，不会标成红色错误。
- 把新看到的 id 写进 `llm-pi-ai.providers.*.models`。
- 额度采集对齐 [CC Switch](https://github.com/farion1231/cc-switch) 的套餐接口（见上表）。xAI 尚无公开 5h/7d 窗口。
- 输入框：内环 5h、外环 7d；悬停显示 `提供方 / 模型`。按量计费用「上次充值 = 100%」对照当前余额。

## 配置

在 profile 的 `cordis.patch.yml` 里按 id `model-sync` 覆盖：`profile`（默认 `web`）、`pollMs`（默认 `60000`，最小 `5000`）。

## 许可

MIT
