var rdb = require('./index');
 rdb.log(console.log);
var table = rdb.table;
var db = rdb('postgres://test:test@localhost:5432/test');

var Transporter = rdb.table('_order_transporter');
Transporter.primaryColumn('id').guid();
Transporter.column('order_id').guid().as('orderId');
Transporter.column('name').string();

var Order = rdb.table('_order');
Order.primaryColumn('id').guid();
Order.column('registered_date').date().as('registeredDate');
Order.column('order_no').string().as('orderNo');
Order.column('po_reference').string().as('poReference');
Order.column('senders_reference').string().as('sendersReference');

var orderTransporterRelation = Transporter.join(Order).by('order_id').as('order');
Order.hasOne(orderTransporterRelation).as('transporter');

var strategy = {transporter: null};

Order.createReadStream(db, null, strategy).pipe(process.stdout);

