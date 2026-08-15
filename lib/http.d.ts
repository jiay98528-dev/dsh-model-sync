import { type Context } from './dsh-adapter.js';
import { type ModelSyncConfig } from './domain.js';
export declare function registerHttp(ctx: Context, config: ModelSyncConfig): () => void;
