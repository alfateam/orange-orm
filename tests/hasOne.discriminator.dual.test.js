import { describe, test, expect } from 'vitest';
const rdb = require('../src/index');

const sqliteName = ':memory:';

const map = rdb.map(x => ({
	hus: x.table('hus_dual').map(({ column }) => ({
		id: column('hus_id').string().primary().notNull(),
		gaardsbrukId: column('gaardsbruk_id').string().notNull(),
		husTypeId: column('hus_type_id').numeric().notNull(),
		husStatusId: column('hus_status_id').numeric().notNull(),
		husnummer: column('husnummer').numeric().notNull(),
	})),
	husVerpehoeneEgenskaper: x.table('hus_verpehoene_egenskaper_dual').map(({ column }) => ({
		id: column('hus_verpehoene_egenskaper_id').string().primary().notNull(),
		husId: column('hus_id').string().notNull(),
		husEgenskapStatusId: column('hus_egenskap_status_id').numeric().notNull(),
	})).columnDiscriminators('hus_egenskap_status_id=0'),
	husSlaktekyllingEgenskaper: x.table('hus_slaktekylling_egenskaper_dual').map(({ column }) => ({
		id: column('hus_slaktekylling_egenskaper_id').string().primary().notNull(),
		husId: column('hus_id').string().notNull(),
		husEgenskapStatusId: column('hus_egenskap_status_id').numeric().notNull(),
	})).columnDiscriminators('hus_egenskap_status_id=0'),
})).map(x => ({
	hus: x.hus.map(({ hasOne }) => ({
		verpehoeneEgenskaper: hasOne(x.husVerpehoeneEgenskaper).by('husId'),
		slaktekyllingEgenskaper: hasOne(x.husSlaktekyllingEgenskaper).by('husId'),
	})),
}));

const connections = {
	sqlite: {
		db: map({ db: (con) => con.sqlite(sqliteName, { size: 1 }) }),
		init: async (db) => {
			const sql = [
				'DROP TABLE IF EXISTS hus_verpehoene_egenskaper_dual',
				'DROP TABLE IF EXISTS hus_slaktekylling_egenskaper_dual',
				'DROP TABLE IF EXISTS hus_dual',
				`CREATE TABLE hus_dual (
					hus_id TEXT PRIMARY KEY,
					gaardsbruk_id TEXT NOT NULL,
					hus_type_id INTEGER NOT NULL,
					hus_status_id INTEGER NOT NULL,
					husnummer INTEGER NOT NULL
				)`,
				`CREATE TABLE hus_verpehoene_egenskaper_dual (
					hus_verpehoene_egenskaper_id TEXT PRIMARY KEY,
					hus_id TEXT NOT NULL,
					hus_egenskap_status_id INTEGER NOT NULL
				)`,
				`CREATE TABLE hus_slaktekylling_egenskaper_dual (
					hus_slaktekylling_egenskaper_id TEXT PRIMARY KEY,
					hus_id TEXT NOT NULL,
					hus_egenskap_status_id INTEGER NOT NULL
				)`,
			];
			for (const statement of sql) {
				await db.query(statement);
			}
		},
	},
	mssql: {
		db: map({
			db: (con) => con.mssql({
				server: 'mssql',
				options: {
					encrypt: false,
					database: 'master',
				},
				authentication: {
					type: 'default',
					options: {
						userName: 'sa',
						password: 'P@assword123',
					},
				},
			}, { size: 1 }),
		}),
		init: async (db) => {
			const sql = `
				IF OBJECT_ID('dbo.hus_verpehoene_egenskaper_dual', 'U') IS NOT NULL DROP TABLE dbo.hus_verpehoene_egenskaper_dual;
				IF OBJECT_ID('dbo.hus_slaktekylling_egenskaper_dual', 'U') IS NOT NULL DROP TABLE dbo.hus_slaktekylling_egenskaper_dual;
				IF OBJECT_ID('dbo.hus_dual', 'U') IS NOT NULL DROP TABLE dbo.hus_dual;
				CREATE TABLE dbo.hus_dual (
					hus_id NVARCHAR(36) PRIMARY KEY,
					gaardsbruk_id NVARCHAR(36) NOT NULL,
					hus_type_id INT NOT NULL,
					hus_status_id INT NOT NULL,
					husnummer INT NOT NULL
				);
				CREATE TABLE dbo.hus_verpehoene_egenskaper_dual (
					hus_verpehoene_egenskaper_id NVARCHAR(36) PRIMARY KEY,
					hus_id NVARCHAR(36) NOT NULL,
					hus_egenskap_status_id INT NOT NULL
				);
				CREATE TABLE dbo.hus_slaktekylling_egenskaper_dual (
					hus_slaktekylling_egenskaper_id NVARCHAR(36) PRIMARY KEY,
					hus_id NVARCHAR(36) NOT NULL,
					hus_egenskap_status_id INT NOT NULL
				);
			`;
			for (const statement of sql.split(';')) {
				if (statement.trim())
					await db.query(statement);
			}
		},
	},
};

async function insertData(db) {
	const husId = 'hus-1';
	await db.hus.insert({
		id: husId,
		gaardsbrukId: 'gaard-1',
		husTypeId: 1,
		husStatusId: 0,
		husnummer: 1,
	});
	await db.husVerpehoeneEgenskaper.insert({
		id: 'verpe-1',
		husId,
		husEgenskapStatusId: 0,
	});
	return husId;
}

describe('dual hasOne with discriminators', () => {
	test('sqlite: getMany loads verpehoene even when slaktekylling included', async () => {
		const { db, init } = connections.sqlite;
		await init(db);
		const husId = await insertData(db);

		const rows = await db.hus.getMany(db.hus.id.eq(husId), {
			verpehoeneEgenskaper: true,
			slaktekyllingEgenskaper: true,
		});

		expect(rows[0].verpehoeneEgenskaper).toBeTruthy();
	});

	test('mssql: getMany loads verpehoene even when slaktekylling included', async () => {
		const { db, init } = connections.mssql;
		await init(db);
		const husId = await insertData(db);

		const rows = await db.hus.getMany(db.hus.id.eq(husId), {
			verpehoeneEgenskaper: true,
			slaktekyllingEgenskaper: true,
		});

		expect(rows[0].verpehoeneEgenskaper).toBeTruthy();
	});
});
