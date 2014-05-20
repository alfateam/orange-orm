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

    transaction.then(getCustomers).then(printAll).then(commit).then(null, rollback).done(onOk, onFailed);
}

function getCustomers() {
    return Customer.getMany(filter, strategy);
}

function printAll(customers) {
    var all = [];
    for (var i = 0; i < customers.length; i++) {        
        all.push(customers[i].toJSON().then(printCustomer));
    };
    return promise.all(all);
}

function printCustomer(json) {    
    console.log(json);
}

function onOk() {
    console.log('done');
}

function onFailed(err) {
    console.log('failed: ' + err);
    if (err.stack)
        console.log('stack: ' + err.stack);
}