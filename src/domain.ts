// Types, schema, and stable codes for model-sync.

import { z } from './dsh-adapter.js';

export type QuotaKind = 'window' | 'balance' | 'unavailable';

export interface QuotaWindow {
	key: '5h' | '7d' | 'rate';
	label: string;
	used: number;
	limit: number;
	remaining: number;
	resetAt: number | undefined;
}

export interface QuotaBalance {
	current: number;
	lastRecharge: number;
	unit: string;
}

export interface QuotaSnapshot {
	kind: QuotaKind;
	windows: QuotaWindow[];
	balance: QuotaBalance | undefined;
	reason: string | undefined;
	updatedAt: number;
}

export interface DiscoveredModel {
	id: string;
	name: string;
	isNew: boolean;
}

export interface ProviderSnapshot {
	id: string;
	baseURL: string;
	configuredIds: string[];
	discovered: DiscoveredModel[];
	quota: QuotaSnapshot;
	lastError: string | undefined;
}

export interface PluginToggle {
	id: string;
	label: string;
	enabled: boolean;
}

export interface SyncState {
	plugins: PluginToggle[];
	providers: ProviderSnapshot[];
}

export interface ModelSyncConfig {
	profile: string;
	pollMs: number;
}

export const DEFAULT_CONFIG: ModelSyncConfig = {
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
	{ id: 'model-sync', label: '模型同步', packageName: '@agentteam/model-sync' },
] as const;

/** Catalog defaults used when settings omit baseURL. */
export const CATALOG_BASE: Record<string, { baseURL: string; listing: boolean; catalogIds: string[] }> = {
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

export function emptyQuota(reason: string): QuotaSnapshot {
	return {
		kind: 'unavailable',
		windows: [],
		balance: undefined,
		reason,
		updatedAt: Date.now(),
	};
}
