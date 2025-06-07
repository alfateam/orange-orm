// client.ts

import { db } from './map2';
import { schema } from './schema';

// Initialize the client
const database = db(schema);

async function exampleUsage() {
	// 1) Simple getAll without any fetch strategy → returns all columns for each row

	const allCustomers = await database.customers.getAll();
	// Type of allCustomers: Array<{ id: string; name: string; email: string }>
	console.log('All customers:', allCustomers);

	const allOrders = await database.orders.getAll();
	// Type of allOrders: Array<{ id: string; customerId: string; status: string; placedAt: string }>
	console.log('All orders:', allOrders);

	// 2) getById without fetch strategy → returns all columns for that single row or null

	const customer1 = await database.customers.getById('a1b2c3d4-uuid');
	// Type of customer1: { id: string; name: string; email: string } | null
	console.log('Customer #1:', customer1);

	const order1 = await database.orders.getById('z9y8x7w6-uuid');
	// Type of order1: { id: string; customerId: string; status: string; placedAt: string } | null
	console.log('Order #1:', order1);

	// 3) Fetch only specific columns (e.g. pick name and email for customers):

	const partialCustomers = await database.customers.getAll({
		name: true,
		email: true
	});
	// Type: Array<{ name: string; email: string }>
	console.log('Partial customers (name + email):', partialCustomers);

	// 4) Exclude certain columns (e.g. fetch all columns except email for customers):

	const noEmailCustomers = await database.customers.getAll({
		email: false
	});
	// Type: Array<{ id: string; name: string }>
	console.log('Customers without email field:', noEmailCustomers);

	// 5) Fetch a customer plus all of their orders (relation 'orders: true'):

	const customerWithOrders = await database.customers.getById('a1b2c3d4-uuid', {
		orders: true
	});
	/* Type of customerWithOrders:
     {
       id: string;
       name: string;
       email: string;
       orders: Array<{
         id: string;
         customerId: string;
         status: string;
         placedAt: string;
       }>;
     } | null
  */
	console.log('Customer with all orders:', customerWithOrders);

	// 6) Fetch an order and only include its status + placedAt, plus the customer’s email:

	const orderPartial = await database.orders.getById('z9y8x7w6-uuid', {
		status: true,
		placedAt: true,
		customer: { email: true }
	});
	/* Type of orderPartial:
     {
       status: string;
       placedAt: string;
       customer: { email: string } | null;
     } | null
  */
	console.log('Order with partial fields + customer email:', orderPartial);

	// 7) Fetch all orderLines including the full “packages” relation:

	const linesWithAllPackages = await database.orderLines.getAll({
		packages: true
	});
	/* Type of linesWithAllPackages:
     Array<{
       orderId: string;
       productId: string;
       quantity: number;
       price: number;
       packages: Array<{
         id: string;
         orderLineOrderId: string;
         orderLineProductId: string;
         weight: number;
         shippedAt: string;
       }>;
     }>
  */
	console.log('OrderLines with all packages:', linesWithAllPackages);

	// 8) Equivalent to include packages via an empty object:

	const linesWithPackagesEmpty = await database.orderLines.getAll({
		packages: {}
	});
	// Same type as above
	console.log('OrderLines with packages (using {}):', linesWithPackagesEmpty);

	// 9) Exclude the packages relation entirely:

	const linesNoPackages = await database.orderLines.getAll({
		packages: false
	});
	/* Type of linesNoPackages:
     Array<{
       orderId: string;
       productId: string;
       quantity: number;
       price: number;
     }>
  */
	console.log('OrderLines without packages:', linesNoPackages);

	// 10) Composite‐key getById example: fetch a single orderLine, include only quantity + price, and include its packages (only weight & shippedAt):

	const lineKey = { orderId: 'z9y8x7w6-uuid', productId: 'p1q2r3-uuid' };
	const singleLine = await database.orderLines.getById(lineKey, {
		quantity: true,
		price: true,
		packages: {
			weight: true,
			shippedAt: true
		}
	});
	/* Type of singleLine:
     {
       quantity: number;
       price: number;
       packages: Array<{
         weight: number;
         shippedAt: string;
       }>;
     } | null
  */
	console.log('Single OrderLine with partial packages:', singleLine);

	// 11) You can also fetch a deep nested example: fetch orders with each line (only productId) and for each line include packages with only id:

	const deepFetch = await database.orders.getAll({
		lines: {
			productId: true,
			packages: {
				id: true
			}
		}
	});
	/* Type of deepFetch:
     Array<{
       orderId: string;
       productId: string;
       quantity: number;
       price: number;
       lines: Array<{
         productId: string;
         packages: Array<{ id: string }>;
       }>;
     }>
  */
	const filter0 = database.filter.and(database.customers.name.equal('John Doe'));
	const filter = database.orders.customer(x => x .name.equal('John Doe'));
	const filterB = database.customers.orders.placedAt.equal('foo');
	const filterA = database.customers.orders.any(x => x.placedAt.equal('foo'));

	const exists = database.customers.orders.exists();


	const filter2 = database.orders.lines.productId.equal('p1q2r3-uuid');
	const filter3 = database.orders.lines.any(x => x.productId.equal('p1q2r3-uuid'));
	const filter4 = database.orders.lines.all(x => x.productId.equal('p1q2r3-uuid'));
	const filter5 = database.orders.lines.none(x => x.productId.equal('p1q2r3-uuid'));

	const filter6 = database.orders.lines.none(x =>  x.packages.any(y => y.orderLine.price.equal(100)));

	const sorted = await database.orders.getAll({
		lines: {
			orderBy: ['productId asc']
		},
		orderBy: ['customerId']
	});


	const filtered = await database.orders.getAll({
		where: x => x.lines.all(x => x.order.lines.packages.all(x => x.id.equal('1'))),
		customer: {
			where: x => x .name.equal('John Doe')
		}
	});


	const filtered2 = await database.orders.getById('dd',{
		where: x => x.lines.all(x => x.order( x => x.customerId.equal('d'))),
		customer: {
			where: x => x.name.equal('John Doe')
		}
	});

	console.log('Deep nested fetch (orders → lines → packages):', deepFetch);

	const composite = await database.orderLines.getById({orderId: '1', productId: '2'}, {
		quantity: true});

	const customer = await database.customers.getById('a1b2c3d4-uuid');

}

exampleUsage().catch(console.error);
