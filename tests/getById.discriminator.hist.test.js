import { describe, test, beforeAll, afterAll, expect } from 'vitest';
const rdb = require('../src/index');

const sqliteName = 'demo.getbyid.discriminator.hist.test.db';

const map = rdb.map(x => ({
	hus: x.table('hus').map(({ column }) => ({
		id: column('hus_id').string().primary().notNull(),
		gaardsbrukId: column('gaardsbruk_id').string().notNull(),
		husTypeId: column('hus_type_id').numeric().notNull(),
		husStatusId: column('hus_status_id').numeric().notNull(),
		husnummer: column('husnummer').numeric().notNull(),
		poststed: column('poststed').string(),
	})),
	innredningType: x.table('innredning_type').map(({ column }) => ({
		id: column('innredning_type_id').numeric().primary().notNull(),
		navn: column('navn').string().notNull(),
	})),
	husVerpehoeneEgenskaper: x.table('hus_verpehoene_egenskaper').map(({ column }) => ({
		id: column('hus_verpehoene_egenskaper_id').string().primary().notNull(),
		husId: column('hus_id').string().notNull(),
		husEgenskapStatusId: column('hus_egenskap_status_id').numeric().notNull(),
		innredningTypeId: column('innredning_type_id').numeric(),
	})).columnDiscriminators('hus_egenskap_status_id=0'),
	husVerpehoeneEgenskaperHistorikk: x.table('hus_verpehoene_egenskaper').map(({ column }) => ({
		id: column('hus_verpehoene_egenskaper_id').string().primary().notNull(),
		husId: column('hus_id').string().notNull(),
		husEgenskapStatusId: column('hus_egenskap_status_id').numeric().notNull(),
		innredningTypeId: column('innredning_type_id').numeric(),
	})).columnDiscriminators('hus_egenskap_status_id=1'),
})).map(x => ({
	husVerpehoeneEgenskaper: x.husVerpehoeneEgenskaper.map(({ references }) => ({
		innredningType: references(x.innredningType).by('innredningTypeId'),
	})),
	hus: x.hus.map(({ hasOne, hasMany }) => ({
		verpehoeneEgenskaper: hasOne(x.husVerpehoeneEgenskaper).by('husId'),
		verpehoeneEgenskaperHistorikk: hasMany(x.husVerpehoeneEgenskaperHistorikk).by('husId'),
	})),
}));

const db = map({ db: (con) => con.sqlite(sqliteName, { size: 1 }) });

beforeAll(async () => {
	const sql = [
		'DROP TABLE IF EXISTS hus_verpehoene_egenskaper',
		'DROP TABLE IF EXISTS innredning_type',
		'DROP TABLE IF EXISTS hus',
		`CREATE TABLE hus (
			hus_id TEXT PRIMARY KEY,
			gaardsbruk_id TEXT NOT NULL,
			hus_type_id INTEGER NOT NULL,
			hus_status_id INTEGER NOT NULL,
			husnummer INTEGER NOT NULL,
			poststed TEXT
		)`,
		`CREATE TABLE innredning_type (
			innredning_type_id INTEGER PRIMARY KEY,
			navn TEXT NOT NULL
		)`,
		`CREATE TABLE hus_verpehoene_egenskaper (
			hus_verpehoene_egenskaper_id TEXT PRIMARY KEY,
			hus_id TEXT NOT NULL,
			hus_egenskap_status_id INTEGER NOT NULL,
			innredning_type_id INTEGER
		)`,
	];
	for (const statement of sql) {
		await db.query(statement);
	}
});

afterAll(async () => {
	await db.close();
});

describe('getById with discriminator + historikk + join', () => {
	test('getById should load active hasOne and historikk', async () => {
		const husId = 'hus-1';
		const activeId = 'eg-1';
		const histId = 'eg-2';

		await db.hus.insert({
			id: husId,
			gaardsbrukId: 'gaard-1',
			husTypeId: 1,
			husStatusId: 0,
			husnummer: 1,
			poststed: 'Repro',
		});

		await db.innredningType.insert({
			id: 0,
			navn: 'Aviar',
		});

		await db.husVerpehoeneEgenskaper.insert({
			id: activeId,
			husId,
			husEgenskapStatusId: 0,
			innredningTypeId: 0,
		});

		await db.husVerpehoeneEgenskaperHistorikk.insert({
			id: histId,
			husId,
			husEgenskapStatusId: 1,
			innredningTypeId: 0,
		});

		const husById = await db.hus.getById(husId, {
			verpehoeneEgenskaperHistorikk: true,
			verpehoeneEgenskaper: {
				innredningType: true,
			},
		});

		expect(husById.verpehoeneEgenskaper).toBeTruthy();
		expect(husById.verpehoeneEgenskaper?.id).toBe(activeId);
		expect(husById.verpehoeneEgenskaperHistorikk?.length).toBe(1);
		expect(husById.verpehoeneEgenskaperHistorikk?.[0]?.id).toBe(histId);
		expect(husById.verpehoeneEgenskaper?.innredningType?.navn).toBe('Aviar');
	});
});
