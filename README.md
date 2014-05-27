_rdb_
===
_ORM for postgres_. 


Simple, flexible mapper.  
Transaction with commit and rollback.  
Persistence ignorance - no need for explicit updates or saving, everything is handled by transaction.  
Eager or lazy loading.  
Based on promises.  
All [examples][0] er found at npmjs.org/package/rdb-demo.

[getById][1]
------------------
```
var rdb = require('rdb');

var Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');
Customer.column('cBalance').numeric().as('balance');
Customer.column('cRegdate').date().as('registeredDate');
Customer.column('cIsActive').boolean().as('isActive');
Customer.column('cPicture').binary().as('picture');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getById)
    .then(printCustomer)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getById() {
    return Customer.getById('a0000000-0000-0000-0000-000000000000');
}

function printCustomer(customer) {
    var format = 'Customer Id: %s, name: %s, Balance: %s, Registered Date: %s, Is Active: %s, Picture: %s'; 
    var args = [format, customer.id, customer.name, customer.balance, customer.registeredDate, customer.isActive, customer.picture];
    console.log.apply(null,args);
}

function onOk() {
    console.log('Success');
    console.log('Waiting for connection pool to teardown....');
}

function onFailed(err) {
    console.log('Rollback');
    console.log(err);
}
```

[tryGetFirst][2]
------------------
```
var rdb = require('rdb'),
    resetDemo = require('./db/resetDemo');

var Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

var db = rdb('postgres://postgres:postgres@localhost/test');

resetDemo() 
    .then(db.transaction)
    .then(tryGetFirst)
    .then(printCustomer)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function tryGetFirst() {
    var filter = Customer.name.equal('John');
    return Customer.tryGetFirst(filter);
}

function printCustomer(customer) {
    if (customer) {
        console.log('Customer Id: %s, name: %s', customer.id, customer.name);;
    }
    else
        console.log('customer not found');
}

function onOk() {
    console.log('Success');
    console.log('Waiting for connection pool to teardown....');
}

function onFailed(err) {
    console.log('Rollback');
    console.log(err);
}
```

[0]:https://npmjs.org/package/rdb-demo
[1]:https://github.com/alfateam/rdb-demo/blob/master/getById.js
[1]:https://github.com/alfateam/rdb-demo/blob/master/tryGetFirst.js