// foo.ts
import orm from './orm';


const order = orm.table('order');
const customer = orm.table('customer');
const party = orm.table('party').map(({column}) => {
	return {
		partyId: column('foo').string(),
		location: column('bar').string()
	};
});


const customerMapped = customer.map(mapper => {
	return {
		id: mapper.column('id').string(),
		name: mapper.column('name').string(),
		partyId: mapper.column('partyId').string(),
	};
}).map(mapper => {
	return {
		party: mapper.references(party).by('partyId'),
	};
});



const orderMapped = order.map(mapper => {
	return {
		id: mapper.column('id').uuid(),
		name: mapper.column('name').string(),
		balance: mapper.column('balance').number(),
		createdAt: mapper.column('created_at').date(),
		updatedAt: mapper.column('updated_at').date(),
		customerId: mapper.column('customer_id').string(),
		customer: mapper.references(customerMapped).by('customerId')
	};
});



(async () => {


	const filter = orderMapped.customer.name.equalTo('lars');
	const orderRows = await orderMapped.getMany(filter, {orderBy: [], customer: true, id: true});
	orderRows.
});
