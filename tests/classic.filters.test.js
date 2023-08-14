import { describe, test, beforeAll, expect } from 'vitest';
import rdb from '../src/index';
const db = require('./db');
const initPg = require('./initPg');
const initMs = require('./initMs');
const initMysql = require('./initMysql');
const initSqlite = require('./initSqlite');
const initSap = require('./initSap');
const dateToISOString = require('../src/dateToISOString');
const versionArray = process.version.replace('v', '').split('.');

const Order = rdb.table('_order');
Order.column('id').numeric().primary().notNullExceptInsert(),
    Order.column('orderDate').date().notNull();

const Lines = rdb.table('orderLine');
Lines.column('id').numeric().primary().notNullExceptInsert();
Lines.column('orderId').numeric();
Lines.column('product').string();

const Packages = rdb.table('package');
Packages.column('packageId').numeric().primary().notNullExceptInsert().as('id');
Packages.column('lineId').numeric();
Packages.column('sscc').string();


const lineJoin = Lines.join(Order).by('orderId').as('order');
const packageJoin = Packages.join(Lines).by('lineId').as('lines');

Order.hasMany(lineJoin).as('lines');
Lines.hasMany(packageJoin).as('packages');


beforeAll(async () => {
    await createMs('mssql');
    // await insertData('pg');
    await insertData('mssql');
    // if (major > 17)
    // 	await insertData('mssqlNative');
    // await insertData('mysql');
    // await insertData('sqlite');
    // await insertData('sap');

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
                    {
                        product: 'Bicycle',
                        packages: [
                            { sscc: 'aaaa' }
                        ]
                    },
                    {
                        product: 'Small guitar',
                        packages: [
                            { sscc: 'bbbb' }
                        ]
                    }
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
                    {
                        product: 'Magic wand',
                        packages: [
                            { sscc: '1234' }
                        ]
                    }
                ]
            }
        ]);
    }

    async function createMs(dbName) {
        const { db } = getDb(dbName);
        const sql = `IF NOT EXISTS(SELECT * FROM sys.databases WHERE name = 'demo')
		BEGIN
			CREATE DATABASE demo
		END
		`;
        await db.query(sql);
    }
});


describe.only('getMany-lines-any-packages filter', async () => {
    rdb.log(console.dir);

    let db = rdb.mssql({
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
    });

    test('basic filter', async () => {
        await db.transaction(async () => {

            // const filter = Order.lines.packages.lines.order.lines.packages.exists().and(Order.id.eq(1));
            // const filter = Order.lines.packages.lines.order.lines.packages.sscc.startsWith('aaa')


            // const filter = Order.lines.product.startsWith('Bic');

            // const filter = Order.lines.any(x => {
            //     return x.product.startsWith('Bic');
            // });
            
            const filter = Order.lines.any(x => {
                // return x.packages.any(x => x.sscc.startsWith('aaa'));
                const f0 = x.product.startsWith('Bic');
                const f1 = x.packages.any(x => x.sscc.startsWith('aaa'))
                return f0.and(f1);
            });
            // const filter = Order.lines.any(x => {
            //     const f0 = x.product.startsWith('Bic');
            //     const f1 = x.packages.any(x => x.sscc.startsWith('aaa'))
            //     return f0.and(f1);
            // });

            // const filter = Order.lines.any(x => {
            //     return x.product.startsWith('Bic').or(x.product.startsWith('Bicy'));
            //     const f0 = x.product.startsWith('Bic').or(x.product.startsWith('Bicy'));
            //     const f1 = x.packages.any(x => x.sscc.startsWith('aaa'))
            //     const f3 = x.order.lines.packages.sscc.startsWith('aaa');
            //     return f0.and(f1).and(f3);
            // });


            let rows = await Order.getMany(filter);
            let dtos = await rows.toDto({});

            const date1 = new Date(2022, 0, 11, 9, 24, 47);
            const expected = [
                {
                    id: 1,
                    orderDate: dateToISOString(date1),
                }
            ];

            for (let i = 0; i < dtos.length; i++) {
                dtos[i].orderDate = dateToISOString(new Date(rows[i].orderDate));
            }

            expect(dtos).toEqual(expected);
        });
        // console.log(dtos);
    });


});

function getDb(name) {
    if (name === 'mssql')
        return {
            db:
                db.mssql({
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
                }),
            init: initMs

        };
    else if (name === 'mssqlNative')
        return {
            db: db.mssqlNative('server=mssql;Database=demo;Trusted_Connection=No;Uid=sa;pwd=P@assword123;Driver={ODBC Driver 18 for SQL Server};TrustServerCertificate=yes'),
            init: initMs
        };
    else if (name === 'pg')
        return {
            db: db.postgres('postgres://postgres:postgres@postgres/postgres'),
            init: initPg
        };
    else if (name === 'sqlite')
        return {
            db: db.sqlite(sqliteName),
            init: initSqlite
        };
    else if (name === 'sap')
        return {
            db: db.sap(`Driver=${__dirname}/libsybdrvodb.so;SERVER=sapase;Port=5000;UID=sa;PWD=sybase;DATABASE=master`),
            init: initSap
        };
    else if (name === 'mysql')
        return {
            db: db.mysql('mysql://test:test@mysql/test'),
            init: initMysql
        };

    throw new Error('unknown db');
}
const sqliteName = `demo${new Date().getUTCMilliseconds()}.db`;
