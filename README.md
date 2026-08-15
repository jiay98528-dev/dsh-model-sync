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
  Writes each provider's live model list into DeepSeek Harness settings. The composer ring follows the model this session is using. Plan routes read 5h and 7d windows, metered routes read the balance left since the last top-up. With windows and a top-up pack together, the icon draws the windows and keeps the pack in the hover card.
</p>

<p align="center">
  <img src="assets/banner.svg" alt="dsh-model-sync banner" width="100%">
</p>

It takes two settings pages, one for fetching model ids per provider and one for per-model usage. **Model Sync** (sync-arrow icon) writes new model ids from each provider into settings. **Usage** lists plan windows, cumulative counts, and API balance. Resets show as countdowns such as `2d 3h left`. The 5h and 7d windows each get their own row. UI text follows the DSH language setting, English or Chinese.

## Screenshots

| | 中文 | English |
|---|---|---|
| Model Sync | ![Settings ZH](assets/demo-settings-zh.png) | ![Settings EN](assets/demo-settings-en.png) |
| Usage | ![Usage ZH](assets/demo-usage-zh.png) | ![Usage EN](assets/demo-usage-en.png) |
| Composer | ![Composer ZH](assets/demo-composer-zh.png) | ![Composer EN](assets/demo-composer-en.png) |

A model with both limits draws two rings, inner 5h, outer 7d. Progress bar colors follow the remaining quota.

## Install

On npm.

```sh
dsh plugin --profile web add dsh-model-sync
```

The GitHub source also ships prebuilt `lib/`, no `allowBuilds`.

```sh
dsh plugin --profile web add github:jiay98528-dev/dsh-model-sync
```

Restart `dsh web`, refresh the page, open **Settings → Model Sync**. The plugin is listed in the [awesome-dsh-plugin](https://awesome-dsh-plugin.com) market list.

The package ships a cordis.patch.yml bundle patch (`dsh.bundle`) and declares `dsh.client.immediately: true`, so it takes effect on install with no manual config.

## Usage

### Model Sync

1. **Settings → Model Sync**.
2. **Refresh** if the list is empty.
3. Each card lists the provider id, `baseURL`, and model chips. A blue outline marks ids not in settings yet. **Apply N new models** writes them to `llm-pi-ai.providers.<id>.models`.
4. The collapsed **Enable plugins** block keeps this settings UI mounted when Model Sync's main functionality is off. The optional `sub-model-access` toggle writes the loader disabled flag in cordis.patch.yml. Both take effect live.

MiniMax, Kimi Coding, and OpenAI Codex have no OpenAI `/models` endpoint. The plugin uses the known catalog ids.

### Usage

1. **Settings → Usage**.
2. Each provider lists its 5-hour and 7-day windows, one row each, with remaining percent, vendor cumulative counts, a reset countdown, and a colored bar.
3. Metered rows show `current / baseline`. The first sample becomes the baseline. To count spend from before the plugin was enabled, click **Use current balance as baseline**. The balance row also records when the baseline was set.
4. The page auto-refreshes every 60 seconds. **Refresh** pulls immediately.

### Composer rings

1. Pick a model as usual.
2. The ring is right of the model name and left of the context meter. It follows the session model and switches with it.
3. Hover the ring for a detail card titled `provider / model` for this session. Each window gets a row with remaining percent and reset countdown, for example `5 hours    left 100% · 2h 15m left`.
4. Other providers stay on the Usage page.

## Quota sources

| Provider | Icon | Source |
|---|---|---|
| `openai-codex` | 5h / 7d | `chatgpt.com/backend-api/wham/usage` |
| `kimi-coding` | 5h / 7d, top-up pack in the hover card | `api.kimi.com/coding/v1/usages` |
| `zai` | 5h / 7d | `api.z.ai/api/monitor/usage/quota/limit` |
| `minimax-cn` | 5h / 7d | `api.minimaxi.com/v1/api/openplatform/coding_plan/remains` |
| `xai` | 7d | grok.com gRPC-web, ported from CC Switch |
| `deepseek-official` | balance vs last top-up | `api.deepseek.com/user/balance` |
| `xiaomi` | no data | no public plan API |

The DeepSeek metered baseline lives in `$DSH_HOME/profiles/<profile>/model-sync.baseline.json`. A reading above the stored baseline counts as a top-up and resets the baseline.

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
| `pollMs` | `60000` | Poll interval parameter, minimum `5000`. Pages currently refresh quota every 60 seconds |

## Notes

- Host code lives under `node_modules`. After changing and rebuilding this package, restart `dsh web`. Client-only edits need a page refresh.
- Quota calls use credentials already stored in DSH. The plugin keeps no keys of its own.
- Ring placement is bound to DSH 0.1.0-rc.6 composer class names.
- Changelog is [CHANGELOG.md](CHANGELOG.md).

## License

MIT
