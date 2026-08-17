// Package-local JSON API. Third-party remotes are not generated into the
// client `remote.*` table, so the browser talks to these same-origin routes.

import type { IncomingMessage, ServerResponse } from 'node:http';
import { settingsNamespace, type Context } from './dsh-adapter.js';
import { applyModels, listAllProviders } from './discover.js';
import {
	HTTP_PREFIX,
	MANAGED_PLUGIN_IDS,
	emptyQuota,
	type ModelSyncConfig,
	type ProviderSnapshot,
	type SyncState,
} from './domain.js';
import { readPluginEnabled, setEntryEnabled, setEntryEnabledIfPresent } from './patch.js';
import { collectQuota, resetBaseline } from './quota.js';

interface WebServer {
	register(route: { kind: 'exact' | 'prefix'; path: string; handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void> }): () => void;
}

function send(res: ServerResponse, status: number, body: unknown): void {
	const payload = Buffer.from(JSON.stringify(body), 'utf8');
	res.writeHead(status, {
		'content-type': 'application/json; charset=utf-8',
		'cache-control': 'no-store',
		'content-length': payload.length,
	});
	res.end(payload);
}

async function readJson(req: IncomingMessage): Promise<unknown> {
	const chunks: Buffer[] = [];
	for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
	if (chunks.length === 0) return {};
	return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function deepseekApiKeyEnv(ctx: Context): string {
	const settings = ctx.get('settings');
	const section = settings?.get(settingsNamespace('llm-deepseek')) as { apiKeyEnv?: string } | undefined;
	return section?.apiKeyEnv ?? 'DEEPSEEK_API_KEY';
}

async function buildState(ctx: Context, config: ModelSyncConfig): Promise<SyncState> {
	const enabled = readPluginEnabled(config.profile);
	const plugins = MANAGED_PLUGIN_IDS
		.filter((row) => !row.optional || enabled[row.id] !== undefined)
		.map((row) => ({
			id: row.id,
			label: row.label,
			enabled: enabled[row.id] === true,
		}));
	const syncEnabled = enabled['model-sync'] === true;
	const usageEnabled = enabled['model-sync-usage'] === true;
	if (!syncEnabled && !usageEnabled) return { plugins, providers: [] };
	const listings = await listAllProviders(ctx, syncEnabled);
	const settings = ctx.get('settings');
	const section = settings?.get(settingsNamespace('llm-pi-ai')) as { providers?: Record<string, { apiKeyEnv?: string }> } | undefined;
	const providers: ProviderSnapshot[] = [];
	for (const listing of listings) {
		const apiKeyEnv = section?.providers?.[listing.id]?.apiKeyEnv;
		const quota = usageEnabled
			? await collectQuota(ctx, listing.id, apiKeyEnv, config.profile)
			: emptyQuota('');
		providers.push({
			id: listing.id,
			baseURL: listing.baseURL,
			configuredIds: listing.configuredIds,
			discovered: listing.discovered,
			quota,
			lastError: listing.error,
		});
	}
	// deepseek-official lives on the llm-deepseek route, not in llm-pi-ai
	// providers, yet it is the pay-as-you-go API model users pay per call.
	if (usageEnabled) {
		providers.push({
			id: 'deepseek-official',
			baseURL: 'https://api.deepseek.com',
			configuredIds: [],
			discovered: [],
			quota: await collectQuota(ctx, 'deepseek-official', deepseekApiKeyEnv(ctx), config.profile),
			lastError: undefined,
		});
	}
	return {
		plugins,
		providers,
	};
}

function featureEnabled(config: ModelSyncConfig, id: 'model-sync' | 'model-sync-usage'): boolean {
	return readPluginEnabled(config.profile)[id] === true;
}

export function registerHttp(ctx: Context, config: ModelSyncConfig): () => void {
	const web = ctx.get('webServer') as WebServer | undefined;
	if (!web) {
		ctx.logger('model-sync').warn('webServer unavailable; HTTP API not mounted');
		return () => {};
	}
	return web.register({
		kind: 'prefix',
		path: HTTP_PREFIX,
		handler: async (req, res) => {
			const url = new URL(req.url ?? '/', 'http://127.0.0.1');
			const path = url.pathname;
			try {
				if (req.method === 'GET' && path === `${HTTP_PREFIX}/state`) {
					send(res, 200, await buildState(ctx, config));
					return;
				}
				if (req.method === 'POST' && path === `${HTTP_PREFIX}/discover`) {
					send(res, 200, await buildState(ctx, config));
					return;
				}
				if (req.method === 'POST' && path === `${HTTP_PREFIX}/apply`) {
					if (!featureEnabled(config, 'model-sync')) {
						send(res, 409, { error: 'model-sync feature disabled' });
						return;
					}
					const body = (await readJson(req)) as { provider?: string; models?: Array<{ id: string; name: string }> };
					if (!body.provider || !Array.isArray(body.models)) {
						send(res, 400, { error: 'provider and models[] required' });
						return;
					}
					const result = await applyModels(ctx, body.provider, body.models);
					send(res, 200, { ...result, state: await buildState(ctx, config) });
					return;
				}
				if (req.method === 'POST' && path === `${HTTP_PREFIX}/toggle`) {
					const body = (await readJson(req)) as { id?: string; enabled?: boolean };
					if (!body.id || typeof body.enabled !== 'boolean') {
						send(res, 400, { error: 'id and enabled required' });
						return;
					}
					const plugin = MANAGED_PLUGIN_IDS.find((row) => row.id === body.id);
					if (!plugin) {
						send(res, 400, { error: `unknown plugin ${body.id}` });
						return;
					}
					if (plugin.optional) setEntryEnabledIfPresent(config.profile, body.id, body.enabled);
					else setEntryEnabled(config.profile, body.id, body.enabled);
					send(res, 200, { ok: true, state: await buildState(ctx, config) });
					return;
				}
				if (req.method === 'POST' && path === `${HTTP_PREFIX}/baseline-reset`) {
					if (!featureEnabled(config, 'model-sync-usage')) {
						send(res, 409, { error: 'model-sync usage feature disabled' });
						return;
					}
					const body = (await readJson(req)) as { provider?: string };
					if (!body.provider) {
						send(res, 400, { error: 'provider required' });
						return;
					}
					const result = await resetBaseline(ctx, body.provider, deepseekApiKeyEnv(ctx), config.profile);
					if (!result.ok) {
						send(res, 502, { error: result.error ?? 'baseline reset failed' });
						return;
					}
					send(res, 200, { ok: true, state: await buildState(ctx, config) });
					return;
				}
				send(res, 404, { error: 'not found' });
			} catch (error) {
				send(res, 500, { error: error instanceof Error ? error.message : String(error) });
			}
		},
	});
}
