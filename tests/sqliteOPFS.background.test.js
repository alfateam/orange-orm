import { afterEach, describe, expect, test } from 'vitest';
const createWorker = require('../src/sqliteOPFS/inlineWorker');
const createClient = require('../src/sqliteOPFS/workerClient');
const connectPort = require('../src/sqliteOPFS/connectWorkerPort');
const newDatabase = require('../src/sqliteOPFS/newDatabase');
const lifecycle = require('../src/sqliteOPFS/backgroundLifecycle');
const { createSyncAuto } = require('../src/client/syncAuto');
const closes = [];
afterEach(async () => { while (closes.length) await closes.pop()(); });

function fixture() {
	const events = [], sql = [];
	let paused = false, open = 0, failPause = false, inTransaction = false, foreignKeys = 0;
	const pool = {
		vfsName: 'opfs-sahpool-fixture',
		isPaused: () => paused,
		unpauseVfs() { events.push('unpause'); paused = false; },
		pauseVfs() {
			expect(open).toBe(0);
			if (failPause) throw new Error('handle close failed');
			events.push('pause'); paused = true;
		},
		OpfsSAHPoolDb: class {
			constructor(filename) { expect(paused).toBe(false); this.filename = filename; foreignKeys = 0; open++; events.push('open'); }
			exec(arg) {
				const text = typeof arg === 'object' ? arg.sql : arg;
				if (typeof arg === 'object') sql.push(text);
				if (/^PRAGMA foreign_keys=/.test(text)) foreignKeys = Number(text.split('=')[1]);
				if (text === 'BEGIN') inTransaction = true;
				if (text === 'COMMIT' || text === 'ROLLBACK') inTransaction = false;
				return [];
			}
			close() { events.push('close'); open--; }
			changes() { return 0; }
			selectValue(text) { return text === 'PRAGMA foreign_keys' ? foreignKeys : 0; }
		}
	};
	const worker = createWorker({ sqlite3InitModule: () => ({ installOpfsSAHPoolVfs: async () => pool, capi: { sqlite3_get_autocommit: () => inTransaction ? 0 : 1 } }) });
	const client = createClient('background.sqlite3', { worker, vfs: 'opfs-sahpool' });
	closes.push(() => client.close());
	return { worker, client, events, sql, foreignKeys: () => foreignKeys, failPause: () => { failPause = true; } };
}
const query = (client, text) => new Promise((resolve, reject) => client.executeQuery({ sql: () => text, parameters: [] }, (e, rows) => e ? reject(e) : resolve(rows)));
const tick = () => new Promise(resolve => setTimeout(resolve, 5));

