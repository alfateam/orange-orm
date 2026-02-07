import rdb from '../dist/index.mjs';

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
	customerDiscr: x.table('customer').map(({ column }) => ({
		id: column('id').numeric().primary().notNullExceptInsert(),
		name: column('name').string(),
		balance: column('balance').numeric(),
		isActive: column('isActive').boolean(),
	})).columnDiscriminators('balance=200'),
	withSchema: x.table('withSchema').map(({ column }) => ({
		id: column('id').numeric().primary().notNullExceptInsert(),
		name: column('name').string(),
	})),

	vendor: x.table('vendor').map(({ column }) => ({
		id: column('id').numeric().primary().notNull(),
		name: column('name').string().validate(validateName).validate(truthy).JSONSchema(nameSchema),
		balance: column('balance').numeric(),
		isActive: column('isActive').boolean(),
	})),
	vendorDiscr: x.table('vendor').map(({ column }) => ({
		id: column('id').numeric().primary().notNull(),
		name: column('name').string(),
		isActive: column('isActive').boolean(),
	})).columnDiscriminators('balance=1'),

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
		balance: column('balance').numeric().default(0),
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

	compositeOrder: x.table('compositeOrder').map(({ column }) => ({
		companyId: column('companyId').string().primary().notNullExceptInsert(),
		orderNo: column('orderNo').numeric().primary().notNullExceptInsert(),
	})),

	compositeOrderLine: x.table('compositeOrderLine').map(({ column }) => ({
		companyId: column('companyId').string().primary().notNullExceptInsert(),
		orderNo: column('orderNo').numeric().primary().notNullExceptInsert(),
		lineNo: column('lineNo').numeric().primary().notNullExceptInsert(),
		product: column('product').string(),
	})),

	order: x.table('order').map(({ column }) => ({
		id: column('id').numeric().primary().notNullExceptInsert(),
		orderDate: column('orderDate').date().notNull(),
		customerId: column('customerId').numeric().notNullExceptInsert(),
	})),
	orderNote: x.table('orderNote').map(({ column }) => ({
		id: column('id').numeric().primary().notNullExceptInsert(),
		orderId: column('orderId').numeric().notNullExceptInsert(),
		note: column('note').string(),
	})),

	orderLine: x.table('orderLine').map(({ column }) => ({
		id: column('id').numeric().primary().notNullExceptInsert(),
		orderId: column('orderId').numeric(),
		product: column('product').string(),
		amount: column('amount').numeric(),
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
		date: column('date').date(),
		datetime: column('tdatetime').date(),
	})),

	datetestWithTz: x.table('datetest').map(({ column }) => ({
		id: column('id').numeric().primary().notNullExceptInsert(),
		date: column('date').date(),
		datetime: column('tdatetime').date(),
		datetime_tz: column('tdatetime_tz').dateWithTimeZone()
	})),
	brukerRolleLike: x.table('bruker_rolle_like').map(({ column }) => ({
		brukerRolleId: column('bruker_rolle_id').string().primary().notNull(),
		brukerId: column('bruker_id').string().notNull(),
		rolleTypeId: column('rolle_type_id').numeric().notNull(),
		aktorId: column('aktor_id').string().notNull(),
		opprettetTid: column('opprettet_tid').date().notNull(),
		avsluttetTid: column('avsluttet_tid').date(),
		brukerRolleStatusTypeId: column('bruker_rolle_status_type_id').numeric().notNull(),
		sistEndretAvBrukerId: column('sist_endret_av_bruker_id').string()
	})),
	bigintParent: x.table('bigintParent').map(({ column}) => ({
		id: column('id').bigint().primary().notNullExceptInsert(),
		foo: column('foo').numeric(),
	})),
	bigintChild: x.table('bigintChild').map(({ column}) => ({
		id: column('id').bigint().primary(),
		bar: column('bar').numeric(),
		parentId: column('parentId').bigint()
	}))

})).map(x => ({
	orderLine: x.orderLine.map(({ hasMany, references }) => ({
		packages: hasMany(x.package).by('lineId'),
		order: references(x.order).by('orderId'),
	})),
	customer: x.customer.map(({hasMany}) => ({
		orders: hasMany(x.order).by('customerId')
	})),
	order: x.order.map(({ hasOne, hasMany, references }) => ({
		customer: references(x.customer).by('customerId').notNull(),
		customerDiscr: references(x.customerDiscr).by('customerId'),
		deliveryAddress: hasOne(x.deliveryAddress).by('orderId').notNull(),
		lines: hasMany(x.orderLine).by('orderId')
	})),
	orderNote: x.orderNote.map(({ references }) => ({
		order: references(x.order).by('orderId')
	})),
	compositeOrder: x.compositeOrder.map(({ hasMany }) => ({
		lines: hasMany(x.compositeOrderLine).by('companyId', 'orderNo')
	})),
	bigintParent: x.bigintParent.map(({ hasMany }) => ({
		children: hasMany(x.bigintChild).by('parentId')
	}))
}));

export default map;
