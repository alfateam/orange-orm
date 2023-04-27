import rdb from './exp';

class Order {
	id: string;
	customer?: Customer;
	customerId?: string;
	deliveryAddress?: DeliveryAddress;
	orderLines?: OrderLine;
	someJSON: SomeJSON;
}

class SomeJSON {
	foo: string;
}


class OrderLine {
	lineId: string;
}

class DeliveryAddress {
	addressId: string;
	order: Order
}

class Customer {
	customerId: string;
	name: string;
}


const customer = rdb.table<Customer>('customer').map(({column}) => {
	return {
		customerId: column('customerId').string(),
		name: column('name').string()
	}
});

const deliveryAddress = rdb.table<DeliveryAddress>('deliveryAddress').map((table) => {
	return {
		addressId: table.column('addressId').string()
	}
});

const order0 = rdb.table<Order>('order').map((mapper) => {
	return {
		id: mapper.column('id').string(),
		customerId: mapper.column('customerId').string(),
		fofo: 'sring'
	}
});


const order = rdb.table<Order>('order').map(({column, references}) => {
	return {
		id: column('id').string(),
		customerId: column('customerId').string(),
		someJSON: column('someJSON').json(),
		customer: references(customer).by('customerId'),
		foo: column('foo')
		// deliveryAddress: references(deliveryAddress).by('customerId')
	}
});


const db = rdb({
	customer: customer,
	order: order,
	// foo: {id: 1}
});

const filter = db.order.customerId.equals('fo');
const f2 = db.order.customer.name.equals('foo');
const f = f2.and(filter);
const row = await db.order.getOne(f, {orderBy: []});

await db.customer.getAll({orderBy: ['asc customerId']});





// type Person = {
// 	name: string;
// 	age: number;
//   };


// type staffKeys<T> = {
//   [K in keyof T]: `asc ${(string & keyof T)}` | `desc ${(string & keyof T)}` | K;
// }[keyof T];



//   function foo(keys: staffKeys<Person>[]) {
// 	return null;
//   }

//   foo(['age', 'asc age', 'desc age'])