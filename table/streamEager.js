var rdb = require('../index'),
    resetDemo = require('../../rdb-demo/db/resetDemo');

var Order = rdb.table('_order');
var OrderLine = rdb.table('_orderLine');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');

OrderLine.primaryColumn('lId').guid().as('id');
OrderLine.column('lOrderId').guid().as('orderId');
OrderLine.column('lProduct').string().as('product');

rdb.log(console.log);

var line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

var db = rdb('postgres://postgres:postgres@localhost/test');

var emptyFilter;
var strategy = {
    lines: {
        orderBy: 'product desc'
    },
    orderBy: 'orderNo',
    limit: 2,
};

module.exports = resetDemo()
    .then(function() {
        Order.createReadStream(db, emptyFilter, strategy).on('data', printOrder).on('error', onError).on('end', onEnd);

    }).then(null, onError);


function onError(e) {
    console.log(e.stack);
}


function onEnd() {
    console.log('end...');
}
function printOrder(order) {
    console.log(JSON.stringify(order));
}