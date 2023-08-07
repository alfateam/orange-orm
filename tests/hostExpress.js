const initPg = require('./initPg');
const rdb = require('./db');
const Rdb = require('../src/index');
Rdb.log(console.dir);
const express = require('express');
const { json } = require('body-parser');


run();

async function run() {
	await server();
	await client();
}


function baseFilter({db, _request, _response}) {
	const filter =  db.order.lines.exists();
	return filter;
}

async function server() {
	const db = rdb({ db: (cons) => cons.postgres('postgres://postgres:postgres@postgres/postgres') });
	db({});
	await insertData(db);
	let app = express();
	app.disable('x-powered-by')
		.use(json({ limit: '100mb' }))
		.use('/rdb', db.express({order: {baseFilter}}));
	app.listen(3000, () => console.log('Example app listening on port 3000!'));

	async function insertData() {
		await initPg(db);

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

}



async function client() {
	const remote = rdb({ db: (c) => c.http('http://localhost:3000/rdb') });
	// const result = await remote.order.getMany(remote.filter.and(remote.order.id.eq('2323')));
	const result = await remote.order.getMany();
	console.dir(result);
}

