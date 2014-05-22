var init = require('./init'),
    db = require('./myDb'),
    rdb = require('../index');
    Order = require('./order');

insertDemoThenGet();

function insertDemoThenGet() {
    init(runDbTest, onFailed);
}

function runDbTest() {
    db.transaction().then(getById).then(rdb.commit).then(null, rdb.rollback).done(onOk, onFailed);
}

function getById() {
    return Order.getById('58d52776-2866-4fbe-8072-cdf13370959b').then(printOrder);
}

function printOrder(order) {
    console.log('id: %s, customerId: %s, status: %s, tax: %s, units: %s, regDate: %s, sum: %s, image: %s', order.id, order.customerId, order.status, order.tax, order.units, order.regDate, order.sum, order.image);
}

function onOk() {
    console.log('done');
}

function onFailed(err) {
    console.log('failed: ' + err);
    if (err.stack)
        console.log('stack: ' + err.stack);
}