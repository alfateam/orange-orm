// foo.ts
import orm from './orm';

interface Order {
  id: string;
  name: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
  customerId: string;
  customer: Customer;
}

interface Customer {
  id: string;
  name: string;
}

const order = orm.table<Order>('order');
const customer = orm.table<Customer>('customer');

const customerMapped = customer.map(mapper => {
  return {
    id: mapper.column('id').string(),
    name: mapper.column('name').string(),
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
    customer: mapper.references(customerMapped).by('customerId'),
  };
});


(async () => {  
  const customerFilter = orderMapped.customer.name.startsWith('demo');
  const balanceFilter = orderMapped.balance.greaterThan(100);
  const nameFilter = orderMapped.name.startsWith('lars');
  const filter = balanceFilter.and(nameFilter).and(customerFilter);
  const orderRows = await orderMapped.getMany(filter);
  console.log(orderRows);

  const customerRows = await customerMapped.getMany();
  console.log(customerRows);
})();
