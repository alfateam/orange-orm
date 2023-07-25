const initPg = require('./initPg');
const rdb = require('./db');
const express = require('express');
const { json } = require('body-parser');

run();

async function run() {
	await server();
	await client();
}


async function server() {
	const db = rdb({ db: (cons) => cons.postgres('postgres://postgres:postgres@postgres/postgres') });
	await insertData(db);
	let app = express();
	app.disable('x-powered-by')
		.use(json({ limit: '100mb' }))
		.use('/rdb', db.express());
	app.listen(3000, () => console.log('Example app listening on port 3000!'));

	async function insertData() {
		await initPg(db);

		const george = await db.customer.insert({
			name: 'George',
			balance: 177,
			isActive: true
		});

		const john = await db.customer.insert({
			name: 'John',
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
					{ product: 'Piano' }
				]
			}
		]);
	}

}



async function client() {
	const remote = rdb({ db: (c) => c.http('http://localhost:3000/rdb') });
	const result = await remote.customer.getMany();
	console.dir(result);
}

