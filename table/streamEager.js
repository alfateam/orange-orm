var rdb = require('../index'),
    resetDemo = require('../../rdb-demo/db/resetDemo');

var Order = rdb.table('_order');
var OrderLine = rdb.table('_orderLine');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');
Order.column('oFoo').boolean().as('foo');

OrderLine.primaryColumn('lId').guid().as('id');
OrderLine.column('lOrderId').guid().as('orderId');
OrderLine.column('lProduct').string().as('product');

rdb.log(console.log);

var line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

// var db = rdb('postgres://postgres:postgres@localhost/test');
var db = rdb.sqlite(__dirname + '/../../rdb-demo/sqlite/db/rdbDemo');


var emptyFilter = Order.foo.greaterThan(new Date());
var strategy = {
    lines: {
        orderBy: 'product'
    },
    orderBy: 'orderNo',
    limit: 3
};

var counter = 0;
var data = '';
module.exports = resetDemo()
    .then(function() {
        Order.createJSONReadStream(db, emptyFilter, strategy).on('data', printOrder).on('error', onError).on('end', onEnd);

    }).then(null, onError);


function onError(e) {
    console.log(e.stack);
}


function onEnd() {
    // console.log('end...' + counter);
    var obj = JSON.parse(data);
    for (var i = 0; i < obj.length; i++) {
        var dto = obj[i]
        console.log(dto);
    }
}

function printOrder(order) {
    // console.log(typeof order);
    counter++;
    data += order;
    // console.log(order);
}
