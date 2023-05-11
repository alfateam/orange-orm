// foo.ts
import orm from './orm';

orm.foo([])
const party = orm.table('party')(mapper => {
  return {
    partyId: mapper.column('foo').string(),
    location: mapper.column('bar').string()
  }
});



const customerMapped = orm.table('customer')(mapper => {
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

const orderMapped = orm.table('order')(mapper => {
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
  const orderRows = await orderMapped.getMany(filter, {orderBy: ['balance'],customer: {orderBy: ['partyId asc'], party: {location: false}}});
  orderRows.customer.party.
});

