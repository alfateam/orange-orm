import { afterEach, describe, expect, test } from 'vitest';
import installSqliteWorker from '../src/sqliteOPFS/workerHandler.mjs';

const createClient = require('../src/sqliteOPFS/workerClient');
let restore;
afterEach(() => restore?.());

describe('SQLite module worker protocol', () => {
	test('shares the database and prioritizes UI leases across ports', async () => {
		const { worker, responses, opened } = createModuleWorker();
		const ui = createClient('shared.sqlite3', { worker, vfs: 'opfs-wl' });
		const sync = createClient('shared.sqlite3', {
			worker: ui.connectPort(), vfs: 'opfs-wl', closeDbOnClose: false
		});
		try {
			await Promise.all([ui.ready, sync.ready]);
			const first = await ui.checkout();
			const events = [];
			const background = sync.checkout(1).then(lease => { events.push('sync'); return lease; });
			await tick();
			const foreground = ui.checkout(0).then(lease => { events.push('ui'); return lease; });
			await tick();
			expect(events).toEqual([]);
			await first.releaseCheckout();
			const uiLease = await foreground;
			expect(events).toEqual(['ui']);
			expect(await query(uiLease, 'SELECT 1')).toEqual([{ value: 1 }]);
			await uiLease.releaseCheckout();
			const syncLease = await background;
			expect(events).toEqual(['ui', 'sync']);
			await syncLease.releaseCheckout();
			expect(opened).toEqual(['/shared.sqlite3']);
			expect(responses.some(message => Array.isArray(message.result) && message.elapsedMs >= 0)).toBe(true);
		}
		finally {
			await sync.close();
			await ui.close();
		}
	});

	test('keeps processing after a SQL error and reopens the database without initializing SQLite again', async () => {
		const { worker, initialized } = createModuleWorker();
		const client = createClient('recover.sqlite3', {
			worker, vfs: 'opfs-wl'
		});
		try {
			await expect(query(client, 'FAIL')).rejects.toThrow('SQL failed');
			expect(await query(client, 'SELECT 1')).toEqual([{ value: 1 }]);
			await client.suspendDatabase();
			expect(await query(client, 'SELECT 1')).toEqual([{ value: 1 }]);
			expect(initialized).toHaveLength(1);
			expect(initialized[0].connectionString).toBe('recover.sqlite3');
		}
		finally { await client.close(); }
	});
});

function createModuleWorker() {
	const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'self');
	restore = () => {
		if (descriptor) Object.defineProperty(globalThis, 'self', descriptor);
		else delete globalThis.self;
	};
	const listeners = new Set();
	const responses = [];
	const opened = [];
	const initialized = [];
	const scope = {
		postMessage(message) {
			responses.push(message);
			queueMicrotask(() => listeners.forEach(listener => listener({ data: message })));
		}
	};
	Object.defineProperty(globalThis, 'self', { configurable: true, value: scope });
	installSqliteWorker(options => {
		initialized.push(options);
		return Promise.resolve({ oo1: { OpfsWlDb: class {
			constructor(filename) { this.filename = filename; opened.push(filename); }
			exec(arg) {
				if (arg.sql === 'FAIL') throw new Error('SQL failed');
				return arg.returnValue === 'resultRows' ? [{ value: 1 }] : undefined;
			}
			close() {}
		} } });
	});
	return {
		opened, initialized, responses,
		worker: {
			postMessage(data, ports) { queueMicrotask(() => scope.onmessage({ data, ports })); },
			addEventListener(type, listener) { if (type === 'message') listeners.add(listener); },
			removeEventListener(type, listener) { if (type === 'message') listeners.delete(listener); },
			terminate() {}
		}
	};
}
function query(client, sql) {
	return new Promise((resolve, reject) => client.executeQuery({ sql: () => sql }, (error, rows) => error ? reject(error) : resolve(rows)));
}
function tick() { return new Promise(resolve => setTimeout(resolve, 20)); }
