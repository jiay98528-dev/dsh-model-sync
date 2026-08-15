// Quota collectors ported from CC Switch (farion1231/cc-switch)
// coding_plan.rs + subscription.rs — not /models response headers.

import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { credentialRef, type Context } from './dsh-adapter.js';
import { emptyQuota, type QuotaSnapshot, type QuotaWindow } from './domain.js';

function windowOf(key: QuotaWindow['key'], label: string, used: number, limit: number, resetAt?: number): QuotaWindow {
	return { key, label, used, limit, remaining: Math.max(0, limit - used), resetAt };
}

function fromUtilization(key: QuotaWindow['key'], label: string, usedPercent: number, resetAt?: number): QuotaWindow {
	const used = Math.max(0, Math.min(100, usedPercent));
	return windowOf(key, label, used, 100, resetAt);
}

function asNumber(value: unknown): number | undefined {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string' && value.trim() !== '') {
		const n = Number(value);
		if (Number.isFinite(n)) return n;
	}
	return undefined;
}

function isoToUnix(value: unknown): number | undefined {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return value > 1e12 ? Math.floor(value / 1000) : value;
	}
	if (typeof value === 'string' && value.length > 0) {
		const ms = Date.parse(value);
		if (Number.isFinite(ms)) return Math.floor(ms / 1000);
	}
	return undefined;
}

function snapshot(windows: QuotaWindow[], reason?: string): QuotaSnapshot {
	if (windows.length === 0) return emptyQuota(reason ?? 'quota endpoint returned no windows');
	return { kind: 'window', windows, balance: undefined, reason, updatedAt: Date.now() };
}

async function bearer(ctx: Context, apiKeyEnv: string): Promise<string | undefined> {
	try {
		return (await ctx.credentials.resolve(credentialRef(apiKeyEnv)))?.value;
	} catch {
		return undefined;
	}
}

function readCodexAccountId(): string | undefined {
	try {
		const raw = readFileSync(join(homedir(), '.codex', 'auth.json'), 'utf8');
		const parsed = JSON.parse(raw) as { tokens?: { account_id?: string } };
		const id = parsed.tokens?.account_id;
		return typeof id === 'string' && id.length > 0 ? id : undefined;
	} catch {
		return undefined;
	}
}

function windowSecondsToKey(secs: number): QuotaWindow['key'] {
	if (secs === 18_000) return '5h';
	if (secs === 604_800) return '7d';
	if (secs >= 86_400) return '7d';
	return '5h';
}

async function fetchCodex(ctx: Context, apiKeyEnv: string): Promise<QuotaSnapshot> {
	const token = await bearer(ctx, apiKeyEnv);
	if (!token) return emptyQuota('CODEX credential empty');
	const headers: Record<string, string> = {
		authorization: `Bearer ${token}`,
		accept: 'application/json',
		'user-agent': 'codex-cli',
	};
	const accountId = readCodexAccountId();
	if (accountId) headers['chatgpt-account-id'] = accountId;
	try {
		const response = await fetch('https://chatgpt.com/backend-api/wham/usage', {
			headers,
			signal: AbortSignal.timeout(15_000),
		});
		if (!response.ok) return emptyQuota(`codex wham/usage HTTP ${response.status}`);
		const body = (await response.json()) as {
			rate_limit?: {
				primary_window?: { used_percent?: number; limit_window_seconds?: number; reset_at?: number };
				secondary_window?: { used_percent?: number; limit_window_seconds?: number; reset_at?: number };
			};
		};
		const windows: QuotaWindow[] = [];
		for (const raw of [body.rate_limit?.primary_window, body.rate_limit?.secondary_window]) {
			if (!raw || typeof raw.used_percent !== 'number') continue;
			const key = windowSecondsToKey(raw.limit_window_seconds ?? 0);
			windows.push(fromUtilization(key, key === '5h' ? '5 小时' : '7 天', raw.used_percent, raw.reset_at));
		}
		return snapshot(windows, windows.length ? undefined : 'codex wham/usage had no rate_limit windows');
	} catch (error) {
		return emptyQuota(`codex wham/usage failed: ${String(error)}`);
	}
}

async function fetchKimi(ctx: Context, apiKeyEnv: string): Promise<QuotaSnapshot> {
	const token = await bearer(ctx, apiKeyEnv);
	if (!token) return emptyQuota('kimi credential empty');
	try {
		const response = await fetch('https://api.kimi.com/coding/v1/usages', {
			headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
			signal: AbortSignal.timeout(15_000),
		});
		if (!response.ok) return emptyQuota(`kimi /coding/v1/usages HTTP ${response.status}`);
		const body = (await response.json()) as Record<string, unknown>;
		const windows: QuotaWindow[] = [];
		const limits = Array.isArray(body.limits) ? body.limits : [];
		for (const item of limits) {
			if (typeof item !== 'object' || item === null) continue;
			const detail = (item as { detail?: Record<string, unknown> }).detail;
			if (!detail) continue;
			const limit = asNumber(detail.limit) ?? 1;
			const remaining = asNumber(detail.remaining) ?? 0;
			const usedPct = limit > 0 ? ((limit - remaining) / limit) * 100 : 0;
			windows.push(fromUtilization('5h', '5 小时', usedPct, isoToUnix(detail.resetTime)));
		}
		const usage = body.usage as Record<string, unknown> | undefined;
		if (usage) {
			const limit = asNumber(usage.limit) ?? 1;
			const remaining = asNumber(usage.remaining) ?? 0;
			const usedPct = limit > 0 ? ((limit - remaining) / limit) * 100 : 0;
			windows.push(fromUtilization('7d', '7 天', usedPct, isoToUnix(usage.resetTime)));
		}
		return snapshot(windows, windows.length ? undefined : 'kimi usages had no limits/usage');
	} catch (error) {
		return emptyQuota(`kimi usages failed: ${String(error)}`);
	}
}

