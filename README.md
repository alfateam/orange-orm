__rdb__
=========
ORM for postgres. 

Simple, flexible mapper.  
Transaction with commit and rollback.  
Persistence ignorance - no need for explicit saving, everything is handled by transaction.  
Eager or lazy loading.  
Based on promises.  
All examples below are found at [npmjs.org/package/rdb-demo][0].  
_Table of contents_
---------------
__Querying__  
<a href="#getById">getById</a>
[tryGetFirst][902]  
[join][903]  
[hasMany][904]  
[hasOne][905]  
[composite keys][906]  
[getById eagerly][907]  
[tryGetFirst eagerly][908]  
[toJSON][909]  
[toJSON with strategy][910]  
[getMany][911]  
[getMany lazily][912]  
[getMany eagerly][913]  
[manyToJSON][914]  
[(many)ToJSON with strategy][915]  

__Persistence__  
[update][916]  
[insert][917]  
[default values][918]  
[conventions][919]  
[update a join-relation][920]  
[update a hasOne-relation][921]  
[update a hasMany-relation][922]  

__Filtering__  
[equal][923]  
[notEqual][924]  
[not][925]  
[lessThan][926]  
[lessThanOrEqual][927]  
[greaterThan][928]  
[greaterThanOrEqual][929]  
[between][930]  
[in][931]   
[startsWith][932]  
[endsWith][933]  
[contains][934]  
[exists][935]  
[or][936]  
[and][937]  
[or alternative syntax][938]  
[and alternative syntax][939]  
[sub filter][940]    
[composite filter][941]  
_Contents_
---------------
<a name="getById"></a>
__[getById][1]__
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
<a name="tryGetFirst"></a>
__[tryGetFirst][2]__
```
var rdb = require('rdb');

var Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
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
<a name="join"></a>
__[join][3]__
```
var rdb = require('rdb');

var Customer = rdb.table('_customer');
var Order = rdb.table('_order');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');
Order.column('oCustomerId').guid().as('customerId');
Order.join(Customer).by('oCustomerId').as('customer');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getOrder)
    .then(printOrder)
    .then(printCustomer)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getOrder() {
    return Order.getById('a0000000-a000-0000-0000-000000000000');
}

function printOrder(order) {
    var format = 'Order Id: %s, Order No: %s, Customer Id: %s'; 
    var args = [format, order.id, order.orderNo, order.customerId];
    console.log.apply(null,args);
    return order.customer; //this is a promise
}

function printCustomer(customer) {
    if (!customer)
        return;
    var format = 'Customer Id: %s, name: %s'; 
    var args = [format, customer.id, customer.name];
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
<a name="hasMany"></a>
__[hasMany][4]__
```
var rdb = require('rdb');

var Order = rdb.table('_order');
var OrderLine = rdb.table('_orderLine');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');

OrderLine.primaryColumn('lId').guid().as('id');
OrderLine.column('lOrderId').guid().as('orderId');
OrderLine.column('lProduct').string().as('product');

var line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getOrder)
    .then(printOrder)
    .then(printLines)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getOrder() {
    return Order.getById('b0000000-b000-0000-0000-000000000000');
}

function printOrder(order) {
    var format = 'Order Id: %s, Order No: %s'; 
    var args = [format, order.id, order.orderNo];
    console.log.apply(null,args);
    return order.lines; //this is a promise
}

function printLines(lines) {
    lines.forEach(printLine);

    function printLine(line) {
        var format = 'Line Id: %s, Order Id: %s, Product: %s'; 
        var args = [format, line.id, line.orderId, line.product];
        console.log.apply(null,args);
    }    
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
<a name="hasOne"></a>
__[hasOne][5]__
```
var rdb = require('rdb');

var Order = rdb.table('_order');
var DeliveryAddress = rdb.table('_deliveryAddress');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');

DeliveryAddress.primaryColumn('dId').guid().as('id');
DeliveryAddress.column('dOrderId').string().as('orderId');
DeliveryAddress.column('dName').string().as('name');
DeliveryAddress.column('dStreet').string().as('street');

var deliveryAddress_order_relation = DeliveryAddress.join(Order).by('dOrderId').as('order');
Order.hasOne(deliveryAddress_order_relation).as('deliveryAddress');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getOrder)
    .then(printOrder)
    .then(printDeliveryAddress)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getOrder() {
    return Order.getById('b0000000-b000-0000-0000-000000000000');
}

function printOrder(order) {
    var format = 'Order Id: %s, Order No: %s'; 
    var args = [format, order.id, order.orderNo];
    console.log.apply(null,args);
    return order.deliveryAddress; //this is a promise
}

