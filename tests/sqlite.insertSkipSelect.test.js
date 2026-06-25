import { describe, expect, test } from 'vitest';

const sqliteInsert = require('../src/sqlite/insert');
const insertSql = require('../src/sqlite/insertSql');
const batchInsert = require('../src/sqlite/batchInsert');
const patchTable = require('../src/patchTable');
const insertAndForget = require('../src/table/insertAndForget');
const newParameterized = require('../src/table/query/newParameterized');

describe('sqlite insert skipSelectAfterInsert', () => {
	test('does not select inserted row when option is set', async () => {
		const commands = [];
		const queries = [];
		const context = {
			rdb: {
				changes: [],
				dbClient: {
					executeCommand(query, callback) {
						commands.push(sqlOf(query));
						callback(null, []);
					},
					executeQuery(query, callback) {
						queries.push(sqlOf(query));
						callback(null, []);
					}
				},
				insertSql,
				multipleStatements: false
			}
		};
		const table = newTable();
		const row = {
			id: 1,
			name: 'Acme',
			__id: true,
			__name: true,
			hydrate(_context, values) {
				this.hydratedWith = values;
			}
		};

		const result = await sqliteInsert(context, table, row, {
			concurrency: 'overwrite',
			skipSelectAfterInsert: true
		});

		expect(commands).toHaveLength(1);
		expect(commands[0]).toContain('INSERT INTO "customer"');
		expect(queries).toEqual([]);
		expect(result).toEqual([{ id: 1, name: 'Acme' }]);
	});

	test('batch inserts flat insertAndForget rows through patchTable', async () => {
		const commands = [];
		const context = newContext(commands, 999);
		const table = newTable();

		const result = await patchTable(context, table, [
			{ op: 'add', path: '/0', value: { id: 1, name: 'Acme' } },
			{ op: 'add', path: '/1', value: { id: 2, name: 'Beta' } }
		], {
			strategy: { insertAndForget: true },
			concurrency: 'overwrite'
		});

		expect(result).toEqual({ changed: [], strategy: { insertAndForget: true } });
		expect(commands).toHaveLength(1);
		expect(commands[0].sql).toBe('INSERT INTO "customer" ("id","name") VALUES (?,?),(?,?) ON CONFLICT("id") DO UPDATE SET "id"=excluded."id","name"=excluded."name"');
		expect(commands[0].parameters).toEqual([1, 'Acme', 2, 'Beta']);
	});

	test('batch insert groups rows by shape', async () => {
		const commands = [];
		const context = newContext(commands, 999);
		const table = newTable();

		await batchInsert(context, table, [
			newRow({ id: 1, name: 'Acme' }),
			newRow({ id: 2 }),
			newRow({ id: 3, name: 'Beta' })
		], {});

		expect(commands).toHaveLength(2);
		expect(commands[0].sql).toBe('INSERT INTO "customer" ("id","name") VALUES (?,?),(?,?)');
		expect(commands[0].parameters).toEqual([1, 'Acme', 3, 'Beta']);
		expect(commands[1].sql).toBe('INSERT INTO "customer" ("id") VALUES (?)');
		expect(commands[1].parameters).toEqual([2]);
	});

	test('batch insert chunks by maxParameters', async () => {
		const commands = [];
		const context = newContext(commands, 4);
		const table = newTable();

		await batchInsert(context, table, [
			newRow({ id: 1, name: 'Acme' }),
			newRow({ id: 2, name: 'Beta' }),
			newRow({ id: 3, name: 'Core' })
		], {});

		expect(commands).toHaveLength(2);
		expect(commands[0].sql).toBe('INSERT INTO "customer" ("id","name") VALUES (?,?),(?,?)');
		expect(commands[0].parameters).toEqual([1, 'Acme', 2, 'Beta']);
		expect(commands[1].sql).toBe('INSERT INTO "customer" ("id","name") VALUES (?,?)');
		expect(commands[1].parameters).toEqual([3, 'Core']);
	});

	test('batch insert chunks by actual encoded parameter count', async () => {
		const commands = [];
		const context = newContext(commands, 3);
		const table = newTable();

		await batchInsert(context, table, [
			newRow({ id: 1, name: null }),
			newRow({ id: 2, name: 'Beta' }),
			newRow({ id: 3, name: 'Core' })
		], {});

		expect(commands).toHaveLength(2);
		expect(commands[0].sql).toBe('INSERT INTO "customer" ("id","name") VALUES (?,null),(?,?)');
		expect(commands[0].parameters).toEqual([1, 2, 'Beta']);
		expect(commands[1].sql).toBe('INSERT INTO "customer" ("id","name") VALUES (?,?)');
		expect(commands[1].parameters).toEqual([3, 'Core']);
	});

	test('insertAndForget clears temporary primary keys before batching', async () => {
		const commands = [];
		const context = newContext(commands, 999);
		const table = newTable();

		await patchTable(context, table, [
			{ op: 'add', path: '/0', value: { id: '~tmp-1', name: 'Acme' } },
			{ op: 'add', path: '/1', value: { id: '~tmp-2', name: 'Beta' } }
		], {
			strategy: { insertAndForget: true }
		});

		expect(commands).toHaveLength(1);
		expect(commands[0].sql).toBe('INSERT INTO "customer" ("name") VALUES (?),(?)');
		expect(commands[0].parameters).toEqual(['Acme', 'Beta']);
	});

	test('does not batch non-flat insertAndForget patches', async () => {
		const commands = [];
		const context = newContext(commands, 999);
		const table = newTable();
		let fallbackInserts = 0;
		table.insertWithConcurrency = async function() {
			fallbackInserts++;
			return {};
		};

		await patchTable(context, table, [
			{ op: 'add', path: '/0', value: { id: 1, name: 'Acme', ignored: true } },
			{ op: 'add', path: '/1', value: { id: 2, name: 'Beta' } }
		], {
			strategy: { insertAndForget: true },
			concurrency: 'overwrite',
			skipSelectAfterInsert: true
		});

		expect(commands).toHaveLength(0);
		expect(fallbackInserts).toBe(2);
	});
});

