// foo.ts
import orm from './orm';

const party = orm.table('party').map(mapper => {
  return {
    partyId: mapper.column('foo').string(),
    location: mapper.column('bar').string(),
  }
});



const customerMapped = orm.table('customer').map(mapper => {
  return {
    id: mapper.column('id').string(),
    name: mapper.column('name').string(),
    partyId: mapper.column('partyId').string(),
  };
})(mapper => {
  return {
    party: mapper.references(party).by('partyId')
  }
});


const orderMapped = orm.table('order').map(mapper => {
  return {
    id: mapper.column('id').uuid(),
    name: mapper.column('name').string(),
    balance: mapper.column('balance').number(),
    createdAt: mapper.column('created_at').date(),
    updatedAt: mapper.column('updated_at').date(),
    customerId: mapper.column('customer_id').string(),
  };
})(mapper => {
  return {
    customer: mapper.references(customerMapped).by('customerId')
  }
});

(async () => {
  const filter = orderMapped.customer.name.equalTo('lars');
  const orderRows = await orderMapped.getMany(filter, { orderBy: ['balance'], customer: { orderBy: ['partyId asc'], party: { location: false } } });
  const bar = foo(orderRows);
  orderRows
});



function foo(orderRows: Order) {
  throw new Error('Function not implemented.');
}

interface Order {
  id: string;
  name: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
  customerId: string;

  customer: {
    id: string;
    name: string;
    partyId: string;
    party: {
      partyId: string;
    };
  };
}


