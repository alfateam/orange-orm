import { describe, expect, test } from 'vitest';

const rdb = require('../src/index');
const { ensureSyncSchema } = require('../src/client/syncSchema');

describe('sync schema', () => {
	test('creates local sqlite schema from mapped tables and stores checksum', async () => {
		const map = createMap();
		const client = toClient(map);
		const db = newFakeDb();

		await ensureSyncSchema(db, client, ['customer', 'order'], {});

		expect(db.statements.some(x => x.includes('CREATE TABLE IF NOT EXISTS "customer"'))).toBe(true);
		expect(db.statements.some(x => x.includes('"id" INTEGER PRIMARY KEY'))).toBe(true);
		expect(db.statements.some(x => x.includes('"name" TEXT NOT NULL'))).toBe(true);
		expect(db.statements.some(x => x.includes('CREATE TABLE IF NOT EXISTS "order"'))).toBe(true);
		expect(db.schemaStates.length).toBe(1);
		expect(db.schemaStates[0].scope).toBe('sync:customer|order');
		expect(db.schemaStates[0].checksum).toMatch(/^fnv1a32:/);
	});

	test('throws when stored schema checksum differs from current map', async () => {
		const map = createMap();
		const client = toClient(map);
		const db = newFakeDb();

		await ensureSyncSchema(db, client, ['customer'], {});

		const changedMap = rdb.map((x) => ({
			customer: x.table('customer').map(({ column }) => ({
				id: column('id').numeric().primary().notNullExceptInsert(),
				name: column('name').string().notNull(),
				email: column('email').string()
			}))
		}));

		await expect(ensureSyncSchema(db, toClient(changedMap), ['customer'], {}))
			.rejects.toThrow('Local sync schema does not match current map');
	});
});

function createMap() {
	return rdb.map((x) => ({
		customer: x.table('customer').map(({ column }) => ({
			id: column('id').numeric().primary().notNullExceptInsert(),
			name: column('name').string().notNull(),
			isActive: column('isActive').boolean()
		})),
		order: x.table('order').map(({ column }) => ({
			companyId: column('companyId').string().primary().notNullExceptInsert(),
			orderNo: column('orderNo').numeric().primary().notNullExceptInsert(),
			orderDate: column('orderDate').dateWithTimeZone()
		}))
	}));
}

function toClient(map) {
	const tables = {};
	for (let name in map) {
		if (map[name] && map[name]._dbName)
			tables[name] = map[name];
	}
	return { tables };
}

function newFakeDb() {
	const schemaStates = [];
	const statements = [];
	return {
		schemaStates,
		statements,
		async query(sql) {
			statements.push(sql);
			if (sql.startsWith('SELECT "checksum"')) {
				const scope = extractScope(sql);
				const state = schemaStates.find(x => x.scope === scope);
				return state ? [{ checksum: state.checksum }] : [];
			}
			if (sql.startsWith('INSERT INTO "orange_schema_state"')) {
				const values = extractStringValues(sql);
				schemaStates.push({
					scope: values[0],
					checksum: values[4]
				});
			}
			return [];
		}
	};
}

function extractScope(sql) {
	const match = sql.match(/WHERE "scope" = '((?:''|[^'])*)'/);
	return match ? match[1].replace(/''/g, '\'') : undefined;
}

function extractStringValues(sql) {
	const values = [];
	const pattern = /'((?:''|[^'])*)'/g;
	let match;
	while ((match = pattern.exec(sql)))
		values.push(match[1].replace(/''/g, '\''));
	return values;
}
