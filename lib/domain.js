// Types, schema, and stable codes for model-sync.
import { z } from './dsh-adapter.js';
export const DEFAULT_CONFIG = {
    profile: 'web',
    pollMs: 60_000,
};
export const Config = z.object({
    profile: z.string().default('web'),
    pollMs: z.number().min(5_000).default(60_000),
});
export const HTTP_PREFIX = '/agentteam/model-sync';
export const MANAGED_PLUGIN_IDS = [
    { id: 'sub-model-access', label: '订阅制模型接入', packageName: '@agentteam/sub-model-access' },
    { id: 'model-sync', label: '模型同步', packageName: 'dsh-model-sync' },
];
/** Catalog defaults used when settings omit baseURL. */
export const CATALOG_BASE = {
    zai: { baseURL: 'https://api.z.ai/api/coding/paas/v4', listing: true, catalogIds: [] },
    xai: { baseURL: 'https://api.x.ai/v1', listing: true, catalogIds: [] },
    'kimi-coding': {
        baseURL: 'https://api.kimi.com/coding',
        listing: false,
        catalogIds: ['k3', 'k3-256k', 'kimi-for-coding', 'kimi-for-coding-highspeed'],
    },
    xiaomi: { baseURL: 'https://api.xiaomimimo.com/v1', listing: true, catalogIds: [] },
    'openai-codex': {
        baseURL: 'https://chatgpt.com/backend-api',
        listing: false,
        catalogIds: ['gpt-5.3-codex-spark', 'gpt-5.4', 'gpt-5.4-mini', 'gpt-5.5', 'gpt-5.6-luna', 'gpt-5.6-sol', 'gpt-5.6-terra'],
    },
    'minimax-cn': {
        baseURL: 'https://api.minimaxi.com/anthropic',
        listing: false,
        catalogIds: ['MiniMax-M2.7', 'MiniMax-M2.7-highspeed', 'MiniMax-M3'],
    },
};
export function emptyQuota(reason) {
    return {
        kind: 'unavailable',
        windows: [],
        balance: undefined,
        reason,
        updatedAt: Date.now(),
    };
}
