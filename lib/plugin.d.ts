import type { Context } from './dsh-adapter.js';
import { Config } from './domain.js';
export declare const name = "model-sync";
export declare const inject: string[];
export { Config };
export declare function apply(ctx: Context, raw: unknown): void;
