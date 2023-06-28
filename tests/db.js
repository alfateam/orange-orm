const rdb = require('../src/index');

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
		id: column('id').numeric().primary(),
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

module.exports = map;
