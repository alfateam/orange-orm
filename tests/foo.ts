// foo.ts
import orm from './orm';

interface Order {
  id: string;
  name: string;
  balance: number;
  createdAt: string;
  updatedAt: Date;
  customerId: string;
  customer: Customer;
}

interface Customer {
  id: string;
  name: string;
}
interface Party {
  id: string;
  name: string;
}

const order = orm.table<Order>('order');
const customer = orm.table<Customer>('customer');
// const party = orm.table<Party>('party');


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
    customer: mapper.references(customerMapped).by('customerId')
  };
});

(async () => {  
  
  const filter = orderMapped.customer.name.equalTo('lars');
  const orderRows = await orderMapped.getMany(filter, { orderBy: ['name', 'createdAt desc', 'updatedAt'], balance: true, customer: {id: true} });  

  console.log(orderRows);



  const customerRows = await customerMapped.getMany();
  console.log(customerRows);
})();
