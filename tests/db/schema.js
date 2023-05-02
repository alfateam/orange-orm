const rdb = require('../../src/index');

//customer
const customer = rdb.table('customer');
customer.primaryColumn('id').numeric();
customer.column('name').string().validate(validateName);
customer.column('balance').numeric();
customer.column('isActive').boolean();

function validateName(value, _row) {
	if (value && value.length > 10)
		throw new Error('Length cannot exceed 10 characters');
}

//order
const order = rdb.table('_order');
order.primaryColumn('id').numeric();
order.column('orderDate').date();
order.column('customerId').numeric();

//orderLine
const orderLine = rdb.table('orderLine');
orderLine.primaryColumn('id').numeric();
orderLine.column('orderId').numeric();
orderLine.column('product').string();

//deliveryAddress
const deliveryAddress = rdb.table('deliveryAddress');
deliveryAddress.primaryColumn('id').numeric();
deliveryAddress.column('orderId').numeric();
deliveryAddress.column('name').string();
deliveryAddress.column('street').string();
deliveryAddress.column('postalCode').string();
deliveryAddress.column('postalPlace').string();
deliveryAddress.column('countryCode').string();

//relations
order.join(customer).by('customerId').as('customer');

const line_order_relation = orderLine.join(order).by('orderId').as('order');
order.hasMany(line_order_relation).as('lines');

const deliveryAddress_order_relation = deliveryAddress.join(order).by('orderId').as('order');
order.hasOne(deliveryAddress_order_relation).as('deliveryAddress');

module.exports = rdb({
	tables: {
		customer,
		order,
		lines: orderLine
	}
});
