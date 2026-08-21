import { describe, expect, test } from 'vitest';

const newSyncClient = require('../src/client/syncClient');
const { readOutboxRowsSymbol } = newSyncClient;

describe('sync outbox paging', () => {
	test('reads past the former 10000 row snapshot boundary without overlap or loss', async () => {
		const sourceRows = newOutboxRows(10001);
		const db = createOutboxDb(sourceRows);
		const syncClient = newSyncClient({ tables: {} }, async () => db, { applyTo() {} });

		const first = await syncClient[readOutboxRowsSymbol]({ statuses: ['pending'], limit: 10000 });
		const last = first[first.length - 1];
		const second = await syncClient[readOutboxRowsSymbol]({
			statuses: ['pending'],
			limit: 10000,
			after: {
				createdAtMs: last.created_at_ms,
				mutationId: last.mutation_id
			}
		});

		expect(first).toHaveLength(10000);
		expect(second).toHaveLength(1);
		expect(second[0].mutation_id).toBe('mutation-10000');
		expect(new Set([...first, ...second].map(row => row.mutation_id)).size).toBe(10001);
	});

	test('replays every local mutation past the former 10000 row boundary', async () => {
		const sourceRows = newOutboxRows(10001);
		const db = createOutboxDb(sourceRows);
		db.__sqliteSync = {
			url: '/rdb',
			auto: false,
			crossTabLock: false,
			schema: false,
			tables: ['project']
		};
		let replayed = 0;
		const transactionClient = {
			project: {
				patch: async () => {
					replayed += 1;
				}
			},
			query: db.query
		};
		const syncClient = newSyncClient({
			tables: {
				project: {
					_dbName: 'project',
					_columns: [],
					_primaryColumns: []
				}
			},
			transaction: async (fn) => fn(transactionClient)
		}, async () => db, {
			applyTo(axios) {
				axios.request = async () => ({
					data: { phase: 'keys', items: [], done: true, cursor: 'cursor-1' }
				});
			}
		});

		await syncClient.sync();

		expect(replayed).toBe(10001);
	}, 15000);
});

function newOutboxRows(count) {
	return Array.from({ length: count }, (_value, index) => ({
		mutation_id: `mutation-${String(index).padStart(5, '0')}`,
		table_name: 'project',
		patch_json: '[]',
		options_json: null,
		created_at_ms: index,
		operation_id: null,
		operation_name: null,
		operation_json: null,
		status: 'pending',
		last_error: null,
		attempts: 0,
		pushed_at_ms: null,
		result_json: null
	}));
}

function createOutboxDb(rows) {
	return {
		__sqliteSync: { url: '/rdb', tables: ['project'] },
		async query(sql) {
			const text = String(sql || '');
			if (!/^SELECT "mutation_id"/u.test(text))
				return [];
			const limit = Number(text.match(/LIMIT (\d+)/u)?.[1] || 10000);
			const cursor = text.match(/"created_at_ms" > (\d+).*"mutation_id" > '([^']+)'/u);
			const filtered = cursor
				? rows.filter(row => row.created_at_ms > Number(cursor[1])
					|| row.created_at_ms === Number(cursor[1]) && row.mutation_id > cursor[2])
				: rows;
			return filtered.slice(0, limit);
		}
	};
}
