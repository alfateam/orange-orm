var init = require('./init');
var db = require('./myDb');
var Order = require('./order');
var Customer = require('./customer');

var promise = require('../table/promise');
var strategy;
var filter;
var commit, rollback;

insertThenGet();

function insertThenGet() {
    init(runDbTest, onFailed);
}

function runDbTest() {
    var transaction = db.transaction();
    commit = transaction.commit;
    rollback = transaction.rollback;

    transaction.then(insertOrder).then(getOrders).then(commit).then(null, rollback).done(onOk, onFailed);
}

function insertOrder() {
    var order = Order.insert('58d52776-2866-4fbe-8072-cdf13370959a');
    order.regDate = new Date();
    order.status = 78;
    order.units = 34;
}

function getOrders() {
    return Customer.getMany(filter, strategy).then(onCustomers);
}

function onCustomers(customers) {
    var all = [];
    for (var i = 0; i < customers.length; i++) {
        printCustomer(customers[i]);
        all.push(customers[i].orders.then(onOrders));
    };
    return promise.all(all);
}


function getById() {
    return Order.getById('58d52776-2866-4fbe-8072-cdf13370959b').then(printOrder);
}

function printOrder(order) {
    console.log('id: %s, customerId: %s, status: %s, tax: %s, units: %s, regDate: %s, sum: %s, image: %s', order.id, order.customerId, order.status, order.tax, order.units, order.regDate, order.sum, order.image);
}

function printCustomer(customer) {
    console.log('customerId: %s, customerName: %s', customer.id, customer.name);
}

function onOrders(orders) {
    console.log('Number of orders: ' + orders.length);
    var all = [];
    for (var i in orders) {
        var order = orders[i];
        order.units = 500;
        printOrder(order);
        var customer = order.customer.then(printCustomer);
        all.push(customer);
    };

    return promise.all(all);
}

function onOk() {
    console.log('done');
}

function onFailed(err) {
    console.log('failed: ' + err);
    if (err.stack)
        console.log('stack: ' + err.stack);
}