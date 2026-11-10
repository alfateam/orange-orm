/* global globalThis */
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import sqliteTestPath from './sqliteTestPath.mjs';

const express = require('express');
const { types: { isProxy } } = require('node:util');
const orange = require('../src/index');

const map = orange.map(x => ({
	project: x.table('projects').map(({ column }) => ({
		id: column('id').numeric().primary(),
		name: column('name').string()
	})),
	task: x.table('tasks').map(({ column }) => ({
		projectId: column('project_id').numeric().primary(),
		id: column('id').numeric().primary(),
		name: column('name').string()
	})),
	internal: x.table('private_data').map(({ column }) => ({
		id: column('id').numeric().primary()
	}))
})).map(x => ({
	project: x.project.map(({ hasMany }) => ({
		tasks: hasMany(x.task).by('projectId')
	}))
}));
const db = map.sqlite(sqliteTestPath('plain.db'));
const requests = [];
const hooks = [];
let httpDb;
let baseUrl;
let server;

beforeAll(async () => {
	await db.query('DROP TABLE IF EXISTS tasks');
	await db.query('DROP TABLE IF EXISTS projects');
	await db.query('CREATE TABLE projects (id INTEGER PRIMARY KEY, name TEXT)');
	await db.query('CREATE TABLE tasks (project_id INTEGER, id INTEGER, name TEXT, PRIMARY KEY (project_id, id))');
	await db.project.insert([{ id: 1, name: 'One' }, { id: 2, name: 'Two' }]);
	await db.task.insert([
		{ projectId: 1, id: 10, name: 'First' },
		{ projectId: 1, id: 11, name: 'Second' },
		{ projectId: 2, id: 10, name: 'Private' }
	]);
	const app = express().use(express.json());
	app.use('/db', (req, res, next) => {
		if (req.headers.authorization !== 'Bearer test')
			return res.sendStatus(401);
		if (req.method === 'POST')
			requests.push(req.body);
		next();
	}, db({ tables: { project: map.project, task: map.task } }).express({
		project: {
			readonly: true,
			baseFilter: (db, req) => db.project.id.eq(Number(req.headers['x-project-id'] || 1))
		},
		task: { baseFilter: db.task.projectId.eq(1).and(db.task.id.eq(10)) },
		hooks: { transaction: {
			afterBegin: async (_db, req) => { hooks.push(req.headers.authorization); }
		} }
	}));
	await new Promise(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
	baseUrl = `http://127.0.0.1:${server.address().port}/db`;
	httpDb = map.http(baseUrl);
	httpDb.interceptors.request.use(config => {
		config.headers.Authorization = 'Bearer test';
		return config;
	});
});

afterAll(async () => {
	if (server)
		await new Promise(resolve => server.close(resolve));
	await db.close();
});

describe.each(['local', 'http'])('plain reads (%s)', transport => {
	const client = () => transport === 'local' ? db : httpDb;

	test('preserves selection, nested pagination and ordinary mutable data throughout the graph', async () => {
		const table = client().project;
		const strategy = {
			where: x => x.id.eq(1), name: true,
			tasks: { name: true, orderBy: 'id desc', limit: 1, offset: 1 }
		};
		const rows = await table.getMany.plain(strategy);
		expect(rows).toEqual(await table.getMany(strategy));
		expect(rows[0].tasks[0].name).toBe('First');
		assertPlain(rows);
		rows[0].tasks[0].name = 'Only local';
		rows.push({ name: 'New' });
		expect((await client().task.getById.plain(1, 10)).name).toBe('First');
		expect(await table.count()).toBe(transport === 'local' ? 2 : 1);
	});

	test('supports one row, primary key objects, positional filters and composite keys', async () => {
		const table = client().project;
		const one = await table.getOne.plain({ where: x => x.id.eq(1), tasks: true });
		expect(one).toEqual(await table.getOne({ where: x => x.id.eq(1), tasks: true }));
		assertPlain(one);
		expect(await table.getOne.plain({ id: 1 }, { tasks: true })).toEqual(one);
		expect(await table.getOne.plain(table.id.eq(1), { tasks: true })).toEqual(one);
		expect(await table.getMany.plain(table.id.eq(1), { tasks: true })).toEqual([one]);
		const byId = await table.getById.plain(1, { tasks: true });
		expect(byId).toEqual(one);
		assertPlain(byId);
		const composite = await client().task.getById.plain(1, 10);
		expect(composite).toEqual({ projectId: 1, id: 10, name: 'First' });
		assertPlain(composite);
	});

	test('returns empty results and preserves getOne ordering and limit semantics', async () => {
		const table = client().project;
		expect(await table.getMany.plain({ where: x => x.id.eq(-1) })).toEqual([]);
		expect(await table.getOne.plain({ where: x => x.id.eq(-1) })).toBeUndefined();
		expect(await table.getById.plain(-1)).toBeUndefined();
		expect(await table.getById.plain()).toBeUndefined();
		expect(await table.getOne.plain({ orderBy: 'id desc', limit: 100 }))
			.toEqual(await table.getOne({ orderBy: 'id desc', limit: 100 }));
	});

	test('preserves ad-hoc relations and their HTTP target base filters', async () => {
		const strategy = {
			where: x => x.id.eq(1),
			matching: (project, { db }) => db.task.many({
				where: task => task.projectId.eq(project.id), orderBy: 'id'
			}),
			first: (_, { db, root }) => db.task.one({
				where: task => task.projectId.eq(root.id), orderBy: 'id'
			})
		};
		const rows = await client().project.getMany.plain(strategy);
		expect(rows).toEqual(await client().project.getMany(strategy));
		expect(rows[0].matching.map(x => x.id)).toEqual(transport === 'local' ? [10, 11] : [10]);
		expect(rows[0].first.id).toBe(10);
		assertPlain(rows);
	});
});

test('plain methods work in transactions and can be detached from the table', async () => {
	await db.transaction(async tx => {
		const getMany = tx.project.getMany.plain;
		const getOne = tx.project.getOne.plain;
		const getById = tx.project.getById.plain;
		expect(await getMany()).toHaveLength(2);
		expect(await getOne({ where: x => x.id.eq(1) })).toEqual(await getById(1));
	});
});

test('plain reads skip reactive wrapping and leave tracked reads functional', async () => {
	let wrapped = 0;
	const reactiveDb = db({ reactive: value => { wrapped++; return value; } });
	await reactiveDb.project.getMany.plain();
	await reactiveDb.project.getOne.plain();
	await reactiveDb.project.getById.plain(1);
	expect(wrapped).toBe(0);
	await reactiveDb.project.getMany({ where: x => x.id.eq(1) });
	expect(wrapped).toBe(1);
	const tracked = await reactiveDb.project.getById(1);
	expect(isProxy(tracked)).toBe(true);
	tracked.name = 'Saved';
	await tracked.saveChanges();
	expect((await db.project.getById.plain(1)).name).toBe('Saved');
	tracked.name = 'One';
	await tracked.saveChanges();
});

describe('plain HTTP security', () => {
	test('uses the existing read operation and transaction hooks for every variant', async () => {
		requests.length = 0;
		hooks.length = 0;
		await httpDb.project.getMany.plain();
		await httpDb.project.getOne.plain();
		await httpDb.project.getById.plain(1);
		expect(requests.map(x => x.path)).toEqual(['getManyDto', 'getManyDto', 'getManyDto']);
		expect(hooks).toEqual(['Bearer test', 'Bearer test', 'Bearer test']);
	});

	test.each(['getMany', 'getOne', 'getById'])('%s.plain cannot bypass authentication or table exposure', async method => {
		const args = method === 'getById' ? [1] : [];
		await expect(map.http(baseUrl).project[method].plain(...args)).rejects.toThrow('Unauthorized');
		await expect(httpDb.internal[method].plain(...args)).rejects.toThrow('Table is not exposed');
	});

	test('applies request-dependent base filters even to explicit primary keys', async () => {
		expect((await httpDb.project.getMany.plain()).map(x => x.id)).toEqual([1]);
		expect(await httpDb.project.getMany.plain({ where: x => x.id.eq(2) })).toEqual([]);
		expect(await httpDb.project.getOne.plain({ where: x => x.id.eq(2) })).toBeUndefined();
		expect(await httpDb.project.getById.plain(2)).toBeUndefined();
		const other = map.http(baseUrl);
		other.interceptors.request.use(config => {
			config.headers.Authorization = 'Bearer test';
			config.headers['x-project-id'] = '2';
			return config;
		});
		expect((await other.project.getMany.plain()).map(x => x.id)).toEqual([2]);
		expect(await other.project.getById.plain(1)).toBeUndefined();
	});

	test('rejects unexposed ad-hoc targets, raw SQL and invalid pagination', async () => {
		await expect(httpDb.project.getMany.plain({
			privateRows: (_, { db }) => db.internal.many({})
		})).rejects.toThrow('not mapped or exposed');
		await expect(httpDb.project.getMany.plain({ where: { sql: '1=1', parameters: [] } }))
			.rejects.toThrow('Raw filters are disallowed');
		await expect(httpDb.project.getOne.plain('1=1')).rejects.toThrow('Raw filters are disallowed');
		await expect(httpDb.project.getById.plain(1, { where: { sql: '1=1', parameters: [] } }))
			.rejects.toThrow('Raw filters are disallowed');
		await expect(httpDb.project.getMany.plain({ limit: '1; DROP TABLE projects' })).rejects.toThrow();
		expect(await db.project.count()).toBe(2);
	});

	test.each([
		{ where: { sql: '1=1', parameters: [] } },
		{ tasks: { where: '1=1' } },
		{ matching: {
			__rdbAdHocRelation: 'many', table: 'task',
			strategy: { where: { sql: '1=1', parameters: [] } },
			__rdbAdHocOwnerScope: 's1'
		} }
	])('rejects raw filters in crafted HTTP strategies: %j', async strategy => {
		const response = await globalThis.fetch(`${baseUrl}?table=project`, {
			method: 'POST',
			headers: { Authorization: 'Bearer test', 'Content-Type': 'application/json' },
			body: JSON.stringify({ path: 'getManyDto', args: [null, strategy] })
		});
		expect(response.status).toBe(403);
		expect(await response.text()).toContain('Raw filters are disallowed');
	});
});

function assertPlain(value) {
	if (!value || typeof value !== 'object')
		return;
	expect(isProxy(value)).toBe(false);
	for (const name of ['saveChanges', 'save', 'refresh', 'delete', 'acceptChanges', 'clearChanges'])
		expect(value[name]).toBeUndefined();
	for (const child of Object.values(value))
		assertPlain(child);
}
