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
	innredningType: x.table('innredning_type_dual').map(({ column }) => ({
		id: column('innredning_type_id').numeric().primary().notNull(),
		navn: column('navn').string().notNull(),
	})),
	belysningType: x.table('belysning_type_dual').map(({ column }) => ({
		id: column('belysning_type_id').numeric().primary().notNull(),
		navn: column('navn').string().notNull(),
	})),
	gulvType: x.table('gulv_type_dual').map(({ column }) => ({
		id: column('gulv_type_id').numeric().primary().notNull(),
		navn: column('navn').string().notNull(),
	})),
	husVerpehoeneEgenskaper: x.table('hus_verpehoene_egenskaper_dual').map(({ column }) => ({
		id: column('hus_verpehoene_egenskaper_id').string().primary().notNull(),
		husId: column('hus_id').string().notNull(),
		innredningTypeId: column('innredning_type_id').numeric().notNull(),
		belysningTypeId: column('belysning_type_id').numeric().notNull(),
		gulvTypeId: column('gulv_type_id').numeric().notNull(),
	})).columnDiscriminators('hus_egenskap_status_id=0'),
	husSlaktekyllingEgenskaper: x.table('hus_slaktekylling_egenskaper_dual').map(({ column }) => ({
		id: column('hus_slaktekylling_egenskaper_id').string().primary().notNull(),
		husId: column('hus_id').string().notNull(),
		innredningTypeId: column('innredning_type_id').numeric().notNull(),
	})).columnDiscriminators('hus_egenskap_status_id=0'),
})).map(x => ({
	husVerpehoeneEgenskaper: x.husVerpehoeneEgenskaper.map(({ references }) => ({
		innredningType: references(x.innredningType).by('innredningTypeId'),
		belysningType: references(x.belysningType).by('belysningTypeId'),
		gulvType: references(x.gulvType).by('gulvTypeId'),
	})),
	husSlaktekyllingEgenskaper: x.husSlaktekyllingEgenskaper.map(({ references }) => ({
		innredningType: references(x.innredningType).by('innredningTypeId'),
	})),
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
				'DROP TABLE IF EXISTS belysning_type_dual',
				'DROP TABLE IF EXISTS gulv_type_dual',
				'DROP TABLE IF EXISTS innredning_type_dual',
				'DROP TABLE IF EXISTS hus_dual',
				`CREATE TABLE hus_dual (
					hus_id TEXT PRIMARY KEY,
					gaardsbruk_id TEXT NOT NULL,
					hus_type_id INTEGER NOT NULL,
					hus_status_id INTEGER NOT NULL,
					husnummer INTEGER NOT NULL
				)`,
				`CREATE TABLE innredning_type_dual (
					innredning_type_id INTEGER PRIMARY KEY,
					navn TEXT NOT NULL
				)`,
				`CREATE TABLE belysning_type_dual (
					belysning_type_id INTEGER PRIMARY KEY,
					navn TEXT NOT NULL
				)`,
				`CREATE TABLE gulv_type_dual (
					gulv_type_id INTEGER PRIMARY KEY,
					navn TEXT NOT NULL
				)`,
				`CREATE TABLE hus_verpehoene_egenskaper_dual (
					hus_verpehoene_egenskaper_id TEXT PRIMARY KEY,
					hus_id TEXT NOT NULL,
					innredning_type_id INTEGER NOT NULL,
					belysning_type_id INTEGER NOT NULL,
					gulv_type_id INTEGER NOT NULL,
					hus_egenskap_status_id INTEGER NOT NULL
				)`,
				`CREATE TABLE hus_slaktekylling_egenskaper_dual (
					hus_slaktekylling_egenskaper_id TEXT PRIMARY KEY,
					hus_id TEXT NOT NULL,
					innredning_type_id INTEGER NOT NULL,
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
				IF OBJECT_ID('dbo.belysning_type_dual', 'U') IS NOT NULL DROP TABLE dbo.belysning_type_dual;
				IF OBJECT_ID('dbo.gulv_type_dual', 'U') IS NOT NULL DROP TABLE dbo.gulv_type_dual;
				IF OBJECT_ID('dbo.innredning_type_dual', 'U') IS NOT NULL DROP TABLE dbo.innredning_type_dual;
				IF OBJECT_ID('dbo.hus_dual', 'U') IS NOT NULL DROP TABLE dbo.hus_dual;
				CREATE TABLE dbo.hus_dual (
					hus_id NVARCHAR(36) PRIMARY KEY,
					gaardsbruk_id NVARCHAR(36) NOT NULL,
					hus_type_id INT NOT NULL,
					hus_status_id INT NOT NULL,
					husnummer INT NOT NULL
				);
				CREATE TABLE dbo.innredning_type_dual (
					innredning_type_id INT PRIMARY KEY,
					navn NVARCHAR(100) NOT NULL
				);
				CREATE TABLE dbo.belysning_type_dual (
					belysning_type_id INT PRIMARY KEY,
					navn NVARCHAR(100) NOT NULL
				);
				CREATE TABLE dbo.gulv_type_dual (
					gulv_type_id INT PRIMARY KEY,
					navn NVARCHAR(100) NOT NULL
				);
				CREATE TABLE dbo.hus_verpehoene_egenskaper_dual (
					hus_verpehoene_egenskaper_id NVARCHAR(36) PRIMARY KEY,
					hus_id NVARCHAR(36) NOT NULL,
					innredning_type_id INT NOT NULL,
					belysning_type_id INT NOT NULL,
					gulv_type_id INT NOT NULL,
					hus_egenskap_status_id INT NOT NULL
				);
				CREATE TABLE dbo.hus_slaktekylling_egenskaper_dual (
					hus_slaktekylling_egenskaper_id NVARCHAR(36) PRIMARY KEY,
					hus_id NVARCHAR(36) NOT NULL,
					innredning_type_id INT NOT NULL,
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
	await db.innredningType.insert([
		{ id: 1, navn: 'Verpe' },
		{ id: 2, navn: 'Slakte' },
	]);
	await db.belysningType.insert([
		{ id: 1, navn: 'LED' },
		{ id: 2, navn: 'Halogen' },
	]);
	await db.gulvType.insert([
		{ id: 1, navn: 'Betong' },
		{ id: 2, navn: 'Gummi' },
	]);
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
		innredningTypeId: 1,
		belysningTypeId: 1,
		gulvTypeId: 1,
		husEgenskapStatusId: 0,
	});
	await db.husSlaktekyllingEgenskaper.insert({
		id: 'verpe-1',
		husId,
		innredningTypeId: 2,
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
			verpehoeneEgenskaper: { innredningType: true, belysningType: true, gulvType: true },
			slaktekyllingEgenskaper: {
				innredningType: true
			},
		});

		expect(rows[0].verpehoeneEgenskaper).toBeTruthy();
		expect(rows[0].slaktekyllingEgenskaper).toBeTruthy();
		expect(rows[0].verpehoeneEgenskaper?.innredningType?.navn).toBe('Verpe');
		expect(rows[0].verpehoeneEgenskaper?.belysningType?.navn).toBe('LED');
		expect(rows[0].verpehoeneEgenskaper?.gulvType?.navn).toBe('Betong');
		expect(rows[0].slaktekyllingEgenskaper?.innredningType?.navn).toBe('Slakte');
	});

	test('mssql: getMany loads verpehoene even when slaktekylling included', async () => {
		const { db, init } = connections.mssql;
		await init(db);
		const husId = await insertData(db);

		const rows = await db.hus.getMany(db.hus.id.eq(husId), {
			verpehoeneEgenskaper: { innredningType: true, belysningType: true, gulvType: true },
			slaktekyllingEgenskaper: { innredningType: true },
		});

		expect(rows[0].verpehoeneEgenskaper).toBeTruthy();
		expect(rows[0].slaktekyllingEgenskaper).toBeTruthy();
		expect(rows[0].verpehoeneEgenskaper?.innredningType?.navn).toBe('Verpe');
		expect(rows[0].verpehoeneEgenskaper?.belysningType?.navn).toBe('LED');
		expect(rows[0].verpehoeneEgenskaper?.gulvType?.navn).toBe('Betong');
		expect(rows[0].slaktekyllingEgenskaper?.innredningType?.navn).toBe('Slakte');
	});
});
