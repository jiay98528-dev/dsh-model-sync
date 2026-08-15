// Quota collectors ported from CC Switch (farion1231/cc-switch)
// coding_plan.rs + subscription.rs — not /models response headers.
// Pay-as-you-go API credits (balance) are collected separately and keep a
// local "last recharge" baseline so the remaining percent can be shown as
// current / last-recharge.
import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { credentialRef } from './dsh-adapter.js';
import { emptyQuota } from './domain.js';
function windowOf(key, label, used, limit, resetAt) {
    return { key, label, used, limit, remaining: Math.max(0, limit - used), resetAt };
}
function fromUtilization(key, label, usedPercent, resetAt) {
    const used = Math.max(0, Math.min(100, usedPercent));
    return windowOf(key, label, used, 100, resetAt);
}
function asNumber(value) {
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    if (typeof value === 'string' && value.trim() !== '') {
        const n = Number(value);
        if (Number.isFinite(n))
            return n;
    }
    return undefined;
}
function isoToUnix(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value > 1e12 ? Math.floor(value / 1000) : value;
    }
    if (typeof value === 'string' && value.length > 0) {
        const ms = Date.parse(value);
        if (Number.isFinite(ms))
            return Math.floor(ms / 1000);
    }
    return undefined;
}
function snapshot(windows, reason) {
    if (windows.length === 0)
        return emptyQuota(reason ?? 'quota endpoint returned no windows');
    return { kind: 'window', windows, balance: undefined, reason, updatedAt: Date.now() };
}
async function bearer(ctx, apiKeyEnv) {
    try {
        return (await ctx.credentials.resolve(credentialRef(apiKeyEnv)))?.value;
    }
    catch {
        return undefined;
    }
}
function readCodexAccountId() {
    try {
        const raw = readFileSync(join(homedir(), '.codex', 'auth.json'), 'utf8');
        const parsed = JSON.parse(raw);
        const id = parsed.tokens?.account_id;
        return typeof id === 'string' && id.length > 0 ? id : undefined;
    }
    catch {
        return undefined;
    }
}
function windowSecondsToKey(secs) {
    if (secs === 18_000)
        return '5h';
    if (secs === 604_800)
        return '7d';
    if (secs >= 86_400)
        return '7d';
    return '5h';
}
async function fetchCodex(ctx, apiKeyEnv) {
    const token = await bearer(ctx, apiKeyEnv);
    if (!token)
        return emptyQuota('CODEX credential empty');
    const headers = {
        authorization: `Bearer ${token}`,
        accept: 'application/json',
        'user-agent': 'codex-cli',
    };
    const accountId = readCodexAccountId();
    if (accountId)
        headers['chatgpt-account-id'] = accountId;
    try {
        const response = await fetch('https://chatgpt.com/backend-api/wham/usage', {
            headers,
            signal: AbortSignal.timeout(15_000),
        });
        if (!response.ok)
            return emptyQuota(`codex wham/usage HTTP ${response.status}`);
        const body = (await response.json());
        const windows = [];
        for (const raw of [body.rate_limit?.primary_window, body.rate_limit?.secondary_window]) {
            if (!raw || typeof raw.used_percent !== 'number')
                continue;
            const key = windowSecondsToKey(raw.limit_window_seconds ?? 0);
            windows.push(fromUtilization(key, key === '5h' ? '5 小时' : '7 天', raw.used_percent, raw.reset_at));
        }
        return snapshot(windows, windows.length ? undefined : 'codex wham/usage had no rate_limit windows');
    }
    catch (error) {
        return emptyQuota(`codex wham/usage failed: ${String(error)}`);
    }
}
async function fetchKimi(ctx, apiKeyEnv) {
    const token = await bearer(ctx, apiKeyEnv);
    if (!token)
        return emptyQuota('kimi credential empty');
    try {
        const response = await fetch('https://api.kimi.com/coding/v1/usages', {
            headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
            signal: AbortSignal.timeout(15_000),
        });
        if (!response.ok)
            return emptyQuota(`kimi /coding/v1/usages HTTP ${response.status}`);
        const body = (await response.json());
        const windows = [];
        const limits = Array.isArray(body.limits) ? body.limits : [];
        for (const item of limits) {
            if (typeof item !== 'object' || item === null)
                continue;
            const detail = item.detail;
            if (!detail)
                continue;
            const limit = asNumber(detail.limit) ?? 1;
            const remaining = asNumber(detail.remaining) ?? 0;
            const usedPct = limit > 0 ? ((limit - remaining) / limit) * 100 : 0;
            windows.push(fromUtilization('5h', '5 小时', usedPct, isoToUnix(detail.resetTime)));
        }
        const usage = body.usage;
        if (usage) {
            const limit = asNumber(usage.limit) ?? 1;
            const remaining = asNumber(usage.remaining) ?? 0;
            const usedPct = limit > 0 ? ((limit - remaining) / limit) * 100 : 0;
            windows.push(fromUtilization('7d', '7 天', usedPct, isoToUnix(usage.resetTime)));
        }
        return snapshot(windows, windows.length ? undefined : 'kimi usages had no limits/usage');
    }
    catch (error) {
        return emptyQuota(`kimi usages failed: ${String(error)}`);
    }
}
async function fetchZhipu(ctx, apiKeyEnv) {
    const token = await bearer(ctx, apiKeyEnv);
    if (!token)
        return emptyQuota('zhipu credential empty');
    try {
        const response = await fetch('https://api.z.ai/api/monitor/usage/quota/limit', {
            headers: { authorization: token, 'content-type': 'application/json', 'accept-language': 'en-US,en' },
            signal: AbortSignal.timeout(15_000),
        });
        if (!response.ok)
            return emptyQuota(`zhipu quota/limit HTTP ${response.status}`);
        const body = (await response.json());
        if (body.success === false)
            return emptyQuota(`zhipu API: ${String(body.msg ?? 'unknown')}`);
        const data = body.data;
        if (!data)
            return emptyQuota('zhipu quota missing data');
        const rows = Array.isArray(data.limits) ? data.limits : [];
        const windows = [];
        for (const raw of rows) {
            if (typeof raw !== 'object' || raw === null)
                continue;
            const item = raw;
            const typ = String(item.type ?? '');
            if (!/tokens_limit|credit_limit/i.test(typ))
                continue;
            const pct = asNumber(item.percentage) ?? 0;
            const unit = asNumber(item.unit);
            const key = unit === 6 ? '7d' : '5h';
            windows.push(fromUtilization(key, key === '5h' ? '5 小时' : '7 天', pct, isoToUnix(item.nextResetTime)));
        }
        return snapshot(windows);
    }
    catch (error) {
        return emptyQuota(`zhipu quota failed: ${String(error)}`);
    }
}
async function fetchMinimax(ctx, apiKeyEnv) {
    const token = await bearer(ctx, apiKeyEnv);
    if (!token)
        return emptyQuota('minimax credential empty');
    try {
        const response = await fetch('https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains', {
            headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
            signal: AbortSignal.timeout(15_000),
        });
        if (!response.ok)
            return emptyQuota(`minimax coding_plan/remains HTTP ${response.status}`);
        const body = (await response.json());
        const base = body.base_resp;
        if (base && asNumber(base.status_code) !== undefined && asNumber(base.status_code) !== 0) {
            return emptyQuota(`minimax API ${String(base.status_code)}: ${String(base.status_msg ?? '')}`);
        }
        const remains = Array.isArray(body.model_remains) ? body.model_remains : [];
        const item = remains.find((row) => typeof row === 'object' && row !== null && row.model_name === 'general');
        if (!item)
            return emptyQuota('minimax remains had no general model');
        const windows = [];
        const remain5 = asNumber(item.current_interval_remaining_percent);
        if (remain5 !== undefined)
            windows.push(fromUtilization('5h', '5 小时', 100 - remain5, isoToUnix(item.end_time)));
        if (asNumber(item.current_weekly_status) === 1) {
            const remain7 = asNumber(item.current_weekly_remaining_percent);
            if (remain7 !== undefined)
                windows.push(fromUtilization('7d', '7 天', 100 - remain7, isoToUnix(item.weekly_end_time)));
        }
        return snapshot(windows);
    }
    catch (error) {
        return emptyQuota(`minimax remains failed: ${String(error)}`);
    }
}
// === pay-as-you-go balance collectors ===
const DEEPSEEK_BALANCE_URL = 'https://api.deepseek.com/user/balance';
function balanceFilePath(profile) {
    const home = process.env.DSH_HOME ?? join(process.env.USERPROFILE ?? process.env.HOME ?? '', '.dsh');
    return join(home, 'profiles', profile, 'model-sync.baseline.json');
}
function readBaseline(profile) {
    try {
        const parsed = JSON.parse(readFileSync(balanceFilePath(profile), 'utf8'));
        const out = {};
        for (const [key, value] of Object.entries(parsed)) {
            if (typeof value !== 'object' || value === null)
                continue;
            const rec = value;
            const lastRecharge = asNumber(rec.lastRecharge);
            const unit = typeof rec.unit === 'string' ? rec.unit : '';
            if (lastRecharge === undefined || !unit)
                continue;
            out[key] = { lastRecharge, unit, at: asNumber(rec.at) ?? Date.now() };
        }
        return out;
    }
    catch {
        return {};
    }
}
// Serialize baseline writes so concurrent /state polls never race read-modify-write.
let baselineChain = Promise.resolve();
function persistBaseline(profile, rows) {
    const path = balanceFilePath(profile);
    baselineChain = baselineChain
        .then(() => {
        const tmp = `${path}.tmp`;
        writeFileSync(tmp, `${JSON.stringify(rows, null, 2)}\n`, 'utf8');
        renameSync(tmp, path);
    })
        .catch(() => { });
    return baselineChain;
}
async function fetchDeepseekReading(ctx, apiKeyEnv) {
    const token = await bearer(ctx, apiKeyEnv);
    if (!token)
        throw new Error('DEEPSEEK credential empty');
    const response = await fetch(DEEPSEEK_BALANCE_URL, {
        headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
        signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok)
        throw new Error(`deepseek /user/balance HTTP ${response.status}`);
    const body = (await response.json());
    const infos = Array.isArray(body.balance_infos) ? body.balance_infos : [];
    const row = (infos.find((x) => typeof x === 'object' && x !== null && x.currency === 'CNY') ??
        infos[0]);
    if (!row)
        throw new Error('deepseek balance_infos missing');
    const current = asNumber(row.total_balance);
    if (current === undefined)
        throw new Error('deepseek total_balance missing');
    return { current, unit: typeof row.currency === 'string' ? row.currency : 'CNY' };
}
/**
 * Collect a pay-as-you-go balance and maintain the "last recharge" baseline:
 * a reading higher than the stored baseline means a top-up happened (or the
 * first sight), so the baseline resets to that reading — remaining percent
 * then equals current / lastRecharge and starts back at 100%.
 */
export async function collectBalance(ctx, provider, apiKeyEnv, profile) {
    if (!apiKeyEnv)
        return emptyQuota('no apiKeyEnv on this route');
    let reading;
    try {
        reading = await fetchDeepseekReading(ctx, apiKeyEnv);
    }
    catch (error) {
        return emptyQuota(`deepseek balance failed: ${String(error)}`);
    }
    const rows = readBaseline(profile);
    const prev = rows[provider];
    const lastRecharge = prev !== undefined && prev.lastRecharge >= reading.current ? prev.lastRecharge : reading.current;
    if (lastRecharge === prev?.lastRecharge) {
        // unchanged baseline; nothing to persist
    }
    else {
        rows[provider] = { lastRecharge, unit: reading.unit, at: Date.now() };
        await persistBaseline(profile, rows);
    }
    return {
        kind: 'balance',
        windows: [],
        balance: { current: reading.current, lastRecharge, unit: reading.unit },
        reason: undefined,
        updatedAt: Date.now(),
    };
}
export async function collectQuota(ctx, provider, apiKeyEnv, profile) {
    if (!apiKeyEnv)
        return emptyQuota('no apiKeyEnv on this route');
    if (provider === 'openai-codex')
        return fetchCodex(ctx, apiKeyEnv);
    if (provider === 'kimi-coding')
        return fetchKimi(ctx, apiKeyEnv);
    if (provider === 'zai')
        return fetchZhipu(ctx, apiKeyEnv);
    if (provider === 'minimax-cn')
        return fetchMinimax(ctx, apiKeyEnv);
    if (provider === 'deepseek-official')
        return collectBalance(ctx, provider, apiKeyEnv, profile);
    if (provider === 'xai') {
        return emptyQuota('xAI 5h/7d 走 grok.com gRPC 账单，尚未接入');
    }
    return emptyQuota('no public quota API for this provider yet');
}