async function fetchZhipu(ctx: Context, apiKeyEnv: string): Promise<QuotaSnapshot> {
	const token = await bearer(ctx, apiKeyEnv);
	if (!token) return emptyQuota('zhipu credential empty');
	try {
		const response = await fetch('https://api.z.ai/api/monitor/usage/quota/limit', {
			headers: { authorization: token, 'content-type': 'application/json', 'accept-language': 'en-US,en' },
			signal: AbortSignal.timeout(15_000),
		});
		if (!response.ok) return emptyQuota(`zhipu quota/limit HTTP ${response.status}`);
		const body = (await response.json()) as Record<string, unknown>;
		if (body.success === false) return emptyQuota(`zhipu API: ${String(body.msg ?? 'unknown')}`);
		const data = body.data as Record<string, unknown> | undefined;
		if (!data) return emptyQuota('zhipu quota missing data');
		const rows = Array.isArray(data.limits) ? data.limits : [];
		const windows: QuotaWindow[] = [];
		for (const raw of rows) {
			if (typeof raw !== 'object' || raw === null) continue;
			const item = raw as Record<string, unknown>;
			const typ = String(item.type ?? '');
			if (!/tokens_limit|credit_limit/i.test(typ)) continue;
			const pct = asNumber(item.percentage) ?? 0;
			const unit = asNumber(item.unit);
			const key: QuotaWindow['key'] = unit === 6 ? '7d' : '5h';
			windows.push(fromUtilization(key, key === '5h' ? '5 小时' : '7 天', pct, isoToUnix(item.nextResetTime)));
		}
		return snapshot(windows);
	} catch (error) {
		return emptyQuota(`zhipu quota failed: ${String(error)}`);
	}
}

async function fetchMinimax(ctx: Context, apiKeyEnv: string): Promise<QuotaSnapshot> {
	const token = await bearer(ctx, apiKeyEnv);
	if (!token) return emptyQuota('minimax credential empty');
	try {
		const response = await fetch('https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains', {
			headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
			signal: AbortSignal.timeout(15_000),
		});
		if (!response.ok) return emptyQuota(`minimax coding_plan/remains HTTP ${response.status}`);
		const body = (await response.json()) as Record<string, unknown>;
		const base = body.base_resp as Record<string, unknown> | undefined;
		if (base && asNumber(base.status_code) !== undefined && asNumber(base.status_code) !== 0) {
			return emptyQuota(`minimax API ${String(base.status_code)}: ${String(base.status_msg ?? '')}`);
		}
		const remains = Array.isArray(body.model_remains) ? body.model_remains : [];
		const item = remains.find((row) => typeof row === 'object' && row !== null && (row as { model_name?: string }).model_name === 'general') as Record<string, unknown> | undefined;
		if (!item) return emptyQuota('minimax remains had no general model');
		const windows: QuotaWindow[] = [];
		const remain5 = asNumber(item.current_interval_remaining_percent);
		if (remain5 !== undefined) windows.push(fromUtilization('5h', '5 小时', 100 - remain5, isoToUnix(item.end_time)));
		if (asNumber(item.current_weekly_status) === 1) {
			const remain7 = asNumber(item.current_weekly_remaining_percent);
			if (remain7 !== undefined) windows.push(fromUtilization('7d', '7 天', 100 - remain7, isoToUnix(item.weekly_end_time)));
		}
		return snapshot(windows);
	} catch (error) {
		return emptyQuota(`minimax remains failed: ${String(error)}`);
	}
}

export async function collectQuota(ctx: Context, provider: string, apiKeyEnv: string | undefined): Promise<QuotaSnapshot> {
	if (!apiKeyEnv) return emptyQuota('no apiKeyEnv on this route');
	if (provider === 'openai-codex') return fetchCodex(ctx, apiKeyEnv);
	if (provider === 'kimi-coding') return fetchKimi(ctx, apiKeyEnv);
	if (provider === 'zai') return fetchZhipu(ctx, apiKeyEnv);
	if (provider === 'minimax-cn') return fetchMinimax(ctx, apiKeyEnv);
	if (provider === 'xai') {
		return emptyQuota('xAI 5h/7d 走 grok.com gRPC 账单，尚未接入');
	}
	return emptyQuota('no public quota API for this provider yet');
}