describe('opt-in OPFS background lifecycle', () => {
	test('disabled option does not subscribe or close an idle database', async () => {
		const f = fixture();
		const db = newDatabase('background.sqlite3', { worker: f.worker, vfs: 'opfs-sahpool', lifecycle: {
			suspendWhenHidden: false, visibility: { isVisible: () => false, subscribe() { throw new Error('must not subscribe'); } }
		} });
		closes.push(() => db.end());
		await f.client.ready;
		await query(f.client, 'SELECT 1'); await tick();
		expect(f.events).toEqual(['open']);
	});

	test('pauses an idle pool without terminating its worker and reopens for the next query', async () => {
		const f = fixture(); await f.client.ready;
		await f.client.setBackground(true); await tick();
		expect(f.events).toEqual(['open', 'close', 'pause']);
		await f.client.setBackground(false);
		await query(f.client, 'SELECT 1'); await query(f.client, 'SELECT 2');
		expect(f.events).toEqual(['open', 'close', 'pause', 'unpause', 'open']);
	});

	test('restores foreign-key enforcement after reopening', async () => {
		const f = fixture(); await f.client.ready;
		await query(f.client, 'PRAGMA foreign_keys=1'); expect(f.foreignKeys()).toBe(1);
		await f.client.setBackground(true); await tick();
		await f.client.setBackground(false); await query(f.client, 'SELECT 1');
		expect(f.foreignKeys()).toBe(1);
		expect(f.events).toEqual(['open', 'close', 'pause', 'unpause', 'open']);
	});

	test('does not close between statements in a transaction held by a different port', async () => {
		const f = fixture();
		const other = createClient('background.sqlite3', { worker: connectPort(f.worker), vfs: 'opfs-sahpool', closeDbOnClose: false });
		closes.push(() => other.close());
		const tx = await other.checkout();
		await query(tx, 'BEGIN');
		await f.client.setBackground(true); await tick();
		expect(f.events).toEqual(['open']);
		await query(tx, 'INSERT INTO example VALUES (1)'); await query(tx, 'COMMIT');
		await tx.releaseCheckout(); await tick();
		expect(f.events).toEqual(['open', 'close', 'pause']);
		expect(f.sql).toEqual(['BEGIN', 'INSERT INTO example VALUES (1)', 'COMMIT']);
	});

	test('does not implicitly roll back a raw SQL transaction between requests', async () => {
		const f = fixture(); await f.client.ready;
		await query(f.client, 'BEGIN'); await f.client.setBackground(true); await tick();
		expect(f.events).toEqual(['open']);
		await query(f.client, 'COMMIT'); await tick();
		expect(f.events).toEqual(['open', 'close', 'pause']);
	});

	test('finishes a rollback and queued checkouts before pausing', async () => {
		const f = fixture(); const tx = await f.client.checkout();
		await query(tx, 'BEGIN'); await f.client.setBackground(true);
		const next = f.client.checkout();
		await query(tx, 'ROLLBACK'); await tx.releaseCheckout();
		const second = await next; await tick();
		expect(f.events).toEqual(['open']);
		await second.releaseCheckout(); await tick();
		expect(f.events).toEqual(['open', 'close', 'pause']);
	});

	test('a foreground transition cancels suspension while a transaction is finishing', async () => {
		const f = fixture(); const tx = await f.client.checkout();
		await f.client.setBackground(true); await f.client.setBackground(false);
		await tx.releaseCheckout(); await tick();
		expect(f.events).toEqual(['open']);
	});

	test('a sync hold spans idle gaps and releases after the whole sync finishes', async () => {
		const f = fixture(); await f.client.ready;
		const release = await f.client.holdBackground();
		await f.client.setBackground(true); await query(f.client, 'SELECT 1'); await tick();
		expect(f.events).toEqual(['open']);
		await release(); await release(); await tick();
		expect(f.events).toEqual(['open', 'close', 'pause']);
	});

	test('a late local write can reopen while hidden and closes again after commit', async () => {
		const f = fixture(); await f.client.ready; await f.client.setBackground(true); await tick();
		const tx = await f.client.checkout();
		await query(tx, 'BEGIN'); await query(tx, 'INSERT INTO example VALUES (2)'); await query(tx, 'COMMIT');
		await tx.releaseCheckout(); await tick();
		expect(f.events).toEqual(['open', 'close', 'pause', 'unpause', 'open', 'close', 'pause']);
	});

	test('surfaces a failed handle close instead of silently reopening an uncertain VFS', async () => {
		const f = fixture(); await f.client.ready; f.failPause();
		await f.client.setBackground(true); await tick(); await f.client.setBackground(false);
		await expect(query(f.client, 'SELECT 1')).rejects.toThrow('handle close failed');
		expect(f.events).toEqual(['open', 'close']);
	});

	test('observes initial visibility and removes the listener on close', () => {
		let subscriber, stopped = false; const states = [];
		const off = lifecycle.observe({ lifecycle: { suspendWhenHidden: true, visibility: {
			isVisible: () => false, subscribe(fn) { subscriber = fn; return () => { stopped = true; }; }
		} } }, value => states.push(value));
		subscriber(true); off();
		expect(states).toEqual([false, true]); expect(stopped).toBe(true);
	});

	test('automatic sync stays configured while hidden and runs after foreground return', async () => {
		let visible = false, calls = 0;
		const auto = createSyncAuto({}, async () => ({ auto: { intervalMs: 0 } }), {
			canRun: () => visible, runSync: async () => { calls++; }
		});
		closes.push(() => auto.stop());
		await auto.start(); expect(calls).toBe(0); expect(await auto.isRunning()).toBe(true);
		visible = true; await auto.runNow(); expect(calls).toBe(1);
		visible = false; await auto.runNow(); expect(calls).toBe(1);
	});
});
