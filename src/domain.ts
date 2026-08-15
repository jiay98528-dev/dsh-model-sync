// Types, schema, and stable codes for model-sync.

import { z } from './dsh-adapter.js';

export type QuotaKind = 'window' | 'balance' | 'unavailable';

export interface QuotaWindow {
	key: '5h' | '7d' | 'rate';
	label: string;
	/** Used percent, 0-100. */
	used: number;
	/** Percent base (100 for utilization windows). */
	limit: number;
	/** Remaining percent, 0-100. */
	remaining: number;
	resetAt: number | undefined;
	/** Raw cumulative usage when the provider reports counts (requests etc.). */
	usedRaw?: number;
	/** Raw window limit accompanying usedRaw. */
	limitRaw?: number;
	/** Unit label for raw counts, e.g. '次'. */
	rawUnit?: string;
}

/** Pay-as-you-go API credit. Remaining percent = current / lastRecharge. */
export interface QuotaBalance {
	/** Current balance. */
	current: number;
	/** Balance right after the last top-up (baseline B0); reset whenever a reading exceeds it. */
	lastRecharge: number;
	/** Unit: currency code (CNY / USD) or a non-currency unit (e.g. points). */
	unit: string;
	/** Row label in the quota popup; defaults to "API 余额". */
	label?: string;
	/** Unix ms when the baseline was last set (first sight or last top-up / manual reset). */
	baselineAt?: number;
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
	{ id: 'sub-model-access', label: '订阅制模型接入', packageName: '@agentteam/sub-model-access', optional: true },
	{ id: 'model-sync', label: '模型同步', packageName: 'dsh-model-sync', optional: false },
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
