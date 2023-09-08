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
		id: column('id').numeric().primary().notNullExceptInsert(),
		name: column('name').string().validate(validateName).validate(truthy).JSONSchema(nameSchema),
		balance: column('balance').numeric(),
		isActive: column('isActive').boolean(),
	})),

	customer2: x.table('customer').map(({ column }) => ({
		id: column('id').numeric().primary().notNullExceptInsert(),
		name: column('name').string().validate(validateName).validate(truthy).JSONSchema(nameSchema),
		balance: column('balance').numeric(),
		isActive: column('isActive').boolean(),
		data: column('data').json(),
		picture: column('picture').binary()
	})),

	customerDefault: x.table('customer').map(({ column }) => ({
		id: column('id').numeric().primary().notNullExceptInsert(),
		name: column('name').string(),
		balance: column('balance').numeric(),
		isActive: column('isActive').boolean().default(true),
	})),

	customerDbNull: x.table('customer').map(({ column }) => ({
		id: column('id').numeric().primary().notNullExceptInsert(),
		name: column('name').string().validate(validateName).dbNull('foo'),
		balance: column('balance').numeric(),
		isActive: column('isActive').boolean(),
	})),

	package: x.table('package').map(({ column }) => ({
		id: column('packageId').numeric().primary().notNullExceptInsert(),
		lineId: column('lineId').numeric().notNullExceptInsert(),
		sscc: column('sscc').string()
	})),

	order: x.table('_order').map(({ column }) => ({
		id: column('id').numeric().primary().notNullExceptInsert(),
		orderDate: column('orderDate').date().notNull(),
		customerId: column('customerId').numeric().notNullExceptInsert(),
	})),

	orderLine: x.table('orderLine').map(({ column }) => ({
		id: column('id').numeric().primary().notNullExceptInsert(),
		orderId: column('orderId').numeric(),
		product: column('product').string(),
	})),

	deliveryAddress: x.table('deliveryAddress').map(({ column }) => ({
		id: column('id').numeric().primary().notNullExceptInsert(),
		orderId: column('orderId').numeric(),
		name: column('name').string(),
		street: column('street').string(),
		postalCode: column('postalCode').string(),
		postalPlace: column('postalPlace').string(),
		countryCode: column('countryCode').string(),
	})),

	datetest: x.table('datetest').map(({ column }) => ({
		id: column('id').numeric().primary().notNullExceptInsert(),
		date: column('_date').date(),
		datetime: column('_datetime').date(),
	})),

	datetestWithTz: x.table('datetest').map(({ column }) => ({
		id: column('id').numeric().primary().notNullExceptInsert(),
		date: column('_date').date(),
		datetime: column('_datetime').date(),
		datetime_tz: column('_datetime_tz').dateWithTimeZone()
	}))
})).map(x => ({
	orderLine: x.orderLine.map(({ hasMany }) => ({
		packages: hasMany(x.package).by('lineId')
	}))
})).map(x => ({
	order: x.order.map(({ hasOne, hasMany, references }) => ({
		customer: references(x.customer).by('customerId'),
		deliveryAddress: hasOne(x.deliveryAddress).by('orderId'),
		lines: hasMany(x.orderLine).by('orderId')
	}))

}));

module.exports = map;