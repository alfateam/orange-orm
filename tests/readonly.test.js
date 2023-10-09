import { describe, test, beforeAll, afterAll, expect } from 'vitest';
import { fileURLToPath } from 'url';
const map = require('./db');
import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';
const initPg = require('./initPg');
const initMs = require('./initMs');
const initMysql = require('./initMysql');
const initSqlite = require('./initSqlite');
const initSap = require('./initSap');
const port = 3009;
let server;

beforeAll(async () => {
	await insertData('pg');
	await insertData('mssql');
	await insertData('mysql');
	await insertData('sap');
	await insertData('sqlite');
	await insertData('sqlite2');

	async function insertData(dbName) {
		const { db, init } = getDb(dbName);
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
			{
				orderDate: date1,
				customer: george,
				deliveryAddress: {
					name: 'George',
					street: 'Node street 1',
					postalCode: '7059',
					postalPlace: 'Jakobsli',
					countryCode: 'NO'
				},
				lines: [
					{ product: 'Bicycle' },
					{ product: 'Small guitar' }
				]
			},
			{
				customer: john,
				orderDate: date2,
				deliveryAddress: {
					name: 'Harry Potter',
					street: '4 Privet Drive, Little Whinging',
					postalCode: 'GU4',
					postalPlace: 'Surrey',
					countryCode: 'UK'
				},
				lines: [
					{ product: 'Magic wand' }
				]
			}
		]);
	}
});

describe('readonly everything', () => {
	const options = { readonly: true };

	beforeAll(() => hostExpress(options));

	afterAll(async () => {
		return new Promise((res) => {
			server.close(res);
		});
	});

	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));


	async function verify(dbName) {

		const db = getDb(dbName).db(options);

		const rows = await db.customer.getAll();
		const name = 'Oscar';
		let error;

		const expected = [{
			id: 1,
			name: 'George',
			balance: 177,
			isActive: true
		}, {
			id: 2,
			name: 'Harry',
			balance: 200,
			isActive: true
		}
		];

		expect(rows).toEqual(expected);
		try {
			rows[0].name = name;
			await rows.saveChanges();
		}
		catch (e) {
			error = e;
		}
		const expectedMeta = {
			readonly: true,
			concurrency: undefined,
			vendorDiscr: {
				id:  {
					readonly: true,
				},
				isActive:  {
					readonly: true,
				},
				name:  {
					readonly: true,
				}
			},
			customer: {
				id: { readonly: true },
				name: { readonly: true },
				balance: { readonly: true },
				isActive: { readonly: true }
			},
			vendor: {
				id: { readonly: true },
				name: { readonly: true },
				balance: { readonly: true },
				isActive: { readonly: true }
			},
			customer2: {
				id: { readonly: true },
				name: { readonly: true },
				balance: { readonly: true },
				isActive: { readonly: true },
				data: { readonly: true },
				picture: { readonly: true }
			},
			customerDbNull: {
				balance: {
					readonly: true,
				},
				id: {
					readonly: true,
				},
				isActive: {
					readonly: true,
				},
				name: {
					readonly: true,
				},
			},
			customerDefault: {
				balance: {
					readonly: true,
				},
				id: {
					readonly: true,
				},
				isActive: {
					readonly: true,
				},
				name: {
					readonly: true,
				},
			},
			order: {
				id: { readonly: true },
				orderDate: { readonly: true },
				customerId: { readonly: true },
				lines: {
					id: { readonly: true },
					orderId: { readonly: true },
					product: { readonly: true },
					packages: {
						id: {
							readonly: true,
						},
						lineId: {
							readonly: true,
						},
						sscc: {
							readonly: true,
						},
					},
				},
				deliveryAddress: {
					id: { readonly: true },
					orderId: { readonly: true },
					name: { readonly: true },
					street: { readonly: true },
					postalCode: { readonly: true },
					postalPlace: { readonly: true },
					countryCode: { readonly: true }
				}
			},
			deliveryAddress: {
				id: { readonly: true },
				orderId: { readonly: true },
				name: { readonly: true },
				street: { readonly: true },
				postalCode: { readonly: true },
				postalPlace: { readonly: true },
				countryCode: { readonly: true }
			},
			orderLine: {
				id: { readonly: true },
				orderId: { readonly: true },
				product: { readonly: true },
				packages: {
					id: {
						readonly: true,
					},
					lineId: {
						readonly: true,
					},
					sscc: {
						readonly: true,
					},
				},
			},
			package: {
				id: {
					readonly: true,
				},
				lineId: {
					readonly: true,
				},
				sscc: {
					readonly: true,
				},
			},
			datetest: {
				id: { readonly: true },
				date: { readonly: true },
				datetime: { readonly: true },
			},
			datetestWithTz: {
				id: { readonly: true },
				date: { readonly: true },
				datetime: { readonly: true },
				datetime_tz: { readonly: true },
			}
		};
		expect(error?.message).toEqual('Cannot update column name because it is readonly');
		if (dbName !== 'http')
			expect(db.metaData).toEqual(expectedMeta);
	}
});

