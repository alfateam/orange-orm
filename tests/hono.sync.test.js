import { describe, expect, test } from 'vitest';
import { Hono } from 'hono';

const hostHono = require('../src/hostHono');

describe('Hono sync adapter', () => {
	test('routes sync push requests through the shared sync protocol', async () => {
		const calls = [];
		const app = createApp({
			commands: {
				record: async (tx, args) => {
					calls.push([tx, args]);
					return args.value;
				}
			}
		});

		const response = await app.request('http://localhost/rdb?sync=push', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				phase: 'push',
				clientId: 'client-1',
				mutations: [{
					id: 'mutation-1',
					commands: [{ name: 'record', args: { value: 42 } }]
				}]
			})
		});

		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			phase: 'push',
			applied: 1,
			results: [{
				id: 'mutation-1',
				commands: [{ name: 'record', result: 42 }]
			}]
		});
		expect(calls).toHaveLength(1);
		expect(calls[0][1]).toEqual({ value: 42 });
	});

	test('returns 404 when sync is disabled', async () => {
		const app = createApp({ sync: false });
		const response = await app.request('http://localhost/rdb?sync=keys', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ phase: 'keys' })
		});

		expect(response.status).toBe(404);
	});
});

function createApp(options = {}) {
	const tx = {
		query: async (sql) => sql.includes('RETURNING result_json')
			? [{ result_json: null }]
			: []
	};
	const table = {
		_dbName: 'item',
		_primaryColumns: [{ alias: 'id', _dbName: 'id' }]
	};
	const client = {
		db: {},
		tables: { item: table },
		__commands: {},
		query: async () => [],
		transaction: async (fn) => fn(tx)
	};
	const app = new Hono();
	const handler = hostHono(() => ({}), client, options);
	app.all('/rdb', handler);
	app.all('/rdb/*', handler);
	return app;
}
