import { type Context } from './dsh-adapter.js';
import { type DiscoveredModel } from './domain.js';
interface ProviderSection {
    apiKeyEnv?: string;
    baseURL?: string;
    models?: Array<{
        id?: string;
        name?: string;
    }>;
}
export interface LiveListing {
    id: string;
    baseURL: string;
    configuredIds: string[];
    discovered: DiscoveredModel[];
    error: string | undefined;
}
export declare function listProvider(ctx: Context, id: string, section: ProviderSection): Promise<LiveListing>;
export declare function listAllProviders(ctx: Context, discover?: boolean): Promise<LiveListing[]>;
export declare function applyModels(ctx: Context, provider: string, models: Array<{
    id: string;
    name: string;
}>): Promise<{
    added: string[];
}>;
export {};
