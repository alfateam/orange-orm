import { afterAll, beforeAll, describe, expect, test } from 'vitest';

const express = require('express');
const orange = require('../src/index');
const { setupChangeTracking } = require('../src/sync/setupChangeTracking');

const map = orange.map(x => ({
	project: x.table('projects').map(({ column }) => ({
		id: column('id').numeric().primary(),
		name: column('name').string()
	})),
	task: x.table('tasks').map(({ column }) => ({
		id: column('id').numeric().primary(),
		projectId: column('project_id').numeric(),
		name: column('name').string()
	})),
	internal: x.table('private_data').map(({ column }) => ({
		id: column('id').numeric().primary(),
		name: column('name').string()
	}))
})).map(x => ({
	project: x.project.map(({ hasMany }) => ({
		tasks: hasMany(x.task).by('projectId')
	}))
}));
const db = map.pglite(undefined, { size: 1 });
let server;
let baseUrl;
let httpDb;

beforeAll(async () => {
	await db.query('CREATE TABLE projects (id INTEGER PRIMARY KEY, name TEXT)');
	await db.query('CREATE TABLE tasks (id INTEGER PRIMARY KEY, project_id INTEGER REFERENCES projects(id), name TEXT)');
	await db.query('CREATE TABLE private_data (id INTEGER PRIMARY KEY, name TEXT)');
	await setupChangeTracking(db, db.tables);
	await db.project.insert([{ id: 1, name: 'Project 1' }, { id: 2, name: 'Project 2' }]);
	await db.task.insert({ id: 10, projectId: 1, name: 'Task 10' });
	await db.internal.insert({ id: 20, name: 'Internal 20' });

	const app = express().use(express.json());
	app.use('/all', db.express());
	app.use('/selected', db.express({ project: {} }));
	app.use('/settings', db.express({ sync: { limits: { maxKeysPerBatch: 1 } } }));
	const configuredDb = db({ internal: { readonly: true } });
	app.use('/inherited', configuredDb.express());
	app.use('/inherited-selected', configuredDb.express({ project: {} }));
	app.use('/disabled', db.express({ project: {}, sync: false }));
	app.use('/disabled-object', db.express({ project: {}, sync: { enabled: false } }));
	app.use('/filtered', db.express({
		project: { baseFilter: db.project.id.eq(1) },
		task: {}
	}));
	await new Promise(resolve => {
		server = app.listen(0, '127.0.0.1', resolve);
	});
	baseUrl = `http://127.0.0.1:${server.address().port}`;
	httpDb = map.http(`${baseUrl}/selected`);
}, 30000);

afterAll(async () => {
	if (server)
		await new Promise(resolve => server.close(resolve));
	await db.close();
});

