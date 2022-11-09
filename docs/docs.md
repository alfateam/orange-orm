# Rdb
Description: typescript, browser, concise, db support
logo  
bullet points/Features ?  Databases: .., Browser enabled, full typescript support, rich filtering, raw sql enabled
Someicons ?
Link to classic style documentation

## Getting started 

<details><summary>Schema file</summary><blockquote style="background: transparent">
<details><summary>Nested</summary><blockquote style="background: transparent">

In order to make changes  
__Hello__
```javascript
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

</details>

</blockquote>
</details>  
<details><summary>Fetching rows</summary>

```javascript
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
</details>  
<details><summary>Fetching related tables</summary>

```javascript
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
</details>  
<details><summary>Updating rows</summary>

```javascript
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
</details>  
<details><summary>Inserting rows</summary>

```javascript
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
</details>  
<details><summary>Auto-generated keys</summary>

```javascript
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
</details>  
<details><summary>Deleting rows</summary>

```javascript
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
</details>  
<details><summary>Filtering</summary>

```javascript
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
</details>  
<details><summary>Limit and order by</summary>

```javascript
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
</details>  
<details><summary>Batch deletes</summary>

```javascript
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

</details>

## In the browser    
<details><summary>Hosting in express</summary>

```javascript
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

</details>  
<details><summary>Custom filters</summary>

```javascript
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

</details>  

<details><summary>Base filters</summary>

```javascript
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

</details>  
<details><summary>Access rights</summary>

```javascript
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

</details>  
<details><summary>Concurrency</summary>

```javascript
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

</details>  
<details><summary>Unload / Restore to local storage</summary>

```javascript
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

</details>  
<details><summary>Exposing a subset of columns</summary>

```javascript
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

</details>  
<details><summary>Authentication and interception</summary>

```javascript
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

</details>

<details><summary>Dynamic connection string</summary>

```javascript
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

</details>
 
    
## On the server
    
<details><summary>Pooling</summary>

```javascript
```

</details>
<details><summary>Transactions</summary>

```javascript
```

</details>
    
<details><summary>Locks</summary>

```javascript
```

</details>
    
<details><summary>Unload / restore to file</summary>

```javascript
```

</details>
    
<details><summary>Dynamic connection string</summary>

```javascript
```

</details>
