import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, test } from 'node:test';
import { readPluginEnabled, setEntryEnabled, setEntryEnabledIfPresent } from '../lib/patch.js';

let root;
let patchPath;

beforeEach(() => {
	root = mkdtempSync(join(tmpdir(), 'dsh-model-sync-'));
	patchPath = join(root, 'profiles', 'web', 'cordis.patch.yml');
	mkdirSync(join(root, 'profiles', 'web'), { recursive: true });
	process.env.DSH_HOME = root;
});

afterEach(() => {
	delete process.env.DSH_HOME;
	rmSync(root, { recursive: true, force: true });
});

test('missing optional entry is reported as absent and ignored when toggled', () => {
	const source = '  - id: model-sync\n    name: dsh-model-sync\n';
	writeFileSync(patchPath, source);

	const enabled = readPluginEnabled('web');
	assert.equal(enabled['model-sync'], true);
	assert.equal(enabled['sub-model-access'], undefined);
	assert.equal(setEntryEnabledIfPresent('web', 'sub-model-access', true), false);
	assert.equal(readFileSync(patchPath, 'utf8'), source);
});

test('present optional entry can still be disabled and enabled', () => {
	writeFileSync(patchPath, '  - id: sub-model-access\n    name: "@agentteam/sub-model-access"\n  - id: model-sync\n    name: dsh-model-sync\n');

	assert.equal(setEntryEnabledIfPresent('web', 'sub-model-access', false), true);
	assert.match(readFileSync(patchPath, 'utf8'), /id: sub-model-access\n    disabled: true\n/);
	assert.equal(readPluginEnabled('web')['sub-model-access'], false);

	assert.equal(setEntryEnabledIfPresent('web', 'sub-model-access', true), true);
	assert.doesNotMatch(readFileSync(patchPath, 'utf8'), /disabled: true/);
	assert.equal(readPluginEnabled('web')['sub-model-access'], true);
});

test('missing required entry still throws', () => {
	writeFileSync(patchPath, '  - id: sub-model-access\n    name: "@agentteam/sub-model-access"\n');

	assert.throws(
		() => setEntryEnabled('web', 'model-sync', false),
		/patch entry not found: model-sync/,
	);
});
