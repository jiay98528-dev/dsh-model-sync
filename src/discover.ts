// Live /models listing against each configured llm-pi-ai provider.

import { credentialRef, settingsNamespace, type Context } from './dsh-adapter.js';
import { CATALOG_BASE, type DiscoveredModel } from './domain.js';

interface ProviderSection {
	apiKeyEnv?: string;
	baseURL?: string;
	models?: Array<{ id?: string; name?: string }>;
}

export interface LiveListing {
	id: string;
	baseURL: string;
	configuredIds: string[];
	discovered: DiscoveredModel[];
	error: string | undefined;
}

function listingUrl(baseURL: string): string {
	return `${baseURL.replace(/\/+$/, '')}/models`;
}

function fromCatalog(catalogIds: string[] | undefined, configuredIds: string[]): DiscoveredModel[] {
	const have = new Set(configuredIds);
	const ids = catalogIds ?? [];
	const out: DiscoveredModel[] = [];
	const seen = new Set<string>();
	for (const id of [...configuredIds, ...ids]) {
		if (!id || seen.has(id)) continue;
		seen.add(id);
		out.push({ id, name: id, isNew: !have.has(id) });
	}
	return out;
}

function readIds(body: unknown): Array<{ id: string; name: string }> {
	if (typeof body !== 'object' || body === null) return [];
	const rec = body as Record<string, unknown>;
	const raw = Array.isArray(rec.data) ? rec.data : Array.isArray(body) ? body : [];
	const out: Array<{ id: string; name: string }> = [];
	for (const item of raw) {
		if (typeof item === 'string' && item.length > 0) {
			out.push({ id: item, name: item });
			continue;
		}
		if (typeof item !== 'object' || item === null) continue;
		const row = item as Record<string, unknown>;
		const id = typeof row.id === 'string' ? row.id : typeof row.name === 'string' ? row.name : '';
		if (!id) continue;
		out.push({ id, name: typeof row.name === 'string' ? row.name : id });
	}
	return out;
}

export async function listProvider(ctx: Context, id: string, section: ProviderSection): Promise<LiveListing> {
	const catalog = CATALOG_BASE[id];
	const baseURL = section.baseURL || catalog?.baseURL || '';
	const configuredIds = (section.models ?? []).map((m) => m.id).filter((x): x is string => typeof x === 'string' && x.length > 0);
	if (!baseURL) {
		return { id, baseURL: '', configuredIds, discovered: fromCatalog(catalog?.catalogIds, configuredIds), error: 'no baseURL (not in catalog and not set in settings)' };
	}
	if (catalog && !catalog.listing) {
		// Anthropic-Messages / Codex backends have no OpenAI-style GET /models.
		// Surface the lock-file catalog instead of a red error.
		return { id, baseURL, configuredIds, discovered: fromCatalog(catalog.catalogIds, configuredIds), error: undefined };
	}
	const headers: Record<string, string> = { accept: 'application/json' };
	const refName = section.apiKeyEnv;
	if (refName) {
		try {
			const resolved = await ctx.credentials.resolve(credentialRef(refName));
			if (resolved?.value) headers.authorization = `Bearer ${resolved.value}`;
		} catch (error) {
			return { id, baseURL, configuredIds, discovered: [], error: `credential ${refName}: ${String(error)}` };
		}
	}
	let response: Response;
	try {
		response = await fetch(listingUrl(baseURL), { method: 'GET', headers, signal: AbortSignal.timeout(15_000) });
	} catch (error) {
		return { id, baseURL, configuredIds, discovered: [], error: `fetch failed: ${String(error)}` };
	}
	if (!response.ok) {
		const fallback = fromCatalog(catalog?.catalogIds, configuredIds);
		return {
			id,
			baseURL,
			configuredIds,
			discovered: fallback,
			error: fallback.length > 0 ? undefined : `${listingUrl(baseURL)} answered ${response.status}`,
		};
	}
	let body: unknown;
	try {
		body = await response.json();
	} catch {
		return { id, baseURL, configuredIds, discovered: [], error: 'response is not JSON' };
	}
	const live = readIds(body);
	const have = new Set(configuredIds);
	const discovered = live.map((m) => ({ id: m.id, name: m.name, isNew: !have.has(m.id) }));
	return { id, baseURL, configuredIds, discovered, error: undefined };
}

export async function listAllProviders(ctx: Context): Promise<LiveListing[]> {
	const settings = ctx.get('settings');
	if (!settings) return [];
	const section = settings.get(settingsNamespace('llm-pi-ai')) as { providers?: Record<string, ProviderSection> } | undefined;
	const providers = section?.providers ?? {};
	const ids = Object.keys(providers);
	return Promise.all(ids.map((id) => listProvider(ctx, id, providers[id] ?? {})));
}

export async function applyModels(ctx: Context, provider: string, models: Array<{ id: string; name: string }>): Promise<{ added: string[] }> {
	const settings = ctx.get('settings');
	if (!settings) throw new Error('settings seam unavailable');
	const section = settings.get(settingsNamespace('llm-pi-ai')) as { providers?: Record<string, ProviderSection> } | undefined;
	const current = section?.providers?.[provider]?.models ?? [];
	const have = new Set(current.map((m) => m.id).filter(Boolean) as string[]);
	const added: string[] = [];
	const next = [...current];
	for (const model of models) {
		if (!model.id || have.has(model.id)) continue;
		next.push({ id: model.id, name: model.name || model.id });
		have.add(model.id);
		added.push(model.id);
	}
	if (added.length === 0) return { added };
	await settings.mutate(settingsNamespace('llm-pi-ai'), [
		{ op: 'set', path: ['providers', provider, 'models'], value: next },
	]);
	return { added };
}
