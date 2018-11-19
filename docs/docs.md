All examples below are found at [npmjs.org/package/rdb-demo](https://npmjs.org/package/rdb-demo).  
_Documentation and examples_
---------------
__Connecting__  
[connect to postgres](#_connecttopostgres)  
[connect to mySql](#_connecttomysql)  
[connect to sqlite](#_connecttosqlite)  
[pool size](#_poolsize)  
[schema](#_schema)  
[schema alternative 2](#_schema2)  
[end pool](#_endpool)  
[end all pools](#_endallpools)  
[logging](#_logging)  

__Basic querying__  
[getById](#_getbyid)  
[tryGetById](#_trygetbyid)  
[tryGetFirst](#_trygetfirst)  
[join](#_join)  
[hasMany](#_hasmany)  
[hasOne](#_hasone)  
[composite keys](#_compositekeys)  
[getById eagerly](#_getbyideager)    
[tryGetFirst eagerly](#_trygetfirsteager)  
[toDto](#_todto)  
[toDto with strategy](#_todtowithstrategy)  
[toDto with orderBy](#_todtowithorderby)  
[toDto with orderBy descending](#_todtowithorderbydesc)  
[toDto ignoring columns](#_serializable)  
[toJSON](#_tojson)  
[toJSON with strategy](#_tojsonwithstrategy)  
[getMany](#_getmany)  
[getMany lazily](#_getmanylazy)  
[getMany eagerly](#_getmanyeager)  
[(many)ToDto](#_manytodto)  
[(many)ToDto with strategy](#_manytodtowithstrategy)  
[(many)ToJSON](#_manytojson)  
[(many)ToJSON with strategy](#_manytojsonwithstrategy)  
[Raw SQL query](#_rawsqlquery)  
[Raw SQL Query With Parameters](#_rawsqlquerywithparameters)  

__Streaming__  
[streaming rows](#_streameager)  
[streaming json](#_streamjsoneager)  

__Persistence__  
[update](#_update)  
[insert](#_insert)  
[delete](#_delete)  
[cascade delete](#_cascadedelete)  
[bulk delete](#_bulkdelete)  
[bulk cascade delete](#_bulkcascadedelete)  
[default values](#_defaultvalues)  
[conventions](#_conventions)  
[update a join-relation](#_updatejoin)  
[update a hasOne-relation](#_updatehasone)  
[update a hasMany-relation](#_updatehasmany)  
[row lock](#_rowlock)  
[transaction lock](#_transactionlock)  

__Filters__  
[equal](#_equal)  
[notEqual](#_notequal)  
[not](#_not)  
[lessThan](#_lessthan)  
[lessThanOrEqual](#_lessthanorequal)  
[greaterThan](#_greaterthan)  
[greaterThanOrEqual](#_greaterthanorequal)  
[between](#_between)  
[in](#_in)   
[startsWith](#_startswith)  
[endsWith](#_endswith)  
[contains](#_contains)  
[iEqual](#_iequal)  
[iStartsWith](#_istartswith)  
[iEndsWith](#_iendswith)  
[iContains](#_icontains)  
[exists](#_exists)  
[or](#_or)  
[and](#_and)  
[or alternative syntax](#_oralternative)  
[and alternative syntax](#_andalternative)  
[sub filter](#_subfilter)  
[composite filter](#_compositefilter)  
[raw sql filter](#_rawsqlfilter)  

_Contents_
---------------

<a name="_connecttopostgres"></a>
[connect to postgres](https://github.com/alfateam/rdb-demo/blob/master/connect.js)
```js
const rdb = require('rdb');

const db = rdb('postgres://rdb:rdb@localhost/rdbdemo');
//alternatively: var db = rdb.pg('postgres://postgres:postgres@localhost/test');
//will use pool with 10 connections by default

module.exports = async function() {
    try {
        await db.transaction();
        await rdb.commit();
        console.log('Waiting for connection pool to teardown....');
    } catch (e) {
        console.log(e.stack);
        rdb.rollback();
    }
}();
```
<a name="_connecttomysql"></a>
[connect to mySql](https://github.com/alfateam/rdb-demo/blob/master/mySql/connect.js)
```js
const rdb = require('rdb');

const db = rdb('mysql://root@localhost/rdbDemo?multipleStatements=true');
//alternatively: var db = rdb.mySql('mysql://root@localhost/rdbDemo?multipleStatements=true');
//will use pool with 10 connections by default

module.exports = async function() {
    try {
        await db.transaction();
        await rdb.commit();
        console.log('Waiting for connection pool to teardown....');
    } catch (e) {
        console.log(e.stack);
        rdb.rollback();
    }
}();
```
<a name="_connecttosqlite"></a>
[connect to sqlite](https://github.com/alfateam/rdb-demo/blob/master/sqlite/connect.js)  
Requires sqlite3 as a dependency in your own package.json
```js
const rdb = require('rdb');

const db = rdb.sqlite(__dirname + '/db/rdbDemo');
//will use pool with 10 connections by default

module.exports = async function() {
    try {
        await db.transaction();
        await rdb.commit();
        console.log('Waiting for connection pool to teardown....');
    } catch (e) {
        console.log(e.stack);
        rdb.rollback();
    }
}();
```
<a name="_poolsize"></a>
[pool size](https://github.com/alfateam/rdb-demo/blob/master/poolOptions.js)
```js
const rdb = require('rdb');
const poolOptions = {size: 20};

const db = rdb('postgres://rdb:rdb@localhost/rdbdemo', poolOptions);

module.exports = async function() {
    try {
        await db.transaction();
        await rdb.commit();
        console.log('Waiting for connection pool to teardown....');
    } catch (e) {
        console.log(e.stack);
        rdb.rollback();
    }
}();
```
<a name="_schema"></a>
[schema](https://github.com/alfateam/rdb-demo/blob/master/schema.js)
(postgres only)
```js
const rdb = require('rdb');

const db = rdb('postgres://rdb:rdb@localhost/rdbdemo');
//alternatively: var db = rdb.pg('postgres://postgres:postgres@localhost/test');

module.exports = async function() {
    try {
        await db.transaction({schema: ['mySchema', 'otherSchema']}); 
        //or use string for single schema );
        await rdb.commit();
        console.log('Waiting for connection pool to teardown....');
    } catch (e) {
        console.log(e.stack);
        rdb.rollback();
    }
}();
```
<a name="_schema2"></a>
[schema alternative 2](https://github.com/alfateam/rdb-demo/blob/master/schema2.js)
(postgres only)
```js
const rdb = require('rdb');

const db = rdb('postgres://rdb:rdb@localhost/rdbdemo');
//alternatively: var db = rdb.pg('postgres://postgres:postgres@localhost/test');

module.exports = async function() {
    try {
        await db.transaction();
        await db.schema({schema: ['mySchema', 'otherSchema']});
        //or use string for single schema );
        await rdb.commit();
        console.log('Waiting for connection pool to teardown....');
    } catch (e) {
        console.log(e.stack);
        rdb.rollback();
    }
}();
```
<a name="_endpool"></a>
[end pool](https://github.com/alfateam/rdb-demo/blob/master/endPool.js)
```js
const rdb = require('rdb');

const db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

module.exports = async function() {
    try {
        await db.transaction();
        await rdb.commit();
        await db.end();
        console.log('Pool ended.');
    } catch (e) {
        console.log(e.stack);
        rdb.rollback();
    }
}();
```
<a name="_endallpools"></a>
[end all pools](https://github.com/alfateam/rdb-demo/blob/master/endAllPools.js)
```js
const rdb = require('rdb');

const dbPg = rdb('postgres://rdb:rdb@localhost/rdbdemo');
const dbMySql = rdb('mysql://root@localhost/rdbDemo?multipleStatements=true');

module.exports = async function() {
    try {
        await connectPg();
        await connectMySql();
        await rdb.end();
        console.log('Pools ended.');
    } catch (e) {
        console.log(e.stack);
    }
}();

async function connectPg() {
    try {
        await dbPg.transaction();
        await rdb.commit();
    } catch (e) {
        console.log(e.stack);
        rdb.rollback();
    }
};

async function connectMySql() {
    try {
        await dbMySql.transaction();
        await rdb.commit();
    } catch (e) {
        console.log(e.stack);
        rdb.rollback();
    }
};
```
<a name="_logging"></a>
[logging](https://github.com/alfateam/rdb-demo/blob/master/logging.js)
```js
const rdb = require('rdb');

const Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

rdb.log(console.log); //will log sql and parameters

const db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

module.exports = async function() {
    try {
        await db.transaction();
        let customer = await Customer.getById('a0000000-0000-0000-0000-000000000000');
        customer.name = 'Ringo'; 
        rdb.commit();
        console.log('Waiting for connection pool to teardown....');
    } catch (e) {
        console.log(e.stack);
        rdb.rollback();
    }
}();

```
<a name="_getbyid"></a>
[getById](https://github.com/alfateam/rdb-demo/blob/master/getById.js)
```js
const rdb = require('rdb');
const Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');
Customer.column('cBalance').numeric().as('balance');
Customer.column('cRegdate').date().as('registeredDate');
Customer.column('cIsActive').boolean().as('isActive');
Customer.column('cPicture').binary().as('picture');
Customer.column('cDocument').json().as('document');

const db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

module.exports = async function() {
    try {
        await db.transaction();
        let customer = await Customer.getById('a0000000-0000-0000-0000-000000000000');
        console.log(await customer.toDto());
        await rdb.commit();
        console.log('Waiting for connection pool to teardown....');
    } catch (e) {
        console.log(e.stack);
        rdb.rollback();
    }
}();
```
<a name="_trygetbyid"></a>
[tryGetById](https://github.com/alfateam/rdb-demo/blob/master/tryGetById.js)
```js
const rdb = require('rdb');

const Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');
Customer.column('cBalance').numeric().as('balance');
Customer.column('cRegdate').date().as('registeredDate');
Customer.column('cIsActive').boolean().as('isActive');
Customer.column('cPicture').binary().as('picture');

const db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

module.exports = async function() {
    try {
        await db.transaction();
        let customer = await Customer.tryGetById('a0000000-0000-0000-0000-000000000000');
        console.log(await customer.toDto());
        await rdb.commit();
        console.log('Waiting for connection pool to teardown....');
    } catch (e) {
        console.log(e.stack);
        rdb.rollback();
    }
}();
```
<a name="_trygetfirst"></a>
[tryGetFirst](https://github.com/alfateam/rdb-demo/blob/master/tryGetFirst.js)
```js
const rdb = require('rdb');

const Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

const db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

module.exports = async function() {
    try {
        await db.transaction();
        let filter = Customer.name.equal('John');
        let customer = await Customer.tryGetFirst(filter);
        console.log(await customer.toDto());
        await rdb.commit();
        console.log('Waiting for connection pool to teardown....');
    } catch (e) {
        console.log(e.stack);
        rdb.rollback();
    }
}();
```
<a name="_join"></a>
[join](https://github.com/alfateam/rdb-demo/blob/master/join.js)
```js
const rdb = require('rdb');

const Customer = rdb.table('_customer');
const Order = rdb.table('_order');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');
Order.column('oCustomerId').guid().as('customerId');
Order.join(Customer).by('oCustomerId').as('customer');

const db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

module.exports = async function() {
    try {
        await db.transaction();
        let order = await Order.getById('a0000000-a000-0000-0000-000000000000');
        let customer = await order.customer;
        console.log(await order.toJSON({customer: null}));
        await rdb.commit();
        console.log('Waiting for connection pool to teardown....');
    } catch (e) {
        console.log(e.stack);
        rdb.rollback();
    }
}();
```
<a name="_hasmany"></a>
[hasMany](https://github.com/alfateam/rdb-demo/blob/master/hasMany.js)
```js
const rdb = require('rdb');
const resetDemo = require('./db/resetDemo');
const inspect = require('util').inspect;

const Order = rdb.table('_order');
const OrderLine = rdb.table('_orderLine');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');

OrderLine.primaryColumn('lId').guid().as('id');
OrderLine.column('lOrderId').guid().as('orderId');
OrderLine.column('lProduct').string().as('product');

const line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

const db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

module.exports = async function() {
    try {
        await resetDemo();
        await db.transaction();
        let order = await Order.getById('b0000000-b000-0000-0000-000000000000');
        let dtos = await order.toDto();
        console.log(inspect(dtos, false, 10));
        await rdb.commit();
        console.log('Waiting for connection pool to teardown....');
    } catch (e) {
        console.log(e.stack);
        rdb.rollback();
    }
}();
```
<a name="_hasone"></a>
[hasOne](https://github.com/alfateam/rdb-demo/blob/master/hasOne.js)
```js
const rdb = require('rdb');
const {inspect} = require('util');

const Order = rdb.table('_order');
const DeliveryAddress = rdb.table('_deliveryAddress');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');

DeliveryAddress.primaryColumn('dId').guid().as('id');
DeliveryAddress.column('dOrderId').string().as('orderId');
DeliveryAddress.column('dName').string().as('name');
DeliveryAddress.column('dStreet').string().as('street');

const deliveryAddress_order_relation = DeliveryAddress.join(Order).by('dOrderId').as('order');
Order.hasOne(deliveryAddress_order_relation).as('deliveryAddress');

const db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

module.exports = async function() {
    try {
        await db.transaction();
        let order = await Order.getById('b0000000-b000-0000-0000-000000000000');
        let dtos = await order.toDto();
        console.log(inspect(dtos, false, 10));
        await rdb.commit();
        console.log('Waiting for connection pool to teardown....');
    } catch (e) {
        console.log(e.stack);
        rdb.rollback();
    }
}();
```
<a name="_compositekeys"></a>
[composite keys](https://github.com/alfateam/rdb-demo/blob/master/compositeKeys.js)
```js
const rdb = require('rdb');

const Order = rdb.table('_compositeOrder');
const OrderLine = rdb.table('_compositeOrderLine');

Order.primaryColumn('oCompanyId').numeric().as('companyId');
Order.primaryColumn('oOrderNo').numeric().as('orderNo');

OrderLine.primaryColumn('lCompanyId').numeric().as('companyId');
OrderLine.primaryColumn('lOrderNo').numeric().as('orderNo');
OrderLine.primaryColumn('lLineNo').numeric().as('lineNo');
OrderLine.column('lProduct').string().as('product');

const line_order_relation = OrderLine.join(Order).by('lCompanyId', 'lOrderNo').as('order');
Order.hasMany(line_order_relation).as('lines');

const db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

module.exports = async function() {
    try {
        await db.transaction();
        let companyId = 1;
        let orderId = 1001;
        let order = await Order.getById(companyId, orderId);
        console.log(await order.toDto());
        await rdb.commit();
        console.log('Waiting for connection pool to teardown....');
    } catch (e) {
        console.log(e.stack);
        rdb.rollback();
    }
}();
```
<a name="_getbyideager"></a>
[getById eagerly](https://github.com/alfateam/rdb-demo/blob/master/getByIdEager.js)
```js
const rdb = require('rdb');
const inspect = require('util').inspect;

const Customer = rdb.table('_customer');
const Order = rdb.table('_order');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');
Order.column('oCustomerId').guid().as('customerId');
Order.join(Customer).by('oCustomerId').as('customer');

const db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

module.exports = async function() {
    try {
        await db.transaction();
        let fetchingStrategy = { customer: null }; //alternatively: {customer : {}} 
        let order = await Order.getById('a0000000-a000-0000-0000-000000000000', fetchingStrategy);
        console.log(await order.toDto());
        let customer = await order.customer;
        console.log(await customer.toDto());
        await rdb.commit();
        console.log('Waiting for connection pool to teardown....');
    } catch (e) {
        console.log(e.stack);
        rdb.rollback();
    }
}();
```
<a name="_trygetfirsteager"></a>
[tryGetFirst eagerly](https://github.com/alfateam/rdb-demo/blob/master/tryGetFirstEager.js)
```js
const rdb = require('rdb');

const Customer = rdb.table('_customer');
const Order = rdb.table('_order');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');
Order.column('oCustomerId').guid().as('customerId');

Order.join(Customer).by('oCustomerId').as('customer');

const db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

module.exports = async function() {
    try {
        await db.transaction();
        let filter = Order.customer.name.equal('John');
        let strategy = { customer: null };
        let order = await Order.tryGetFirst(filter, strategy);
        if (order)
            console.log(await order.toDto());
        await rdb.commit();
        console.log('Waiting for connection pool to teardown....');
    } catch (e) {
        console.log(e.stack);
        rdb.rollback();
    }
}();
```
<a name="_todto"></a>
[toDto](https://github.com/alfateam/rdb-demo/blob/master/toDto.js)
```js
const rdb = require('rdb');

const Order = rdb.table('_order');
const Customer = rdb.table('_customer');
const OrderLine = rdb.table('_orderLine');
const DeliveryAddress = rdb.table('_deliveryAddress');

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

const order_customer_relation = Order.join(Customer).by('oCustomerId').as('customer');

const line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

const deliveryAddress_order_relation = DeliveryAddress.join(Order).by('dOrderId').as('order');
Order.hasOne(deliveryAddress_order_relation).as('deliveryAddress');


const db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

module.exports = async function() {
    try {
        let order = await Order.getById('b0000000-b000-0000-0000-000000000000');
        let dto = await order.toDto( /*strategy*/ );
        //default strategy, expand all hasOne and hasMany relations
        console.log(dto);
        await rdb.commit();
        console.log('Waiting for connection pool to teardown....');
    } catch (e) {
        console.log(e.stack);
        rdb.rollback();
    }
}();
```
<a name="_todtowithstrategy"></a>
[toDto with strategy](https://github.com/alfateam/rdb-demo/blob/master/toDtoWithStrategy.js)
```js
const rdb = require('rdb');

const Order = rdb.table('_order');
const Customer = rdb.table('_customer');
const OrderLine = rdb.table('_orderLine');
const DeliveryAddress = rdb.table('_deliveryAddress');

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

const order_customer_relation = Order.join(Customer).by('oCustomerId').as('customer');

const line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

const deliveryAddress_order_relation = DeliveryAddress.join(Order).by('dOrderId').as('order');
Order.hasOne(deliveryAddress_order_relation).as('deliveryAddress');


const db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

module.exports = async function() {
    try {
        await db.transaction();
        let order = await Order.getById('b0000000-b000-0000-0000-000000000000');
        let strategy = {customer : null, lines : null, deliveryAddress : null};
        let dto = await order.toDto(strategy);
        console.log(dto);
        await rdb.commit();
        console.log('Waiting for connection pool to teardown....');
    } catch (e) {
        console.log(e.stack);
        rdb.rollback();
    }
}();
```
<a name="_todtowithorderby"></a>
[toDto with orderBy](https://github.com/alfateam/rdb-demo/blob/master/toDtoWithOrderBy.js)
```js
const rdb = require('rdb');

const Order = rdb.table('_order');
const Customer = rdb.table('_customer');
const OrderLine = rdb.table('_orderLine');
const DeliveryAddress = rdb.table('_deliveryAddress');

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

const order_customer_relation = Order.join(Customer).by('oCustomerId').as('customer');

const line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

const deliveryAddress_order_relation = DeliveryAddress.join(Order).by('dOrderId').as('order');
Order.hasOne(deliveryAddress_order_relation).as('deliveryAddress');

const db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

module.exports = async function() {
    try {
        await db.transaction();
        let order = await Order.getById('b0000000-b000-0000-0000-000000000000');
        let strategy = {
            lines: {
                orderBy: ['product']
                //alternative: orderBy: ['product asc']
            }
        };
        let dto = await order.toDto(strategy);
        console.log(dto);
        await rdb.commit();
        console.log('Waiting for connection pool to teardown....');
    } catch (e) {
        console.log(e.stack);
        rdb.rollback();
    }
}();
```
<a name="_todtowithorderbydesc"></a>
[toDto with orderBy descending](https://github.com/alfateam/rdb-demo/blob/master/toDtoWithOrderByDesc.js)
```js
const rdb = require('rdb');

const Order = rdb.table('_order');
const Customer = rdb.table('_customer');
const OrderLine = rdb.table('_orderLine');
const DeliveryAddress = rdb.table('_deliveryAddress');

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

const order_customer_relation = Order.join(Customer).by('oCustomerId').as('customer');

const line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

const deliveryAddress_order_relation = DeliveryAddress.join(Order).by('dOrderId').as('order');
Order.hasOne(deliveryAddress_order_relation).as('deliveryAddress');

const db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

module.exports = async function() {
    try {
        await db.transaction();
        let order = await Order.getById('b0000000-b000-0000-0000-000000000000');
        let strategy = {
            lines: {
                orderBy: ['product desc']
            }
        };
        let dto = await order.toDto(strategy);
        console.log(dto);
        await rdb.commit();
        console.log('Waiting for connection pool to teardown....');
    } catch (e) {
        console.log(e.stack);
        rdb.rollback();
    }
}();
```
<a name="_serializable"></a>
[toDto ignoring columns](https://github.com/alfateam/rdb-demo/blob/master/serializable.js)
```js
const rdb = require('rdb');

const User = rdb.table('_user');
User.primaryColumn('uId').guid().as('id');
User.column('uUserId').string().as('userId');
User.column('uPassword').string().as('password').serializable(false);
User.column('uEmail').string().as('email');

const db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

module.exports = async function() {
    try {
        await db.transaction();
        let user = await User.getById('87654400-0000-0000-0000-000000000000');
        console.log(await user.toDto());
        //will print all properties except password
        //because it is not serializable
        await rdb.commit();
        console.log('Waiting for connection pool to teardown....');
    } catch (e) {
        console.log(e.stack);
        rdb.rollback();
    }
}();
```
<a name="_tojson"></a>
[toJSON](https://github.com/alfateam/rdb-demo/blob/master/toJSON.js)
```js
const rdb = require('rdb');

const Order = rdb.table('_order');
const Customer = rdb.table('_customer');
const OrderLine = rdb.table('_orderLine');
const DeliveryAddress = rdb.table('_deliveryAddress');

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

const order_customer_relation = Order.join(Customer).by('oCustomerId').as('customer');

const line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

const deliveryAddress_order_relation = DeliveryAddress.join(Order).by('dOrderId').as('order');
Order.hasOne(deliveryAddress_order_relation).as('deliveryAddress');

const db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

module.exports = async function() {
    try {
        await db.transaction();
        let order = await Order.getById('b0000000-b000-0000-0000-000000000000');
        let json = await order.toJSON( /*strategy*/ );
        //default strategy, expand all hasOne and hasMany relations
        console.log(json);
        await rdb.commit();
        console.log('Waiting for connection pool to teardown....');
    } catch (e) {
        console.log(e.stack);
        rdb.rollback();
    }
}();
```
<a name="_tojsonwithstrategy"></a>
[toJSON with strategy](https://github.com/alfateam/rdb-demo/blob/master/toJSONWithStrategy.js)
```js
const rdb = require('rdb');

const Order = rdb.table('_order');
const Customer = rdb.table('_customer');
const OrderLine = rdb.table('_orderLine');
const DeliveryAddress = rdb.table('_deliveryAddress');

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

const order_customer_relation = Order.join(Customer).by('oCustomerId').as('customer');

const line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

const deliveryAddress_order_relation = DeliveryAddress.join(Order).by('dOrderId').as('order');
Order.hasOne(deliveryAddress_order_relation).as('deliveryAddress');

const db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

module.exports = async function() {
    try {
        await db.transaction();
        let order = await Order.getById('b0000000-b000-0000-0000-000000000000');
        let strategy = {customer : null, lines : null, deliveryAddress : null};
        console.log(await order.toJSON(strategy));
        await rdb.commit();
        console.log('Waiting for connection pool to teardown....');
    } catch (e) {
        console.log(e.stack);
        rdb.rollback();
    }
}();
```
<a name="_getmany"></a>
[getMany](https://github.com/alfateam/rdb-demo/blob/master/getMany.js)
```js
const rdb = require('rdb');

const Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

const db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

module.exports = async function() {
    try {
        await db.transaction();
        let customers = await Customer.getMany();
        let dtos = await customers.toDto();
        console.log(dtos);
        await rdb.commit();
        console.log('Waiting for connection pool to teardown....');
    } catch (e) {
        console.log(e.stack);
        rdb.rollback();
    }
}();
```
<a name="_getmanylazy"></a>
[getMany lazily](https://github.com/alfateam/rdb-demo/blob/master/getManyLazy.js)
```js
const rdb = require('rdb');
const promise = require('promise/domains');
const inspect = require('util').inspect;

const Order = rdb.table('_order');
const OrderLine = rdb.table('_orderLine');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');

OrderLine.primaryColumn('lId').guid().as('id');
OrderLine.column('lOrderId').guid().as('orderId');
OrderLine.column('lProduct').string().as('product');

const line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

const db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

module.exports = async function() {
    try {
        await db.transaction();
        let orders = await Order.getMany();
        let dtos = await orders.toDto();
        console.log(inspect(dtos, false, 10));
        await rdb.commit();
        console.log('Waiting for connection pool to teardown....');
    } catch (e) {
        console.log(e.stack);
        rdb.rollback();
    }
}();
```
<a name="_getmanyeager"></a>
[getMany eager](https://github.com/alfateam/rdb-demo/blob/master/getManyEager.js)
```js
const inspect = require('util').inspect;
const rdb = require('rdb');

const Order = rdb.table('_order');
const OrderLine = rdb.table('_orderLine');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');

OrderLine.primaryColumn('lId').guid().as('id');
OrderLine.column('lOrderId').guid().as('orderId');
OrderLine.column('lProduct').string().as('product');

const line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

const db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

module.exports = async function() {
    try {
        await db.transaction();
        let emptyFilter;
        let strategy = {lines : null};
        let orders = await Order.getMany(emptyFilter, strategy);
        let dtos = await orders.toDto();
        console.log(inspect(dtos, false, 10));
        await rdb.commit();
        console.log('Waiting for connection pool to teardown....');
    } catch (e) {
        console.log(e.stack);
        rdb.rollback();
    }
}();
```
<a name="_manytodto"></a>
[(many)ToDto](https://github.com/alfateam/rdb-demo/blob/master/manyToDto.js)
```js
const rdb = require('rdb');
const inspect = require('util').inspect;

const Order = rdb.table('_order');
const Customer = rdb.table('_customer');
const OrderLine = rdb.table('_orderLine');
const DeliveryAddress = rdb.table('_deliveryAddress');

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

const order_customer_relation = Order.join(Customer).by('oCustomerId').as('customer');

const line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

const deliveryAddress_order_relation = DeliveryAddress.join(Order).by('dOrderId').as('order');
Order.hasOne(deliveryAddress_order_relation).as('deliveryAddress');

const db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

module.exports = async function() {
    try {
        await db.transaction();
        let orders = await Order.getMany();
        let dtos = await orders.toDto( /*strategy*/ );
        //default strategy, expand all hasOne and hasMany relations
        console.log(inspect(dtos, false, 10));
        rdb.commit();
        console.log('Waiting for connection pool to teardown....');
    } catch (e) {
        console.log(e.stack);
        rdb.rollback();
    }
}();

```
<a name="_manytodtowithstrategy"></a>
[(many)ToDto with strategy](https://github.com/alfateam/rdb-demo/blob/master/manyToDtoWithStrategy.js)
```js
const inspect = require('util').inspect;
const rdb = require('rdb');

const Order = rdb.table('_order');
const Customer = rdb.table('_customer');
const OrderLine = rdb.table('_orderLine');
const DeliveryAddress = rdb.table('_deliveryAddress');

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

const order_customer_relation = Order.join(Customer).by('oCustomerId').as('customer');

const line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

const deliveryAddress_order_relation = DeliveryAddress.join(Order).by('dOrderId').as('order');
Order.hasOne(deliveryAddress_order_relation).as('deliveryAddress');

const db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

module.exports = async function() {
    try {
        await db.transaction();

        let orders = await Order.getMany();
        let strategy = { customer: null, lines: null, deliveryAddress: null };
        let dtos = await orders.toDto(strategy);
        console.log(inspect(dtos, false, 10));

        await rdb.commit();
        console.log('Waiting for connection pool to teardown....');
    } catch (e) {
        console.log(e.stack);
        rdb.rollback();
    }
}();
```
<a name="_manytojson"></a>
[(many)ToJSON](https://github.com/alfateam/rdb-demo/blob/master/manyToJSON.js)
```js
const rdb = require('rdb');

const Order = rdb.table('_order');
const Customer = rdb.table('_customer');
const OrderLine = rdb.table('_orderLine');
const DeliveryAddress = rdb.table('_deliveryAddress');

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

const order_customer_relation = Order.join(Customer).by('oCustomerId').as('customer');

const line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

const deliveryAddress_order_relation = DeliveryAddress.join(Order).by('dOrderId').as('order');
Order.hasOne(deliveryAddress_order_relation).as('deliveryAddress');

const db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

module.exports = async function() {
    try {
        await db.transaction();
        let orders = await Order.getMany();
        console.log(await orders.toJSON( /*strategy*/ ));
        //default strategy, expand all hasOne and hasMany relations
        await rdb.commit();
        console.log('Waiting for connection pool to teardown....');
    } catch (e) {
        console.log(e.stack);
        rdb.rollback();
    }
}();
```
<a name="_manytojsonwithstrategy"></a>
[(many)ToJSON with strategy](https://github.com/alfateam/rdb-demo/blob/master/manyToJSONWithStrategy.js)
```js
const rdb = require('rdb');

const Order = rdb.table('_order');
const Customer = rdb.table('_customer');
const OrderLine = rdb.table('_orderLine');
const DeliveryAddress = rdb.table('_deliveryAddress');

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

const order_customer_relation = Order.join(Customer).by('oCustomerId').as('customer');

const line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

const deliveryAddress_order_relation = DeliveryAddress.join(Order).by('dOrderId').as('order');
Order.hasOne(deliveryAddress_order_relation).as('deliveryAddress');

const db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

module.exports = async function() {
    try {
        await db.transaction();
        let orders = await Order.getMany();
        let strategy = {customer : null, lines : null, deliveryAddress : null};
        console.log(await orders.toJSON(strategy));
        await rdb.commit();
        console.log('Waiting for connection pool to teardown....');
    } catch (e) {
        console.log(e.stack);
        rdb.rollback();
    }
}();
```
<a name="_rawsqlquery"></a>
[Raw SQL Query](https://github.com/alfateam/rdb-demo/blob/master/rawSqlQuery.js)
```js
var rdb = require('rdb');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getUniqueCustomerIds)
    .then(print)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getUniqueCustomerIds() {
    return rdb.query('SELECT DISTINCT oCustomerId AS "customerId" FROM _order');
}

function print(rows) {
    console.log(rows);
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
<a name="_rawsqlquerywithparameters"></a>
[Raw SQL Query With Parameters](https://github.com/alfateam/rdb-demo/blob/master/rawSqlQueryWithParameters.js)
```js
var rdb = require('rdb');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getOrderNos)
    .then(print)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getOrderNos() {
    return rdb.query({
        sql: 'SELECT oOrderNo AS "orderNo" FROM _order WHERE oOrderNo LIKE ?',
        parameters: ['%04']
    });
}

function print(rows) {
    console.log(rows);
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
<a name="_streameager"></a>
[streaming rows](https://github.com/alfateam/rdb-demo/blob/master/streamEager.js)
```js
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

var emptyFilter;
var strategy = {
    lines: {
        orderBy: ['product']
    },
    orderBy: ['orderNo'],
    limit: 5,
};

Order.createReadStream(db, emptyFilter, strategy).on('data', printOrder);

function printOrder(order) {
    var format = 'Order Id: %s, Order No: %s';
    console.log(format, order.id, order.orderNo);
    order.lines.forEach(printLine);
}

function printLine(line) {
    var format = 'Line Id: %s, Order Id: %s, Product: %s';
    console.log(format, line.id, line.orderId, line.product);
}
```
<a name="_streamjsoneager"></a>
[streaming json](https://github.com/alfateam/rdb-demo/blob/master/streamJSONEager.js)
```js
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

var emptyFilter;
var strategy = {
    lines: {
        orderBy: ['product']
    },
    orderBy: ['orderNo'],
    limit: 5,
};

Order.createJSONReadStream(db, emptyFilter, strategy).pipe(process.stdout);
```
<a name="_update"></a>
[update](https://github.com/alfateam/rdb-demo/blob/master/update.js)
```js
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
<a name="_insert"></a>
[insert](https://github.com/alfateam/rdb-demo/blob/master/insert.js)
```js
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
<a name="_delete"></a>
[delete](https://github.com/alfateam/rdb-demo/blob/master/delete.js)
```js
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
    .then(deleteCustomer)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getById() {    
    return Customer.getById('87654321-0000-0000-0000-000000000000');
}

function deleteCustomer(customer) {
    customer.delete();
}

function onOk() {
    console.log('Success');
    console.log('Waiting for connection pool to teardown....');
}

function onFailed(err) {
    console.log('Rollback');
    console.log(err.stack);
}
```
<a name="_cascadedelete"></a>
[cascadeDelete](https://github.com/alfateam/rdb-demo/blob/master/cascadeDelete.js)
```js
var rdb = require('rdb');

var Customer = rdb.table('_customer');
var Order = rdb.table('_order');
var OrderLine = rdb.table('_orderLine');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');
Order.column('oCustomerId').guid().as('customerId');

OrderLine.primaryColumn('lId').guid().as('id');
OrderLine.column('lOrderId').guid().as('orderId');

var orderToCustomer = Order.join(Customer).by('oCustomerId').as('customer');
Customer.hasMany(orderToCustomer).as('orders');

var line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getById)
    .then(deleteCustomer)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function getById() {
    return Customer.getById('87654399-0000-0000-0000-000000000000');
}

function deleteCustomer(customer) {
    customer.cascadeDelete();
}

function onOk() {
    console.log('Success');
    console.log('Waiting for connection pool to teardown....');
}

function onFailed(err) {
    console.log('Rollback');
    console.log(err.stack);
}
```
<a name="_bulkdelete"></a>
[bulk delete](https://github.com/alfateam/rdb-demo/blob/master/bulkDelete.js)
```js
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
    .then(deleteCustomer)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function deleteCustomer() {    
    var filter = Customer.id.eq('87654321-0000-0000-0000-000000000000');
    return Customer.delete(filter);
}

function onOk() {
    console.log('Success');
    console.log('Waiting for connection pool to teardown....');
}

function onFailed(err) {
    console.log('Rollback');
    console.log(err.stack);
}
```
<a name="_cascadedelete"></a>
[bulk cascadeDelete](https://github.com/alfateam/rdb-demo/blob/master/bulkCascadeDelete.js)
```js
var rdb = require('rdb');

var Customer = rdb.table('_customer');
var Order = rdb.table('_order');
var OrderLine = rdb.table('_orderLine');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');
Order.column('oCustomerId').guid().as('customerId');

OrderLine.primaryColumn('lId').guid().as('id');
OrderLine.column('lOrderId').guid().as('orderId');

var orderToCustomer = Order.join(Customer).by('oCustomerId').as('customer');
Customer.hasMany(orderToCustomer).as('orders');

var line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(deleteCustomer)
    .then(rdb.commit)
    .then(null, rdb.rollback)
    .then(onOk, onFailed);

function deleteCustomer() {
    var filter =  Customer.id.eq('87654399-0000-0000-0000-000000000000');
    Customer.cascadeDelete(filter);
}

function onOk() {
    console.log('Success');
    console.log('Waiting for connection pool to teardown....');
}

function onFailed(err) {
    console.log('Rollback');
    console.log(err.stack);
}
```
<a name="_defaultvalues"></a>
[default values](https://github.com/alfateam/rdb-demo/blob/master/defaultValues.js)
```js
var rdb = require('rdb');

var buf = new Buffer(10);
buf.write('\u00bd + \u00bc = \u00be', 0);

var Customer = rdb.table('_customer');

/*unless overridden, numeric is default 0, 
string is default null, 
guid is default null,
date is default null,
binary is default null,
boolean is default false,
json is default null
*/                    

Customer.primaryColumn('cId').guid().as('id').default(null);
Customer.column('cName').string().as('name').default('default name');
Customer.column('cBalance').numeric().as('balance').default(2000);
Customer.column('cRegdate').date().as('registeredDate').default(new Date());
Customer.column('cIsActive').boolean().as('isActive').default(true);
Customer.column('cPicture').binary().as('picture').default(buf);
Customer.column('cDocument').json().as('document').default({foo: true});

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
<a name="_conventions"></a>
[conventions](https://github.com/alfateam/rdb-demo/blob/master/conventions.js)
```js
var rdb = require('rdb');

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
<a name="_updatejoin"></a>
[update a join-relation](https://github.com/alfateam/rdb-demo/blob/master/updateJoin.js)
```js
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
<a name="_updatehasone"></a>
[update a hasOne-relation](https://github.com/alfateam/rdb-demo/blob/master/updateHasOne.js)
```js
var rdb = require('rdb');

var Order = rdb.table('_order');
var DeliveryAddress = rdb.table('_deliveryAddress');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');

DeliveryAddress.primaryColumn('dId').guid().as('id');
DeliveryAddress.column('dOrderId').string().as('orderId');
DeliveryAddress.column('dName').string().as('name');
DeliveryAddress.column('dStreet').string().as('street');

var deliveryAddress_order_relation = DeliveryAddress.hasone(Order).by('dOrderId').as('order');
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
<a name="_updatehasmany"></a>
[update a hasMany-relation](https://github.com/alfateam/rdb-demo/blob/master/updateHasMany.js)
```js
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
<a name="_rowlock"></a>
[row lock](https://github.com/alfateam/rdb-demo/blob/master/exclusive.js)  
(not in sqlite)
```js
var rdb = require('rdb');
var promise = require('promise/domains');

var Customer = rdb.table('_customer');
Customer.primaryColumn('cId').guid().as('id');
Customer.column('cBalance').numeric().as('balance');
Customer.exclusive();

var db = rdb('postgres://postgres:postgres@localhost/test');

showBalance()
    .then(updateConcurrently)
    .then(showBalance)
    .then(onOk, onFailed);

function showBalance() {
    return db.transaction()
        .then(getById)
        .then(printBalance)
        .then(rdb.commit)
        .then(null, rdb.rollback);

    function printBalance(customer) {
        console.log('Balance: ' + customer.balance)
    }
}

function updateConcurrently() {
    var concurrent1 = db.transaction()
        .then(getById)
        .then(increaseBalance)
        .then(rdb.commit)
        .then(null, rdb.rollback);

    var concurrent2 = db.transaction()
        .then(getById)
        .then(increaseBalance)
        .then(rdb.commit)
        .then(null, rdb.rollback);
    return promise.all([concurrent1, concurrent2]);
}

function getById() {
    console.log('....................');
    return Customer.getById('a0000000-0000-0000-0000-000000000000');
}

function increaseBalance(customer) {
    customer.balance += 100;
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
<a name="_transactionlock"></a>
[transaction lock](https://github.com/alfateam/rdb-demo/blob/master/lock.js)  
(postgres only)
```js
var rdb = require('rdb');
var promise = require('promise/domains');

var Customer = rdb.table('_customer');
Customer.primaryColumn('cId').guid().as('id');
Customer.column('cBalance').numeric().as('balance');

var db = rdb('postgres://postgres:postgres@localhost/test');

showBalance()
    .then(updateConcurrently)
    .then(showBalance)
    .then(onOk, onFailed);

function showBalance() {
    return db.transaction()
        .then(getById)
        .then(printBalance)
        .then(rdb.commit)
        .then(null, rdb.rollback);

    function printBalance(customer) {
        console.log('Balance: ' + customer.balance)
    }
}

function updateConcurrently() {
    var concurrent1 = db.transaction()
        .then(getById)
        .then(increaseBalance)
        .then(rdb.commit)
        .then(null, rdb.rollback);

    var concurrent2 = db.transaction()
        .then(getById)
        .then(increaseBalance)
        .then(rdb.commit)
        .then(null, rdb.rollback);
    return promise.all([concurrent1, concurrent2]);
}

function getById() {
    //pg_advisory_xact_lock(12345)
    //will be released on commit/rollback 
    return rdb.lock("12345").then(function() {
        return Customer.getById('a0000000-0000-0000-0000-000000000000');    
    });    
}

function increaseBalance(customer) {
    customer.balance += 100;
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
<a name="_equal"></a>
[equal](https://github.com/alfateam/rdb-demo/blob/master/filtering/equal.js)
```js
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
<a name="_notequal"></a>
[notEqual](https://github.com/alfateam/rdb-demo/blob/master/filtering/notEqual.js)
```js
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
<a name="_not"></a>
[not](https://github.com/alfateam/rdb-demo/blob/master/filtering/not.js)
```js
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
<a name="_lessthan"></a>
[lessThan](https://github.com/alfateam/rdb-demo/blob/master/filtering/lessThan.js)
```js
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
<a name="_lessthanorequal"></a>
[lessThanOrEqual](https://github.com/alfateam/rdb-demo/blob/master/filtering/lessThanOrEqual.js)
```js
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
<a name="_greaterthan"></a>
[greaterThan](https://github.com/alfateam/rdb-demo/blob/master/filtering/greaterThan.js)
```js
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
<a name="_greaterthanorequal"></a>
[greaterThanOrEqual](https://github.com/alfateam/rdb-demo/blob/master/filtering/greaterThanOrEqual.js)
```js
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
<a name="_between"></a>
[between](https://github.com/alfateam/rdb-demo/blob/master/filtering/between.js)
```js
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
<a name="_in"></a>
[in](https://github.com/alfateam/rdb-demo/blob/master/filtering/in.js)
```js
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
<a name="_startswith"></a>
[startsWith](https://github.com/alfateam/rdb-demo/blob/master/filtering/startsWith.js)
```js
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
<a name="_endswith"></a>
[endsWith](https://github.com/alfateam/rdb-demo/blob/master/filtering/endsWith.js)
```js
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
<a name="_contains"></a>
[contains](https://github.com/alfateam/rdb-demo/blob/master/filtering/contains.js)
```js
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
<a name="_contains"></a>
[contains](https://github.com/alfateam/rdb-demo/blob/master/filtering/contains.js)
```js
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
<a name="_iequal"></a>
[iEqual](https://github.com/alfateam/rdb-demo/blob/master/filtering/iEqual.js)  
(postgres only)
```js
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
    var filter = Customer.name.iEqual('jOhN');
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
<a name="_istartswith"></a>
[iStartsWith](https://github.com/alfateam/rdb-demo/blob/master/filtering/iStartsWith.js)  
(postgres only)
```js
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
    var filter = Customer.name.iStartsWith('jo');
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
<a name="_iendswith"></a>
[iEndsWith](https://github.com/alfateam/rdb-demo/blob/master/filtering/iEndsWith.js)  
(postgres only)
```js
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
    var filter = Customer.name.iEndsWith('nNy');
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
<a name="_icontains"></a>
[iContains](https://github.com/alfateam/rdb-demo/blob/master/filtering/iContains.js)  
(postgres only)
```js
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
    var filter = Customer.name.iContains('oHn');
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
<a name="_exists"></a>
[exists](https://github.com/alfateam/rdb-demo/blob/master/filtering/exists.js)
```js
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
<a name="_or"></a>
[or](https://github.com/alfateam/rdb-demo/blob/master/filtering/or.js)
```js
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
<a name="_and"></a>
[and](https://github.com/alfateam/rdb-demo/blob/master/filtering/and.js)
```js
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
<a name="_oralternative"></a>
[or alternative syntax](https://github.com/alfateam/rdb-demo/blob/master/filtering/orAlternative.js)
```js
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
<a name="_andalternative"></a>
[and alternative syntax](https://github.com/alfateam/rdb-demo/blob/master/filtering/andAlternative.js)
```js
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
<a name="_subfilter"></a>
[sub filter](https://github.com/alfateam/rdb-demo/blob/master/filtering/subFilter.js)
```js
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
<a name="_compositefilter"></a>
[composite filter](https://github.com/alfateam/rdb-demo/blob/master/filtering/compositeFilter.js)
```js
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
<a name="_rawsqlfilter"></a>
[raw sql filter](https://github.com/alfateam/rdb-demo/blob/master/filtering/rawSqlFilter.js)
```js
var inspect = require('util').inspect;
var rdb = require('rdb');

var Order = rdb.table('_order');
Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');
Order.column('oCustomerId').guid().as('customerId');

var Customer = rdb.table('_customer');
Customer.primaryColumn('cid').guid().as('id');
Customer.column('cName').string().as('name');
Customer.column('cBalance').string().as('balance');
Customer.column('cIsActive').boolean().as('isActive');

var orderCustomerJoin = Order.join(Customer).by('oCustomerId').as('customer');
Customer.hasMany(orderCustomerJoin).as('orders');

var db = rdb('postgres://postgres:postgres@localhost/test');

db.transaction()
    .then(getOrders)
    .then(printOrders)
    .then(db.commit)
    .then(null, db.rollback)
    .then(onOk, console.log);

function getOrders() {
    var filter = {
        sql: 'exists (select 1 from _customer where _customer.cId = oCustomerId and _customer.cBalance > 3000 and _customer.cName LIKE ?)',
        parameters: ['%o%']
    };
    return Order.getMany(filter);
}

function printOrders(orders) {
    var strategy = {customer: null}
    return orders.toDto(strategy).then(printDtos);
}

function printDtos(dtos) {
    console.log(inspect(dtos,false,10));
}

function onOk() {
    console.log('Done');
}
```