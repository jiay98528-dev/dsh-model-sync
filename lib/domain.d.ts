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
/** Pay-as-you-go API credit. Remaining percent = current / lastRecharge. */
export interface QuotaBalance {
    /** Current balance. */
    current: number;
    /** Balance right after the last top-up (baseline B0); reset whenever a reading exceeds it. */
    lastRecharge: number;
    /** Currency code, e.g. CNY / USD. */
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
export declare const DEFAULT_CONFIG: ModelSyncConfig;
export declare const Config: z<Schemastery.ObjectS<{
    profile: z<string, string>;
    pollMs: z<number, number>;
}>, Schemastery.ObjectT<{
    profile: z<string, string>;
    pollMs: z<number, number>;
}>>;
export declare const HTTP_PREFIX = "/agentteam/model-sync";
export declare const MANAGED_PLUGIN_IDS: readonly [{
    readonly id: "sub-model-access";
    readonly label: "订阅制模型接入";
    readonly packageName: "@agentteam/sub-model-access";
}, {
    readonly id: "model-sync";
    readonly label: "模型同步";
    readonly packageName: "dsh-model-sync";
}];
/** Catalog defaults used when settings omit baseURL. */
export declare const CATALOG_BASE: Record<string, {
    baseURL: string;
    listing: boolean;
    catalogIds: string[];
}>;
export declare function emptyQuota(reason: string): QuotaSnapshot;
