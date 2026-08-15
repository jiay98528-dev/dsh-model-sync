<p align="center">
  <img src="assets/logo.svg" width="88" alt="dsh-model-sync logo">
</p>

<h1 align="center">dsh-model-sync</h1>

<p align="center">
  English · <a href="README.zh.md">中文</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/dsh-model-sync"><img alt="npm" src="https://img.shields.io/npm/v/dsh-model-sync?color=4D6BFE"></a>
  <a href="https://github.com/topics/dsh-plugin"><img alt="dsh-plugin" src="https://img.shields.io/badge/topic-dsh--plugin-4D6BFE"></a>
  <a href="https://awesome-dsh-plugin.com"><img alt="Awesome DSH Plugin" src="https://awesome-dsh-plugin.com/badge.svg"></a>
  <a href="LICENSE"><img alt="MIT" src="https://img.shields.io/badge/license-MIT-111827"></a>
</p>

<p align="center">
  Sync live provider model lists into DeepSeek Harness settings, and show <b>5-hour / 7-day</b> quota rings beside the composer for the <b>current session model</b> only.
</p>

<p align="center">
  <img src="assets/banner.svg" alt="dsh-model-sync banner" width="100%">
</p>

Settings → **模型同步** lists every configured provider: enable/disable this plugin, discover new model ids, apply them, inspect quotas. The composer rings follow only the model this conversation is using. Full provider detail stays on the settings page.

## Screenshots

**Settings — discover and apply new models**

![Settings page](assets/demo-settings.png)

**Composer — hover the rings for the current `provider / model`**

![Composer quota rings](assets/demo-composer.png)

Inner ring = 5 hours. Outer ring = 7 days. Hover title is `provider / model`. Pay-as-you-go balances use last recharge as 100% vs current remaining.

## Install

npm (preferred — prebuilt, no `allowBuilds`):

```sh
dsh plugin --profile web add dsh-model-sync
```

GitHub (also ships `lib/`, no `allowBuilds`):

```sh
dsh plugin --profile web add github:jiay98528-dev/dsh-model-sync
```

Then restart `dsh web` and refresh the page. Open **Settings → 模型同步**.

The package declares `dsh.bundle` (`cordis.patch.yml`) and `dsh.client.immediately: true`, so the settings section and composer rings mount without another plugin injecting them.

## Usage

### 1. Settings page

1. Start `dsh web` and open **Settings**.
2. Open the **模型同步** section in the left nav.
3. Click **刷新** if the list is empty.
4. Each provider card shows:
   - `id` and `baseURL`
   - discovered model chips (blue outline = new, not yet in settings)
   - **应用 N 个新模型** to write those ids into `llm-pi-ai.providers.<id>.models`
   - quota / balance text, or a short reason when the provider has no public window API
5. The top card toggles **模型同步** and optional **订阅制模型接入** (`sub-model-access`) by writing `disabled` on the matching profile row. That change is hot.

Catalog-only protocols (MiniMax, Kimi Coding, OpenAI Codex) do not speak OpenAI `GET /models`. The plugin falls back to known catalog ids instead of painting a red “this protocol has no /models listing” error.

### 2. Composer rings

1. Open any conversation and pick a model as usual.
2. A dual ring appears to the left of the model name in the composer.
3. Hover (or focus) it. The card title is `provider / model` for **this session only**.
4. Switching the session model updates the ring. Other providers stay on the settings page.

If the hover card says the current model is not recognized, the session provider is not in the discovered list yet — open Settings and refresh.

### 3. Quota sources

| Provider | What you see | Endpoint |
|---|---|---|
| `openai-codex` | 5h / 7d utilization | `chatgpt.com/backend-api/wham/usage` |
| `kimi-coding` | 5h / 7d utilization | `api.kimi.com/coding/v1/usages` |
| `zai` | 5h / 7d utilization | `api.z.ai/api/monitor/usage/quota/limit` |
| `minimax-cn` | 5h / 7d remaining | `api.minimaxi.com/v1/api/openplatform/coding_plan/remains` |
| `deepseek-official` | balance vs last recharge | `api.deepseek.com/user/balance` |
| `xai` | reason only | grok.com gRPC billing is not ported yet |
| others | reason only | no public plan window |

Plan percentages come from the same family of APIs as [CC Switch](https://github.com/farion1231/cc-switch). Remaining % = `100 − used`. Zhipu (`zai`) must send the raw key in `Authorization` (no `Bearer `). Codex also reads `tokens.account_id` from `~/.codex/auth.json` when present.

## Config

Override the bundle row in your profile `cordis.patch.yml` by id `model-sync`:

```yaml
- id: model-sync
  name: dsh-model-sync
  config:
    profile: web
    pollMs: 60000
```

| Field | Default | Meaning |
|---|---|---|
| `profile` | `web` | Which `$DSH_HOME/profiles/<name>` to read and write |
| `pollMs` | `60000` | Quota refresh interval (minimum `5000`) |

## Notes

- Host code lives under `node_modules`. After you change and rebuild this package, restart `dsh web`. A page refresh is enough for client-only edits.
- Quota calls use credentials already stored in DSH. Tokens are not logged and are only sent to that provider’s own quota API.
- Installing a plugin runs third-party code with your permissions. Read the source before you install it on a machine that holds keys.

## License

MIT
