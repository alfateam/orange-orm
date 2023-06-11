// foo.ts
import orm from './orm';

const party = orm.table('party').map(mapper => {
  return {
    pid: mapper.primaryColumn('foo').uuid(),
    plocation: mapper.column('bar').string(),
    plocation2: mapper.column('dbar').string(),
  }
});


const customerMapped = orm.table('customer').map(mapper => {
  return {
    id: mapper.primaryColumn('id').uuid().notNull(),
    name: mapper.column('name').string(),
    partyId: mapper.column('partyId').uuid(),
  };
})
.map(mapper => {
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
    customerId: mapper.column('customer_id').uuid(),
    picture: mapper.column('picture').json()
  };
}).map(mapper => {
  return {
    customer: mapper.references(customerMapped).by('customerId')
  }
});

const filter = orderMapped.customer.name.equal('lars');


const row = await orderMapped.getOne(filter, {
  orderBy: ['balance'],
  customer: true,
  createdAt: true
  // balance: false,
  // , customer: { name: true }
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
