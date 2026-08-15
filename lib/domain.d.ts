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
    enabled: boolean;
    profile: string;
    pollMs: number;
}
export declare const DEFAULT_CONFIG: ModelSyncConfig;
export declare const Config: z<Schemastery.ObjectS<{
    enabled: z<boolean, boolean>;
    profile: z<string, string>;
    pollMs: z<number, number>;
}>, Schemastery.ObjectT<{
    enabled: z<boolean, boolean>;
    profile: z<string, string>;
    pollMs: z<number, number>;
}>>;
export declare const HTTP_PREFIX = "/agentteam/model-sync";
export declare const MANAGED_PLUGIN_IDS: readonly [{
    readonly id: "sub-model-access";
    readonly label: "订阅制模型接入";
    readonly packageName: "@agentteam/sub-model-access";
    readonly optional: true;
    readonly toggle: "loader";
}, {
    readonly id: "model-sync";
    readonly label: "模型同步";
    readonly packageName: "dsh-model-sync";
    readonly optional: false;
    readonly toggle: "feature";
}];
/** Catalog defaults used when settings omit baseURL. */
export declare const CATALOG_BASE: Record<string, {
    baseURL: string;
    listing: boolean;
    catalogIds: string[];
}>;
export declare function emptyQuota(reason: string): QuotaSnapshot;
