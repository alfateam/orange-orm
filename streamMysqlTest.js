var rdb = require('./index');
var table = rdb.table;
// rdb.log(console.log);
var db = rdb.mySql('mysql:guest:guest@localhost/rdbDemo?multipleStatements=true');


var Order = rdb.table('_order');
var OrderLine = rdb.table('_orderLine');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');

OrderLine.primaryColumn('lId').guid().as('id');
OrderLine.column('lOrderId').guid().as('orderId');
OrderLine.column('lProduct').string().as('product');

var line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');


var strategy = {
    lines: null
};

// Order.createReadStream(db, null, strategy).on('end', onEnd).on('data', onData);
// Order.createReadStream(db, null, strategy).on('end', onEnd).on('data', onData);
Order.createJSONReadStream(db, null, strategy).on('error', onError).pipe(process.stdout);

function onError (e) {
	console.log(e.stack);
}

function onEnd() {
    console.log('end');
}

function onData (data) {
	console.log(data);
}
