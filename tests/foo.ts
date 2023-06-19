// foo.ts
import orm from './orm';

const party = orm.table('party')
  .map(x => (
    {
      id: x.column('id').uuid().notNull().primary(),
      location: x.column('location').string()
    }
  ));

const customer = orm.table('customer')
  .map(x => (
    {
      id: x.column('id').uuid().notNull().validate((e) => !!e).primary(),
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
  .map(({ column }) => (
    {
      id: column('id').uuid().notNull().primary().validate(e => !!e),
      orderId: column('orderId').uuid().notNull(),
      product: column('product').string(),
    }
  ));

const order = orm.table('order')
  .map(({ column }) => (
    {
      id: column('id').uuid().notNull().primary(),
      balance: column('balance').numeric(),
      title: column('name').string(),
      createdAt: column('created_at').date(),
      updatedAt: column('updated_at').date(),
      customerId: column('customer_id').uuid(),
      picture: column('picture').jsonOf<Foo>()
    }
  ))
  .map((x) => (
    {
      customer: x.references(customer).by('customerId'),
      lines: x.hasMany(orderLines).by('orderId')
    }
  ));



interface Foo {
    hello: string;
    world: number;
    sub: {
      a: boolean
      b: boolean
    }
}

const db = orm({ order, customer,  });

const filter = db.order.customer.name.eq("John");

let rows = await  db.order.getOne(filter, {lines: true, customer: true});

const data = {id: '7', title: 'title', customer: {id: '22',name: 'jp'}};

let inserted = await db.order.insert(data, {});

let rowById = await db.order.getById('id');


rowById.customerId = '12345';
await rowById.saveChanges();

const patch : any = [{foo: 1}];


rowById.createdAt