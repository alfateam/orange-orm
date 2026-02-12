import { describe, test, beforeAll, afterAll, expect } from 'vitest';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';

const map = require('./db');
const initSqlite = require('./initSqlite');
const dateToISOString = require('../src/dateToISOString');

const port = 3012;
let server;

afterAll(async () => {
	return new Promise((res) => {
		if (server)
			server.close(res);
		else
			res();
	});
});

beforeAll(async () => {
	const { db, init } = getDb('sqlite');
	await init(db);

	const george = await db.customer.insert({
		name: 'George',
		balance: 177,
		isActive: true
	});

	const john = await db.customer.insert({
		name: 'Harry',
		balance: 200,
		isActive: true
	});

	const date1 = new Date(2022, 0, 11, 9, 24, 47);
	const date2 = new Date(2021, 0, 11, 12, 22, 45);
	await db.order.insert([
		{ orderDate: date1, customer: george },
		{ orderDate: date2, customer: john }
	]);

	hostHono();
});

describe('hono adapter', () => {
	test('returns unauthorized when token is missing', async () => {
		const db = getHttpDb();

		await expect(db.order.getMany({ where: x => x.id.eq(2) }))
			.rejects.toThrow('Request failed with status code 401');
	});

	test('handles get/post/patch through http client with token', async () => {
		const db = getHttpDb();
		const date = new Date(2025, 5, 10, 8, 30, 0);
		db.interceptors.request.use((config) => {
			config.headers.Authorization = 'Bearer 2';
			return config;
		});

		const rows = await db.order.getMany({ where: x => x.id.eq(2) });
		expect(rows.length).toEqual(1);
		expect(rows[0].id).toEqual(2);

		await db.order.update({ orderDate: date }, x => x.id.eq(2));
		const row = await db.order.getById(2);
		row.orderDate = dateToISOString(new Date(row.orderDate));

		expect(row.orderDate).toEqual(dateToISOString(date));
	});
});

function hostHono() {
	const { db } = getDb('sqlite');
	const app = new Hono();
	app.use('/rdb', cors());
	app.use('/rdb', validateToken);
	app.use('/rdb/*', validateToken);
	app.all('/rdb', db.hono());
	app.all('/rdb/*', db.hono());
	server = serve({ fetch: app.fetch, port });
}

async function validateToken(c, next) {
	const authHeader = c.req.header('authorization');
	if (authHeader)
		return next();
	return c.json({ error: 'Authorization header missing' }, 401);
}

const pathSegments = __filename.split('/');
const lastSegment = pathSegments[pathSegments.length - 1];
const fileNameWithoutExtension = lastSegment.split('.')[0];
const sqliteName = `demo.${fileNameWithoutExtension}.db`;

const connections = {
	sqlite: {
		db: map({ db: con => con.sqlite(sqliteName) }),
		init: initSqlite
	},
	http: {
		db: `http://localhost:${port}/rdb`
	}
};

function getDb(name) {
	if (name === 'sqlite')
		return connections.sqlite;
	if (name === 'http')
		return connections.http;
	throw new Error('Unknown db');
}

function getHttpDb() {
	return map.http(connections.http.db);
}