function printDeliveryAddress(address) {
    var format = 'DeliveryAddress Id: %s, Order Id: %s, %s'; 
    var args = [format, address.id, address.orderId, address.name, address.street];
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
<a name="compositeKeys"></a>
__[composite keys][6]__
```
var rdb = require('rdb');

var Order = rdb.table('_compositeOrder');
var OrderLine = rdb.table('_compositeOrderLine');

Order.primaryColumn('oCompanyId').numeric().as('companyId');
Order.primaryColumn('oOrderNo').numeric().as('orderNo');

OrderLine.primaryColumn('lCompanyId').numeric().as('companyId');
OrderLine.primaryColumn('lOrderNo').numeric().as('orderNo');
OrderLine.primaryColumn('lLineNo').numeric().as('lineNo');
OrderLine.column('lProduct').string().as('product');

var line_order_relation = OrderLine.join(Order).by('lCompanyId', 'lOrderNo').as('order');
Order.hasMany(line_order_relation).as('lines');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getOrder)
    .then(printOrder)
    .then(printLines)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getOrder() {
    var companyId = 1,
        orderId = 1001;
    return Order.getById(companyId, orderId);
}

function printOrder(order) {
    console.log('Company Id: %s, Order No: %s', order.companyId, order.orderNo)
    return order.lines; //this is a promise
}

function printLines(lines) {
    lines.forEach(printLine);

    function printLine(line) {
        var format = 'Company Id: %s, Order No: %s, Line No: %s, Product: %s'; 
        var args = [format, line.companyId, line.orderNo, line.lineNo, line.product];
        console.log.apply(null,args);
    }    
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
<a name="getByIdEager"></a>
__[getById eagerly][7]__
```
var rdb = require('rdb');

var Customer = rdb.table('_customer');
var Order = rdb.table('_order');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');
Order.column('oCustomerId').guid().as('customerId');
Order.join(Customer).by('oCustomerId').as('customer');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getOrderWithCustomer)
    .then(printOrder)
    .then(printCustomer)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getOrderWithCustomer() {
    var fetchingStrategy = {customer : null}; //alternatively: {customer : {}} 
    return Order.getById('a0000000-a000-0000-0000-000000000000', fetchingStrategy);
}

function printOrder(order) {
    var format = 'Order Id: %s, Order No: %s, Customer Id: %s'; 
    var args = [format, order.id, order.orderNo, order.customerId];
    console.log.apply(null,args);
    return order.customer; //this is a promise
}

function printCustomer(customer) {
    if (!customer)
        return;
    console.log('Customer Id: %s, name: %s', customer.id, customer.name);
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
<a name="tryGetFirstEager"></a>
__[tryGetFirst eagerly][8]__
```
var rdb = require('rdb');

var Customer = rdb.table('_customer');
var Order = rdb.table('_order');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');
Order.column('oCustomerId').guid().as('customerId');

Order.join(Customer).by('oCustomerId').as('customer');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(tryGetFirstOrderWithCustomer)
    .then(printOrder)
    .then(printCustomer)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function tryGetFirstOrderWithCustomer() {
    var filter = Order.customer.name.equal('John');
    var strategy = {customer : null};
    return Order.tryGetFirst(filter, strategy);
}

function printOrder(order) {
    if (!order) {
        console.log('order not found');
        return;
    }
    var format = 'Order Id: %s, Order No: %s, Customer Id: %s'; 
    var args = [format, order.id, order.orderNo, order.customerId];
    console.log.apply(null,args);
    return order.customer;
}

function printCustomer(customer) {
    if (!customer) 
        return;
    console.log('Customer Id: %s, name: %s', customer.id, customer.name);
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
<a name="toJSON"></a>
__[toJSON][9]__
```
var rdb = require('rdb');

var Order = rdb.table('_order');
var Customer = rdb.table('_customer');
var OrderLine = rdb.table('_orderLine');
var DeliveryAddress = rdb.table('_deliveryAddress');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');
Order.column('oCustomerId').string().as('customerId');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

OrderLine.primaryColumn('lId').guid().as('id');
OrderLine.column('lOrderId').string().as('orderId');
OrderLine.column('lProduct').string().as('product');

DeliveryAddress.primaryColumn('dId').guid().as('id');
DeliveryAddress.column('dOrderId').string().as('orderId');
DeliveryAddress.column('dName').string().as('name');
DeliveryAddress.column('dStreet').string().as('street');

var order_customer_relation = Order.join(Customer).by('customerId').as('customer');

var line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

var deliveryAddress_order_relation = DeliveryAddress.join(Order).by('dOrderId').as('order');
Order.hasOne(deliveryAddress_order_relation).as('deliveryAddress');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getOrder)
    .then(toJSON)
    .then(print)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getOrder() {
    return Order.getById('b0000000-b000-0000-0000-000000000000');
}

function toJSON(order) {
    return order.toJSON(/*strategy*/);
    //default strategy, expand all hasOne and hasMany relations
}

