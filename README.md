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
  Writes each provider's live model list into DeepSeek Harness settings. The composer ring tracks the model this session is using. Plan routes show 5h and 7d windows. Metered routes show remaining balance against the last top-up.
</p>

<p align="center">
  <img src="assets/banner.svg" alt="dsh-model-sync banner" width="100%">
</p>

Two settings pages. **Model Sync** (refresh icon) finds new model ids and writes them. **Usage** (list icon) lists windows, cumulative counts, and API balance. Resets are countdowns such as `2d 3h left`. 5h and 7d each get their own row. The ring sits right of the model name and left of the context meter.

## Screenshots

| | 中文 | English |
|---|---|---|
| Model Sync | ![Settings ZH](assets/demo-settings-zh.png) | ![Settings EN](assets/demo-settings-en.png) |
| Usage | ![Usage ZH](assets/demo-usage-zh.png) | ![Usage EN](assets/demo-usage-en.png) |
| Composer | ![Composer ZH](assets/demo-composer-zh.png) | ![Composer EN](assets/demo-composer-en.png) |

One quota draws one ring. Both 5h and 7d draw two rings, inner 5h, outer 7d. Color follows remaining fraction, dark red at 0%, green at 75%, sky or navy at 100%. When a provider has plan windows and a top-up pack, the icon draws the windows. The pack stays in the hover card.

## Install

```sh
dsh plugin --profile web add dsh-model-sync
```

The GitHub source also ships prebuilt `lib/`. No `allowBuilds`.

```sh
dsh plugin --profile web add github:jiay98528-dev/dsh-model-sync
```

Restart `dsh web`, refresh the page, open **Settings → Model Sync**.

The package declares `dsh.bundle` and `dsh.client.immediately: true`.

## Usage

### Model Sync

1. **Settings → Model Sync**.
2. **Refresh** if the list is empty.
3. Each card shows provider id, `baseURL`, and model chips. Blue outline means the id is not in settings yet. **Apply N new models** writes them to `llm-pi-ai.providers.<id>.models`.
4. **Enable plugins** (collapsed) toggles this plugin and optional `sub-model-access`. Takes effect live.

MiniMax, Kimi Coding, and OpenAI Codex have no OpenAI `/models`. The plugin uses the catalog ids.

### Usage

1. **Settings → Usage**.
2. Each provider shows 5h and 7d remaining percent, vendor cumulative counts, a reset countdown, and a colored bar. The two windows never share a line.
3. Metered rows show `current / baseline`. The first sample becomes the baseline. To match spend that already happened, use **Use current balance as baseline**.

### Composer rings

1. Pick a model as usual.
2. The ring is right of the model name and left of the context meter.
3. Hover title is `provider / model` for this session. Each window is its own row, for example `5 hours    left 100% · 2h 15m left`.
4. Change the session model and the ring follows. Other providers stay on Usage.

## Quota sources

| Provider | Icon | Source |
|---|---|---|
| `openai-codex` | 5h / 7d | `chatgpt.com/backend-api/wham/usage` |
| `kimi-coding` | 5h / 7d, top-up pack in the hover card | `api.kimi.com/coding/v1/usages` |
| `zai` | 5h / 7d | `api.z.ai/api/monitor/usage/quota/limit` |
| `minimax-cn` | 5h / 7d | `api.minimaxi.com/v1/api/openplatform/coding_plan/remains` |
| `xai` | 7d | grok.com gRPC-web, ported from CC Switch |
| `deepseek-official` | balance vs last top-up | `api.deepseek.com/user/balance` |
| `xiaomi` | no window data | no public plan API |

DeepSeek metered baseline is `$DSH_HOME/profiles/<profile>/model-sync.baseline.json`. A reading above the stored baseline is a top-up.

## Config

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
| `pollMs` | `60000` | Quota refresh interval, minimum `5000` |

## Notes

- Host code lives under `node_modules`. After you change and rebuild this package, restart `dsh web`. Client-only edits need a page refresh.
- Quota calls use credentials already stored in DSH.
- Ring placement is bound to DSH 0.1.0-rc.6 composer class names.
- Changelog is [CHANGELOG.md](CHANGELOG.md).

## License

MIT
