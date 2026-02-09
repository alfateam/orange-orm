import { describe, test, beforeAll, afterAll, expect } from 'vitest';
const rdb = require('../src/index');
const express = require('express');
const cors = require('cors');
const { json } = require('body-parser');
const initPg = require('./initPg');

const port = 3030;
let server;

const map = rdb.map(x => ({
	rls_test: x.table('rls_test').map(({ column }) => ({
		id: column('id').numeric().primary().notNullExceptInsert(),
		tenant_id: column('tenant_id').numeric(),
		value: column('value').string(),
	}))
}));

const db = map({ db: con => con.postgres('postgres://postgres:postgres@postgres/postgres', { size: 1 }) });

beforeAll(async () => {
	await initPg(db);
	await setupRls(db);
	hostExpress();
});

afterAll(async () => {
	if (server)
		await new Promise((resolve) => server.close(resolve));
	if (db?.close)
		await db.close();
});

describe('express RLS hooks (pg)', () => {
	test('filters rows by tenant header', async () => {
		const httpDb = map.http(`http://localhost:${port}/rdb`);
		httpDb.interceptors.request.use((config) => {
			config.headers['X-Tenant-Id'] = '1';
			return config;
		});

		const rows = await httpDb.rls_test.getMany();
		expect(rows.map(r => r.tenant_id)).toEqual([1, 1]);
	});

	test('denies rows without matching tenant', async () => {
		const httpDb = map.http(`http://localhost:${port}/rdb`);
		httpDb.interceptors.request.use((config) => {
			config.headers['X-Tenant-Id'] = '2';
			return config;
		});

		const rows = await httpDb.rls_test.getMany();
		expect(rows.map(r => r.tenant_id)).toEqual([2]);
	});
});

function hostExpress() {
	const app = express();
	app.disable('x-powered-by')
		.use(json({ limit: '100mb' }))
		.use('/rdb', cors(), db.express({
			hooks: {
				transaction: {
					afterBegin: async (_db, req) => {
						const raw = req.headers['x-tenant-id'];
						const tenantId = Number.parseInt(Array.isArray(raw) ? raw[0] : (raw || '0'), 10);
						const safeTenant = Number.isFinite(tenantId) ? tenantId : 0;
						await _db.query('set local role rls_test_user');
						await _db.query({sql: 'select set_config(\'app.tenant_id\', ?, true)', parameters: [safeTenant]});
					}
				}
			}
		}));
	server = app.listen(port);
}

async function setupRls(db) {
	await db.query(`
		drop role if exists rls_test_user;
		create role rls_test_user;
		grant usage on schema public to rls_test_user;
		drop table if exists rls_test;
		create table rls_test (
			id serial primary key,
			tenant_id integer not null,
			value text not null
		);
		insert into rls_test (tenant_id, value) values
			(1, 'a'),
			(1, 'b'),
			(2, 'c');
		grant select on rls_test to rls_test_user;
		alter table rls_test enable row level security;
		alter table rls_test force row level security;
		drop policy if exists rls_test_tenant on rls_test;
		create policy rls_test_tenant on rls_test
			for select
			using (tenant_id::text = current_setting('app.tenant_id', true));
	`);
}