function print(json) {
    console.log(json);
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
<a name="toJSONWithStrategy"></a>
__[toJSON with strategy][10]__
```
var rdb = require('rdb');

var Order = rdb.table('_order');
var Customer = rdb.table('_customer');
var OrderLine = rdb.table('_orderLine');
var DeliveryAddress = rdb.table('_deliveryAddress');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');
Order.column('oCustomerId').string().as('customerId');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

OrderLine.primaryColumn('lId').guid().as('id');
OrderLine.column('lOrderId').guid().as('orderId');
OrderLine.column('lProduct').string().as('product');

DeliveryAddress.primaryColumn('dId').guid().as('id');
DeliveryAddress.column('dOrderId').string().as('orderId');
DeliveryAddress.column('dName').string().as('name');
DeliveryAddress.column('dStreet').string().as('street');

var order_customer_relation = Order.join(Customer).by('oCustomerId').as('customer');

var line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

var deliveryAddress_order_relation = DeliveryAddress.join(Order).by('dOrderId').as('order');
Order.hasOne(deliveryAddress_order_relation).as('deliveryAddress');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getOrder)
    .then(toJSON)
    .then(print)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getOrder() {
    return Order.getById('b0000000-b000-0000-0000-000000000000');
}

function toJSON(order) {
    var strategy = {customer : null, lines : null, deliveryAddress : null};
    return order.toJSON(strategy);
}

function print(json) {
    console.log(json);
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
<a name="getMany"></a>
__[getMany][11]__
```
var rdb = require('rdb');

var Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getAllCustomers)
    .then(printCustomers)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getAllCustomers() {
    return Customer.getMany();
}

function printCustomers(customers) {
    customers.forEach(printCustomer);

    function printCustomer(customer) {
        console.log('Customer Id: %s, name: %s', customer.id, customer.name);
    }
}

function print(json) {
    console.log(json);
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
<a name="getManyLazy"></a>
__[getMany lazily][12]__
```
var rdb = require('rdb'),
    promise = require('promise');

var Order = rdb.table('_order');
var OrderLine = rdb.table('_orderLine');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');

OrderLine.primaryColumn('lId').guid().as('id');
OrderLine.column('lOrderId').guid().as('orderId');
OrderLine.column('lProduct').string().as('product');

var line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getAllOrders)
    .then(printOrders)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getAllOrders() {
    return Order.getMany();
}

function printOrders(orders) {
    var printAllLines = [];
    orders.forEach(printOrder);

    function printOrder(order) {
        var format = 'Order Id: %s, Order No: %s'; 
        var args = [format, order.id, order.orderNo];
        console.log.apply(null,args);
        printAllLines.push(order.lines.then(printLines));
    }
    return promise.all(printAllLines);
}

function printLines(lines) {
    lines.forEach(printLine);

    function printLine(line) {
        var format = 'Line Id: %s, Order Id: %s, Product: %s'; 
        var args = [format, line.id, line.orderId, line.product];
        console.log.apply(null,args);
    }    
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
<a name="getManyEager"></a>
__[getMany eagerly][13]__
```
var rdb = require('rdb'),
    promise = require('promise');

var Order = rdb.table('_order');
var OrderLine = rdb.table('_orderLine');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');

OrderLine.primaryColumn('lId').guid().as('id');
OrderLine.column('lOrderId').guid().as('orderId');
OrderLine.column('lProduct').string().as('product');

var line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getAllOrders)
    .then(printOrders)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getAllOrders() {
    var emptyFilter;
    var strategy = {lines : null};
    return Order.getMany(emptyFilter, strategy);
}

function printOrders(orders) {
    var printAllLines = [];
    orders.forEach(printOrder);

    function printOrder(order) {
        var format = 'Order Id: %s, Order No: %s'; 
        var args = [format, order.id, order.orderNo];
        console.log.apply(null,args);
        printAllLines.push(order.lines.then(printLines));
    }
    return promise.all(printAllLines);
}

function printLines(lines) {
    lines.forEach(printLine);

    function printLine(line) {
        var format = 'Line Id: %s, Order Id: %s, Product: %s'; 
        var args = [format, line.id, line.orderId, line.product];
        console.log.apply(null,args);
    }    
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
<a name="manyToJSON"></a>
__[(many)ToJSON][14]__
```
var rdb = require('rdb');

var Order = rdb.table('_order');
var Customer = rdb.table('_customer');
var OrderLine = rdb.table('_orderLine');
var DeliveryAddress = rdb.table('_deliveryAddress');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');
Order.column('oCustomerId').string().as('customerId');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

OrderLine.primaryColumn('lId').guid().as('id');
OrderLine.column('lOrderId').guid().as('orderId');
OrderLine.column('lProduct').string().as('product');

DeliveryAddress.primaryColumn('dId').guid().as('id');
DeliveryAddress.column('dOrderId').string().as('orderId');
DeliveryAddress.column('dName').string().as('name');
DeliveryAddress.column('dStreet').string().as('street');

var order_customer_relation = Order.join(Customer).by('customerId').as('customer');

var line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

var deliveryAddress_order_relation = DeliveryAddress.join(Order).by('dOrderId').as('order');
Order.hasOne(deliveryAddress_order_relation).as('deliveryAddress');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getOrders)
    .then(toJSON)
    .then(print)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getOrders() {
    return Order.getMany();
}

function toJSON(orders) {
    return orders.toJSON(/*strategy*/);
    //default strategy, expand all hasOne and hasMany relations
}

function print(json) {
    console.log(json);
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
<a name="manyToJSONWithStrategy"></a>
__[(many)ToJSON with strategy][15]__
```
var rdb = require('rdb');

var Order = rdb.table('_order');
var Customer = rdb.table('_customer');
var OrderLine = rdb.table('_orderLine');
var DeliveryAddress = rdb.table('_deliveryAddress');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');
Order.column('oCustomerId').string().as('customerId');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

OrderLine.primaryColumn('lId').guid().as('id');
OrderLine.column('lOrderId').guid().as('orderId');
OrderLine.column('lProduct').string().as('product');

DeliveryAddress.primaryColumn('dId').guid().as('id');
DeliveryAddress.column('dOrderId').string().as('orderId');
DeliveryAddress.column('dName').string().as('name');
DeliveryAddress.column('dStreet').string().as('street');

var order_customer_relation = Order.join(Customer).by('oCustomerId').as('customer');

var line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

var deliveryAddress_order_relation = DeliveryAddress.join(Order).by('dOrderId').as('order');
Order.hasOne(deliveryAddress_order_relation).as('deliveryAddress');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getOrders)
    .then(toJSON)
    .then(print)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getOrders() {
    return Order.getMany();
}

