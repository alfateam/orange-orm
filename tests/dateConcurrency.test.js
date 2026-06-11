import { describe, expect, test } from 'vitest';

const newUpdateCommandCore = require('../src/table/commands/newUpdateCommandCore');
const newParameterized = require('../src/table/query/newParameterized');

describe('date concurrency comparison', () => {
	test('uses direct pg comparison for dateWithTimeZone columns', () => {
		const command = buildCommand({ hasTimeZone: true });

		expect(command.sql()).toContain('"updatedAt" IS NOT DISTINCT FROM ?');
		expect(command.sql()).not.toContain('date_trunc');
		expect(command.parameters).toContain('2026-06-03T11:00:00.123Z');
	});
});

function buildCommand({ hasTimeZone }) {
	const context = {
		rdb: {
			engine: 'pg',
			quote: (name) => '"' + name + '"'
		}
	};
	const idColumn = {
		alias: 'id',
		_dbName: 'id',
		encode: (_context, value) => newParameterized('?', [value])
	};
	const updatedAtColumn = {
		alias: 'updatedAt',
		_dbName: 'updatedAt',
		tsType: 'DateColumn',
		hasTimeZone,
		encode: (_context, value) => newParameterized('?', [value])
	};
	const table = {
		_dbName: 'project',
		_primaryColumns: [idColumn],
		_columnDiscriminators: [],
		id: idColumn,
		updatedAt: updatedAtColumn
	};
	return newUpdateCommandCore(
		context,
		table,
		{ updatedAt: updatedAtColumn },
		{ id: 1, updatedAt: '2026-06-03T11:01:00.000Z' },
		{ columns: { updatedAt: { oldValue: '2026-06-03T11:00:00.123Z' } } }
	);
}
