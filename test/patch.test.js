import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, test } from 'node:test';
import { readPluginEnabled, setEntryEnabled, setEntryEnabledIfPresent } from '../lib/patch.js';

let root;
let profileDir;
let patchPath;

function installBundle(packageName, id) {
	const packageDir = join(profileDir, 'node_modules', ...packageName.split('/'));
	mkdirSync(packageDir, { recursive: true });
	writeFileSync(join(packageDir, 'package.json'), JSON.stringify({
		name: packageName,
		dsh: { bundle: { patch: './cordis.patch.yml' } },
	}));
	writeFileSync(join(packageDir, 'cordis.patch.yml'), `- insert:\n    - id: ${id}\n      name: ${packageName}\n`);
}

function writeProfile(bundles) {
	writeFileSync(join(profileDir, 'package.json'), JSON.stringify({
		name: 'test-profile',
		dsh: { profile: { bundles } },
	}));
}

beforeEach(() => {
	root = mkdtempSync(join(tmpdir(), 'dsh-model-sync-'));
	profileDir = join(root, 'profiles', 'web');
	patchPath = join(profileDir, 'cordis.patch.yml');
	mkdirSync(profileDir, { recursive: true });
	writeFileSync(patchPath, '# user overrides\n[]\n');
	installBundle('dsh-model-sync', 'model-sync');
	writeProfile(['dsh-model-sync']);
	process.env.DSH_HOME = root;
});

afterEach(() => {
	delete process.env.DSH_HOME;
	rmSync(root, { recursive: true, force: true });
});

test('missing optional bundle is absent and ignored when toggled', () => {
	const source = readFileSync(patchPath, 'utf8');

	const enabled = readPluginEnabled('web');
	assert.equal(enabled['model-sync'], true);
	assert.equal(enabled['sub-model-access'], undefined);
	assert.equal(setEntryEnabledIfPresent('web', 'sub-model-access', true), false);
	assert.equal(readFileSync(patchPath, 'utf8'), source);
});

test('bundle entry can be disabled and enabled through a user-layer override', () => {
	installBundle('@agentteam/sub-model-access', 'sub-model-access');
	writeProfile(['dsh-model-sync', '@agentteam/sub-model-access']);

	assert.equal(setEntryEnabledIfPresent('web', 'sub-model-access', false), true);
	assert.match(readFileSync(patchPath, 'utf8'), /- id: sub-model-access\n  disabled: true\n/);
	assert.equal(readPluginEnabled('web')['sub-model-access'], false);

	assert.equal(setEntryEnabledIfPresent('web', 'sub-model-access', true), true);
	assert.match(readFileSync(patchPath, 'utf8'), /- id: sub-model-access\n  disabled: false\n/);
	assert.equal(readPluginEnabled('web')['sub-model-access'], true);
});

test('required bundle entry can be toggled when absent from the user layer', () => {
	assert.equal(readPluginEnabled('web')['model-sync'], true);

	setEntryEnabled('web', 'model-sync', false);
	assert.match(readFileSync(patchPath, 'utf8'), /- id: model-sync\n  disabled: true\n/);
	assert.equal(readPluginEnabled('web')['model-sync'], false);

	setEntryEnabled('web', 'model-sync', true);
	assert.match(readFileSync(patchPath, 'utf8'), /- id: model-sync\n  disabled: false\n/);
	assert.equal(readPluginEnabled('web')['model-sync'], true);
});

test('missing required bundle entry still throws', () => {
	writeProfile([]);

	assert.throws(
		() => setEntryEnabled('web', 'model-sync', false),
		/patch entry not found: model-sync/,
	);
});
