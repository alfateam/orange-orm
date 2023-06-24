import orm from '../src/index';

interface Document {
  hello: string;
  world: number;
  sub: {
    a: boolean;
    b: boolean;
  };
}

const map = orm
  .map((x) => ({        
    deliveryParty: x.table('deliveryParty').map(({ column }) => ({
      id: column('id').uuid().notNull().primary(),
      orderId: column('order_id').uuid().notNull(),
      street: column('street').string(),
      postalCode: column('postal_code').string(),
      postalPlace: column('postal_place').string(),
    })),

    customer: x.table('customer').map(({ column }) => ({
      id: column('id').uuid().notNull().primary().notNullExceptInsert(),
      name: column('name').string(),
      customerNo: column('customer_no').numeric().notNull(),
    })),

    order: x.table('order').map(({ column }) => ({
      id: column('id').uuid().notNull().primary(),
      balance: column('balance').numeric(),
      title: column('name').string(),
      createdAt: column('created_at').date(),
      updatedAt: column('updated_at').date(),
      customerId: column('customer_id').uuid(),
      document: column('document').jsonOf<Document>(),
    })),

    orderLines: x.table('orderLines').map(({ column }) => ({
      id: column('id').uuid().notNull().primary(),
      orderId: column('order_id').uuid().notNull(),
      product: column('product').string(),
    })),
  }))
  .map((x) => ({
    order: x.order.map(({ hasMany, hasOne, references }) => ({
      lines: hasMany(x.orderLines).by('orderId'),
      deliveryParty: hasOne(x.deliveryParty).by('orderId'),      
      customer: references(x.customer).by('customerId')
    })),
  }));

  
const db = map({ db: (providers) => providers.mssql('foo') });


const filter = db.order.lines.any((line) => line.product.contains('bike'));
let row = await db.order.getOne(filter, {
  lines: true,
  customer: true,
  deliveryParty: true,
});

console.dir(row);
