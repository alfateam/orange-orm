// foo.ts
import orm from './orm';

const party = orm.table('party')
  .map(mapper => (
    {
      id: mapper.primaryColumn('id').uuid(),
      location: mapper.column('location').string(),
    }
  ));

const customer = orm.table('customer')
  .map(mapper => (
    {
      id: mapper.primaryColumn('id').uuid().notNull(),
      name: mapper.column('name').string(),
      partyId: mapper.column('partyId').uuid(),
    }
  ))
  .map(mapper => (
    {
      party: mapper.references(party).by('partyId')
    }
  ));

const orderLines = orm.table('orderLines')
  .map(({ column, primaryColumn }) => (
    {
      id: primaryColumn('id').uuid(),
      orderId: column('orderId').uuid().notNull(),
      product: column('product').string()
    }
  ));

const order = orm.table('order')
  .map(({ column, primaryColumn }) => (
    {
      id: primaryColumn('id').uuid().notNull(),
      title: column('name').string().notNull(),
      balance: column('balance').numeric(),
      createdAt: column('created_at').date(),
      updatedAt: column('updated_at').date(),
      customerId: column('customer_id').uuid(),
      picture: column('picture').json()
    }
  ))
  .map((mapper) => (
    {
      customer: mapper.references(customer).by('customerId'),
      lines: mapper.hasMany(orderLines).by('orderId')
    }
  ));

const db = orm({ order });


const filter = db.order.lines.all(x => {
  return x.orderId.eq('2');
})

const row = await db.order.getOne(filter, {
  customer: {

  },
  limit: 3,
  createdAt: true,
  orderBy: ['createdAt'],
  lines: true

  // }  // customer: {
  //   limit: 3,
  //   orderBy: ['name']
  // },
  // lines: {
  //   id: true,
  //   product: true,
  //   limit: 1
  // }
  // customer: true,
  // balance: true,
  // customerId: false
});
row.