import { type Context } from './dsh-adapter.js';
import { type QuotaSnapshot } from './domain.js';
export interface BalanceRecord {
    /** Balance right after the last top-up (baseline B0); percent = current / lastRecharge. */
    lastRecharge: number;
    unit: string;
    /** Unix ms when the baseline was set. */
    at: number;
}
/**
 * Collect a pay-as-you-go balance and maintain the "last recharge" baseline:
 * a reading higher than the stored baseline means a top-up happened (or the
 * first sight), so the baseline resets to that reading — remaining percent
 * then equals current / lastRecharge and starts back at 100%.
 */
export declare function collectBalance(ctx: Context, provider: string, apiKeyEnv: string, profile: string): Promise<QuotaSnapshot>;
/**
 * Re-anchor the baseline to the current balance (manual correction). Useful
 * when the plugin was first enabled long after a top-up, so the remaining
 * percent denominator matches the user's mental model again.
 */
export declare function resetBaseline(ctx: Context, provider: string, apiKeyEnv: string, profile: string): Promise<{
    ok: boolean;
    error?: string;
}>;
export declare function collectQuota(ctx: Context, provider: string, apiKeyEnv: string | undefined, profile: string): Promise<QuotaSnapshot>;
