var rdb = require('./index');
var table = rdb.table;
rdb.log(console.log);
var db = rdb.mySql('mysql://guest:guest@localhost/rdbDemo?multipleStatements=true');


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
    lines: {
      orderBy: ['product'],
    },
    orderBy: ['orderNo'],
    limit: 2
};

// Order.createReadStream(db, null, strategy).on('end', onEnd).on('data', onData);
// Order.createReadStream(db, null, strategy).on('end', onEnd).on('data', onData);
var json = '';
// var stream = Order.createJSONReadStream(db, null, strategy).on('error', onError).on('data', onData).on('end', onEnd);
var stream = Order.createJSONReadStream(db, null, strategy);

var oboe = require('oboe');
oboe(stream)
.node('![*]', function( row ){
      console.log(row);
   })
.fail(onError);

function onError (e) {
	console.log(e);
}

function onEnd() {
    console.log( 'done...........');
		// var obj = JSON.parse(json); 

}

function onData (data) {
	json += data;
	// var obj = JSON.parse(data);
	// console.log(data);
}
