import { type Context } from './dsh-adapter.js';
import { type QuotaSnapshot } from './domain.js';
export declare function collectQuota(ctx: Context, provider: string, apiKeyEnv: string | undefined): Promise<QuotaSnapshot>;
