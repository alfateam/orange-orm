const rdb = require('rdb');
const _db = require('./db');
const initDb = require('./initSqlite');
const dateToISOString = require('../src/dateToISOString');

test('insert autoincremental', async () => {
	const db = _db({
		db: rdb.sqlite(`demo${new Date().getUTCMilliseconds()}.db`)
		// db: rdb.sqlite(__dirname + `/demo${new Date().getUTCMilliseconds()}.db`)
	});
	await initDb(db);

	const george = await db.customer.insert({
		name: 'George',
		balance: 177,
		isActive: true
	});

	const expected = {
		id: 1,
		name: 'George',
		balance: 177,
		isActive: true
	};

	expect(george).toEqual(expected);
});

test('insert autoincremental with relations', async () => {
	const db = _db({
		db: rdb.sqlite(`demo${new Date().getUTCMilliseconds()}.db`)
	});
	await initDb(db);

	const date1 = new Date(2022, 0, 11, 9, 24, 47);
	const date2 = new Date(2021, 0, 11, 12, 22, 45);
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

	let orders = await db.order.insert([
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

	const expected = [
		{
			id: 1,
			orderDate: dateToISOString(date1),
			customerId: 1,
			customer: {
				id: 1,
				name: 'George',
				balance: 177,
				isActive: true
			},
			deliveryAddress: {
				id: 1,
				orderId: 1,
				name: 'George',
				street: 'Node street 1',
				postalCode: '7059',
				postalPlace: 'Jakobsli',
				countryCode: 'NO'
			},
			lines: [
				{ product: 'Bicycle', id: 1, orderId: 1 },
				{ product: 'Small guitar', id: 2, orderId: 1 }
			]
		},
		{
			id: 2,
			customerId: 2,
			customer: {
				id: 2,
				name: 'John',
				balance: 200,
				isActive: true
			},
			orderDate: dateToISOString(date2),
			deliveryAddress: {
				id: 2,
				orderId: 2,
				name: 'Harry Potter',
				street: '4 Privet Drive, Little Whinging',
				postalCode: 'GU4',
				postalPlace: 'Surrey',
				countryCode: 'UK'
			},
			lines: [
				{ product: 'Piano', id: 3, orderId: 2 }
			]
		}
	];

	expect(orders).toHaveLength(2);
	expect(orders).toEqual(expected);

});

