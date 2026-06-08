import { describe, expect, test } from 'vitest';

const createDomain = require('../src/createDomain');
const newTransaction = require('../src/sqliteOPFS/newTransaction');
const executeQuery = require('../src/table/executeQueries/executeQuery');
const executeCommand = require('../src/table/executeQueries/executeCommand');

describe('sqliteOPFS readonly lane', () => {
	test('routes readonly queries to connectRead', async () => {
		const calls = [];
		const pool = newPool(calls);
		const domain = createDomain();

		await domain.run(() => new Promise(newTransaction(domain, pool, { readonly: true })));
		const rows = await executeQuery(domain, newSql('SELECT 1'));

		expect(rows).toEqual([{ ok: true }]);
		expect(calls).toEqual(['read:query']);
	});

	test('keeps commands on write connection in readonly context', async () => {
		const calls = [];
		const pool = newPool(calls);
		const domain = createDomain();

		await domain.run(() => new Promise(newTransaction(domain, pool, { readonly: true })));
		const result = await executeCommand(domain, newSql('UPDATE customer SET name = name'));

		expect(result).toEqual({ rowsAffected: 1 });
		expect(calls).toEqual(['write:command']);
	});
});

function newPool(calls) {
	return {
		connect(cb) {
			cb(null, {
				executeCommand(_query, callback) {
					calls.push('write:command');
					callback(null, { rowsAffected: 1 });
				}
			}, () => {});
		},
		connectRead(cb) {
			cb(null, {
				executeQuery(_query, callback) {
					calls.push('read:query');
					callback(null, [{ ok: true }]);
				}
			}, () => {});
		}
	};
}

function newSql(sql) {
	return {
		sql: () => sql,
		parameters: []
	};
}
