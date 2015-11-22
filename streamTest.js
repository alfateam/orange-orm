var rdb = require('./index');
var table = rdb.table;
rdb.log(console.log);
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

var FreightLine = rdb.table('_order_freight_line');

FreightLine.primaryColumn('id').guid();
FreightLine.column('order_id').guid().as('orderId');
FreightLine.column('line_no').numeric().as('lineNo');
FreightLine.column('description').string();

var orderFreightLinesRelation = FreightLine.join(Order).by('order_id').as('order');
Order.hasMany(orderFreightLinesRelation).as('lines');

// Order.createReadStream(db, null, strategy).on('end', onEnd).on('data', onData);

var strategy = {
    transporter: null,
    orderBy: ['poReference'],
    lines: {
    	orderBy: ['lineNo']
    }
};

// Order.createJSONReadStream(db, null, strategy);

Order.createJSONReadStream(db, null, strategy).pipe(process.stdout);

function onEnd() {
    console.log('end');
}

function onData (data) {
	console.log(data);
}