describe('Express table exposure', () => {
	test('defaults to all mapped tables and enables sync without configuration', async () => {
		const direct = await request('/all?table=internal', { path: 'getManyDto', args: [] });
		expect(direct.status).toBe(200);
		expect(direct.body).toEqual([{ id: 20, name: 'Internal 20' }]);
		const snapshot = await request('/all?sync=pull', { phase: 'keys', inlineRows: true });
		expect(snapshot.status).toBe(200);
		expect(new Set(snapshot.body.items.map(x => x.table))).toEqual(new Set(['project', 'task', 'internal']));
	});

	test('shared settings alone keep all tables exposed', async () => {
		const result = await request('/settings?sync=pull', { phase: 'keys', tables: ['internal'] });
		expect(result.status).toBe(200);
		expect(result.body.items.map(x => x.table)).toEqual(['internal']);
	});

	test('inherited table defaults do not select or expose additional tables', async () => {
		const all = await request('/inherited?sync=pull', { phase: 'keys' });
		expect(new Set(all.body.items.map(x => x.table))).toEqual(new Set(['project', 'task', 'internal']));
		const selected = await request('/inherited-selected?sync=pull', { phase: 'keys' });
		expect(selected.body.items.map(x => x.table)).toEqual(['project', 'project']);
		const blocked = await request('/inherited-selected?table=internal', { path: 'getManyDto', args: [] });
		expect(blocked.status).toBe(400);
	});

	test('keeps explicitly exposed empty configs and base filters', async () => {
		const client = map.http(`${baseUrl}/filtered`);
		expect((await client.project.getMany()).map(x => x.id)).toEqual([1]);
		expect((await client.task.getMany()).map(x => x.id)).toEqual([10]);
		await expect(client.internal.getMany()).rejects.toThrow('Table is not exposed');
	});

	test.each(['GET', 'POST', 'PATCH'])('rejects direct access to unexposed tables with %s', async (method) => {
		const body = method === 'PATCH'
			? { patch: [{ op: 'replace', path: '/[20]/name', oldValue: 'Internal 20', value: 'Leaked' }] }
			: { path: 'getManyDto', args: [] };
		const result = await request('/selected?table=internal', body, method);
		expect(result).toEqual({ status: 400, body: 'Table is not exposed or does not exist' });
		expect((await db.internal.getById(20)).name).toBe('Internal 20');
	});

	test.each(['constructor', '__proto__', 'toString'])('does not expose inherited property %s', async (table) => {
		const result = await request(`/selected?table=${table}`, { path: 'getManyDto', args: [] });
		expect(result.status).toBe(400);
	});

	test('limits metadata and generated client declarations to exposed roots', async () => {
		const metadata = await request('/selected?table=project', undefined, 'GET');
		expect(metadata.status).toBe(200);
		const declarations = await request('/selected', undefined, 'GET');
		expect(declarations.status).toBe(200);
		expect(declarations.body).toContain('project');
		expect(declarations.body).not.toContain('internal');
	});

	test('keeps mapped relations available without exposing their tables directly', async () => {
		const project = await httpDb.project.getById(1, { tasks: true });
		expect(project.tasks.map(x => x.id)).toEqual([10]);
		await expect(httpDb.task.getMany()).rejects.toThrow('Table is not exposed');
	});

	test('blocks ad-hoc access to unexposed tables', async () => {
		await expect(httpDb.project.getMany({
			privateRows: (_, { db }) => db.internal.many({})
		})).rejects.toThrow('not mapped or exposed');
	});

	test('cannot replace the server table registry through request options', async () => {
		const body = {
			path: 'getManyDto',
			args: [null, { privateRows: {
				__rdbAdHocRelation: 'many', table: 'internal', strategy: {},
				__rdbAdHocOwnerScope: 's1'
			} }],
			options: { tables: null, tableConfigs: null }
		};
		const result = await request('/selected?table=project', body);
		expect(result.status).toBe(400);
		expect(result.body).toContain('not mapped or exposed');
	});
});