describe('readonly table', () => {
	const options = { customer: { readonly: true } };
	beforeAll(() => hostExpress(options));

	afterAll(async () => {
		return new Promise((res) => {
			server.close(res);
		});
	});


	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));


	async function verify(dbName) {
		const db = getDb(dbName).db(options);

		const rows = await db.customer.getAll();
		const name = 'Oscar';
		let error;

		const expected = [{
			id: 1,
			name: 'George',
			balance: 177,
			isActive: true
		}, {
			id: 2,
			name: 'Harry',
			balance: 200,
			isActive: true
		}
		];

		expect(rows).toEqual(expected);
		try {
			rows[0].name = name;
			await rows.saveChanges();
		}
		catch (e) {
			error = e;
		}
		expect(error?.message).toEqual('Cannot update column name because it is readonly');
	}
});

describe('readonly column', () => {

	const options = { customer: { name: { readonly: true } } };
	beforeAll(() => hostExpress(options));

	afterAll(async () => {
		return new Promise((res) => {
			server.close(res);
		});
	});


	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));


	async function verify(dbName) {
		const db = getDb(dbName).db(options);

		const rows = await db.customer.getAll();
		const name = 'Oscar';
		let error;

		const expected = [{
			id: 1,
			name: 'George',
			balance: 177,
			isActive: true
		}, {
			id: 2,
			name: 'Harry',
			balance: 200,
			isActive: true
		}
		];

		expect(rows).toEqual(expected);
		try {
			rows[0].name = name;
			await rows.saveChanges();
		}
		catch (e) {
			error = e;
		}

		expect(error?.message).toEqual('Cannot update column name because it is readonly');
	}
});


describe('readonly table delete', () => {

	const options = { order: { readonly: true } };
	beforeAll(() => hostExpress(options));

	afterAll(async () => {
		return new Promise((res) => {
			server.close(res);
		});
	});


	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));


	async function verify(dbName) {
		const db = getDb(dbName).db(options);

		const rows = await db.order.getAll();
		let error;

		try {
			rows.pop();
			await rows.saveChanges();
		}
		catch (e) {
			error = e;
		}
		expect(error?.message).toEqual('Cannot delete _order because it is readonly');
	}
});

describe('readonly nested table delete', () => {

	const options = { order: { readonly: true } };
	beforeAll(() => hostExpress(options));

	afterAll(async () => {
		return new Promise((res) => {
			server.close(res);
		});
	});


	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));


	async function verify(dbName) {
		const db = getDb(dbName).db(options);

		const rows = await db.order.getAll({ lines: true });
		let error;

		try {
			rows[0].lines.pop();
			await rows.saveChanges();
		}
		catch (e) {
			error = e;
		}
		expect(error?.message).toEqual('Cannot delete orderLine because it is readonly');
	}
});
describe('readonly on grandChildren table delete', () => {

	const options = { order: { lines: { readonly: true } } };
	beforeAll(() => hostExpress(options));

	afterAll(async () => {
		return new Promise((res) => {
			server.close(res);
		});
	});


	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));


	async function verify(dbName) {
		const db = getDb(dbName).db(options);

		const rows = await db.order.getAll({ lines: true });
		let error;

		try {
			rows.pop();
			await rows.saveChanges();
		}
		catch (e) {
			error = e;
		}
		expect(error?.message).toEqual('Cannot delete orderLine because it is readonly');
	}
});

describe('readonly nested table delete override', () => {

	const options = { order: { readonly: true, lines: { readonly: false } } };
	beforeAll(() => hostExpress(options));

	afterAll(async () => {
		return new Promise((res) => {
			server.close(res);
		});
	});


	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));


	async function verify(dbName) {
		const db = getDb(dbName).db(options);

		const rows = await db.order.getAll({ lines: true });

		const length = rows[0].lines.length;
		rows[0].lines.pop();
		expect(rows[0].lines.length).toEqual(length - 1);

	}
});

describe('readonly column no change', () => {

	const options = { customer: { balance: { readonly: true } } };
	beforeAll(() => hostExpress(options));

	afterAll(async () => {
		return new Promise((res) => {
			server.close(res);
		});
	});


	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));


	async function verify(dbName) {
		const db = getDb(dbName).db(options);

		const rows = await db.customer.getAll();
		const name = 'Oscar';

		const expected = [{
			id: 1,
			name: name,
			balance: 177,
			isActive: true
		}, {
			id: 2,
			name: 'Harry',
			balance: 200,
			isActive: true
		}
		];

		rows[0].name = name;
		await rows.saveChanges();
		expect(rows).toEqual(expected);
	}
});

describe('readonly nested column', () => {

	const options = { order: { lines: { product: { readonly: true } } } };
	beforeAll(() => hostExpress(options));

	afterAll(async () => {
		return new Promise((res) => {
			server.close(res);
		});
	});


	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));


	async function verify(dbName) {

		let db;
		if (dbName === 'http')
			db = getDb(dbName).db();
		else
			db = getDb(dbName).db(options);

		const rows = await db.order.getAll({ lines: true });
		let error;
		try {
			rows[0].lines[0].product = 'changed product';
			await rows.saveChanges();
		}
		catch (e) {
			error = e;
		}

		expect(error?.message).toEqual('Cannot update column product because it is readonly');
	}
});

