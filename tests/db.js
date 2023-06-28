const rdb = require('../src/index');
const client = require('../src/client/index');

const nameSchema = {
	type: 'string',
};


function validateName(value) {
	if (value && value.length > 10)
		throw new Error('Length cannot exceed 10 characters');
}

function truthy(value) {
	if (!value)
		throw new Error('Name must be set');
}

const map = rdb.map(x => ({
	customer: x.table('customer').map(({ column }) => ({
		id: column('id').numeric().primary(),
		name: column('name').string().validate(validateName).validate(truthy).JSONSchema(nameSchema),
		balance: column('balance').numeric(),
		isActive: column('isActive').boolean(),
	})),

	order: x.table('_order').map(({ column }) => ({
		id: column('id').numeric().primary(),
		orderDate: column('orderDate').date().notNull(),
		customerId: column('customerId').numeric(),
	})),

	orderLine: x.table('orderLine').map(({ column }) => ({
		id: column('id').string().primary(),
		orderId: column('orderId').numeric(),
		product: column('product').string(),
	})),

	deliveryAddress: x.table('deliveryAddress').map(({ column }) => ({
		id: column('id').numeric().primary(),
		orderId: column('orderId').numeric(),
		name: column('name').string(),
		street: column('street').string(),
		postalCode: column('postalCode').string(),
		postalPlace: column('postalPlace').string(),
		countryCode: column('countryCode').string(),
	})),

})).map(x => ({
	order: x.order.map(({ hasOne, hasMany, references }) => ({
		customer: references(x.customer).by('customerId'),
		deliveryAddress: hasOne(x.deliveryAddress).by('orderId'),
		lines: hasMany(x.orderLine).by('orderId')
	}))
}));


const customer = rdb.table('customer');
customer.primaryColumn('id').numeric();
customer.column('name').string().validate(validateName).validate(truthy).JSONSchema(nameSchema);
customer.column('balance').numeric();
customer.column('isActive').boolean();

const order = rdb.table('_order');
order.column('id').numeric().primary();
order.column('orderDate').date().notNull();
order.column('customerId').numeric();


const orderLine = rdb.table('orderLine');
orderLine.primaryColumn('id').string();
orderLine.column('orderId').numeric();
orderLine.column('product').string();

const deliveryAddress = rdb.table('deliveryAddress');
deliveryAddress.primaryColumn('id').numeric();
deliveryAddress.column('orderId').numeric();
deliveryAddress.column('name').string();
deliveryAddress.column('street').string();
deliveryAddress.column('postalCode').string();
deliveryAddress.column('postalPlace').string();
deliveryAddress.column('countryCode').string();


order.join(customer).by('customerId').as('customer');
const lineJoin = orderLine.join(order).by('orderId');
order.hasMany(lineJoin).as('lines');
const deliveryAddressJoin = deliveryAddress.join(order).by('orderId');
order.hasOne(deliveryAddressJoin).as('deliveryAddress');

module.exports = client({tables: {order, customer, orderLine, deliveryAddress}});






// module.exports = map;
