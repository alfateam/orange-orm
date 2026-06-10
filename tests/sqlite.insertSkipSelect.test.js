import { describe, expect, test } from 'vitest';

const sqliteInsert = require('../src/sqlite/insert');
const insertSql = require('../src/sqlite/insertSql');
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
		expect(result).toEqual([row]);
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
		_aliases: new Set(['id', 'name']),
		_emitChanged: Object.assign(() => [], { callbacks: [] })
	};
	table.id = idColumn;
	table.name = nameColumn;
	return table;
}

function newColumn(alias, isPrimary) {
	return {
		alias,
		_dbName: alias,
		isPrimary,
		encode(_context, value) {
			return newParameterized('?', [value]);
		}
	};
}

function sqlOf(query) {
	return typeof query.sql === 'function' ? query.sql() : query;
}
