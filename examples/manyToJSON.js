var init = require('./init');
var db = require('./myDb');
var Order = require('./order');
var Customer = require('./customer');

var promise = require('../table/promise');
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
    return Customer.getMany();
}

function printAll(customers) {
    customers.toJSON().then(printJSON)
}

function printJSON(json) {    
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