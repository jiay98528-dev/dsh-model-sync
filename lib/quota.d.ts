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
export declare function collectQuota(ctx: Context, provider: string, apiKeyEnv: string | undefined, profile: string): Promise<QuotaSnapshot>;
