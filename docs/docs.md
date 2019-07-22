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
[getManyDto](#_getmanydto)  
[getMany lazily](#_getmanylazy)  
[getMany eagerly](#_getmanyeager)  
[getManyDto eagerly](#_getmanydtoeager)  
[getMany with orderBy jsonb](#_getmanywithorderbyjsonb)  
[getMany with orderBy jsonb descending](#_getmanywithorderbyjsonbdesc)  
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
let rdb = require('rdb');

let db = rdb('postgres://rdb:rdb@localhost/rdbdemo');
//alternatively: let db = rdb.pg('postgres://postgres:postgres@localhost/test');
//will use pool with 10 connections by default

return db.transaction(async () => {
    //transaction will commit after this function
});
```
<a name="_connecttomysql"></a>
[connect to mySql](https://github.com/alfateam/rdb-demo/blob/master/mySql/connect.js)
```js
let rdb = require('rdb');

let db = rdb('mysql://root@localhost/rdbDemo?multipleStatements=true');
//alternatively: let db = rdb.mySql('mysql://root@localhost/rdbDemo?multipleStatements=true');
//will use pool with 10 connections by default

return db.transaction(async () => {
    //transaction will commit after this function
});
```
<a name="_connecttosqlite"></a>
[connect to sqlite](https://github.com/alfateam/rdb-demo/blob/master/sqlite/connect.js)
Requires sqlite3 as a dependency in your own package.json
```js
let rdb = require('rdb');

let db = rdb.sqlite(__dirname + '/db/rdbDemo');
//will use pool with 10 connections by default

return db.transaction(async () => {
    //transaction will commit after this function
});
```
<a name="_poolsize"></a>
[pool size](https://github.com/alfateam/rdb-demo/blob/master/poolOptions.js)
```js
let rdb = require('rdb');
let poolOptions = {size: 20};

let db = rdb('postgres://rdb:rdb@localhost/rdbdemo', poolOptions);

return db.transaction(async () => {
    //transaction will commit after this function
});
```
<a name="_schema"></a>
[schema](https://github.com/alfateam/rdb-demo/blob/master/schema.js)  
(postgres only)
```js
let rdb = require('rdb');

let db = rdb('postgres://rdb:rdb@localhost/rdbdemo');
//alternatively: let db = rdb.pg('postgres://postgres:postgres@localhost/test');

await db.transaction({schema: ['mySchema', 'otherSchema']}, async () => {
    //or use string for single schema );
    //transaction will commit after this function
});

```
<a name="_schema2"></a>
[schema alternative 2](https://github.com/alfateam/rdb-demo/blob/master/schema2.js)  
(postgres only)
```js
let rdb = require('rdb');

let db = rdb('postgres://rdb:rdb@localhost/rdbdemo');
//alternatively: let db = rdb.pg('postgres://postgres:postgres@localhost/test');

return db.transaction(async () => {
    await db.schema({schema: ['mySchema', 'otherSchema']});
    //or use string for single schema );
});
```
<a name="_endpool"></a>
[end pool](https://github.com/alfateam/rdb-demo/blob/master/endPool.js)
```js
let rdb = require('rdb');

let db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

await db.transaction(async () => {
    //transaction will commit after this function
});
await db.end();
console.log('Pool ended.');

```
<a name="_endallpools"></a>
[end all pools](https://github.com/alfateam/rdb-demo/blob/master/endAllPools.js)
```js
let rdb = require('rdb');

let dbPg = rdb('postgres://rdb:rdb@localhost/rdbdemo');
let dbMySql = rdb('mysql://root@localhost/rdbDemo?multipleStatements=true');

await dbPg.transaction(async () => {
    //do pg stuff here
});
await dbMySql.transaction(async () => {
    //do mySql stuff here
});
await rdb.end();
console.log('Pools ended.');
```
<a name="_logging"></a>
[logging](https://github.com/alfateam/rdb-demo/blob/master/logging.js)
```js
let rdb = require('rdb');

let Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

rdb.log(console.log); //will log sql and parameters

let db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

await db.transaction(async () => {
    let customer = await Customer.getById('a0000000-0000-0000-0000-000000000000');
    customer.name = 'Ringo';
});
```
<a name="_getbyid"></a>
[getById](https://github.com/alfateam/rdb-demo/blob/master/getById.js)
```js
let rdb = require('rdb');
let Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');
Customer.column('cBalance').numeric().as('balance');
Customer.column('cRegdate').date().as('registeredDate');
Customer.column('cIsActive').boolean().as('isActive');
Customer.column('cPicture').binary().as('picture');
Customer.column('cDocument').json().as('document');

let db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

await db.transaction(async () => {
    let customer = await Customer.getById('a0000000-0000-0000-0000-000000000000');
    console.log(await customer.toDto());
});
```
<a name="_trygetbyid"></a>
[tryGetById](https://github.com/alfateam/rdb-demo/blob/master/tryGetById.js)
```js
let rdb = require('rdb');

let Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');
Customer.column('cBalance').numeric().as('balance');
Customer.column('cRegdate').date().as('registeredDate');
Customer.column('cIsActive').boolean().as('isActive');
Customer.column('cPicture').binary().as('picture');

let db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

await db.transaction(async () => {
    let customer = await Customer.tryGetById('a0000000-0000-0000-0000-000000000000');
    console.log(await customer.toDto());
});
```
<a name="_trygetfirst"></a>
[tryGetFirst](https://github.com/alfateam/rdb-demo/blob/master/tryGetFirst.js)
```js
let rdb = require('rdb');

let Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

let db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

await db.transaction(async () => {
    let filter = Customer.name.equal('John');
    let customer = await Customer.tryGetFirst(filter);
    console.log(await customer.toDto());
});
```
<a name="_join"></a>
[join](https://github.com/alfateam/rdb-demo/blob/master/join.js)
```js
let rdb = require('rdb');

let Customer = rdb.table('_customer');
let Order = rdb.table('_order');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');
Order.column('oCustomerId').guid().as('customerId');
Order.join(Customer).by('oCustomerId').as('customer');

let db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

await db.transaction(async () => {
    let order = await Order.getById('a0000000-a000-0000-0000-000000000000');
    console.log(await order.toJSON({customer: null}));
});

```
<a name="_hasmany"></a>
[hasMany](https://github.com/alfateam/rdb-demo/blob/master/hasMany.js)
```js
let rdb = require('rdb');
let resetDemo = require('./db/resetDemo');
let inspect = require('util').inspect;

let Order = rdb.table('_order');
let OrderLine = rdb.table('_orderLine');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');

OrderLine.primaryColumn('lId').guid().as('id');
OrderLine.column('lOrderId').guid().as('orderId');
OrderLine.column('lProduct').string().as('product');

let line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

let db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

await db.transaction(async () => {
    let order = await Order.getById('b0000000-b000-0000-0000-000000000000');
    let dtos = await order.toDto();
    console.log(inspect(dtos, false, 10));
});
```
<a name="_hasone"></a>
[hasOne](https://github.com/alfateam/rdb-demo/blob/master/hasOne.js)
```js
let rdb = require('rdb');
let {inspect} = require('util');

let Order = rdb.table('_order');
let DeliveryAddress = rdb.table('_deliveryAddress');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');

DeliveryAddress.primaryColumn('dId').guid().as('id');
DeliveryAddress.column('dOrderId').string().as('orderId');
DeliveryAddress.column('dName').string().as('name');
DeliveryAddress.column('dStreet').string().as('street');

let deliveryAddress_order_relation = DeliveryAddress.join(Order).by('dOrderId').as('order');
Order.hasOne(deliveryAddress_order_relation).as('deliveryAddress');

let db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

await db.transaction(async () => {
    let order = await Order.getById('b0000000-b000-0000-0000-000000000000');
    let dtos = await order.toDto();
    console.log(inspect(dtos, false, 10));
});
```
<a name="_compositekeys"></a>
[composite keys](https://github.com/alfateam/rdb-demo/blob/master/compositeKeys.js)
```js
let rdb = require('rdb');

let Order = rdb.table('_compositeOrder');
let OrderLine = rdb.table('_compositeOrderLine');

Order.primaryColumn('oCompanyId').numeric().as('companyId');
Order.primaryColumn('oOrderNo').numeric().as('orderNo');

OrderLine.primaryColumn('lCompanyId').numeric().as('companyId');
OrderLine.primaryColumn('lOrderNo').numeric().as('orderNo');
OrderLine.primaryColumn('lLineNo').numeric().as('lineNo');
OrderLine.column('lProduct').string().as('product');

let line_order_relation = OrderLine.join(Order).by('lCompanyId', 'lOrderNo').as('order');
Order.hasMany(line_order_relation).as('lines');

let db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

await db.transaction(async () => {
    let companyId = 1;
    let orderId = 1001;
    let order = await Order.getById(companyId, orderId);
    console.log(await order.toDto());
});
```
<a name="_getbyideager"></a>
[getById eagerly](https://github.com/alfateam/rdb-demo/blob/master/getByIdEager.js)
```js
let rdb = require('rdb');
let inspect = require('util').inspect;

let Customer = rdb.table('_customer');
let Order = rdb.table('_order');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');
Order.column('oCustomerId').guid().as('customerId');
Order.join(Customer).by('oCustomerId').as('customer');

let db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

await db.transaction(async () => {
    let fetchingStrategy = { customer: null }; //alternatively: {customer : {}}
    let order = await Order.getById('a0000000-a000-0000-0000-000000000000', fetchingStrategy);
    console.log(await order.toDto());
    let customer = await order.customer;
    console.log(await customer.toDto());
});
```
<a name="_trygetfirsteager"></a>
[tryGetFirst eagerly](https://github.com/alfateam/rdb-demo/blob/master/tryGetFirstEager.js)
```js
let rdb = require('rdb');

let Customer = rdb.table('_customer');
let Order = rdb.table('_order');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');
Order.column('oCustomerId').guid().as('customerId');

Order.join(Customer).by('oCustomerId').as('customer');

let db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

await db.transaction(async () => {
    let filter = Order.customer.name.equal('John');
    let strategy = { customer: null };
    let order = await Order.tryGetFirst(filter, strategy);
    if (order)
        console.log(await order.toDto());
});
```
<a name="_todto"></a>
[toDto](https://github.com/alfateam/rdb-demo/blob/master/toDto.js)
```js
let rdb = require('rdb');

let Order = rdb.table('_order');
let Customer = rdb.table('_customer');
let OrderLine = rdb.table('_orderLine');
let DeliveryAddress = rdb.table('_deliveryAddress');

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

Order.join(Customer).by('oCustomerId').as('customer');

let line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

let deliveryAddress_order_relation = DeliveryAddress.join(Order).by('dOrderId').as('order');
Order.hasOne(deliveryAddress_order_relation).as('deliveryAddress');


let db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

await db.transaction(async () => {
    let order = await Order.getById('b0000000-b000-0000-0000-000000000000');
    let dto = await order.toDto( /*strategy*/ );
    //default strategy, expand all hasOne and hasMany relations
    console.log(dto);
});
```
<a name="_todtowithstrategy"></a>
[toDto with strategy](https://github.com/alfateam/rdb-demo/blob/master/toDtoWithStrategy.js)
```js
let rdb = require('rdb');

let Order = rdb.table('_order');
let Customer = rdb.table('_customer');
let OrderLine = rdb.table('_orderLine');
let DeliveryAddress = rdb.table('_deliveryAddress');

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

Order.join(Customer).by('oCustomerId').as('customer');

let line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

let deliveryAddress_order_relation = DeliveryAddress.join(Order).by('dOrderId').as('order');
Order.hasOne(deliveryAddress_order_relation).as('deliveryAddress');


let db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

await db.transaction(async () => {
    let order = await Order.getById('b0000000-b000-0000-0000-000000000000');
    let strategy = {customer : null, lines : null, deliveryAddress : null};
    let dto = await order.toDto(strategy);
    console.log(dto);
});
```
<a name="_todtowithorderby"></a>
[toDto with orderBy](https://github.com/alfateam/rdb-demo/blob/master/toDtoWithOrderBy.js)
```js
let rdb = require('rdb');

let Order = rdb.table('_order');
let Customer = rdb.table('_customer');
let OrderLine = rdb.table('_orderLine');
let DeliveryAddress = rdb.table('_deliveryAddress');

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

Order.join(Customer).by('oCustomerId').as('customer');

let line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

let deliveryAddress_order_relation = DeliveryAddress.join(Order).by('dOrderId').as('order');
Order.hasOne(deliveryAddress_order_relation).as('deliveryAddress');

let db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

await db.transaction(async () => {
    let order = await Order.getById('b0000000-b000-0000-0000-000000000000');
    let strategy = {
        lines: {
            orderBy: ['product']
            //alternative: orderBy: ['product asc']
        }
    };
    let dto = await order.toDto(strategy);
    console.log(dto);
});
```
<a name="_todtowithorderbydesc"></a>
[toDto with orderBy descending](https://github.com/alfateam/rdb-demo/blob/master/toDtoWithOrderByDesc.js)
```js
let rdb = require('rdb');

let Order = rdb.table('_order');
let Customer = rdb.table('_customer');
let OrderLine = rdb.table('_orderLine');
let DeliveryAddress = rdb.table('_deliveryAddress');

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

Order.join(Customer).by('oCustomerId').as('customer');

let line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

let deliveryAddress_order_relation = DeliveryAddress.join(Order).by('dOrderId').as('order');
Order.hasOne(deliveryAddress_order_relation).as('deliveryAddress');

let db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

await db.transaction(async () => {
    let order = await Order.getById('b0000000-b000-0000-0000-000000000000');
    let strategy = {
        lines: {
            orderBy: ['product desc']
        }
    };
    let dto = await order.toDto(strategy);
    console.log(dto);
});
```
<a name="_serializable"></a>
[toDto ignoring columns](https://github.com/alfateam/rdb-demo/blob/master/serializable.js)
```js
let rdb = require('rdb');

let User = rdb.table('_user');
User.primaryColumn('uId').guid().as('id');
User.column('uUserId').string().as('userId');
User.column('uPassword').string().as('password').serializable(false);
User.column('uEmail').string().as('email');

let db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

await db.transaction(async () => {
    let user = await User.getById('87654400-0000-0000-0000-000000000000');
    console.log(await user.toDto());
    //will print all properties except password
    //because it is not serializable
});
```
<a name="_tojson"></a>
[toJSON](https://github.com/alfateam/rdb-demo/blob/master/toJSON.js)
```js
let rdb = require('rdb');

let Order = rdb.table('_order');
let Customer = rdb.table('_customer');
let OrderLine = rdb.table('_orderLine');
let DeliveryAddress = rdb.table('_deliveryAddress');

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

Order.join(Customer).by('oCustomerId').as('customer');

let line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

let deliveryAddress_order_relation = DeliveryAddress.join(Order).by('dOrderId').as('order');
Order.hasOne(deliveryAddress_order_relation).as('deliveryAddress');

let db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

await db.transaction(async () => {
    let order = await Order.getById('b0000000-b000-0000-0000-000000000000');
    let json = await order.toJSON( /*strategy*/ );
    //default strategy, expand all hasOne and hasMany relations
    console.log(json);
});
```
<a name="_tojsonwithstrategy"></a>
[toJSON with strategy](https://github.com/alfateam/rdb-demo/blob/master/toJSONWithStrategy.js)
```js
let rdb = require('rdb');

let Order = rdb.table('_order');
let Customer = rdb.table('_customer');
let OrderLine = rdb.table('_orderLine');
let DeliveryAddress = rdb.table('_deliveryAddress');

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

Order.join(Customer).by('oCustomerId').as('customer');

let line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

let deliveryAddress_order_relation = DeliveryAddress.join(Order).by('dOrderId').as('order');
Order.hasOne(deliveryAddress_order_relation).as('deliveryAddress');

let db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

await db.transaction(async () => {
    let order = await Order.getById('b0000000-b000-0000-0000-000000000000');
    let strategy = {customer : null, lines : null, deliveryAddress : null};
    console.log(await order.toJSON(strategy));
});
```
<a name="_getmany"></a>
[getMany](https://github.com/alfateam/rdb-demo/blob/master/getMany.js)
```js
let rdb = require('rdb');

let Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

let db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

await db.transaction(async () => {
    let customers = await Customer.getMany();
    let dtos = await customers.toDto();
    console.log(dtos);
});
```
<a name="_getmanydto"></a>
[getManyDto](https://github.com/alfateam/rdb-demo/blob/master/getManyDto.js)
```js
let rdb = require('rdb');

let Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

let db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

await db.transaction(async () => {
    console.log(await Customer.getManyDto());
});
```
<a name="_getmanylazy"></a>
[getMany lazily](https://github.com/alfateam/rdb-demo/blob/master/getManyLazy.js)
```js
let rdb = require('rdb');
let inspect = require('util').inspect;

let Order = rdb.table('_order');
let OrderLine = rdb.table('_orderLine');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');

OrderLine.primaryColumn('lId').guid().as('id');
OrderLine.column('lOrderId').guid().as('orderId');
OrderLine.column('lProduct').string().as('product');

let line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

let db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

await db.transaction(async () => {
    let orders = await Order.getMany();
    let dtos = await orders.toDto();
    console.log(inspect(dtos, false, 10));
});
```
<a name="_getmanyeager"></a>
[getMany eager](https://github.com/alfateam/rdb-demo/blob/master/getManyEager.js)
```js
let inspect = require('util').inspect;
let rdb = require('rdb');

let Order = rdb.table('_order');
let OrderLine = rdb.table('_orderLine');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');

OrderLine.primaryColumn('lId').guid().as('id');
OrderLine.column('lOrderId').guid().as('orderId');
OrderLine.column('lProduct').string().as('product');

let line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

let db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

await db.transaction(async () => {
    let emptyFilter;
    let strategy = {
        lines: null
    };
    let orders = await Order.getMany(emptyFilter, strategy);
    let dtos = await orders.toDto();
    console.log(inspect(dtos, false, 10));
});
```
<a name="_getmanydtoeager"></a>
[getManyDto eager](https://github.com/alfateam/rdb-demo/blob/master/getManyDtoEager.js)
```js
let rdb = require('rdb');
let inspect = require('util').inspect;

let Order = rdb.table('_order');
let OrderLine = rdb.table('_orderLine');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');

OrderLine.primaryColumn('lId').guid().as('id');
OrderLine.column('lOrderId').guid().as('orderId');
OrderLine.column('lProduct').string().as('product');

let line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

let db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

await db.transaction(async () => {
    let emptyFilter;
    let strategy = {lines : null};
    let orders = await Order.getManyDto(emptyFilter, strategy);
    console.log(inspect(orders, false, 10));
});
```
<a name="_getmanywithorderbyjsonb"></a>
[getMany with orderBy jsonb](https://github.com/alfateam/rdb-demo/blob/master/getManyWithOrderByJsonb.js)
```js
let rdb = require('rdb');

let Order = rdb.table('_jOrder');

Order.primaryColumn('oId').guid().as('id');
Order.column('oData').json().as('data');

let db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

await db.transaction(async () => {
    let strategy = {
        orderBy: ['data->\'orderNo\'']
        //alternative: orderBy: ['data->>\'orderId\' asc']
    };
    let orders = await Order.getMany(null, strategy);
    let dtos = await orders.toDto();
    console.log(dtos);
});
```
<a name="_getmanywithorderbyjsonbdesc"></a>
[getMany with orderBy jsonb descending](https://github.com/alfateam/rdb-demo/blob/master/getManyWithOrderByJsonb.js)
```js
let rdb = require('rdb');

let Order = rdb.table('_jOrder');

Order.primaryColumn('oId').guid().as('id');
Order.column('oData').json().as('data');

let db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

await db.transaction(async () => {
    let strategy = {
        orderBy: ['data->\'orderNo\' desc']
    };
    let orders = await Order.getMany(null, strategy);
    let dtos = await orders.toDto();
    console.log(dtos);
});
```
<a name="_manytodto"></a>
[(many)ToDto](https://github.com/alfateam/rdb-demo/blob/master/manyToDto.js)
```js
let rdb = require('rdb');
let inspect = require('util').inspect;

let Order = rdb.table('_order');
let Customer = rdb.table('_customer');
let OrderLine = rdb.table('_orderLine');
let DeliveryAddress = rdb.table('_deliveryAddress');

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

Order.join(Customer).by('oCustomerId').as('customer');

let line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

let deliveryAddress_order_relation = DeliveryAddress.join(Order).by('dOrderId').as('order');
Order.hasOne(deliveryAddress_order_relation).as('deliveryAddress');

let db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

await db.transaction(async () => {
    let orders = await Order.getMany();
    let dtos = await orders.toDto( /*strategy*/ );
    //default strategy, expand all hasOne and hasMany relations
    console.log(inspect(dtos, false, 10));
});
```
<a name="_manytodtowithstrategy"></a>
[(many)ToDto with strategy](https://github.com/alfateam/rdb-demo/blob/master/manyToDtoWithStrategy.js)
```js
let inspect = require('util').inspect;
let rdb = require('rdb');

let Order = rdb.table('_order');
let Customer = rdb.table('_customer');
let OrderLine = rdb.table('_orderLine');
let DeliveryAddress = rdb.table('_deliveryAddress');

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

Order.join(Customer).by('oCustomerId').as('customer');

let line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

let deliveryAddress_order_relation = DeliveryAddress.join(Order).by('dOrderId').as('order');
Order.hasOne(deliveryAddress_order_relation).as('deliveryAddress');

let db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

await db.transaction(async () => {
    let orders = await Order.getMany();
    let strategy = { customer: null, lines: null, deliveryAddress: null };
    let dtos = await orders.toDto(strategy);
    console.log(inspect(dtos, false, 10));
});
```
<a name="_manytojson"></a>
[(many)ToJSON](https://github.com/alfateam/rdb-demo/blob/master/manyToJSON.js)
```js
let rdb = require('rdb');

let Order = rdb.table('_order');
let Customer = rdb.table('_customer');
let OrderLine = rdb.table('_orderLine');
let DeliveryAddress = rdb.table('_deliveryAddress');

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

Order.join(Customer).by('oCustomerId').as('customer');

let line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

let deliveryAddress_order_relation = DeliveryAddress.join(Order).by('dOrderId').as('order');
Order.hasOne(deliveryAddress_order_relation).as('deliveryAddress');

let db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

await db.transaction(async () => {
    let orders = await Order.getMany();
    console.log(await orders.toJSON( /*strategy*/ ));
    //default strategy, expand all hasOne and hasMany relations
});
```
<a name="_manytojsonwithstrategy"></a>
[(many)ToJSON with strategy](https://github.com/alfateam/rdb-demo/blob/master/manyToJSONWithStrategy.js)
```js
let rdb = require('rdb');

let Order = rdb.table('_order');
let Customer = rdb.table('_customer');
let OrderLine = rdb.table('_orderLine');
let DeliveryAddress = rdb.table('_deliveryAddress');

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

Order.join(Customer).by('oCustomerId').as('customer');

let line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

let deliveryAddress_order_relation = DeliveryAddress.join(Order).by('dOrderId').as('order');
Order.hasOne(deliveryAddress_order_relation).as('deliveryAddress');

let db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

await db.transaction(async () => {
    let orders = await Order.getMany();
    let strategy = {customer : null, lines : null, deliveryAddress : null};
    console.log(await orders.toJSON(strategy));
});
```
<a name="_rawsqlquery"></a>
[Raw SQL Query](https://github.com/alfateam/rdb-demo/blob/master/rawSqlQuery.js)
```js
let rdb = require('rdb');

let db = rdb('postgres://postgres:postgres@localhost/test');

await db.transaction(async () => {
    let result = await rdb.query('SELECT DISTINCT oCustomerId AS "customerId" FROM _order');
    console.log(result);
});
```
<a name="_rawsqlquerywithparameters"></a>
[Raw SQL Query With Parameters](https://github.com/alfateam/rdb-demo/blob/master/rawSqlQueryWithParameters.js)
```js
let rdb = require('rdb');

let db = rdb('postgres://postgres:postgres@localhost/test');

await db.transaction(async () => {
    let result = await rdb.query({
        sql: 'SELECT oOrderNo AS "orderNo" FROM _order WHERE oOrderNo LIKE ?',
        parameters: ['%04']
    });
    console.log(result);
});
```
<a name="_streameager"></a>
[streaming rows](https://github.com/alfateam/rdb-demo/blob/master/streamEager.js)
```js
let rdb = require('rdb');

let Order = rdb.table('_order');
let OrderLine = rdb.table('_orderLine');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');

OrderLine.primaryColumn('lId').guid().as('id');
OrderLine.column('lOrderId').guid().as('orderId');
OrderLine.column('lProduct').string().as('product');

let line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

let db = rdb('postgres://postgres:postgres@localhost/test');

let emptyFilter;
let strategy = {
    lines: {
        orderBy: ['product']
    },
    orderBy: ['orderNo'],
    limit: 5,
};

await Order.createReadStream(db, emptyFilter, strategy).on('data', printOrder);

function printOrder(order) {
    let format = 'Order Id: %s, Order No: %s';
    console.log(format, order.id, order.orderNo);
    order.lines.forEach(printLine);
}

function printLine(line) {
    let format = 'Line Id: %s, Order Id: %s, Product: %s';
    console.log(format, line.id, line.orderId, line.product);
}
```
<a name="_streamjsoneager"></a>
[streaming json](https://github.com/alfateam/rdb-demo/blob/master/streamJSONEager.js)
```js
let rdb = require('rdb');

let Order = rdb.table('_order');
let OrderLine = rdb.table('_orderLine');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');

OrderLine.primaryColumn('lId').guid().as('id');
OrderLine.column('lOrderId').guid().as('orderId');
OrderLine.column('lProduct').string().as('product');

let line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

let db = rdb('postgres://postgres:postgres@localhost/test');

let emptyFilter;
let strategy = {
    lines: {
        orderBy: ['product']
    },
    orderBy: ['orderNo'],
    limit: 5,
};

await Order.createJSONReadStream(db, emptyFilter, strategy).pipe(process.stdout);
```
<a name="_update"></a>
[update](https://github.com/alfateam/rdb-demo/blob/master/update.js)
```js
let rdb = require('rdb');

let Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

let db = rdb('postgres://postgres:postgres@localhost/test');

await db.transaction(async () => {
    let customer = await Customer.getById('a0000000-0000-0000-0000-000000000000');
    customer.name = 'Ringo';
    customer = await Customer.getById('a0000000-0000-0000-0000-000000000000');
    console.log(customer.name)
});
```
<a name="_insert"></a>
[insert](https://github.com/alfateam/rdb-demo/blob/master/insert.js)
```js
let rdb = require('rdb');

let Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

let db = rdb('postgres://postgres:postgres@localhost/test');

await db.transaction(async () => {
    let id = 'abcdef00-0000-0000-0000-000000000000'
    let customer = Customer.insert(id)
    customer.name = 'Paul';
    customer = await Customer.getById(id);
    console.log(customer.name)
});
```
<a name="_delete"></a>
[delete](https://github.com/alfateam/rdb-demo/blob/master/delete.js)
```js
let rdb = require('rdb');

let Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');
Customer.column('cBalance').numeric().as('balance');
Customer.column('cRegdate').date().as('registeredDate');
Customer.column('cIsActive').boolean().as('isActive');
Customer.column('cPicture').binary().as('picture');

let db = rdb('postgres://postgres:postgres@localhost/test');

await db.transaction(async () => {
    let customer = await Customer.getById('87654321-0000-0000-0000-000000000000');
    await customer.delete();
});
```
<a name="_cascadedelete"></a>
[cascadeDelete](https://github.com/alfateam/rdb-demo/blob/master/cascadeDelete.js)
```js
let rdb = require('rdb');

let Customer = rdb.table('_customer');
let Order = rdb.table('_order');
let OrderLine = rdb.table('_orderLine');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');
Order.column('oCustomerId').guid().as('customerId');

OrderLine.primaryColumn('lId').guid().as('id');
OrderLine.column('lOrderId').guid().as('orderId');

let orderToCustomer = Order.join(Customer).by('oCustomerId').as('customer');
Customer.hasMany(orderToCustomer).as('orders');

let line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

let db = rdb('postgres://postgres:postgres@localhost/test');

await db.transaction(async () => {
    let customer = await Customer.getById('87654399-0000-0000-0000-000000000000');
    await customer.cascadeDelete();
});
```
<a name="_bulkdelete"></a>
[bulk delete](https://github.com/alfateam/rdb-demo/blob/master/bulkDelete.js)
```js
let rdb = require('rdb');

let Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');
Customer.column('cBalance').numeric().as('balance');
Customer.column('cRegdate').date().as('registeredDate');
Customer.column('cIsActive').boolean().as('isActive');
Customer.column('cPicture').binary().as('picture');

let db = rdb('postgres://postgres:postgres@localhost/test');

await db.transaction(async () => {
    let filter = Customer.id.eq('87654321-0000-0000-0000-000000000000');
    await Customer.delete(filter);
});
```
<a name="_cascadedelete"></a>
[bulk cascadeDelete](https://github.com/alfateam/rdb-demo/blob/master/bulkCascadeDelete.js)
```js
let rdb = require('rdb');

let Customer = rdb.table('_customer');
let Order = rdb.table('_order');
let OrderLine = rdb.table('_orderLine');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');
Order.column('oCustomerId').guid().as('customerId');

OrderLine.primaryColumn('lId').guid().as('id');
OrderLine.column('lOrderId').guid().as('orderId');

let orderToCustomer = Order.join(Customer).by('oCustomerId').as('customer');
Customer.hasMany(orderToCustomer).as('orders');

let line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

let db = rdb('postgres://postgres:postgres@localhost/test');

await db.transaction(async () => {
    let filter = Customer.id.eq('87654399-0000-0000-0000-000000000000');
    await Customer.cascadeDelete(filter);
});
```
<a name="_defaultvalues"></a>
[default values](https://github.com/alfateam/rdb-demo/blob/master/defaultValues.js)
```js
let rdb = require('rdb');

let buf = Buffer.alloc(10);
buf.write('\u00bd + \u00bc = \u00be', 0);

let Customer = rdb.table('_customer');

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

let db = rdb('postgres://postgres:postgres@localhost/test');

await db.transaction(async () => {
    let customer = Customer.insert('abcdef02-0000-0000-0000-000000000000')
    console.log(await customer.toDto());
});
```
<a name="_conventions"></a>
[conventions](https://github.com/alfateam/rdb-demo/blob/master/conventions.js)
```js
let rdb = require('rdb');

let Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid(); //property name will also be cId
Customer.column('cName').string(); //property name will also be cName

let db = rdb('postgres://postgres:postgres@localhost/test');

await db.transaction(async () => {
    let customer = Customer.insert('abcdef01-0000-0000-0000-000000000000')
    customer.cName = 'Paul';
    console.log(await customer.toDto());
});
```
<a name="_updatejoin"></a>
[update a join-relation](https://github.com/alfateam/rdb-demo/blob/master/updateJoin.js)
```js
let rdb = require('rdb');

let Customer = rdb.table('_customer');
let Order = rdb.table('_order');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');
Order.column('oCustomerId').guid().as('customerId');

Order.join(Customer).by('oCustomerId').as('customer');

let db = rdb('postgres://postgres:postgres@localhost/test');

await db.transaction(async () => {
    let order = await Order.getById('b0000000-b000-0000-0000-000000000000');
    let yokoId = '12345678-0000-0000-0000-000000000000';
    order.customerId = yokoId;
    let customer = await order.customer;
    console.log(customer.name);
});
```
<a name="_updatehasone"></a>
[update a hasOne-relation](https://github.com/alfateam/rdb-demo/blob/master/updateHasOne.js)
```js
let rdb = require('rdb');

let Order = rdb.table('_order');
let DeliveryAddress = rdb.table('_deliveryAddress');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');

DeliveryAddress.primaryColumn('dId').guid().as('id');
DeliveryAddress.column('dOrderId').string().as('orderId');
DeliveryAddress.column('dName').string().as('name');
DeliveryAddress.column('dStreet').string().as('street');

let deliveryAddress_order_relation = DeliveryAddress.hasone(Order).by('dOrderId').as('order');
Order.hasOne(deliveryAddress_order_relation).as('deliveryAddress');

let db = rdb('postgres://postgres:postgres@localhost/test');

await db.transaction(async () => {
    let address = DeliveryAddress.insert('eeeeeeee-0000-0000-0000-000000000000');
    address.orderId = 'a0000000-a000-0000-0000-000000000000';
    address.name = 'Sgt. Pepper';
    address.street = 'L18 Penny Lane';
    let order = await address.order;
    console.log((await order.deliveryAddress).street);
});
```
<a name="_updatehasmany"></a>
[update a hasMany-relation](https://github.com/alfateam/rdb-demo/blob/master/updateHasMany.js)
```js
let rdb = require('rdb');

let Order = rdb.table('_order');
let OrderLine = rdb.table('_orderLine');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');

OrderLine.primaryColumn('lId').guid().as('id');
OrderLine.column('lOrderId').guid().as('orderId');
OrderLine.column('lProduct').string().as('product');

let line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

let db = rdb('postgres://postgres:postgres@localhost/test');
let orderIdWithNoLines = 'c0000000-c000-0000-0000-000000000000';

await db.transaction(async () => {
    let orderIdWithNoLines = 'c0000000-c000-0000-0000-000000000000';

    let line = OrderLine.insert('eeeeeeee-0001-0000-0000-000000000000');
    line.orderId = orderIdWithNoLines;
    line.product = 'Roller blades';

    let line2 = OrderLine.insert('eeeeeeee-0002-0000-0000-000000000000');
    line2.orderId = orderIdWithNoLines;
    line2.product = 'Helmet';

    let order = await line.order;
    let lines = await order.lines;
    console.log('Number of lines: ' + lines.length);
});
```
<a name="_rowlock"></a>
[row lock](https://github.com/alfateam/rdb-demo/blob/master/exclusive.js)  
(not in sqlite)
```js
let rdb = require('rdb');

let Customer = rdb.table('_customer');
Customer.primaryColumn('cId').guid().as('id');
Customer.column('cBalance').numeric().as('balance');
Customer.exclusive();

let db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

await showBalance();
await updateConcurrently();
await showBalance();

function showBalance() {
    return db.transaction(async () => {
        let customer = await Customer.getById('a0000000-0000-0000-0000-000000000000');
        console.log('Balance: ' + customer.balance);
    });
}

function updateConcurrently() {
    let concurrent1 = db.transaction(async () => {
        let customer = await Customer.getById('a0000000-0000-0000-0000-000000000000');
        customer.balance += 100;
    });

    let concurrent2 = db.transaction(async () => {
        let customer = await Customer.getById('a0000000-0000-0000-0000-000000000000');
        customer.balance += 100;
    });

    return Promise.all([concurrent1, concurrent2]);
}
```
<a name="_transactionlock"></a>
[transaction lock](https://github.com/alfateam/rdb-demo/blob/master/lock.js)  
(postgres only)
```js
let rdb = require('rdb');

let Customer = rdb.table('_customer');
Customer.primaryColumn('cId').guid().as('id');
Customer.column('cBalance').numeric().as('balance');
Customer.exclusive();

let db = rdb('postgres://rdb:rdb@localhost/rdbdemo');

await showBalance();
await updateConcurrently();
await showBalance();

function showBalance() {
    return db.transaction(async () => {
        let customer = await Customer.getById('a0000000-0000-0000-0000-000000000000');
        console.log('Balance: ' + customer.balance);
    });
}

function updateConcurrently() {
    let concurrent1 = db.transaction(async () => {
        await db.lock("12345");
        let customer = await Customer.getById('a0000000-0000-0000-0000-000000000000');
        customer.balance += 100;
    });

    let concurrent2 = db.transaction(async () => {
        await db.lock("12345");
        let customer = await Customer.getById('a0000000-0000-0000-0000-000000000000');
        customer.balance += 100;
    });

    return Promise.all([concurrent1, concurrent2]);
}
```
<a name="_equal"></a>
[equal](https://github.com/alfateam/rdb-demo/blob/master/filtering/equal.js)
```js
let rdb = require('rdb');

let Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

let db = rdb('postgres://postgres:postgres@localhost/test');

await db.transaction(async () => {
    let filter = Customer.name.equal('John');
    //same as Customer.name.eq('John');
    let customers = await Customer.getMany(filter);
    console.log(await customers.toDto());
});
```
<a name="_notequal"></a>
[notEqual](https://github.com/alfateam/rdb-demo/blob/master/filtering/notEqual.js)
```js
let rdb = require('rdb');

let Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

let db = rdb('postgres://postgres:postgres@localhost/test');

await db.transaction(async () => {
    let filter = Customer.name.notEqual('John');
    //same as Customer.name.ne('John');
    let customers = await Customer.getMany(filter);
    console.log(await customers.toDto());
});
```
<a name="_not"></a>
[not](https://github.com/alfateam/rdb-demo/blob/master/filtering/not.js)
```js
let rdb = require('rdb');

let Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

let db = rdb('postgres://postgres:postgres@localhost/test');

await db.transaction(async () => {
    let filter = Customer.name.equal('John').not();
    let customers = await Customer.getMany(filter);
    console.log(await customers.toDto());
});
```
<a name="_lessthan"></a>
[lessThan](https://github.com/alfateam/rdb-demo/blob/master/filtering/lessThan.js)
```js
let rdb = require('rdb');

let Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cBalance').numeric().as('balance');
Customer.column('cName').string().as('name');

let db = rdb('postgres://postgres:postgres@localhost/test');

await db.transaction(async () => {
    let filter = Customer.balance.lessThan(5000);
    //same as Customer.balance.lt(5000);
    let customers = await Customer.getMany(filter);
    console.log(await customers.toDto());
});
```
<a name="_lessthanorequal"></a>
[lessThanOrEqual](https://github.com/alfateam/rdb-demo/blob/master/filtering/lessThanOrEqual.js)
```js
let rdb = require('rdb');

let Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cBalance').numeric().as('balance');
Customer.column('cName').string().as('name');

let db = rdb('postgres://postgres:postgres@localhost/test');

await db.transaction(async () => {
    let filter = Customer.balance.lessThanOrEqual(8123);
    //same as Customer.balance.le(8123);
    let customers = await Customer.getMany(filter);
    console.log(await customers.toDto());
});
```
<a name="_greaterthan"></a>
[greaterThan](https://github.com/alfateam/rdb-demo/blob/master/filtering/greaterThan.js)
```js
let rdb = require('rdb');

let Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cBalance').numeric().as('balance');
Customer.column('cName').string().as('name');

let db = rdb('postgres://postgres:postgres@localhost/test');

await db.transaction(async () => {
    let filter = Customer.balance.greaterThan(5000);
    //same as Customer.balance.gt(5000);
    let customers = await Customer.getMany(filter);
    console.log(await customers.toDto());
});
```
<a name="_greaterthanorequal"></a>
[greaterThanOrEqual](https://github.com/alfateam/rdb-demo/blob/master/filtering/greaterThanOrEqual.js)
```js
let rdb = require('rdb');

let Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cBalance').numeric().as('balance');
Customer.column('cName').string().as('name');

let db = rdb('postgres://postgres:postgres@localhost/test');

await db.transaction(async () => {
    let filter = Customer.balance.greaterThanOrEqual(8123);
    //same as Customer.balance.ge(8123);
    let customers = await Customer.getMany(filter);
    console.log(await customers.toDto());
});
```
<a name="_between"></a>
[between](https://github.com/alfateam/rdb-demo/blob/master/filtering/between.js)
```js
let rdb = require('rdb');

let Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cBalance').numeric().as('balance');
Customer.column('cName').string().as('name');

let db = rdb('postgres://postgres:postgres@localhost/test');

await db.transaction(async () => {
    let filter = Customer.balance.between(3000, 8123);
    let customers = await Customer.getMany(filter);
    console.log(await customers.toDto());
});
```
<a name="_in"></a>
[in](https://github.com/alfateam/rdb-demo/blob/master/filtering/in.js)
```js
let rdb = require('rdb');

let Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

let db = rdb('postgres://postgres:postgres@localhost/test');

await db.transaction(async () => {
    let filter = Customer.name.in(['John', 'Yoko']);
    let customers = await Customer.getMany(filter);
    console.log(await customers.toDto());
});
```
<a name="_startswith"></a>
[startsWith](https://github.com/alfateam/rdb-demo/blob/master/filtering/startsWith.js)
```js
let rdb = require('rdb');

let Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

let db = rdb('postgres://postgres:postgres@localhost/test');

await db.transaction(async () => {
    let filter = Customer.name.startsWith('Jo');
    let customers = await Customer.getMany(filter);
    console.log(await customers.toDto());
});
```
<a name="_endswith"></a>
[endsWith](https://github.com/alfateam/rdb-demo/blob/master/filtering/endsWith.js)
```js
let rdb = require('rdb');

let Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

let db = rdb('postgres://postgres:postgres@localhost/test');

await db.transaction(async () => {
    let filter = Customer.name.endsWith('nny');
    let customers = await Customer.getMany(filter);
    console.log(await customers.toDto());
});
```
<a name="_contains"></a>
[contains](https://github.com/alfateam/rdb-demo/blob/master/filtering/contains.js)
```js
let rdb = require('rdb');

let Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

let db = rdb('postgres://postgres:postgres@localhost/test');

await db.transaction(async () => {
    let filter = Customer.name.contains('ohn');
    let customers = await Customer.getMany(filter);
    console.log(await customers.toDto());
});
```
<a name="_iequal"></a>
[iEqual](https://github.com/alfateam/rdb-demo/blob/master/filtering/iEqual.js)  
(postgres only)
```js
let rdb = require('rdb');

let Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

let db = rdb('postgres://postgres:postgres@localhost/test');

await db.transaction(async () => {
    let filter = Customer.name.iEqual('jOhN');
    //same as Customer.name.iEq('jOhN');
    let customers = await Customer.getMany(filter);
    console.log(await customers.toDto());
});
```
<a name="_istartswith"></a>
[iStartsWith](https://github.com/alfateam/rdb-demo/blob/master/filtering/iStartsWith.js)  
(postgres only)
```js
let rdb = require('rdb');

let Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

let db = rdb('postgres://postgres:postgres@localhost/test');

await db.transaction(async () => {
    let filter = Customer.name.iStartsWith('jo');
    let customers = await Customer.getMany(filter);
    console.log(await customers.toDto());
});
```
<a name="_iendswith"></a>
[iEndsWith](https://github.com/alfateam/rdb-demo/blob/master/filtering/iEndsWith.js)  
(postgres only)
```js
let rdb = require('rdb');

let Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

let db = rdb('postgres://postgres:postgres@localhost/test');

await db.transaction(async () => {
    let filter = Customer.name.iEndsWith('nNy');
    let customers = await Customer.getMany(filter);
    console.log(await customers.toDto());
});
```
<a name="_icontains"></a>
[iContains](https://github.com/alfateam/rdb-demo/blob/master/filtering/iContains.js)  
(postgres only)
```js
let rdb = require('rdb');

let Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

let db = rdb('postgres://postgres:postgres@localhost/test');

await db.transaction(async () => {
    let filter = Customer.name.iContains('oHn');
    let customers = await Customer.getMany(filter);
    console.log(await customers.toDto());
});
```
<a name="_exists"></a>
[exists](https://github.com/alfateam/rdb-demo/blob/master/filtering/exists.js)
```js
let rdb = require('rdb');

let Order = rdb.table('_order');
let DeliveryAddress = rdb.table('_deliveryAddress');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');

DeliveryAddress.primaryColumn('dId').guid().as('id');
DeliveryAddress.column('dOrderId').string().as('orderId');
DeliveryAddress.column('dName').string().as('name');
DeliveryAddress.column('dStreet').string().as('street');

let deliveryAddress_order_relation = DeliveryAddress.join(Order).by('dOrderId').as('order');
Order.hasOne(deliveryAddress_order_relation).as('deliveryAddress');

let db = rdb('postgres://postgres:postgres@localhost/test');

await db.transaction(async () => {
    let filter = Order.deliveryAddress.exists();
    let orders = await Order.getMany(filter);
    console.log(await orders.toDto());
});
```
<a name="_or"></a>
[or](https://github.com/alfateam/rdb-demo/blob/master/filtering/or.js)
```js
let rdb = require('rdb');

let Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

let db = rdb('postgres://postgres:postgres@localhost/test');

await db.transaction(async () => {
    let john = Customer.name.equal('John');
    let yoko = Customer.name.equal('Yoko');
    let filter = john.or(yoko);
    let customers = await Customer.getMany(filter);
    console.log(await customers.toDto());
});
```
<a name="_and"></a>
[and](https://github.com/alfateam/rdb-demo/blob/master/filtering/and.js)
```js
let rdb = require('rdb');

let Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cIsActive').boolean().as('isActive');
Customer.column('cBalance').numeric().as('balance');
Customer.column('cName').string().as('name');

let db = rdb('postgres://postgres:postgres@localhost/test');

await db.transaction(async () => {
    let isActive = Customer.isActive.equal(true);
    let highBalance = Customer.balance.greaterThan(8000);
    let filter = isActive.and(highBalance);
    let customers = await Customer.getMany(filter);
    console.log(await customers.toDto());
});
```
<a name="_oralternative"></a>
[or alternative syntax](https://github.com/alfateam/rdb-demo/blob/master/filtering/orAlternative.js)
```js
let rdb = require('rdb');

let Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cName').string().as('name');

let db = rdb('postgres://postgres:postgres@localhost/test');

await db.transaction(async () => {
    let john = Customer.name.equal('John');
    let yoko = Customer.name.equal('Yoko');
    let filter = rdb.filter.or(john).or(yoko);
    //alternatively rdb.filter.and(john).or(yoko);
    let customers = await Customer.getMany(filter);
    console.log(await customers.toDto());
});
```
<a name="_andalternative"></a>
[and alternative syntax](https://github.com/alfateam/rdb-demo/blob/master/filtering/andAlternative.js)
```js
let rdb = require('rdb');

let Customer = rdb.table('_customer');

Customer.primaryColumn('cId').guid().as('id');
Customer.column('cIsActive').boolean().as('isActive');
Customer.column('cBalance').numeric().as('balance');
Customer.column('cName').string().as('name');

let db = rdb('postgres://postgres:postgres@localhost/test');

await db.transaction(async () => {
    let isActive = Customer.isActive.equal(true);
    let highBalance = Customer.balance.greaterThan(8000);
    let filter = rdb.filter.and(isActive).and(highBalance);
    //alternatively rdb.filter.or(isActive).and(highBalance);
    let customers = await Customer.getMany(filter);
    console.log(await customers.toDto());
});
```
<a name="_subfilter"></a>
[sub filter](https://github.com/alfateam/rdb-demo/blob/master/filtering/subFilter.js)
```js
let rdb = require('rdb');

let Order = rdb.table('_order');
let DeliveryAddress = rdb.table('_deliveryAddress');

Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');

DeliveryAddress.primaryColumn('dId').guid().as('id');
DeliveryAddress.column('dOrderId').string().as('orderId');
DeliveryAddress.column('dName').string().as('name');
DeliveryAddress.column('dStreet').string().as('street');

let deliveryAddress_order_relation = DeliveryAddress.join(Order).by('dOrderId').as('order');
Order.hasOne(deliveryAddress_order_relation).as('deliveryAddress');

let db = rdb('postgres://postgres:postgres@localhost/test');

await db.transaction(async () => {
    let filter = Order.deliveryAddress.street.startsWith('Node');
    let orders = await Order.getMany(filter);
    console.log(await orders.toDto());
});
```
<a name="_compositefilter"></a>
[composite filter](https://github.com/alfateam/rdb-demo/blob/master/filtering/compositeFilter.js)
```js
let rdb = require('rdb');

let Order = rdb.table('_order');
let Customer = rdb.table('_customer');
let OrderLine = rdb.table('_orderLine');

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

let line_order_relation = OrderLine.join(Order).by('lOrderId').as('order');
Order.hasMany(line_order_relation).as('lines');

let db = rdb('postgres://postgres:postgres@localhost/test');

await db.transaction(async () => {
    let isActive = Order.customer.isActive.eq(true);
    let didOrderCar = Order.lines.product.contains('car');
    let filter = isActive.and(didOrderCar);
    //alternatively rdb.filter.and(isActive).and(didOrderCar);
    let orders = await Order.getMany(filter);
    console.log(inspect(await orders.toDto(), false, 10));
});
```
<a name="_rawsqlfilter"></a>
[raw sql filter](https://github.com/alfateam/rdb-demo/blob/master/filtering/rawSqlFilter.js)
```js
let inspect = require('util').inspect;
let rdb = require('rdb');

let Order = rdb.table('_order');
Order.primaryColumn('oId').guid().as('id');
Order.column('oOrderNo').string().as('orderNo');
Order.column('oCustomerId').guid().as('customerId');

let Customer = rdb.table('_customer');
Customer.primaryColumn('cid').guid().as('id');
Customer.column('cName').string().as('name');
Customer.column('cBalance').string().as('balance');
Customer.column('cIsActive').boolean().as('isActive');

let orderCustomerJoin = Order.join(Customer).by('oCustomerId').as('customer');
Customer.hasMany(orderCustomerJoin).as('orders');

let db = rdb('postgres://postgres:postgres@localhost/test');

await db.transaction(async () => {
    let filter = {
        sql: 'exists (select 1 from _customer where _customer.cId = oCustomerId and _customer.cBalance > 3000 and _customer.cName LIKE ?)',
        parameters: ['%o%']
    };
    let orders = await Order.getMany(filter);
    let strategy = { customer: null }
    console.log(await orders.toDto(strategy));
});
```