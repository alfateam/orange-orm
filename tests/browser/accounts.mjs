// Run after npm run build. Optional argument: project with playwright/esbuild installed.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, copyFile, rm } from 'node:fs/promises';
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
const directory = await mkdtemp(join(tmpdir(), 'orange-accounts-browser-'));
let browser, server, remote;

try {
	await build({ entryPoints: [join(root, 'dist/index.browser.mjs')], bundle: true,
		format: 'esm', platform: 'browser', external: ['pg', '@electric-sql/pglite'], outfile: join(directory, 'orange.mjs') });
	await copyFile(join(root, 'dist/managed-sync-worker.mjs'), join(directory, 'managed-sync-worker.mjs'));
	const map = orange.map(({ table }) => ({
		project: table('project').map(({ column }) => ({
			id: column('id').string().primary().notNull(), title: column('title').string().notNull()
		}))
	}));
	remote = map({ db: con => con.pglite(undefined, { size: 1 }) });
	await remote.query('CREATE TABLE project (id TEXT PRIMARY KEY NOT NULL, title TEXT NOT NULL)');
	await setupChangeTracking(remote, { project: remote.tables.project });
	const app = express();
	app.use((_req, res, next) => {
		res.set('Cross-Origin-Opener-Policy', 'same-origin');
		res.set('Cross-Origin-Embedder-Policy', 'require-corp');
		next();
	});
	app.use(express.json());
	app.use('/rdb', remote.express({
		project: { baseFilter: (db, req) => db.project.id.startsWith(`${req.headers['x-account']}-`) }, sync: true
	}));
	app.use('/assets', express.static(directory));
	app.use('/@sqlite.org/sqlite-wasm', express.static(join(root, 'node_modules/@sqlite.org/sqlite-wasm')));
	app.get('/', (_req, res) => res.type('html').send('<!doctype html><title>Account isolation test</title>'));
	server = await new Promise(resolve => { const listening = app.listen(0, '127.0.0.1', () => resolve(listening)); });
	browser = await chromium.launch({ headless: true });
	for (const vfs of ['opfs-sahpool', 'opfs-wl']) {
		await remote.project.delete();
		await remote.project.insert([{ id: 'a-old', title: 'A private' }, { id: 'b-old', title: 'B private' }]);
		const context = await browser.newContext();
		try {
			const page = await context.newPage();
			const errors = [];
			const workerClosures = [];
			page.on('worker', worker => workerClosures.push(new Promise(resolve => worker.on('close', resolve))));
			page.on('pageerror', error => errors.push(error.message));
			await page.goto(`http://127.0.0.1:${server.address().port}`);
			const result = await page.evaluate(async vfs => {
				const { default: orange } = await import('/assets/orange.mjs');
				const map = orange.map(({ table }) => ({ project: table('project').map(({ column }) => ({
					id: column('id').string().primary().notNull(), title: column('title').string().notNull()
				})) }));
				const open = account => {
					const db = map({ db: con => con.sqliteOPFS(`${account}.sqlite3`, {
						vfs, sync: { url: `${location.origin}/rdb`, auto: false }
					}) });
					db.syncClient.interceptors.request.use(config => ({ ...config,
						headers: { ...config.headers, 'x-account': account } }));
					return db;
				};
				const ids = async db => (await db.project.getMany()).map(row => row.id).sort();
				const a = open('a');
				await a.syncClient.sync();
				const before = await ids(a);
				await a.project.insert({ id: 'a-draft', title: 'A offline' });
				const checkpoint = await a.query('SELECT * FROM orange_sync_state');
				let entered, release;
				const blocked = new Promise(resolve => { entered = resolve; });
				const gate = new Promise(resolve => { release = resolve; });
				let oldEvents = 0;
				a.syncClient.on('sync', () => { oldEvents++; });
				a.syncClient.interceptors.request.use(async config => { entered(); await gate; return config; });
				const active = a.syncClient.sync();
				await blocked;
				const pending = Promise.allSettled([active, a.syncClient.sync(), a.syncClient.sync()]);
				await a.close();
				const statuses = (await pending).map(result => result.status);
				const b = open('b');
				await b.syncClient.sync();
				const bIds = await ids(b);
				release();
				await b.close();
				const again = open('a');
				const restored = await ids(again);
				const restoredCheckpoint = await again.query('SELECT * FROM orange_sync_state');
				await again.syncClient.sync();
				await again.close();
				return { before, bIds, restored, checkpoint, restoredCheckpoint, statuses, oldEvents };
			}, vfs);
			assert.deepEqual(result.before, ['a-old']);
			assert.deepEqual(result.bIds, ['b-old']);
			assert.deepEqual(result.restored, ['a-draft', 'a-old']);
			assert.deepEqual(result.restoredCheckpoint, result.checkpoint);
			assert.deepEqual(result.statuses, ['rejected', 'rejected', 'rejected']);
			assert.equal(result.oldEvents, 0);
			assert.equal((await remote.project.getById('a-draft')).title, 'A offline');
			assert.deepEqual(errors, []);
			// Chromium reports worker termination asynchronously, after the close RPC.
			let timeout;
			try {
				await Promise.race([Promise.all(workerClosures), new Promise((_resolve, reject) => {
					timeout = setTimeout(() => reject(new Error('Workers did not terminate after close')), 5000);
				})]);
			} finally { clearTimeout(timeout); }
			assert.equal(page.workers().length, 0, 'All managed sync and SQLite workers must close');
			console.log(`PASS ${vfs}: A → B → A, isolated old rows/checkpoints, pending outbox retained, workers closed`);
		} finally { await context.close(); }
	}
} finally {
	if (browser) await browser.close();
	if (server) await new Promise(resolve => server.close(resolve));
	if (remote) await remote.close();
	await rm(directory, { recursive: true, force: true });
}
