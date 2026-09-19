/* global window */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { build, createServer as createViteServer } from 'vite';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const directory = await mkdtemp(path.join(tmpdir(), 'orange-browser-package-'));
const consumer = path.join(directory, 'consumer');
const report = { directory, node: process.version, cases: [] };
const probe = process.argv.includes('--probe-vite');
const vfs = process.argv.includes('--opfs-wl') ? 'opfs-wl' : 'opfs-sahpool';
const isolated = !process.argv.includes('--no-isolation');
const headers = isolated ? {
	'Cross-Origin-Opener-Policy': 'same-origin',
	'Cross-Origin-Embedder-Policy': 'require-corp'
} : {};
let browser;
let passed = false;
console.log(`Packed consumer: ${consumer}`);
try {
	if (!process.argv.includes('--skip-build'))
		execFileSync('npm', ['run', 'build'], { cwd: root, stdio: 'pipe', maxBuffer: 16 * 1024 * 1024 });
	const packed = JSON.parse(execFileSync('npm', ['pack', '--json', '--pack-destination', directory], { cwd: root, encoding: 'utf8' }));
	const archive = path.join(directory, packed[0].filename);
	await cp(path.join(here, 'fixture'), consumer, { recursive: true });
	await writeFile(path.join(consumer, 'package.json'), JSON.stringify({
		name: 'packed-orange-consumer', private: true, type: 'module',
		dependencies: {
			'orange-orm': `file:${archive}`,
			'@sqlite.org/sqlite-wasm': '3.53.0-build1',
			'@electric-sql/pglite': '0.3.16',
			express: '4.21.2'
		}
	}, null, 2));
	execFileSync('npm', ['install', '--no-audit', '--no-fund'], { cwd: consumer, stdio: 'pipe' });
	const requireConsumer = createRequire(path.join(consumer, 'package.json'));
	const packageRoot = path.resolve(path.dirname(requireConsumer.resolve('orange-orm')), '..');
	const entry = await readFile(path.join(packageRoot, 'dist/index.browser.mjs'), 'utf8');
	for (const worker of ['sqlite-worker.mjs', 'sqlite-url-worker.mjs', 'managed-sync-worker.mjs']) {
		assert.ok(entry.includes(`new Worker(new URL('./${worker}', import.meta.url)`), `Published worker reference: ${worker}`);
		assert.ok(packed[0].files.some(file => file.path === `dist/${worker}`));
	}
	assert.match(await readFile(path.join(packageRoot, 'dist/sqlite-worker.mjs'), 'utf8'), /import .* from '@sqlite.org\/sqlite-wasm'/);
	assert.ok(!entry.includes('URL.createObjectURL'));
	assert.ok(!entry.includes('../../@sqlite.org'));
	// Also exercise the browser-conditioned package import without DOM/Worker globals.
	execFileSync(process.execPath, ['--conditions=browser', '--input-type=module', '-e',
		'import orange from \'orange-orm\'; if (typeof orange.map !== \'function\') throw Error(\'SSR import failed\');'
	], { cwd: consumer, stdio: 'pipe' });
	const orange = requireConsumer('orange-orm');
	const express = requireConsumer('express');
	const { setupChangeTracking } = requireConsumer(path.join(packageRoot, 'src/sync/setupChangeTracking.js'));
	const map = orange.map(({ table }) => ({
		project: table('project').map(({ column }) => ({
			id: column('id').string().primary().notNull(),
			title: column('title').string().notNull()
		}))
	}));
	browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
	report.chromium = browser.version();
	const requestedCase = process.argv.find(arg => arg.startsWith('--case='))?.slice(7);
	const variants = requestedCase ? [requestedCase] : probe ? ['vite-default-dev', 'vite-orange-excluded-dev'] : ['vite-dev', 'vite-production', 'webpack-dev', 'webpack-production'];
	for (const variant of variants) {
		// Each variant has its own PGlite server and browser storage partition.
		// Keep the in-memory server alive while a production build compiles.
		const remote = map({ db: con => con.pglite(undefined, { size: 1, min: 1 }) });
		let syncServer;
		let appServer;
		const context = await browser.newContext();
		const result = { variant, vfs, isolated, requests: [], workers: [], errors: [] };
		const responseBodies = [];
		report.cases.push(result);
		try {
			await remote.query('CREATE TABLE project (id TEXT PRIMARY KEY NOT NULL, title TEXT NOT NULL)');
			await setupChangeTracking(remote, { project: remote.tables.project });
			await remote.project.insert({ id: 'remote', title: `From ${variant}` });
			const syncApp = express();
			syncApp.use((req, res, next) => {
				res.set('Access-Control-Allow-Origin', '*');
				res.set('Access-Control-Allow-Headers', '*');
				res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
				if (req.method === 'OPTIONS') return res.sendStatus(204);
				next();
			});
			syncApp.use(express.json({ limit: '2mb' }));
			syncApp.use('/sync', remote.express({ sync: true }));
			syncServer = await listen(syncApp);
			const syncUrl = `http://127.0.0.1:${syncServer.address().port}/sync`;
			appServer = await startApp(variant, consumer, express);
			const page = await context.newPage();
			page.setDefaultTimeout(60000);
			context.on('response', response => {
				const entry = { url: response.url(), status: response.status() };
				result.requests.push(entry);
				if (response.status() >= 400)
					responseBodies.push(response.text().then(body => { entry.body = body; }).catch(() => {}));
			});
			page.on('worker', worker => result.workers.push(worker.url()));
			page.on('pageerror', error => result.errors.push(error.stack));
			page.on('console', message => {
				if (message.type() === 'error') result.errors.push(message.text());
			});
			const url = `${appServer.url}?vfs=${vfs}&sync=${encodeURIComponent(syncUrl)}`;
			await page.goto(url);
			await page.waitForFunction(() => !!window.fixture);
			const call = (method, ...args) => {
				console.log(`${variant}: ${method}`);
				return page.evaluate(async ({ method, args }) => {
					return await Promise.race([
						window.fixture[method](...args),
						new Promise((_, reject) => setTimeout(() => reject(new Error(`Timed out: ${method}`)), 45000))
					]);
				}, { method, args });
			};
			assert.deepEqual(await call('writeLocal'), [{ id: 'local', title: 'Persistent local data' }]);
			await page.reload();
			await page.waitForFunction(() => !!window.fixture);
			assert.deepEqual(await call('readLocal'), [{ id: 'local', title: 'Persistent local data' }]);
			result.persistence = true;
			await call('openSync');
			await call('sync');
			assert.equal((await call('readSynced'))[0].title, `From ${variant}`);
			result.pull = true;
			const workerNames = await Promise.all(page.workers().map(worker => worker.evaluate(() => self.name)));
			assert.equal(workerNames.filter(name => name === 'orange-orm-sync').length, 1);
			assert.equal(page.workers().filter(worker => !new URL(worker.url()).searchParams.has('vfs')).length, 5,
				'One plain SQLite worker, three shared sync databases, and one sync worker');
			await call('insertSynced', 'online', 'Written online');
			await call('sync');
			assert.equal((await remote.project.getById('online')).title, 'Written online');
			result.push = true;
			await context.setOffline(true);
			await call('insertSynced', 'offline', 'Written offline');
			assert.ok((await call('readSynced')).some(row => row.id === 'offline'));
			await assert.rejects(call('sync'));
			assert.equal(await remote.project.getById('offline'), undefined);
			await context.setOffline(false);
			// Persist the pending outbox across a page reload, then reconnect.
			await page.reload();
			await page.waitForFunction(() => !!window.fixture);
			await call('openSync');
			assert.ok((await call('readSynced')).some(row => row.id === 'offline'));
			await call('sync');
			assert.equal((await remote.project.getById('offline')).title, 'Written offline');
			result.offlineAndReconnect = true;
			await call('close');
			assert.deepEqual(await call('checkModuleOverride'), [{ customModule: true }]);
			result.moduleUrlOverride = true;
			assert.ok(result.requests.some(request => /\.wasm(?:\?|$)/.test(request.url) && request.status === 200), 'WASM loaded in browser');
			if (isolated)
				assert.ok(result.requests.some(request => /[?&]vfs=opfs/.test(request.url) && request.status === 200), 'SQLite OPFS helper loaded');
			assert.deepEqual(result.requests.filter(request => request.status >= 400), [], 'No HTTP failures');
			assert.ok(result.requests.every(request => new URL(request.url).hostname === '127.0.0.1'), 'No CDN dependencies');
			if (variant.endsWith('production')) {
				const origin = new URL(appServer.url).origin;
				assert.ok(result.requests.filter(request => new URL(request.url).origin === origin)
					.every(request => new URL(request.url).pathname.startsWith('/nested/app/')), 'Subdirectory asset URLs');
			}
			// Offline network errors are expected; worker/runtime exceptions are not.
			assert.deepEqual(result.errors.filter(error => !/ERR_INTERNET_DISCONNECTED|Failed to fetch/.test(error)), []);
			result.passed = true;
			console.log(`${variant}: persistence, pull, push, offline/reconnect, assets PASS`);
		}
		catch (error) {
			await Promise.all(responseBodies);
			result.failure = error.stack;
			console.error(`${variant}: ${error.stack}`);
			console.error(JSON.stringify({ errors: result.errors, failedRequests: result.requests.filter(request => request.status >= 400) }, null, 2));
			if (!probe) throw error;
		}
		finally {
			await context.close();
			await appServer?.close();
			if (syncServer) await closeServer(syncServer);
			await remote.close();
		}
	}
	passed = true;
}
finally {
	await browser?.close();
	await writeFile(path.join(directory, 'report.json'), JSON.stringify(report, null, 2));
	console.log(`Report: ${path.join(directory, 'report.json')}`);
	if (passed && process.env.ORANGE_BROWSER_CLEANUP === '1') await rm(directory, { recursive: true, force: true });
}