function toJSON(orders) {
    var strategy = {customer : null, lines : null, deliveryAddress : null};
    return orders.toJSON(strategy);
}

function print(json) {
    console.log(json);
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
<a name="update"></a>
__[update][16]__
```
var rdb = require('rdb');

var Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getById)
    .then(update)
    .then(getById) //will use cache
    .then(verifyUpdated)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getById() {
    return Customer.getById('a0000000-0000-0000-0000-000000000000');
}

function update(customer) {
    customer.name = 'Ringo'; 
}

function verifyUpdated(customer) {
    if (customer.name !== 'Ringo')
        throw new Error('this will not happen');
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
<a name="insert"></a>
__[insert][17]__
```
var rdb = require('rdb');

var Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(insert)
    .then(getById) //will use cache
    .then(verifyInserted)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function insert() {
    var customer = Customer.insert('abcdef00-0000-0000-0000-000000000000')
    customer.name = 'Paul';
}

function getById() {
    return Customer.getById('abcdef00-0000-0000-0000-000000000000');
}

function verifyInserted(customer) {
    if (customer.name !== 'Paul')
        throw new Error('this will not happen');
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
<a name="defaultValues"></a>
__[default values][101]__
```
var rdb = require('rdb');

buf = new Buffer(10);
buf.write('\u00bd + \u00bc = \u00be', 0);

var Customer = rdb.table('_customer');

/*unless overridden, numeric is default 0, 
string is default null, 
guid is default null,
date is default null,
binary is default null
booean is default false
*/                    

Customer.primaryColumn('cId').guid().as('id').default(null);
Customer.column('cName').string().as('name').default('default name');
Customer.column('cBalance').numeric().as('balance').default(2000);
Customer.column('cRegdate').date().as('registeredDate').default(new Date());
Customer.column('cIsActive').boolean().as('isActive').default(true);
Customer.column('cPicture').binary().as('picture').default(buf);


var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(insert)
    .then(print) 
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function insert() {
    var customer = Customer.insert('abcdef02-0000-0000-0000-000000000000')
    return customer.toJSON();
}

function print(json) {
    console.log(json);
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
<a name="conventions"></a>
__[conventions][102]__
```
var rdb = require('rdb'),
    resetDemo = require('./db/resetDemo');

var Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid(); //property name will also be cId
Customer.column('cName').string(); //property name will also be cName

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(insert)
    .then(print) 
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function insert() {
    var customer = Customer.insert('abcdef01-0000-0000-0000-000000000000')
    customer.cName = 'Paul';
    return customer.toJSON();
}

function print(json) {
    console.log(json);
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
<a name="updateJoin"></a>
__[update a join-relation][18]__
```
var rdb = require('rdb');

var Customer = rdb.table('_customer');
var Order = rdb.table('_order');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');
Order.column('oCustomerId').guid().as('customerId');

Order.join(Customer).by('oCustomerId').as('customer');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getById)
    .then(update)
    .then(verifyUpdated)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getById() {
    return Order.getById('b0000000-b000-0000-0000-000000000000');
}

function update(order) {
    var yokoId = '12345678-0000-0000-0000-000000000000';
    order.customerId = yokoId;
    return order.customer; 
}

function verifyUpdated(customer) {
    if (customer.name !== 'Yoko')
        throw new Error('this will not happen');
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
<a name="updateHasOne"></a>
__[update a hasOne-relation][19]__
```
var rdb = require('rdb');

var Order = rdb.table('_order');
var DeliveryAddress = rdb.table('_deliveryAddress');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');

DeliveryAddress.primaryColumn('dId').guid().as('id');
DeliveryAddress.column('dOrderId').string().as('orderId');
DeliveryAddress.column('dName').string().as('name');
DeliveryAddress.column('dStreet').string().as('street');

var deliveryAddress_order_relation = DeliveryAddress.join(Order).by('dOrderId').as('order');
Order.hasOne(deliveryAddress_order_relation).as('deliveryAddress');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(insertDeliveryAddress)
    .then(verifyUpdated)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function insertDeliveryAddress() {
    var address = DeliveryAddress.insert('eeeeeeee-0000-0000-0000-000000000000');
    address.orderId = 'a0000000-a000-0000-0000-000000000000';
    address.name = 'Sgt. Pepper';
    address.street = 'L18 Penny Lane';
    return address.order;
}

function verifyUpdated(order) {
    return order.deliveryAddress.then(verifyUpdatedAddress);;
}

function verifyUpdatedAddress(deliveryAddress) {
    if (deliveryAddress.street !== 'L18 Penny Lane')
        throw new Error('this will not happen');
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
<a name="updateHasMany"></a>
__[update a hasMany-relation][20]__
```
var rdb = require('rdb');

var Order = rdb.table('_order');
var OrderLine = rdb.table('_orderLine');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');

OrderLine.primaryColumn('lId').guid().as('id');
OrderLine.column('lOrderId').guid().as('orderId');
OrderLine.column('lProduct').string().as('product');

var line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

var db = rdb('postgres://postgres:postgres@localhost/test');
var orderIdWithNoLines = 'c0000000-c000-0000-0000-000000000000';

db.transaction()
    .then(insertOrderLine1)
    .then(insertOrderLine2)
    .then(verifyUpdated)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function insertOrderLine1() {
    var line = OrderLine.insert('eeeeeeee-0001-0000-0000-000000000000');
    line.orderId = orderIdWithNoLines;
    line.product = 'Roller blades';
    return line.order;
}

function insertOrderLine2() {
    var line = OrderLine.insert('eeeeeeee-0002-0000-0000-000000000000');
    line.orderId = orderIdWithNoLines;
    line.product = 'Helmet';
    return line.order;
}

function verifyUpdated(order) {
    return order.lines.then(verifyUpdatedLines);
}

function verifyUpdatedLines(lines) {
    if (lines.length !== 2)
        throw new Error('this will not happen');
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
<a name="equal"></a>
__[equal][21]__
```
var rdb = require('rdb');

var Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getFilteredCustomers)
    .then(printCustomers)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getFilteredCustomers() {
    var filter = Customer.name.equal('John');
    //same as Customer.name.eq('John');   
    return Customer.getMany(filter);
}

function printCustomers(customers) {
    customers.forEach(printCustomer);

    function printCustomer(customer) {
        console.log('Customer Id: %s, name: %s', customer.id, customer.name);
    }
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
<a name="notEqual"></a>
__[notEqual][22]__
```
var rdb = require('rdb');

var Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getFilteredCustomers)
    .then(printCustomers)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getFilteredCustomers() {
    var filter = Customer.name.notEqual('John');
    //same as Customer.name.ne('John');   
    return Customer.getMany(filter);
}

function printCustomers(customers) {
    customers.forEach(printCustomer);

    function printCustomer(customer) {
        console.log('Customer Id: %s, name: %s', customer.id, customer.name);
    }
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
<a name="not"></a>
__[not][23]__
```
var rdb = require('rdb');

var Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getFilteredCustomers)
    .then(printCustomers)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getFilteredCustomers() {
    var filter = Customer.name.equal('John').not();
    return Customer.getMany(filter);
}

function printCustomers(customers) {
    customers.forEach(printCustomer);

    function printCustomer(customer) {
        console.log('Customer Id: %s, name: %s', customer.id, customer.name);
    }
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
__<a name="lessThan"></a>__
__[lessThan][24]__
```
var rdb = require('rdb');

var Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cBalance').numeric().as('balance');
Customer.column('cName').string().as('name');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getFilteredCustomers)
    .then(printCustomers)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getFilteredCustomers() {
    var filter = Customer.balance.lessThan(5000);
    //same as Customer.balance.lt(5000);   
    return Customer.getMany(filter);
}

function printCustomers(customers) {
    customers.forEach(printCustomer);

    function printCustomer(customer) {
        console.log('Customer Id: %s, name: %s, balance : %s', customer.id, customer.name, customer.balance);
    }
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
<a name="lessThanOrEqual"></a>
__[lessThanOrEqual][25]__
```
var rdb = require('rdb');

var Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cBalance').numeric().as('balance');
Customer.column('cName').string().as('name');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getFilteredCustomers)
    .then(printCustomers)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getFilteredCustomers() {
    var filter = Customer.balance.lessThanOrEqual(8123);
    //same as Customer.balance.le(8123);   
    return Customer.getMany(filter);
}

function printCustomers(customers) {
    customers.forEach(printCustomer);

    function printCustomer(customer) {
        console.log('Customer Id: %s, name: %s, balance : %s', customer.id, customer.name, customer.balance);
    }
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
<a name="greaterThan"></a>
__[greaterThan][26]__
```
var rdb = require('rdb');

var Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cBalance').numeric().as('balance');
Customer.column('cName').string().as('name');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getFilteredCustomers)
    .then(printCustomers)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getFilteredCustomers() {
    var filter = Customer.balance.greaterThan(5000);
    //same as Customer.balance.gt(5000);   
    return Customer.getMany(filter);
}

function printCustomers(customers) {
    customers.forEach(printCustomer);

    function printCustomer(customer) {
        console.log('Customer Id: %s, name: %s, balance : %s', customer.id, customer.name, customer.balance);
    }
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
<a name="greaterThanOrEqual"></a>
__[greaterThanOrEqual][27]__
```
var rdb = require('rdb');

var Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cBalance').numeric().as('balance');
Customer.column('cName').string().as('name');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getFilteredCustomers)
    .then(printCustomers)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getFilteredCustomers() {
    var filter = Customer.balance.greaterThanOrEqual(8123);
    //same as Customer.balance.ge(8123);   
    return Customer.getMany(filter);
}

function printCustomers(customers) {
    customers.forEach(printCustomer);

    function printCustomer(customer) {
        console.log('Customer Id: %s, name: %s, balance : %s', customer.id, customer.name, customer.balance);
    }
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
<a name="between"></a>
__[between][28]__
```
var rdb = require('rdb');

var Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cBalance').numeric().as('balance');
Customer.column('cName').string().as('name');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getFilteredCustomers)
    .then(printCustomers)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getFilteredCustomers() {
    var filter = Customer.balance.between(3000, 8123);
    return Customer.getMany(filter);
}

function printCustomers(customers) {
    customers.forEach(printCustomer);

    function printCustomer(customer) {
        console.log('Customer Id: %s, name: %s, balance : %s', customer.id, customer.name, customer.balance);
    }
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
<a name="in"></a>
__[in][29]__
```
var rdb = require('rdb');

var Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getFilteredCustomers)
    .then(printCustomers)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getFilteredCustomers() {
    var filter = Customer.name.in(['John', 'Yoko']);
    return Customer.getMany(filter);
}

function printCustomers(customers) {
    customers.forEach(printCustomer);

    function printCustomer(customer) {
        console.log('Customer Id: %s, name: %s', customer.id, customer.name);
    }
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
<a name="startsWith"></a>
__[startsWith][30]__
```
var rdb = require('rdb');

var Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getFilteredCustomers)
    .then(printCustomers)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getFilteredCustomers() {
    var filter = Customer.name.startsWith('Jo');
    return Customer.getMany(filter);
}

function printCustomers(customers) {
    customers.forEach(printCustomer);

    function printCustomer(customer) {
        console.log('Customer Id: %s, name: %s', customer.id, customer.name);
    }
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
<a name="endsWith"></a>
__[endsWith][31]__
```
var rdb = require('rdb');

var Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getFilteredCustomers)
    .then(printCustomers)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getFilteredCustomers() {
    var filter = Customer.name.endsWith('nny');
    return Customer.getMany(filter);
}

function printCustomers(customers) {
    customers.forEach(printCustomer);

    function printCustomer(customer) {
        console.log('Customer Id: %s, name: %s', customer.id, customer.name);
    }
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
<a name="contains"></a>
__[contains][32]__
```
var rdb = require('rdb');

var Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getFilteredCustomers)
    .then(printCustomers)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getFilteredCustomers() {
    var filter = Customer.name.contains('ohn');
    return Customer.getMany(filter);
}

function printCustomers(customers) {
    customers.forEach(printCustomer);

    function printCustomer(customer) {
        console.log('Customer Id: %s, name: %s', customer.id, customer.name);
    }
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
<a name="exists"></a>
__[exists][33]__
```
var rdb = require('rdb');

var Order = rdb.table('_order');
var DeliveryAddress = rdb.table('_deliveryAddress');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');

DeliveryAddress.primaryColumn('dId').guid().as('id');
DeliveryAddress.column('dOrderId').string().as('orderId');
DeliveryAddress.column('dName').string().as('name');
DeliveryAddress.column('dStreet').string().as('street');

var deliveryAddress_order_relation = DeliveryAddress.join(Order).by('dOrderId').as('order');
Order.hasOne(deliveryAddress_order_relation).as('deliveryAddress');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getOrders)
    .then(toJSON)
    .then(print)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getOrders() {
    var filter = Order.deliveryAddress.exists();
    return Order.getMany(filter);
}

function toJSON(orders) {
    return orders.toJSON();
}

function print(json) {
    console.log(json);
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
<a name="or"></a>
__[or][34]__
```
var rdb = require('rdb');

var Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getFilteredCustomers)
    .then(printCustomers)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getFilteredCustomers() {
    var john = Customer.name.equal('John');
    var yoko = Customer.name.equal('Yoko');
    var filter = john.or(yoko);

    return Customer.getMany(filter);
}

function printCustomers(customers) {
    customers.forEach(printCustomer);

    function printCustomer(customer) {
        console.log('Customer Id: %s, name: %s', customer.id, customer.name);
    }
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
<a name="and"></a>
__[and][35]__
```
var rdb = require('rdb');

var Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cIsActive').boolean().as('isActive');
Customer.column('cBalance').numeric().as('balance');
Customer.column('cName').string().as('name');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getFilteredCustomers)
    .then(printCustomers)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getFilteredCustomers() {
    var isActive = Customer.isActive.equal(true);
    var highBalance = Customer.balance.greaterThan(8000);
    var filter = isActive.and(highBalance);
    return Customer.getMany(filter);
}

function printCustomers(customers) {
    customers.forEach(printCustomer);

    function printCustomer(customer) {
        console.log('Customer Id: %s, name: %s', customer.id, customer.name);
    }
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
<a name="orAlternative"></a>
__[or alternative syntax][36]__
```
var rdb = require('rdb'),
    resetDemo = require('../db/resetDemo');

var Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getFilteredCustomers)
    .then(printCustomers)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getFilteredCustomers() {
    var john = Customer.name.equal('John');
    var yoko = Customer.name.equal('Yoko');
    var filter = rdb.filter.or(john).or(yoko);
    //alternatively rdb.filter.and(john).or(yoko);
    return Customer.getMany(filter);
}

function printCustomers(customers) {
    customers.forEach(printCustomer);

    function printCustomer(customer) {
        console.log('Customer Id: %s, name: %s', customer.id, customer.name);
    }
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
<a name="andAlternative"></a>
__[and alternative syntax][37]__
```
var rdb = require('rdb'),
    resetDemo = require('../db/resetDemo');

var Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cIsActive').boolean().as('isActive');
Customer.column('cBalance').numeric().as('balance');
Customer.column('cName').string().as('name');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getFilteredCustomers)
    .then(printCustomers)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getFilteredCustomers() {
    var isActive = Customer.isActive.equal(true);
    var highBalance = Customer.balance.greaterThan(8000);
    var filter = rdb.filter.and(isActive).and(highBalance);
    //alternatively rdb.filter.or(isActive).and(highBalance);
    return Customer.getMany(filter);
}

function printCustomers(customers) {
    customers.forEach(printCustomer);

    function printCustomer(customer) {
        console.log('Customer Id: %s, name: %s', customer.id, customer.name);
    }
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
<a name="subFilter"></a>
__[sub filter][38]__
```
var rdb = require('rdb');

var Order = rdb.table('_order');
var DeliveryAddress = rdb.table('_deliveryAddress');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');

DeliveryAddress.primaryColumn('dId').guid().as('id');
DeliveryAddress.column('dOrderId').string().as('orderId');
DeliveryAddress.column('dName').string().as('name');
DeliveryAddress.column('dStreet').string().as('street');

var deliveryAddress_order_relation = DeliveryAddress.join(Order).by('dOrderId').as('order');
Order.hasOne(deliveryAddress_order_relation).as('deliveryAddress');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getOrders)
    .then(toJSON)
    .then(print)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getOrders() {
    var filter = Order.deliveryAddress.street.startsWith('Node');
    return Order.getMany(filter);
}

function toJSON(orders) {
    return orders.toJSON();
}

function print(json) {
    console.log(json);
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
<a name="compositeFilter"></a>
__[composite filter][39]__
```
var rdb = require('rdb');

var Order = rdb.table('_order');
var Customer = rdb.table('_customer');
var OrderLine = rdb.table('_orderLine');

Order.primaryColumn('oId').guid().as('id');
Order.column('oCustomerId').guid().as('customerId');
Order.column('oOrderNo').string().as('orderNo');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cIsActive').boolean().as('isActive');
Customer.column('cBalance').numeric().as('balance');
Customer.column('cName').string().as('name');

OrderLine.primaryColumn('lId').guid().as('id');
OrderLine.column('lOrderId').guid().as('orderId');
OrderLine.column('lProduct').string().as('product');

Order.join(Customer).by('oCustomerId').as('customer');

var line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');



var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getOrders)
    .then(toJSON)
    .then(print)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getOrders() {
    var isActive = Order.customer.isActive.eq(true);
    var didOrderCar = Order.lines.product.contains('car');
    var filter = isActive.and(didOrderCar);
    //alternatively rdb.filter.and(isActive).and(didOrderCar);
    return Order.getMany(filter);
}

function toJSON(orders) {
    return orders.toJSON();
}

function print(json) {
    console.log(json);
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
[2]:https://github.com/alfateam/rdb-demo/blob/master/tryGetFirst.js
[3]:https://github.com/alfateam/rdb-demo/blob/master/join.js
[4]:https://github.com/alfateam/rdb-demo/blob/master/hasMany.js
[5]:https://github.com/alfateam/rdb-demo/blob/master/hasOne.js
[6]:https://github.com/alfateam/rdb-demo/blob/master/compositeKeys.js
[7]:https://github.com/alfateam/rdb-demo/blob/master/getByIdEager.js
[8]:https://github.com/alfateam/rdb-demo/blob/master/tryGetFirstEager.js
[9]:https://github.com/alfateam/rdb-demo/blob/master/toJSON.js
[10]:https://github.com/alfateam/rdb-demo/blob/master/toJSONWithStrategy.js
[11]:https://github.com/alfateam/rdb-demo/blob/master/getMany.js
[12]:https://github.com/alfateam/rdb-demo/blob/master/getManyLazy.js
[13]:https://github.com/alfateam/rdb-demo/blob/master/getManyEager.js
[14]:https://github.com/alfateam/rdb-demo/blob/master/manyToJSON.js
[15]:https://github.com/alfateam/rdb-demo/blob/master/manyToJSONWithStrategy.js
[16]:https://github.com/alfateam/rdb-demo/blob/master/update.js
[17]:https://github.com/alfateam/rdb-demo/blob/master/insert.js
[18]:https://github.com/alfateam/rdb-demo/blob/master/updateJoin.js
[19]:https://github.com/alfateam/rdb-demo/blob/master/updateHasOne.js
[20]:https://github.com/alfateam/rdb-demo/blob/master/updateHasMany.js
[21]:https://github.com/alfateam/rdb-demo/blob/master/filtering/equal.js
[22]:https://github.com/alfateam/rdb-demo/blob/master/filtering/notEqual.js
[23]:https://github.com/alfateam/rdb-demo/blob/master/filtering/not.js
[24]:https://github.com/alfateam/rdb-demo/blob/master/filtering/lessThan.js
[25]:https://github.com/alfateam/rdb-demo/blob/master/filtering/lessThanOrEqual.js
[26]:https://github.com/alfateam/rdb-demo/blob/master/filtering/greaterThan.js
[27]:https://github.com/alfateam/rdb-demo/blob/master/filtering/greaterThanOrEqual.js
[28]:https://github.com/alfateam/rdb-demo/blob/master/filtering/between.js
[29]:https://github.com/alfateam/rdb-demo/blob/master/filtering/in.js
[30]:https://github.com/alfateam/rdb-demo/blob/master/filtering/startsWith.js
[31]:https://github.com/alfateam/rdb-demo/blob/master/filtering/endsWith.js
[32]:https://github.com/alfateam/rdb-demo/blob/master/filtering/contains.js
[33]:https://github.com/alfateam/rdb-demo/blob/master/filtering/exists.js
[34]:https://github.com/alfateam/rdb-demo/blob/master/filtering/or.js
[35]:https://github.com/alfateam/rdb-demo/blob/master/filtering/and.js
[36]:https://github.com/alfateam/rdb-demo/blob/master/filtering/orAlternative.js
[37]:https://github.com/alfateam/rdb-demo/blob/master/filtering/andAlternative.js
[38]:https://github.com/alfateam/rdb-demo/blob/master/filtering/subFilter.js
[39]:https://github.com/alfateam/rdb-demo/blob/master/filtering/compositeFilter.js
[101]:https://github.com/alfateam/rdb-demo/blob/master/defaultValues.js
[102]:https://github.com/alfateam/rdb-demo/blob/master/conventions.js
[901]:https://npmjs.org/package/rdb#getById
[902]:https://npmjs.org/package/rdb#tryGetFirst
[903]:https://npmjs.org/package/rdb#join
[904]:https://npmjs.org/package/rdb#hasMany
[905]:https://npmjs.org/package/rdb#hasOne
[906]:https://npmjs.org/package/rdb#compositeKeys
[907]:https://npmjs.org/package/rdb#getByIdEager
[908]:https://npmjs.org/package/rdb#tryGetFirstEager
[909]:https://npmjs.org/package/rdb#toJSON
[910]:https://npmjs.org/package/rdb#toJSONWithStrategy
[911]:https://npmjs.org/package/rdb#getMany
[912]:https://npmjs.org/package/rdb#getManyLazy
[913]:https://npmjs.org/package/rdb#getManyEager
[914]:https://npmjs.org/package/rdb#manyToJSON
[915]:https://npmjs.org/package/rdb#manyToJSONWithStrategy
[916]:https://npmjs.org/package/rdb#update
[917]:https://npmjs.org/package/rdb#insert
[918]:https://npmjs.org/package/rdb#defaultValues
[919]:https://npmjs.org/package/rdb#conventions
[920]:https://npmjs.org/package/rdb#updateJoin
[921]:https://npmjs.org/package/rdb#updateHasOne
[922]:https://npmjs.org/package/rdb#updateHasMany
[923]:https://npmjs.org/package/rdb#equal
[924]:https://npmjs.org/package/rdb#notEqual
[925]:https://npmjs.org/package/rdb#not.js
[926]:https://npmjs.org/package/rdb#lessThan
[927]:https://npmjs.org/package/rdb#lessThanOrEqual
[928]:https://npmjs.org/package/rdb#greaterThan
[929]:https://npmjs.org/package/rdb#greaterThanOrEqual
[930]:https://npmjs.org/package/rdb#between
[931]:https://npmjs.org/package/rdb#in
[932]:https://npmjs.org/package/rdb#startsWith
[933]:https://npmjs.org/package/rdb#endsWith
[934]:https://npmjs.org/package/rdb#contains
[935]:https://npmjs.org/package/rdb#exists
[936]:https://npmjs.org/package/rdb#or
[937]:https://npmjs.org/package/rdb#and
[938]:https://npmjs.org/package/rdb#orAlternative
[939]:https://npmjs.org/package/rdb#andAlternative
[940]:https://npmjs.org/package/rdb#subFilter
[941]:https://npmjs.org/package/rdb#compositeFilter
