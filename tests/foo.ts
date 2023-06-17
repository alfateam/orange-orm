// foo.ts
import orm from './orm';

const party = orm.table('party')
  .map(x => (
    {
      id: x.column('id').uuid().primary(),
      location: x.column('location').string(),
    }
  ));

const customer = orm.table('customer')
  .map(x => (
    {
      id: x.column('id').uuid().notNull().primary(),
      name: x.column('name').string(),
      partyId: x.column('partyId').uuid(),
    }
  ))
  .map(x => (
    {
      party: x.references(party).by('partyId')
    }
  ));

const orderLines = orm.table('orderLines')
  .map(({ column, primaryColumn }) => (
    {
      id: column('id').uuid().primary(),
      orderId: column('orderId').uuid().notNull(),
      product: column('product').string()
    }
  ));

const order = orm.table('order')
  .map(({ column }) => (
    {
      id: column('id').uuid().notNull().primary(),
      title: column('name').string().notNull(),
      balance: column('balance').numeric(),
      createdAt: column('created_at').date(),
      updatedAt: column('updated_at').date(),
      customerId: column('customer_id').uuid(),
      picture: column('picture').json()
    }
  ))
  .map((x) => (
    {
      customer: x.references(customer).by('customerId'),
      lines: x.hasMany(orderLines).by('orderId')
    }
  ));

const db = orm({ order, customer });

const filter = db.order.customer.name.eq("John");
let rows = await  db.order.getMany();