describe('readonly nested table', () => {

	const options = { order: { lines: { readonly: true } } };
	beforeAll(() => hostExpress(options));

	afterAll(async () => {
		return new Promise((res) => {
			server.close(res);
		});
	});


	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));


	async function verify(dbName) {
		const db = getDb(dbName).db(options);

		const rows = await db.order.getAll({ lines: true });
		let error;
		try {
			rows[0].lines[0].product = 'changed product';
			await rows.saveChanges();
		}
		catch (e) {
			error = e;
		}

		expect(error?.message).toEqual('Cannot update column product because it is readonly');
	}
});

describe('readonly table with column override', () => {

	const options = { customer: { readonly: true, name: { readonly: false } } };
	beforeAll(() => hostExpress(options));

	afterAll(async () => {
		return new Promise((res) => {
			server.close(res);
		});
	});


	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));


	async function verify(dbName) {
		const db = getDb(dbName).db(options);

		const rows = await db.customer.getAll();
		const name = 'Oscar';

		const expected = [{
			id: 1,
			name: name,
			balance: 177,
			isActive: true
		}, {
			id: 2,
			name: 'Harry',
			balance: 200,
			isActive: true
		}
		];

		rows[0].name = name;
		await rows.saveChanges();
		expect(rows).toEqual(expected);

	}
});

describe('readonly column delete', () => {

	const options = { order: { orderDate: { readonly: true } } };
	beforeAll(() => hostExpress(options));

	afterAll(async () => {
		return new Promise((res) => {
			server.close(res);
		});
	});


	test('pg', async () => await verify('pg'));
	test('mssql', async () => await verify('mssql'));
	test('mysql', async () => await verify('mysql'));
	test('sqlite', async () => await verify('sqlite'));
	test('sap', async () => await verify('sap'));
	test('http', async () => await verify('http'));


	async function verify(dbName) {
		const db = getDb(dbName).db(options);

		const rows = await db.order.getAll();
		const length = rows.length;
		rows.pop();
		await rows.saveChanges();
		expect(rows.length).toEqual(length - 1);
	}
});


function hostExpress(options) {
	const db = getDb('sqlite2').db(options);
	let app = express();
	app.disable('x-powered-by')
		.use(json({ limit: '100mb' }))
		.use('/rdb', cors(), db.express());
	server = app.listen(port, () => console.log(`Example app listening on port ${port}}!`));
}

const pathSegments = fileURLToPath(import.meta.url).split('/');
const lastSegment = pathSegments[pathSegments.length - 1];
const fileNameWithoutExtension = lastSegment.split('.')[0];
const sqliteName = `demo.${fileNameWithoutExtension}.db`;
const sqliteName2 = `demo.${fileNameWithoutExtension}2.db`;

const connections = {
	mssql: {
		db:
			map({
				db: (con) => con.mssql({
					server: 'mssql',
					options: {
						encrypt: false,
						database: 'master'
					},
					authentication: {
						type: 'default',
						options: {
							userName: 'sa',
							password: 'P@assword123',
						}
					}
				})
			}, ),
		init: initMs
	},
	mssqlNative:
	{
		db: map({ db: (con) => con.mssqlNative('server=mssql;Database=demo;Trusted_Connection=No;Uid=sa;pwd=P@assword123;Driver={ODBC Driver 18 for SQL Server};TrustServerCertificate=yes') }),
		init: initMs
	},
	pg: {
		db: map({ db: con => con.postgres('postgres://postgres:postgres@postgres/postgres') }),
		init: initPg
	},
	sqlite: {
		db: map({ db: (con) => con.sqlite(sqliteName) }),
		init: initSqlite
	},
	sqlite2: {

		db: map({ db: (con) => con.sqlite(sqliteName2) }),
		init: initSqlite
	},
	sap: {
		db: map({ db: (con) => con.sap(`Driver=${__dirname}/libsybdrvodb.so;SERVER=sapase;Port=5000;UID=sa;PWD=sybase;DATABASE=master`) }),
		init: initSap
	},
	mysql: {
		db: map({ db: (con) => con.mysql('mysql://test:test@mysql/test') }),
		init: initMysql
	},
	http: {
		db: map.http(`http://localhost:${port}/rdb`),
	}

};

function getDb(name) {
	if (name === 'mssql')
		return connections.mssql;
	else if (name === 'mssqlNative')
		return connections.mssqlNative;
	else if (name === 'pg')
		return connections.pg;
	else if (name === 'sqlite')
		return connections.sqlite;
	else if (name === 'sqlite2')
		return connections.sqlite2;
	else if (name === 'sap')
		return connections.sap;
	else if (name === 'mysql')
		return connections.mysql;
	else if (name === 'http')
		return connections.http;
	else
		throw new Error('unknown');
}
