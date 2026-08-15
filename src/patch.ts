// Enable/disable composition entries by editing the profile cordis.patch.yml.
// Official toggle is the loader `disabled` flag; the inventory UI is read-only.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { MANAGED_PLUGIN_IDS } from './domain.js';

export function profilePatchPath(profile: string): string {
	const home = process.env.DSH_HOME ?? join(process.env.USERPROFILE ?? process.env.HOME ?? '', '.dsh');
	return join(home, 'profiles', profile, 'cordis.patch.yml');
}

export function readPluginEnabled(profile: string): Record<string, boolean | undefined> {
	const text = readFileSync(profilePatchPath(profile), 'utf8');
	const out: Record<string, boolean | undefined> = {};
	for (const row of MANAGED_PLUGIN_IDS) {
		out[row.id] = isEntryEnabled(text, row.id);
	}
	return out;
}

function isEntryEnabled(text: string, id: string): boolean | undefined {
	const block = extractEntryBlock(text, id);
	if (!block) return undefined;
	return !/^\s+disabled:\s*true\s*$/m.test(block);
}

function extractEntryBlock(text: string, id: string): string | undefined {
	const lines = text.split(/\r?\n/);
	const start = lines.findIndex((line) => /^\s+-\s+id:\s+/.test(line) && line.includes(id));
	if (start < 0) return undefined;
	const indent = /^(\s*)/.exec(lines[start])?.[1].length ?? 0;
	let end = start + 1;
	while (end < lines.length) {
		const line = lines[end];
		if (line.trim() === '') {
			end += 1;
			continue;
		}
		const next = /^(\s*)/.exec(line)?.[1].length ?? 0;
		if (/^\s+-\s+id:\s+/.test(line) || next <= indent) break;
		end += 1;
	}
	return lines.slice(start, end).join('\n');
}

function updateEntryEnabled(profile: string, id: string, enabled: boolean): boolean {
	const path = profilePatchPath(profile);
	const text = readFileSync(path, 'utf8');
	const lines = text.split(/\r?\n/);
	const start = lines.findIndex((line) => /^\s+-\s+id:\s+/.test(line) && line.includes(id));
	if (start < 0) return false;
	const indentMatch = /^(\s*)-\s+id:/.exec(lines[start]);
	const childIndent = `${indentMatch?.[1] ?? '    '}  `;
	const indent = indentMatch?.[1].length ?? 0;
	let end = start + 1;
	let disabledAt = -1;
	while (end < lines.length) {
		const line = lines[end];
		if (line.trim() !== '') {
			const next = /^(\s*)/.exec(line)?.[1].length ?? 0;
			if (/^\s+-\s+id:\s+/.test(line) || next <= indent) break;
			if (/^\s+disabled:\s*/.test(line)) disabledAt = end;
		}
		end += 1;
	}
	if (enabled) {
		if (disabledAt >= 0) lines.splice(disabledAt, 1);
	} else if (disabledAt >= 0) {
		lines[disabledAt] = `${childIndent}disabled: true`;
	} else {
		lines.splice(start + 1, 0, `${childIndent}disabled: true`);
	}
	writeFileSync(path, `${lines.join('\n').replace(/\n+$/, '')}\n`, 'utf8');
	return true;
}

export function setEntryEnabled(profile: string, id: string, enabled: boolean): void {
	if (!updateEntryEnabled(profile, id, enabled)) throw new Error(`patch entry not found: ${id}`);
}

/** Update an optional entry, returning false when it is not configured. */
export function setEntryEnabledIfPresent(profile: string, id: string, enabled: boolean): boolean {
	return updateEntryEnabled(profile, id, enabled);
}