function newTable() {
	const idColumn = newColumn('id', true);
	const nameColumn = newColumn('name', false);
	const table = {
		_dbName: 'customer',
		_columns: [idColumn, nameColumn],
		_primaryColumns: [idColumn],
		_columnDiscriminators: [],
		_relations: {},
		_aliases: new Set(['id', 'name']),
		_cache: {
			getInnerCache() {
				return {};
			}
		},
		_emitChanged: Object.assign(() => [], { callbacks: [] })
	};
	table.id = idColumn;
	table.name = nameColumn;
	table.insertAndForget = function(context, options, values) {
		return insertAndForget(context, { table, options }, values);
	};
	return table;
}

function newColumn(alias, isPrimary) {
	return {
		alias,
		_dbName: alias,
		isPrimary,
		dbNull: null,
		equal() {},
		purify(value) {
			return value;
		},
		decode(_context, value) {
			return value;
		},
		encode(_context, value) {
			if (value === null)
				return newParameterized('null');
			return newParameterized('?', [value]);
		}
	};
}

function newContext(commands, maxParameters) {
	return {
		rdb: {
			changes: [],
			cache: {},
			engine: 'sqlite',
			maxParameters,
			dbClient: {
				executeCommand(query, callback) {
					commands.push({
						sql: sqlOf(query),
						parameters: query.parameters
					});
					callback(null, []);
				},
				executeQuery(_query, callback) {
					callback(null, []);
				}
			},
			insertSql,
			batchInsert,
			multipleStatements: false
		}
	};
}

function newRow(values) {
	const row = {};
	for (let key in values) {
		row[key] = values[key];
		row['__' + key] = values[key];
	}
	return row;
}

function sqlOf(query) {
	return typeof query.sql === 'function' ? query.sql() : query;
}
