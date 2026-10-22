import { afterEach, beforeEach, expect, test } from 'vitest';
const orange = require('../src');
const { setupChangeTracking } = require('../src/sync/setupChangeTracking');
const map = orange.map(({ table }) => ({
	vote: table('vote').map(({ column }) => ({ id: column('id').numeric().primary() })),
	grade: table('grade').map(({ column }) => ({ id: column('id').numeric().primary() }))
}));
let db;
beforeEach(async () => {
	db = map.pglite(undefined, { size: 1 });
	await db.query('CREATE TABLE vote (id integer PRIMARY KEY)');
	await db.query('CREATE TABLE grade (id integer PRIMARY KEY)');
	await setupChangeTracking(db, db.tables);
}, 30000);
afterEach(async () => { await db.close(); });

test('verifies every mapped table under a SELECT-only runtime role', async () => {
	await db.query('CREATE ROLE readiness_reader');
	await db.query('GRANT USAGE ON SCHEMA public TO readiness_reader');
	await db.query('GRANT SELECT ON ALL TABLES IN SCHEMA public TO readiness_reader');
	await db.query('SET ROLE readiness_reader');
	try { await orange.assertSyncReady(db); }
	finally { await db.query('RESET ROLE'); }
});

test('rejects disabled and missing tracking, while allowing unrelated triggers', async () => {
	await db.query('CREATE TRIGGER unrelated AFTER UPDATE ON vote FOR EACH ROW EXECUTE FUNCTION orange_sync__vote__log()');
	await orange.assertSyncReady(db);
	await db.query('ALTER TABLE grade DISABLE TRIGGER orange_sync__grade__update');
	await expect(orange.assertSyncReady(db)).rejects.toThrow('grade (update)');
	await db.query('ALTER TABLE grade ENABLE TRIGGER orange_sync__grade__update');
	await db.query('DROP TRIGGER orange_sync__grade__delete ON grade');
	await expect(orange.assertSyncReady(db)).rejects.toThrow('grade (delete)');
	await db.query('DROP TRIGGER unrelated ON vote');
	await setupChangeTracking(db, db.tables);
	await orange.assertSyncReady(db);
});

test('validates configured log tables without modifying data', async () => {
	const options = { changeTable: 'custom_changes', appliedMutationsTable: 'custom_replay' };
	await expect(orange.assertSyncReady(db, options)).rejects.toThrow();
	await setupChangeTracking(db, db.tables, options);
	await db.vote.insert({ id: 1 });
	const before = await db.query('SELECT * FROM custom_changes');
	await orange.assertSyncReady(db, options);
	expect(await db.query('SELECT * FROM custom_changes')).toEqual(before);
	await db.query('ALTER TABLE custom_replay RENAME COLUMN result_json TO invalid_result');
	await expect(orange.assertSyncReady(db, options)).rejects.toThrow();
});
