// Run after npm run build. Optional argument: project with Playwright/esbuild.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const toolRequire = createRequire(join(resolve(process.argv[2] || root), 'package.json'));
const { chromium } = toolRequire('playwright');
const { build } = toolRequire('esbuild');
const express = require('express');
const orange = require('../../src');
const { setupChangeTracking } = require('../../src/sync/setupChangeTracking');
const directory = await mkdtemp(join(tmpdir(), 'orange-delete-browser-'));
let browser, server, remote;

try {
	await build({ entryPoints: [join(root, 'dist/index.browser.mjs')], bundle: true,
		format: 'esm', platform: 'browser', external: ['pg', '@electric-sql/pglite'], outfile: join(directory, 'orange.mjs') });
	const map = orange.map(({ table }) => ({ item: table('item').map(({ column }) => ({ id: column('id').string().primary() })) }));
	remote = map.pglite(undefined, { size: 1 });
	await remote.query('CREATE TABLE item (id text PRIMARY KEY)');
	await setupChangeTracking(remote, remote.tables);
	const app = express();
	app.use((_req, res, next) => {
		res.set('Cross-Origin-Opener-Policy', 'same-origin');
		res.set('Cross-Origin-Embedder-Policy', 'require-corp');
		next();
	});
	app.use(express.json());
	app.use('/rdb', remote.express({ item: {}, sync: {} }));
	app.use('/assets', express.static(directory));
	app.use('/@sqlite.org/sqlite-wasm', express.static(join(root, 'node_modules/@sqlite.org/sqlite-wasm')));
	app.get('/', (_req, res) => res.type('html').send('<!doctype html><title>Delete OPFS</title>'));
	server = await new Promise(resolve => { const listening = app.listen(0, '127.0.0.1', () => resolve(listening)); });
	browser = await chromium.launch({ headless: true });
	for (const config of [
		{ vfs: 'opfs-sahpool', sync: true },
		{ vfs: 'opfs-wl', sync: true },
		{ vfs: 'opfs-sahpool', sync: true, opfsSahPool: { name: 'custom', directory: 'custom-private' } },
		{ vfs: 'opfs-sahpool', sync: false }
	]) {
		const context = await browser.newContext();
		try {
			const page = await context.newPage();
			await page.goto(`http://127.0.0.1:${server.address().port}`);
			const result = await page.evaluate(async config => {
				const { default: orange } = await import('/assets/orange.mjs');
				const map = orange.map(({ table }) => ({ item: table('item').map(({ column }) => ({ id: column('id').string().primary() })) }));
				const open = name => map({ db: con => con.sqliteOPFS(name, { ...config,
					sync: config.sync ? { url: `${location.origin}/rdb`, auto: false, worker: false } : undefined }) });
				const root = await navigator.storage.getDirectory();
				const shared = await root.getDirectoryHandle('shared-photos', { create: true });
				await shared.getFileHandle('keep.jpg', { create: true });
				const db = open('private.db');
				if (config.sync) await db.syncClient.sync();
				else await db.query('CREATE TABLE item (id text PRIMARY KEY)');
				await db.item.insert({ id: 'private-local' });
				await db.close();
				const before = []; for await (const [name] of root.entries()) before.push(name);
				await orange.deleteSqliteOPFS('private.db', config);
				await orange.deleteSqliteOPFS('private.db', config);
				const after = []; for await (const [name] of root.entries()) after.push(name);
				const reopened = open('private.db');
				let oldRows;
				try {
					if (config.sync) {
						await reopened.syncClient.ensureLocalSchema();
						oldRows = await reopened.item.getMany();
					} else {
						oldRows = await reopened.query('SELECT name FROM sqlite_master WHERE name = \'item\'');
					}
				} finally { await reopened.close(); }
				await shared.getFileHandle('keep.jpg');
				return { before, after, oldRows };
			}, config);
			assert.ok(result.before.length > 1);
			assert.deepEqual(result.after, ['shared-photos']);
			assert.deepEqual(result.oldRows, []);
			console.log(`PASS delete OPFS ${JSON.stringify(config)}: storage removed, retry safe, fresh reopen, shared files retained`);
		} finally { await context.close(); }
	}
} finally {
	if (browser) await browser.close();
	if (server) await new Promise(resolve => server.close(resolve));
	if (remote) await remote.close();
	await rm(directory, { recursive: true, force: true });
}
