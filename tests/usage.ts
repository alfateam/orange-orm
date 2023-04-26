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

class Customer {
	customerId: string;
	name: string;
}

class OrderLine {
	lineId: string;
}

class DeliveryAddress {
	addressId: string;
	order: Order
}

const customer = rdb.table<Customer>('customer').map((table) => {
	return {
		customerId: table.column('customerId').string(),
		name: table.column('name').string()
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
		customerId: mapper.column('customerId').string()
	}
});


const order = rdb.table<Order>('order').map(({column, references}) => {
	return {
		id: column('id').string(),
		customerId: column('customerId').string(),
		someJSON: column('someJSON').json(),
		customer: references(customer).by('customerId')
		// deliveryAddress: references(deliveryAddress).by('customerId')
	}
});

const db = rdb({
	customer: customer,
	order: order,
	// foo: {id: 1}
});

const row  = {customerId: '1'};

db.order.getAll({orderBy: [] }


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