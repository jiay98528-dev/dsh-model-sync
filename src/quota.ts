// Quota collectors ported from CC Switch (farion1231/cc-switch)
// coding_plan.rs + subscription.rs — not /models response headers.
// Pay-as-you-go API credits (balance) are collected separately and keep a
// local "last recharge" baseline so the remaining percent can be shown as
// current / last-recharge.

import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { credentialRef, type Context, type Logger } from './dsh-adapter.js';
import { emptyQuota, type QuotaBalance, type QuotaSnapshot, type QuotaWindow } from './domain.js';

function windowOf(
	key: QuotaWindow['key'],
	label: string,
	used: number,
	limit: number,
	resetAt?: number,
	raw?: { usedRaw?: number; limitRaw?: number; rawUnit?: string },
): QuotaWindow {
	return { key, label, used, limit, remaining: Math.max(0, limit - used), resetAt, ...raw };
}

function fromUtilization(key: QuotaWindow['key'], label: string, usedPercent: number, resetAt?: number, raw?: { usedRaw?: number; limitRaw?: number; rawUnit?: string }): QuotaWindow {
	const used = Math.max(0, Math.min(100, usedPercent));
	return windowOf(key, label, used, 100, resetAt, raw);
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

function snapshot(windows: QuotaWindow[], reason?: string, balance?: QuotaBalance): QuotaSnapshot {
	if (windows.length === 0) return emptyQuota(reason ?? 'quota endpoint returned no windows');
	return { kind: 'window', windows, balance, reason, updatedAt: Date.now() };
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
			const usedRaw = asNumber(detail.limit) !== undefined && asNumber(detail.remaining) !== undefined
				? Math.max(0, limit - remaining)
				: undefined;
			const usedPct = limit > 0 ? ((limit - remaining) / limit) * 100 : 0;
			windows.push(fromUtilization('5h', '5 小时', usedPct, isoToUnix(detail.resetTime), { usedRaw, limitRaw: limit, rawUnit: '次' }));
		}
		const usage = body.usage as Record<string, unknown> | undefined;
		if (usage) {
			const limit = asNumber(usage.limit) ?? 1;
			const remaining = asNumber(usage.remaining) ?? 0;
			const usedRaw = asNumber(usage.used);
			const usedPct = limit > 0 ? ((limit - remaining) / limit) * 100 : 0;
			windows.push(fromUtilization('7d', '7 天', usedPct, isoToUnix(usage.resetTime), { usedRaw, limitRaw: limit, rawUnit: '次' }));
		}
		// boosterWallet carries top-up credits; the platform tracks the total
		// (amount) itself, so no local baseline persistence is needed.
		const wallet = body.boosterWallet as Record<string, unknown> | undefined;
		const walletBalance = wallet?.balance as Record<string, unknown> | undefined;
		const amount = asNumber(walletBalance?.amount);
		const amountLeft = asNumber(walletBalance?.amountLeft);
		const balance: QuotaBalance | undefined =
			amount !== undefined && amount > 0 && amountLeft !== undefined
				? { current: amountLeft, lastRecharge: amount, unit: 'points', label: '加量包' }
				: undefined;
		return snapshot(windows, windows.length ? undefined : 'kimi usages had no limits/usage', balance);
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
			const usedRaw = asNumber(item.currentValue);
			const limitRaw = asNumber(item.usage);
			windows.push(fromUtilization(
				key,
				key === '5h' ? '5 小时' : '7 天',
				pct,
				isoToUnix(item.nextResetTime),
				usedRaw !== undefined && limitRaw !== undefined ? { usedRaw, limitRaw, rawUnit: '次' } : undefined,
			));
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

// === pay-as-you-go balance collectors ===

const DEEPSEEK_BALANCE_URL = 'https://api.deepseek.com/user/balance';

export interface BalanceRecord {
	/** Balance right after the last top-up (baseline B0); percent = current / lastRecharge. */
	lastRecharge: number;
	unit: string;
	/** Unix ms when the baseline was set. */
	at: number;
}

interface BalanceReading {
	current: number;
	unit: string;
	/** Platform-provided baseline (top-up total). When present, local baseline tracking is skipped. */
	lastRecharge?: number;
}

function balanceFilePath(profile: string): string {
	const home = process.env.DSH_HOME ?? join(process.env.USERPROFILE ?? process.env.HOME ?? '', '.dsh');
	return join(home, 'profiles', profile, 'model-sync.baseline.json');
}

interface BaselineRead {
	rows: Record<string, BalanceRecord>;
	/** Parse/read diagnostic; undefined when the file was read cleanly (or absent on first run). */
	error: string | undefined;
}

function readBaseline(profile: string): BaselineRead {
	try {
		const parsed = JSON.parse(readFileSync(balanceFilePath(profile), 'utf8')) as Record<string, unknown>;
		const out: Record<string, BalanceRecord> = {};
		for (const [key, value] of Object.entries(parsed)) {
			if (typeof value !== 'object' || value === null) continue;
			const rec = value as Record<string, unknown>;
			const lastRecharge = asNumber(rec.lastRecharge);
			const unit = typeof rec.unit === 'string' ? rec.unit : '';
			if (lastRecharge === undefined || !unit) continue;
			out[key] = { lastRecharge, unit, at: asNumber(rec.at) ?? Date.now() };
		}
		return { rows: out, error: undefined };
	} catch (error) {
		// Missing file on first run is expected; anything else must surface so a
		// silently lost baseline never masquerades as a fresh top-up.
		return { rows: {}, error: `baseline read failed: ${String(error)}` };
	}
}

// Serialize baseline writes so concurrent /state polls never race read-modify-write.
// Failures are logged, never swallowed: a lost baseline would otherwise reset
// the remaining-percent denominator on every restart.
let baselineChain: Promise<void> = Promise.resolve();

function persistBaseline(profile: string, rows: Record<string, BalanceRecord>, log: Logger): Promise<void> {
	const path = balanceFilePath(profile);
	baselineChain = baselineChain.then(() => {
		const tmp = `${path}.tmp`;
		writeFileSync(tmp, `${JSON.stringify(rows, null, 2)}\n`, 'utf8');
		renameSync(tmp, path);
	});
	baselineChain = baselineChain.catch((error) => {
		log.warn(`model-sync baseline persist failed: ${String(error)}`);
	});
	return baselineChain;
}

async function fetchDeepseekReading(ctx: Context, apiKeyEnv: string): Promise<BalanceReading> {
	const token = await bearer(ctx, apiKeyEnv);
	if (!token) throw new Error('DEEPSEEK credential empty');
	const response = await fetch(DEEPSEEK_BALANCE_URL, {
		headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
		signal: AbortSignal.timeout(15_000),
	});
	if (!response.ok) throw new Error(`deepseek /user/balance HTTP ${response.status}`);
	const body = (await response.json()) as Record<string, unknown>;
	const infos = Array.isArray(body.balance_infos) ? body.balance_infos : [];
	const row = (infos.find((x) => typeof x === 'object' && x !== null && (x as Record<string, unknown>).currency === 'CNY') ??
		infos[0]) as Record<string, unknown> | undefined;
	if (!row) throw new Error('deepseek balance_infos missing');
	const current = asNumber(row.total_balance);
	if (current === undefined) throw new Error('deepseek total_balance missing');
	return { current, unit: typeof row.currency === 'string' ? row.currency : 'CNY' };
}

/**
 * Collect a pay-as-you-go balance and maintain the "last recharge" baseline:
 * a reading higher than the stored baseline means a top-up happened (or the
 * first sight), so the baseline resets to that reading — remaining percent
 * then equals current / lastRecharge and starts back at 100%.
 */
export async function collectBalance(ctx: Context, provider: string, apiKeyEnv: string, profile: string): Promise<QuotaSnapshot> {
	const log = ctx.logger('model-sync');
	if (!apiKeyEnv) return emptyQuota('no apiKeyEnv on this route');
	let reading: BalanceReading;
	try {
		reading = await fetchDeepseekReading(ctx, apiKeyEnv);
	} catch (error) {
		return emptyQuota(`deepseek balance failed: ${String(error)}`);
	}
	let lastRecharge = reading.lastRecharge;
	let baselineAt: number | undefined;
	if (lastRecharge === undefined) {
		const { rows, error: readError } = readBaseline(profile);
		if (readError !== undefined) log.warn(`model-sync ${readError}`);
		const prev = rows[provider];
		lastRecharge = prev !== undefined && prev.lastRecharge >= reading.current ? prev.lastRecharge : reading.current;
		baselineAt = prev?.at;
		if (lastRecharge !== prev?.lastRecharge) {
			baselineAt = Date.now();
			rows[provider] = { lastRecharge, unit: reading.unit, at: baselineAt };
			await persistBaseline(profile, rows, log);
		}
	}
	return {
		kind: 'balance',
		windows: [],
		balance: { current: reading.current, lastRecharge, unit: reading.unit, baselineAt },
		reason: undefined,
		updatedAt: Date.now(),
	};
}

/**
 * Re-anchor the baseline to the current balance (manual correction). Useful
 * when the plugin was first enabled long after a top-up, so the remaining
 * percent denominator matches the user's mental model again.
 */
export async function resetBaseline(ctx: Context, provider: string, apiKeyEnv: string, profile: string): Promise<{ ok: boolean; error?: string }> {
	const log = ctx.logger('model-sync');
	let reading: BalanceReading;
	try {
		reading = await fetchDeepseekReading(ctx, apiKeyEnv);
	} catch (error) {
		return { ok: false, error: String(error) };
	}
	const { rows } = readBaseline(profile);
	rows[provider] = { lastRecharge: reading.current, unit: reading.unit, at: Date.now() };
	await persistBaseline(profile, rows, log);
	return { ok: true };
}

// === Grok (xAI) subscription usage — ported from CC Switch subscription_grok.rs ===
// The billing endpoint is gRPC-web with no public .proto; a generic protobuf
// scan extracts the used percent (fixed32 field whose path ends in 1, value in
// [0,100], shallowest first) and the reset time (varint [1,5,1] in the future).

const GROK_BILLING_URL = 'https://grok.com/grok_api_v2.GrokBuildBilling/GetGrokCreditsConfig';

interface GrokScan {
	varint: Array<{ path: number[]; value: number }>;
	fixed32: Array<{ path: number[]; value: number; order: number }>;
}

function readGrokVarint(bytes: Uint8Array, state: { i: number }): number | undefined {
	let value = 0n;
	let shift = 0n;
	while (state.i < bytes.length && shift < 64n) {
		const b = bytes[state.i++];
		value |= BigInt(b & 0x7f) << shift;
		if ((b & 0x80) === 0) {
			const n = Number(value);
			return Number.isSafeInteger(n) ? n : undefined;
		}
		shift += 7n;
	}
	return undefined;
}

function scanGrokProtobuf(bytes: Uint8Array, depth: number, path: number[], scan: GrokScan, order: number): number {
	let index = 0;
	let nextOrder = order;
	while (index < bytes.length) {
		const fieldStart = index;
		const state = { i: index };
		const key = readGrokVarint(bytes, state);
		if (key === undefined || key === 0) {
			index = fieldStart + 1;
			continue;
		}
		index = state.i;
		const fieldNumber = key >> 3;
		const wireType = key & 0x07;
		const fieldPath = [...path, fieldNumber];
		if (wireType === 0) {
			const vstate = { i: index };
			const value = readGrokVarint(bytes, vstate);
			if (value === undefined) {
				index = fieldStart + 1;
				continue;
			}
			scan.varint.push({ path: fieldPath, value });
			index = vstate.i;
		} else if (wireType === 1) {
			if (index + 8 > bytes.length) return nextOrder;
			index += 8;
		} else if (wireType === 2) {
			const lstate = { i: index };
			const length = readGrokVarint(bytes, lstate);
			if (length === undefined || length > bytes.length - lstate.i) {
				index = fieldStart + 1;
				continue;
			}
			if (depth < 4) {
				nextOrder = scanGrokProtobuf(bytes.subarray(lstate.i, lstate.i + length), depth + 1, fieldPath, scan, nextOrder);
			}
			index = lstate.i + length;
		} else if (wireType === 5) {
			if (index + 4 > bytes.length) return nextOrder;
			const bits = bytes[index] | (bytes[index + 1] << 8) | (bytes[index + 2] << 16) | (bytes[index + 3] << 24);
			const view = new DataView(new ArrayBuffer(4));
			view.setUint32(0, bits >>> 0, true);
			scan.fixed32.push({ path: fieldPath, value: view.getFloat32(0, true), order: nextOrder });
			nextOrder += 1;
			index += 4;
		} else {
			index = fieldStart + 1;
		}
	}
	return nextOrder;
}

function percentDecode(input: string): string {
	const out: number[] = [];
	for (let i = 0; i < input.length; i++) {
		const c = input.charCodeAt(i);
		if (c === 0x25 && i + 2 < input.length) {
			const hex = parseInt(input.slice(i + 1, i + 3), 16);
			if (Number.isFinite(hex)) {
				out.push(hex);
				i += 2;
				continue;
			}
		}
		out.push(c & 0xff);
	}
	return Buffer.from(out).toString('utf8');
}

interface GrokBillingSnapshot {
	usedPercent: number;
	resetAt: number | undefined;
}

function parseGrokBilling(data: Uint8Array, nowSecs: number): GrokBillingSnapshot | undefined {
	// gRPC-web frames: 1 flag byte + 4-byte big-endian length; trailer frames skipped.
	let payloads: Uint8Array[] = [];
	let index = 0;
	while (index < data.length) {
		if (index + 5 > data.length) {
			payloads = [];
			break;
		}
		const flags = data[index];
		const length = (data[index + 1] << 24) | (data[index + 2] << 16) | (data[index + 3] << 8) | data[index + 4];
		const start = index + 5;
		const end = start + length;
		if (end > data.length) {
			payloads = [];
			break;
		}
		if ((flags & 0x80) === 0) payloads.push(data.subarray(start, end));
		index = end;
	}
	if (payloads.length === 0 && data.length > 0) {
		const first = data[0];
		if ((first >> 3) > 0 && [0, 1, 2, 5].includes(first & 0x07)) payloads = [data];
	}
	if (payloads.length === 0) return undefined;
	const scan: GrokScan = { varint: [], fixed32: [] };
	let order = 0;
	for (const payload of payloads) order = scanGrokProtobuf(payload, 0, [], scan, order);
	const percent = scan.fixed32
		.filter((f) => f.path[f.path.length - 1] === 1 && Number.isFinite(f.value) && f.value >= 0 && f.value <= 100)
		.sort((a, b) => (a.path.length - b.path.length) || (a.order - b.order))[0];
	if (!percent) return undefined;
	const resets = scan.varint
		.filter((v) => v.value >= 1_700_000_000 && v.value <= 2_100_000_000 && v.value > nowSecs)
		.map((v) => ({ path: v.path, ts: v.value }));
	const exact = resets.filter((r) => r.path.length === 3 && r.path[0] === 1 && r.path[1] === 5 && r.path[2] === 1);
	const resetAt = (exact.length ? exact : resets).map((r) => r.ts).sort((a, b) => a - b)[0];
	return { usedPercent: percent.value, resetAt };
}

async function fetchGrok(ctx: Context, apiKeyEnv: string): Promise<QuotaSnapshot> {
	const token = await bearer(ctx, apiKeyEnv);
	if (!token) return emptyQuota('xai credential empty');
	try {
		const response = await fetch(GROK_BILLING_URL, {
			method: 'POST',
			headers: {
				authorization: `Bearer ${token}`,
				origin: 'https://grok.com',
				referer: 'https://grok.com/?_s=usage',
				accept: '*/*',
				'content-type': 'application/grpc-web+proto',
				'x-grpc-web': '1',
				'x-user-agent': 'connect-es/2.1.1',
				'user-agent': 'dsh-model-sync',
			},
			body: new Uint8Array(5),
			signal: AbortSignal.timeout(15_000),
		});
		if (response.status === 401 || response.status === 403) {
			return emptyQuota(`grok credentials rejected (HTTP ${response.status})`);
		}
		if (!response.ok) return emptyQuota(`grok billing HTTP ${response.status}`);
		const grpcStatus = response.headers.get('grpc-status');
		if (grpcStatus !== null && grpcStatus !== '0') {
			return emptyQuota(`grok billing RPC failed (grpc-status ${grpcStatus}): ${percentDecode(response.headers.get('grpc-message') ?? '')}`);
		}
		const body = new Uint8Array(await response.arrayBuffer());
		const parsed = parseGrokBilling(body, Math.floor(Date.now() / 1000));
		if (!parsed) return emptyQuota('grok billing payload had no usage percent');
		return snapshot([fromUtilization('7d', '7 天', parsed.usedPercent, parsed.resetAt)]);
	} catch (error) {
		return emptyQuota(`grok billing failed: ${String(error)}`);
	}
}

export async function collectQuota(ctx: Context, provider: string, apiKeyEnv: string | undefined, profile: string): Promise<QuotaSnapshot> {
	if (!apiKeyEnv) return emptyQuota('no apiKeyEnv on this route');
	if (provider === 'openai-codex') return fetchCodex(ctx, apiKeyEnv);
	if (provider === 'kimi-coding') return fetchKimi(ctx, apiKeyEnv);
	if (provider === 'zai') return fetchZhipu(ctx, apiKeyEnv);
	if (provider === 'minimax-cn') return fetchMinimax(ctx, apiKeyEnv);
	if (provider === 'deepseek-official') return collectBalance(ctx, provider, apiKeyEnv, profile);
	if (provider === 'xai') return fetchGrok(ctx, apiKeyEnv);
	return emptyQuota('no public quota API for this provider yet');
}
