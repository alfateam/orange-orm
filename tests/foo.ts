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
    id: mapper.column('id').string().notNull(),
    name: mapper.column('name').string(),
    partyId: mapper.column('partyId').string(),
  };
}).map(mapper => {
  return {
    party: mapper.references(party).by('partyId')
  }
});




const orderMapped = orm.table('order').map(mapper => {
  return {
    id: mapper.primaryColumn('id').uuid().notNull(),
    name: mapper.column('name').string().notNull(),
    balance: mapper.column('balance').numeric(),
    createdAt: mapper.column('created_at').date(),
    updatedAt: mapper.column('updated_at').date(),
    customerId: mapper.column('customer_id').string(),
    picture: mapper.column('picture').json(),
  };
}).map(mapper => {
  return {
    customer: mapper.references(customerMapped).by('customerId')
  }
});

const filter = orderMapped.customer.name.equal('lars');


const row = await orderMapped.getOne(filter, {
  orderBy: ['balance']
  // createdAt: true
  // balance: false,
  , customer: { name: true }
  // customer: {


  // }
  // customer: {
  //   id: true
  // }
  // customer: {id: true}
  // customer: {
  // //   orderBy: ['partyId asc'],    
  // //   orders: {

  // //   }

  // }
});
row.customer.
// row.customer.

// interface Order {
//   id: string;
//   balance?: number | null;
// }

