const rdb = require('../src/index');

const map = rdb.map(x => ({
	customer: x.table('customer').map(({ column }) => ({
		id: column('id').numeric().primary(),
		name: column('name').string(),
		balance: column('balance').numeric(),
		isActive: column('isActive').boolean(),
	})),

	order: x.table('_order').map(({ column }) => ({
		//@ts-ignore
		id: column('id').numeric().primary(),
		orderDate: column('orderDate').date(),
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
		deliveryParty: hasOne(x.deliveryAddress).by('orderId'),
		lines: hasMany(x.orderLine).by('orderId')
	}))
}));

module.exports = map;
