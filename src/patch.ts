// Enable/disable composed entries through the profile's user patch layer.
// Bundle entries live in earlier layers; cordis.patch.yml stores id overrides.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { MANAGED_PLUGIN_IDS } from './domain.js';

interface EntryBlock {
	start: number;
	end: number;
	indent: number;
}

interface PackageManifest {
	dsh?: {
		bundle?: { patch?: string };
		profile?: { bundles?: string[] };
	};
}

function profileDir(profile: string): string {
	const home = process.env.DSH_HOME ?? join(process.env.USERPROFILE ?? process.env.HOME ?? '', '.dsh');
	return join(home, 'profiles', profile);
}

export function profilePatchPath(profile: string): string {
	return join(profileDir(profile), 'cordis.patch.yml');
}

function entryLine(line: string): { id: string; indent: number } | undefined {
	const match = /^(\s*)-\s+id:\s+(['"]?)([^'"\s#]+)\2(?:\s*(?:#.*)?)?$/.exec(line);
	if (!match) return undefined;
	return { id: match[3], indent: match[1].length };
}

function findEntryBlock(lines: string[], id: string, requiredIndent?: number): EntryBlock | undefined {
	const start = lines.findIndex((line) => {
		const entry = entryLine(line);
		return entry?.id === id && (requiredIndent === undefined || entry.indent === requiredIndent);
	});
	if (start < 0) return undefined;
	const indent = entryLine(lines[start])?.indent ?? 0;
	let end = start + 1;
	while (end < lines.length) {
		const line = lines[end];
		if (line.trim() === '') {
			end += 1;
			continue;
		}
		const nextIndent = /^(\s*)/.exec(line)?.[1].length ?? 0;
		if (nextIndent <= indent) break;
		end += 1;
	}
	return { start, end, indent };
}

function disabledValue(lines: string[], block: EntryBlock): boolean | undefined {
	const childIndent = block.indent + 2;
	for (let index = block.start + 1; index < block.end; index++) {
		const match = /^(\s*)disabled:\s*(true|false)\s*(?:#.*)?$/.exec(lines[index]);
		if (match?.[1].length === childIndent) return match[2] === 'true';
	}
	return undefined;
}

function entryEnabled(text: string, id: string, requiredIndent?: number): boolean | undefined {
	const lines = text.split(/\r?\n/);
	const block = findEntryBlock(lines, id, requiredIndent);
	if (!block) return undefined;
	return disabledValue(lines, block) !== true;
}

function readManifest(path: string): PackageManifest {
	return JSON.parse(readFileSync(path, 'utf8')) as PackageManifest;
}

function bundleEntryEnabled(profile: string, id: string, packageName: string): boolean | undefined {
	const dir = profileDir(profile);
	const profileManifestPath = join(dir, 'package.json');
	if (!existsSync(profileManifestPath)) return undefined;
	const bundles = readManifest(profileManifestPath).dsh?.profile?.bundles ?? [];
	if (!bundles.includes(packageName)) return undefined;

	const packageDir = join(dir, 'node_modules', ...packageName.split('/'));
	const packageManifestPath = join(packageDir, 'package.json');
	if (!existsSync(packageManifestPath)) return undefined;
	const patchFile = readManifest(packageManifestPath).dsh?.bundle?.patch;
	if (!patchFile) return undefined;
	const patchPath = join(packageDir, patchFile);
	if (!existsSync(patchPath)) return undefined;
	return entryEnabled(readFileSync(patchPath, 'utf8'), id);
}

export function readPluginEnabled(profile: string): Record<string, boolean | undefined> {
	const path = profilePatchPath(profile);
	const text = existsSync(path) ? readFileSync(path, 'utf8') : '[]\n';
	const out: Record<string, boolean | undefined> = {};
	for (const row of MANAGED_PLUGIN_IDS) {
		const bundleEnabled = bundleEntryEnabled(profile, row.id, row.packageName);
		if (bundleEnabled === undefined) {
			out[row.id] = undefined;
			continue;
		}
		const overrideEnabled = entryEnabled(text, row.id, 0);
		out[row.id] = overrideEnabled ?? bundleEnabled;
	}
	return out;
}

function updateOverride(text: string, id: string, enabled: boolean): string {
	const lines = text.split(/\r?\n/);
	const block = findEntryBlock(lines, id, 0);
	const value = enabled ? 'false' : 'true';
	if (block) {
		const childIndent = ' '.repeat(block.indent + 2);
		let disabledAt = -1;
		for (let index = block.start + 1; index < block.end; index++) {
			const match = /^(\s*)disabled:\s*/.exec(lines[index]);
			if (match?.[1].length === block.indent + 2) {
				disabledAt = index;
				break;
			}
		}
		if (disabledAt >= 0) lines[disabledAt] = `${childIndent}disabled: ${value}`;
		else lines.splice(block.start + 1, 0, `${childIndent}disabled: ${value}`);
	} else {
		const override = [`- id: ${id}`, `  disabled: ${value}`];
		const emptyListAt = lines.findIndex((line) => line.trim() === '[]');
		if (emptyListAt >= 0) lines.splice(emptyListAt, 1, ...override);
		else {
			while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();
			lines.push(...override);
		}
	}
	return `${lines.join('\n').replace(/\n+$/, '')}\n`;
}

function updateEntryEnabled(profile: string, id: string, enabled: boolean): boolean {
	const plugin = MANAGED_PLUGIN_IDS.find((row) => row.id === id);
	if (!plugin || bundleEntryEnabled(profile, plugin.id, plugin.packageName) === undefined) return false;
	const path = profilePatchPath(profile);
	const text = existsSync(path) ? readFileSync(path, 'utf8') : '[]\n';
	writeFileSync(path, updateOverride(text, id, enabled), 'utf8');
	return true;
}

export function setEntryEnabled(profile: string, id: string, enabled: boolean): void {
	if (!updateEntryEnabled(profile, id, enabled)) throw new Error(`patch entry not found: ${id}`);
}

/** Update an optional entry, returning false when its bundle does not provide it. */
export function setEntryEnabledIfPresent(profile: string, id: string, enabled: boolean): boolean {
	return updateEntryEnabled(profile, id, enabled);
}
