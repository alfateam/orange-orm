var init = require('./init'),
    db = require('./myDb'),
    Order = require('./order');

var strategy, filter,
    commit, rollback;

insertDemoThenGet();

function insertDemoThenGet() {
    init(runDbTest, onFailed);
}

function runDbTest() {
    var transaction = db.transaction();
    commit = transaction.commit;
    rollback = transaction.rollback;

    transaction.then(getById).then(commit).then(null, rollback).done(onOk, onFailed);
}

function getById() {
    return Order.getById('58d52776-2866-4fbe-8072-cdf13370959b').then(printOrder);
}

function printOrder(order) {
    var image = order.image;
    console.log('id: %s, customerId: %s, status: %s, tax: %s, units: %s, regDate: %s, sum: %s, image: %s', order.id, order.customerId, order.status, order.tax, order.units, order.regDate, order.sum, order.image.toJSON());
}

function onOk() {
    console.log('done');
}

function onFailed(err) {
    console.log('failed: ' + err);
    if (err.stack)
        console.log('stack: ' + err.stack);
}