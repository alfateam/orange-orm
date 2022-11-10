# Rdb
Description: typescript, browser, concise, db support
logo  
bullet points/Features ?  Databases: .., Browser enabled, full typescript support, rich filtering, raw sql enabled
Someicons ?
Link to classic style documentation

<details open><summary><h3>Getting started<h3></summary>
    
<details><summary><strong>Mapping tables</strong></summary><blockquote style="background: transparent">
<details><summary><strong>Nested</strong></summary><blockquote style="background: transparent">

In order to make changes  
__Hello__
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

</details>

</blockquote>
</details>  
    <details><summary><strong>Fetching rows</strong></summary><br>

__Fetching a single row__  
It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.    
    
```javascript
 await db.transaction(async () => {
let isActive = Order.customer.isActive.eq(true);
let didOrderCar = Order.lines.product.contains('car');
let filter = isActive.and(didOrderCar);
//alternatively rdb.filter.and(isActive).and(didOrderCar);
let orders = await Order.getMany(filter);
console.log(inspect(await orders.toDto(), false, 10));
});
```
     
__Fetching many rows__  
It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.    
    
```javascript
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
    
<details><summary><strong>Fetching related tables</strong></summary>

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
<details><summary><strong>Updating rows</strong></summary>

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
<details><summary><strong>Inserting rows</strong></summary>

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
<details><summary><strong>Auto-generated keys</strong></summary>

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
<details><summary><strong>Deleting rows</strong></summary>

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
<details><summary><strong>Filtering</strong></summary>

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
<details><summary><strong>Limit and order by</strong></summary>

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
<details><summary><strong>Batch deletes</strong></summary>

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
    
</details>

<details open><summary><h3>In the browser<h3></summary>
    
<details><summary><strong>Hosting in express</strong></summary>

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
<details><summary><strong>Custom filters</strong></summary>

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

<details><summary><strong>Base filters</strong></summary>

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
<details><summary><strong>Access rights</strong></summary>

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
<details><summary><strong>Concurrency</strong></summary>

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
<details><summary><strong>Unload / Restore to local storage</strong></summary>

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
<details><summary><strong>Exposing a subset of columns</strong></summary>

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
<details><summary><strong>Authentication and interception</strong></summary>

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

<details><summary><strong>Dynamic connection string</strong></summary>

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
    
<details><summary><strong>Vue reactivity</strong></summary>

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

</details> 
    
<details open><summary><h3>On the server<h3></summary>
    
<details><summary><strong>Pooling</strong></summary>

```javascript
```

</details>
<details><summary><strong>Transactions</strong></summary>

```javascript
```

</details>
    
<details><summary><strong>Locks</strong></summary>

```javascript
```

</details>
    
<details><summary><strong>Unload / restore to file</strong></summary>

```javascript
```

</details>
    
<details><summary><strong>Dynamic connection string</strong></summary>

```javascript
```

</details>

</details>