describe('sync uses Express table exposure', () => {
	test('snapshots and inline rows include only exposed roots', async () => {
		const result = await request('/selected?sync=pull', { phase: 'keys', inlineRows: true });
		expect(result.status).toBe(200);
		expect(result.body.items.map(x => [x.table, x.pk])).toEqual([
			['project', [1]], ['project', [2]]
		]);
		expect(result.body.items.every(x => x.row.name)).toBe(true);
	});

	test('filters explicitly requested tables, including database names', async () => {
		const result = await request('/selected?sync=pull', {
			phase: 'keys', tables: ['projects', 'private_data', 'task']
		});
		expect(result.body.items.map(x => x.table)).toEqual(['project', 'project']);
	});

	test('filters change-log pages and ignores table names in continuation tokens', async () => {
		const [{ max }] = await db.query('SELECT MAX(id) AS max FROM orange_changes');
		const result = await request('/selected?sync=pull', {
			phase: 'keys',
			token: { v: 1, mode: 'changes', cursor: 0, watermark: Number(max), tables: ['internal', 'task'] }
		});
		expect(result.status).toBe(200);
		expect(result.body.items.map(x => x.table)).toEqual(['project', 'project']);
		const empty = await request('/selected?sync=pull', {
			phase: 'keys', tables: ['internal'],
			token: { v: 1, mode: 'changes', cursor: 0, watermark: Number(max) }
		});
		expect(empty.body.items).toEqual([]);
		expect(empty.body.done).toBe(true);
	});

	test('filters snapshot continuation tokens', async () => {
		const result = await request('/selected?sync=pull', {
			phase: 'keys', tables: ['project', 'internal'],
			token: { v: 1, mode: 'snapshot', tables: ['internal'], tableIndex: 0,
				lastPk: null, watermark: 0, upperPks: { project: [2], internal: [20] }, inlineRows: true }
		});
		expect(result.body.items.map(x => x.table)).toEqual(['project', 'project']);
	});

	test('does not fetch unexposed rows requested directly by primary key', async () => {
		const result = await request('/selected?sync=pull', {
			phase: 'rows', items: [
				{ table: 'project', pk: [1] }, { table: 'internal', pk: [20] }, { table: 'task', pk: [10] }
			]
		});
		expect(result.body.items.map(x => x.table)).toEqual(['project']);
	});

	test.each(['/disabled', '/disabled-object'])('allows opting out of sync at %s', async (endpoint) => {
		const result = await request(`${endpoint}?sync=pull`, { phase: 'keys' });
		expect(result.status).toBe(404);
		const direct = await request(`${endpoint}?table=project`, { path: 'getManyDto', args: [] });
		expect(direct.status).toBe(200);
	});

	test('push accepts an exposed table without explicit sync configuration', async () => {
		const mutation = { id: 'allowed', table: 'project', patch: [
			{ op: 'replace', path: '/[1]/name', oldValue: 'Project 1', value: 'Updated' }
		] };
		const result = await push('/selected', [mutation]);
		expect(result.status).toBe(200);
		expect(result.body.applied).toBe(1);
		expect((await db.project.getById(1)).name).toBe('Updated');
		const replay = await push('/selected', [mutation]);
		expect(replay.body.duplicates).toBe(1);
	});

	test.each(['internal', 'task', 'constructor'])('push rejects unexposed table %s', async (table) => {
		const result = await push('/selected', [{
			id: `blocked-${table}`, table, patch: [{ op: 'remove', path: '/[20]' }]
		}]);
		expect(result.status).toBe(400);
		expect(result.body).toContain('not exposed');
		expect((await db.internal.getById(20)).name).toBe('Internal 20');
	});

	test('rejects a mixed-table mutation before applying any patches', async () => {
		const result = await push('/selected', [{ id: 'mixed', patches: [
			{ table: 'project', patch: [{ op: 'replace', path: '/[2]/name', oldValue: 'Project 2', value: 'Wrong' }] },
			{ table: 'internal', patch: [{ op: 'remove', path: '/[20]' }] }
		] }]);
		expect(result.status).toBe(400);
		expect((await db.project.getById(2)).name).toBe('Project 2');
	});

	test('checks table exposure before returning a duplicate mutation result', async () => {
		const mutation = { id: 'previously-exposed', table: 'internal', patch: [
			{ op: 'replace', path: '/[20]/name', oldValue: 'Internal 20', value: 'Internal 20' }
		] };
		expect((await push('/all', [mutation])).status).toBe(200);
		const result = await push('/selected', [mutation]);
		expect(result.status).toBe(400);
	});

	test('does not disclose cached results by replaying an id against a different table', async () => {
		const id = 'retargeted-replay';
		const original = await push('/all', [{ id, patches: [{
			table: 'internal', patch: [{ op: 'replace', path: '/[20]/name', oldValue: 'Internal 20', value: 'Internal 20' }]
		}] }]);
		expect(original.status).toBe(200);
		const result = await push('/selected', [{ id, table: 'project', patch: [] }]);
		expect(result.status).toBe(400);
		expect(result.body).toContain('not exposed');
	});
});

async function request(path, body, method = 'POST') {
	const response = await fetch(baseUrl + path, {
		method,
		headers: { 'Content-Type': 'application/json' },
		body: method === 'GET' ? undefined : JSON.stringify(body)
	});
	const text = await response.text();
	let result;
	try { result = JSON.parse(text); }
	catch (_e) { result = text; }
	return { status: response.status, body: result };
}

function push(endpoint, mutations) {
	return request(`${endpoint}?sync=push`, { phase: 'push', clientId: 'exposure-test', mutations });
}