async function startApp(variant, consumer, express) {
	const base = variant.endsWith('production') ? '/nested/app/' : '/';
	if (variant.startsWith('vite')) {
		const config = {
			root: consumer, configFile: false, base,
			optimizeDeps: { exclude: variant === 'vite-default-dev' ? [] : ['orange-orm'] },
			server: { host: '127.0.0.1', port: 0, headers },
			build: { outDir: 'dist-vite' }
		};
		if (variant.endsWith('dev')) {
			const server = await createViteServer(config);
			await server.listen();
			assert.equal((await server.ssrLoadModule('/ssr.js')).imported, true);
			return { url: `http://127.0.0.1:${server.httpServer.address().port}/`, close: () => server.close() };
		}
		await build(config);
		return staticServer(express, path.join(consumer, 'dist-vite'), base);
	}
	const production = variant.endsWith('production');
	const outputPath = path.join(consumer, production ? 'dist-webpack' : 'dev-webpack');
	const compiler = webpack({
		context: consumer, mode: production ? 'production' : 'development',
		entry: './main.js',
		output: { path: outputPath, filename: 'main.js', publicPath: base },
		devtool: false,
		performance: { hints: false }
	});
	if (!production) {
		const server = new WebpackDevServer({
			host: '127.0.0.1', port: 0, headers,
			static: { directory: consumer }, client: false,
			devMiddleware: { stats: 'errors-warnings' }
		}, compiler);
		await server.start();
		return { url: `http://127.0.0.1:${server.server.address().port}/`, close: () => server.stop() };
	}
	try {
		await new Promise((resolve, reject) => compiler.run((error, stats) => {
			if (error || stats.hasErrors()) reject(error || new Error(stats.toString({ all: false, errors: true })));
			else resolve();
		}));
	}
	finally { await new Promise((resolve, reject) => compiler.close(error => error ? reject(error) : resolve())); }
	await cp(path.join(consumer, 'index.html'), path.join(outputPath, 'index.html'));
	return staticServer(express, outputPath, base);
}

async function staticServer(express, directory, base) {
	const app = express();
	app.use((_, response, next) => { response.set(headers); next(); });
	app.use(base, express.static(directory));
	const server = await listen(app);
	return { url: `http://127.0.0.1:${server.address().port}${base}`, close: () => closeServer(server) };
}
function listen(app) { return new Promise(resolve => { const server = app.listen(0, '127.0.0.1', () => resolve(server)); }); }
function closeServer(server) { return new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
