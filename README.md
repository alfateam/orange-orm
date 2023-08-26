![RDB](./docs/logo-sm.jpg)  
RDB is the ultimate Object Relational Mapper for Node.js, offering seamless integration with popular databases like Postgres, MS SQL, MySQL, Sybase SAP, and SQLite. Whether you're building applications in TypeScript or JavaScript  (including both CommonJS and ECMAScript), RDB has got you covered.  

[![npm version](https://img.shields.io/npm/v/rdb.svg?style=flat-square)](https://www.npmjs.org/package/rdb)
[![Build status](https://github.com/alfateam/rdb/workflows/Node.js%20CI/badge.svg)](https://github.com/alfateam/rdb/actions)
[![Coverage Badge](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/lroal/1a69422f03da7f8155cf94fe66022452/raw/rdb__heads_master.json)](https://github.com/alfateam/rdb/actions)


## Key Features

- **Rich Querying Model**: RDB provides a powerful and intuitive querying model, making it easy to retrieve, filter, and manipulate data from your databases.
- **Concise API**: With a concise and developer-friendly API, RDB enables you to interact with your database using simple and expressive syntax.
- **No Code Generation Required**: Enjoy full IntelliSense, even in table mappings, without the need for cumbersome code generation.
- **TypeScript and JavaScript Support**: RDB fully supports both TypeScript and JavaScript, allowing you to leverage the benefits of static typing and modern ECMAScript features.
- **Works in the Browser**: RDB even works in the browser through hosting in Express, giving you the flexibility to build web applications with ease.  

This is the _Modern Typescript Documentation_. Are you looking for the [_Classic Documentation_](https://github.com/alfateam/rdb/blob/master/docs/docs.md) ?

## Installation
```bash
$ npm install rdb
```  
<details><summary><strong>Installing drivers</strong></summary>

To ensure RDB works properly with your database, you'll also need to install the appropriate driver:
- **SQLite**: `$ npm install sqlite3`
- **MySQL**: `$ npm install mysql2`
- **MS SQL**: `$ npm install tedious`
- **PostgreSQL (pg)**: `$ npm install pg`
- **SAP**: `$npm install msnodesqlv8`

</details>  

## Example
Here we choose SQLite.  
```bash
$ npm install sqlite3
```
<sub>📄 db.js</sub>
```javascript
import rdb from 'rdb';

const map = rdb.map(x => ({
  customer: x.table('customer').map(({ column }) => ({
    id: column('id').numeric().primary().notNullExceptInsert(),
    name: column('name').string(),
    balance: column('balance').numeric(),
    isActive: column('isActive').boolean(),
  })),

  order: x.table('_order').map(({ column }) => ({
    id: column('id').numeric().primary().notNullExceptInsert(),
    orderDate: column('orderDate').date().notNull(),
    customerId: column('customerId').numeric().notNullExceptInsert(),
  })),

  orderLine: x.table('orderLine').map(({ column }) => ({
  id: column('id').numeric().primary().notNullExceptInsert(),
    orderId: column('orderId').numeric(),
    product: column('product').string(),
  })),

  deliveryAddress: x.table('deliveryAddress').map(({ column }) => ({
    id: column('id').numeric().primary().notNullExceptInsert(),
    orderId: column('orderId').numeric(),
    name: column('name').string(),
    street: column('street').string(),
    postalCode: column('postalCode').string(),
    postalPlace: column('postalPlace').string(),
    countryCode: column('countryCode').string(),
  }))

})).map(x => ({
  order: x.order.map(v => ({
    customer: v.references(x.customer).by('customerId'),
    lines: v.hasMany(x.orderLine).by('orderId')
    deliveryAddress: hasOne(x.deliveryAddress).by('orderId'),
  }))
}));

export default map.sqlite('demo.db');
```  
<sub>📄 update.js</sub>

```javascript
import db from './db';

updateRow();

async function updateRow() {
  const filter = db.order.lines.any(line => line.product.startsWith('Magic wand'))
                 .and(db.order.customer.name.eq('Harry'));

  const order = await db.order.getOne(filter, {
    lines: true
  });
  order.lines.push({
    product: 'broomstick'
  });

  await order.saveChanges();
}

```

## API 

<details><summary><strong>Mapping tables</strong></summary>
To define a mapping, you employ the <strong><i>map()</i></strong> method, linking your tables and columns to corresponding object properties. You provide a callback function that engages with a parameter representing a database table.

Each column within your database table is designated by using the <strong><i>column()</i></strong> method, in which you specify its name. This action generates a reference to a column object that enables you to articulate further column properties like its data type or if it serves as a primary key.

Relationships between tables can also be outlined. By using methods like <strong><i>hasOne</i></strong>, <strong><i>hasMany</i></strong>, and <strong><i>references</i></strong>, you can establish connections that reflect the relationships in your data schema. In the example below, an 'order' is linked to a 'customer' reference, a 'deliveryAddress', and multiple 'lines'. The hasMany and hasOne relations represents ownership - the tables 'deliveryAddress' and 'orderLine' are owned by the 'order' table, and therefore, they contain the 'orderId' column referring to their parent table, which is 'order'. Conversely, the customer table is independent and can exist without any knowledge of the 'order' table. Therefore we say that the order table <i>references</i> the customer table - necessitating the existence of a 'customerId' column in the 'order' table.  

<sub>📄 db.js</sub>
```javascript
import rdb from 'rdb';

const map = rdb.map(x => ({
  customer: x.table('customer').map(({ column }) => ({
    id: column('id').numeric().primary().notNullExceptInsert(),
    name: column('name').string(),
    balance: column('balance').numeric(),
    isActive: column('isActive').boolean(),
  })),

  order: x.table('_order').map(({ column }) => ({
    id: column('id').numeric().primary().notNullExceptInsert(),
    orderDate: column('orderDate').date().notNull(),
    customerId: column('customerId').numeric().notNullExceptInsert(),
  })),

  orderLine: x.table('orderLine').map(({ column }) => ({
    id: column('id').numeric().primary().notNullExceptInsert(),
    orderId: column('orderId').numeric(),
    product: column('product').string(),
  })),

  deliveryAddress: x.table('deliveryAddress').map(({ column }) => ({
    id: column('id').numeric().primary().notNullExceptInsert(),
    orderId: column('orderId').numeric(),
    name: column('name').string(),
    street: column('street').string(),
    postalCode: column('postalCode').string(),
    postalPlace: column('postalPlace').string(),
    countryCode: column('countryCode').string(),
  }))

})).map(x => ({
  order: x.order.map(({ hasOne, hasMany, references }) => ({
    customer: references(x.customer).by('customerId'),
    deliveryAddress: hasOne(x.deliveryAddress).by('orderId'),
    lines: hasMany(x.orderLine).by('orderId')
  }))
}));

export default map.sqlite('demo.db');
```
The init.js script resets our SQLite database. It's worth noting that SQLite databases are represented as single files, which makes them wonderfully straightforward to manage.

At the start of the script, we import our database mapping from the db.js file. This gives us access to the db object, which we'll use to interact with our SQLite database.

Then, we define a SQL string. This string outlines the structure of our SQLite database. It first specifies to drop existing tables named 'deliveryAddress', 'orderLine', '_order', and 'customer' if they exist. This ensures we have a clean slate. Then, it dictates how to create these tables anew with the necessary columns and constraints.

Because of a peculiarity in SQLite, which only allows one statement execution at a time, we split this SQL string into separate statements. We do this using the split() method, which breaks up the string at every semicolon.  

<sub>📄 init.js</sub>
```javascript
import db from './db';

const sql = `DROP TABLE IF EXISTS deliveryAddress; DROP TABLE IF EXISTS orderLine; DROP TABLE IF EXISTS _order; DROP TABLE IF EXISTS customer;
CREATE TABLE customer (
    id INTEGER PRIMARY KEY,
    name TEXT,
    balance NUMERIC,
    isActive INTEGER
);

CREATE TABLE _order (
    id INTEGER PRIMARY KEY,
    orderDate TEXT,
    customerId INTEGER REFERENCES customer
);

CREATE TABLE orderLine (
    id INTEGER PRIMARY KEY,
    orderId INTEGER REFERENCES _order,
    product TEXT
);

CREATE TABLE deliveryAddress (
    id INTEGER PRIMARY KEY,
    orderId INTEGER REFERENCES _order,
    name TEXT, 
    street TEXT,
    postalCode TEXT,
    postalPlace TEXT,
    countryCode TEXT
)
`;


async function init() {
  const statements = sql.split(';');
  for (let i = 0; i < statements.length; i++) {
    await db.query(statements[i]);
  }
}
export default init;
```
In SQLite, columns with the INTEGER PRIMARY KEY attribute are designed to autoincrement by default. This means that each time a new record is inserted into the table, SQLite automatically produces a numeric key for the id column that is one greater than the largest existing key. This mechanism is particularly handy when you want to create unique identifiers for your table rows without manually entering each id.
</details>

<details><summary><strong>Inserting rows</strong></summary>

In the code below, we initially import the table-mapping feature "db.js" and the setup script "init.js", both of which were defined in the preceding step. The setup script executes a raw query that creates the necessary tables. Subsequently, we insert two customers, named "George" and "Harry", into the customer table, and this is achieved through calling "db.customer.insert".

Next, we insert and array array of two orders in the order table. Each order contains an orderDate, customer information, deliveryAddress, and lines for the order items. We use the customer constants "george" and "harry" from previous inserts. Observe that we don't pass in any primary keys. This is because all tables here have autoincremental keys. The second argument to "db.order.insert" specifies a fetching strategy. This fetching strategy plays a critical role in determining the depth of the data retrieved from the database after insertion. The fetching strategy specifies which associated data should be retrieved and included in the resulting orders object. In this case, the fetching strategy instructs the database to retrieve the customer, deliveryAddress, and lines for each order.

Without a fetching strategy, "db.order.insert" would only return the root level of each order. In that case you would only get the id, orderDate, and customerId for each order.  

```javascript
import db from './db';
import init from './init';

insertRows();

async function insertRows() {
  await init();

  const george = await db.customer.insert({
    name: 'George',
    balance: 177,
    isActive: true
  });

  const harry = await db.customer.insert({
    name: 'Harry',
    balance: 200,
    isActive: true
  });

  const orders = await db.order.insert([
    {
      orderDate: new Date(2022, 0, 11, 9, 24, 47),
      customer: george,
      deliveryAddress: {
        name: 'George',
        street: 'Node street 1',
        postalCode: '7059',
        postalPlace: 'Jakobsli',
        countryCode: 'NO'
      },
      lines: [
        { product: 'Bicycle' },
        { product: 'Small guitar' }
      ]
    },
    {
      customer: harry,
      orderDate: new Date(2021, 0, 11, 12, 22, 45),
      deliveryAddress: {
        name: 'Harry Potter',
        street: '4 Privet Drive, Little Whinging',
        postalCode: 'GU4',
        postalPlace: 'Surrey',
        countryCode: 'UK'
      },
      lines: [
        { product: 'Magic wand' }
      ]
    }
  ], {customer: true, deliveryAddress: true, lines: true}); //fetching strategy
  console.dir(orders, {depth: Infinity});
}
```

</details>

<details><summary><strong>Fetching rows</strong></summary>

 RDB has a rich querying model. As you navigate through, you'll learn about the various methods available to retrieve data from your tables, whether you want to fetch all rows, many rows with specific criteria, or a single row based on a primary key. If you want do dig even deeper into filtering possibilities, there is a whole section about it further down the page.

The fetching strategy in RDB is optional, and its use is influenced by your specific needs. You can define the fetching strategy either on the table level or the column level. This granularity gives you the freedom to decide how much related data you want to pull along with your primary request.

__All rows__

```javascript
import db from './db';

getRows();

async function getRows() {
  const orders = await db.order.getAll({
    customer: true, 
    deliveryAddress: true, 
    lines: true
  });
  console.dir(orders, {depth: Infinity});
}
```
__Limit, offset and order by__  
This script demonstrates how to fetch orders with customer, lines and deliveryAddress, limiting the results to 10, skipping the first row, and sorting the data based on the orderDate in descending order followed by id. The lines are sorted by product.  

```javascript
import db from './db';

getRows();

async function getRows() {
  const orders = await db.order.getAll({
    offset: 1,
    orderBy: ['orderDate desc', 'id'],
    limit: 10,
    customer: true, 
    deliveryAddress: true, 
    lines: {
      orderBy: 'product'
    },
  });
  console.dir(orders, {depth: Infinity});
}
```

__Many rows filtered__

```javascript
import db from './db';

getRows();

async function getRows() {
  const filter = db.order.lines.any(line => line.product.contains('i'))
                 .and(db.order.customer.balance.greaterThan(180));
  const orders = await db.order.getMany(filter, {
    customer: true, 
    deliveryAddress: true, 
    lines: true
  });
  console.dir(orders, {depth: Infinity});
}
```

__Single row filtered__

```javascript
import db from './db';

getRows();

async function getRows() {
  const filter = db.order.customer(customer => customer.isActive.eq(true)
                 .and(customer.startsWith('Harr')));
                 //equivalent, but creates slighly different sql:
                 // const filter = db.order.customer.isActive.eq(true).and(db.order.customer.startsWith('Harr'));
  const order = await db.order.getOne(filter, {
    customer: true, 
    deliveryAddress: true, 
    lines: true
  });
  console.dir(order, {depth: Infinity});
}
```

__Single row by primary key__

```javascript
import db from './db';

getRows();

async function getRows() {
  const order = await db.order.getById(1, {
    customer: true, 
    deliveryAddress: true, 
    lines: true
  });
  console.dir(order, {depth: Infinity});
}
```

__Many rows by primary key__

```javascript
import db from './db';

getRows();

async function getRows() {
  const orders = await db.order.getMany([
      {id: 1},
      {id: 2}
    ], 
    {
      customer: true, 
      deliveryAddress: true, 
      lines: true
  });
  console.dir(orders, {depth: Infinity});
}
```
</details>  

<details><summary><strong>Updating rows</strong></summary>
  
To update rows, modify the property values and invoke the method <strong><i>saveChanges()</i></strong>. The function updates only the modified columns, not the entire row. Rows in child relations can also be updated as long as the parent order <i>owns</i> the child tables. In our illustration, the <strong>order</strong> table owns both the <strong>deliveryAddress</strong> and the <strong>lines</strong> tables because they're part of a <i>hasOne/hasMany relationship</i>. Contrastingly, the <strong>customer</strong> is part of a <i>reference relationship</i> and thus can't be updated here. But you can detach the reference to the customer by assigning it to null or undefined. (Setting order.customerId to null or undefined achieves the same result.)

__Updating a single row__

```javascript
import db from './db';

update();

async function update() {
  const order = await db.order.getById(1, {
    customer: true, 
    deliveryAddress: true, 
    lines: true
  });

  order.orderDate = new Date();
  order.deliveryAddress = null;
  order.lines.push({product: 'Cloak of invisibility'});

  await order.saveChanges();
  console.dir(order, {depth: Infinity});
}
```
__Updating many rows__

```javascript
import db from './db';

update();

async function update() {
  let orders = await db.order.getAll({
    orderBy: 'id',
    lines: true, 
    deliveryAddress: true, 
    customer: true
  });

  orders[0].orderDate = new Date();
  orders[0].deliveryAddress.street = 'Node street 2';
  orders[0].lines[1].product = 'Big guitar';

  orders[1].orderDate = '2023-07-14T12:00:00'; //iso-string is allowed
  orders[1].deliveryAddress = null;
  orders[1].customer = null;
  orders[1].lines.push({product: 'Cloak of invisibility'});

  await orders.saveChanges();
  console.dir(orders, {depth: Infinity});
}
```

__Updating with concurrency__  
Rows get updated using an <i>optimistic</i> concurrency approach by default. This means if a property being edited was meanwhile altered, an exception is raised, indicating the row was modified by a different user. You can change the concurrency strategy either at the table or column level.

Currently, there are three concurrency strategies:
- <strong>optimistic:</strong> Raises an exception if another user changes the property during an update.
- <strong>overwrite:</strong> Overwrites the property, regardless of changes by others.
- <strong>skipOnConflict:</strong> Silently avoids updating the property if another user has modified it in the interim.

In the example below, we've set the concurrency strategy for orderDate to 'overwrite'. This implies that if other users modify orderDate while you're making changes, their updates will be overwritten.

```javascript
import db from './db';

update();

async function update() {
  const order = await db.order.getById(1, {
    customer: true, 
    deliveryAddress: true, 
    lines: true
  });

  order.orderDate = new Date();
  order.deliveryAddress = null;
  order.lines.push({product: 'Cloak of invisibility'});

  await order.saveChanges( {
    orderDate: {
      concurrency: 'overwrite'
  }});
  console.dir(order, {depth: Infinity});
}
```
</details>  

<details><summary><strong>Deleting rows</strong></summary>
Rows in owner tables cascade deletes to their child tables. In essence, if a table has ownership over other tables through <strong><i>hasOne</i></strong> and <strong><i>hasMany</i></strong> relationships, removing a record from the parent table also removes its corresponding records in its child tables. This approach safeguards against leaving orphaned records and upholds data integrity. On the contrary, tables that are merely referenced, through <strong><i>reference relationship </i></strong> relationships, remain unaffected upon deletions. For a deeper dive into these relationships and behaviors, refer to the section on table mapping.

__Deleting a single row__
```javascript
import db from './db';

deleteRow();

async function deleteRow() {    
  const order = await db.order.getById(1);

  await order.delete();
  //will also delete deliveryAddress and lines
  //but not customer
}
```

__Deleting many rows__

```javascript
import db from './db';

deleteRows();

async function deleteRows() {
  const filter = db.order.customer.name.eq('George');
  let orders = await db.order.getMany(filter);

  await orders.delete();
}
```
__Deleting with concurrency__

Concurrent operations can lead to conflicts. When you still want to proceed with the deletion regardless of potential interim changes, the 'overwrite' concurrency strategy can be used. This example demonstrates deleting rows even if the "delivery address" has been modified in the meantime. You can read more about concurrency strategies in the 'Updating rows' section.   
```javascript
import db from './db';

deleteRows();

async function deleteRows() {
  const filter = db.order.deliveryAddress.name.eq('George');
  let orders = await db.order.getMany(filter, {
    customer: true, 
    deliveryAddress: true, 
    lines: true
  });

  await orders.delete({
    deliveryAddress: {
      concurrency: 'overwrite'
    }
  });
}
```
__Batch delete__

When removing a large number of records based on a certain condition, batch deletion can be efficient.   

However, it's worth noting that batch deletes don't follow the cascade delete behavior by default. To achieve cascading in batch deletes, you must explicitly call the deleteCascade method.  

```javascript
import db from './db';

deleteRows();

async function deleteRows() {
  const filter = db.order.deliveryAddress.name.eq('George');
  await db.order.delete(filter);
}
```
__Batch delete cascade__

When deleting records, sometimes associated data in related tables also needs to be removed. This cascade delete helps maintain database integrity.  

```javascript
import db from './db';

deleteRows();

async function deleteRows() {
  const filter = db.order.deliveryAddress.name.eq('George');
  await db.order.deleteCascade(filter);
}
```
__Batch delete by primary key__

For efficiency, you can also delete records directly if you know their primary keys.  

```javascript
import db from './db';

deleteRows();

async function deleteRows() {
  db.customer.delete([{id: 1}, {id: 2}]);
}
```
</details>
<details><summary><strong>In the browser</strong></summary>
You can use <strong><i>RDB</i></strong> directly in the browser using the adapter for the Express.js framework. Instead of sending raw SQL queries from the client to the server, this approach records the method calls in the client. These method calls are then replayed at the server, ensuring a higher level of security by not exposing raw SQL on the client side.  
Raw sql queries and raw sql filters are disabled at the http client due to security reasons.  If you would like RDB to support other web frameworks, like nestJs, fastify, etc, please let me know.

<sub>📄 server.js</sub>
```javascript
import db from './db';
import { json } from 'body-parser';
import express from 'express';

express().disable('x-powered-by')
  .use(json({ limit: '100mb' }))
  .use('/rdb', db.express())
  .listen(3000, () => console.log('Example app listening on port 3000!'));
```

<sub>📄 browser.js</sub>
```javascript
import map from './db';

updateRows();

async function updateRows() {
  const db = map.http('http://localhost:3000/rdb');
  const filter = db.order.lines.any(
    line => line.product.startsWith('Magic wand'))
    .and(db.order.customer.name.startsWith('Harry')
  );

  const order = await db.order.getOne(filter, {
    lines: true
  });
  
  order.lines.push({
    product: 'broomstick'
  });

  await order.saveChanges();
}

```

__Interceptors and base filter__

In the next setup, axios interceptors are employed on the client side to add an Authorization header of requests. Meanwhile, on the server side, an Express.js middleware (validateToken) is utilized to ensure the presence of the Authorization header, while a base filter is applied on the order table to filter incoming requests based on the customerId extracted from this header. This combined approach enhances security by ensuring that users can only access data relevant to their authorization level and that every request is accompanied by a token. In real-world applications, it's advisable to use a more comprehensive token system and expand error handling to manage a wider range of potential issues.  
One notable side effect compared to the previous example, is that only the order table is exposed for interaction, while all other potential tables in the database remain shielded from direct client access (except for related tables).  

<sub>📄 server.js</sub>

```javascript
import db from './db';
import { json } from 'body-parser';
import express from 'express';

express().disable('x-powered-by')
  .use(json({ limit: '100mb' }))
  .use('/rdb', validateToken)
  .use('/rdb', db.express({
    order: {
      baseFilter: (db, req, _res) => {
        const customerId = Number.parseInt(req.headers.authorization.split(' ')[1]); //Bearer 2
        return db.order.customerId.eq(Number.parseInt(customerId));
      }
    }
  }))
  .listen(3000, () => console.log('Example app listening on port 3000!'));

function validateToken(req, res, next) {
  // For demo purposes, we're just checking against existence of authorization header
  // In a real-world scenario, this would be a dangerous approach because it bypasses signature validation
  const authHeader = req.headers.authorization;
  if (authHeader)
    return next();
  else
    return res.status(401).json({ error: 'Authorization header missing' });
}
```

<sub>📄 browser.js</sub>
```javascript
import map from './db';

updateRows();

async function updateRows() {
  const db = map.http('http://localhost:3000/rdb');
  
  db.interceptors.request.use((config) => {
    // For demo purposes, we're just adding hardcoded token
    // In a real-world scenario, use a proper JSON web token
    config.headers.Authorization = 'Bearer 2' //customerId
    return config;
  });

  db.interceptors.response.use(
    response => response, 
    (error) => {
      if (error.response && error.response.status === 401) {
        console.dir('Unauthorized, dispatch a login action');
        //redirectToLogin();
      }
      return Promise.reject(error);
    }
  );

  const filter = db.order.lines.any(
    line => line.product.startsWith('Magic wand'))
    .and(db.order.customer.name.startsWith('Harry')
  );

  const order = await db.order.getOne(filter, {
    lines: true
  });
  
  order.lines.push({
    product: 'broomstick'
  });

  await order.saveChanges();

}

```
</details>
<details><summary><strong>Transactions</strong></summary>
We initiate a database transaction using db.transaction.
Within the transaction, a customer is retrieved and its balance updated using the tx object to ensure operations are transactional.
An error is deliberately thrown to demonstrate a rollback, ensuring all previous changes within the transaction are reverted.
Always use the provided tx object for operations within the transaction to maintain data integrity.

```javascript
import db from './db';

execute();

async function execute() {
  await db.transaction(async tx => {
    const customer = await tx.customer.getById(1);
      customer.balance = 100;
      await customer.saveChanges();
      throw new Error('This will rollback');
  });
}

```
</details>
  
<details><summary><strong>What it is not</strong></summary>

- **It is not about migrations** <p>The allure of ORMs handling SQL migrations is undeniably attractive and sweet. However, this sweetness can become painful. Auto-generated migration scripts might not capture all nuances. Using dedicated migration tools separate from the ORM or manually managing migrations might be the less painful route in the long run.  RDB aim for database agnosticism. And when you're dealing with migrations, you might want to use features specific to a database platform. However, I might consider adding support for (non-auto-generated) migrations at a later point. But for now, it is not on the roadmap.</p>
- **It is not about NoSql databases** <p>Applying ORMs to NoSQL, which inherently diverges from the relational model, can lead to data representation mismatches and a loss of specialized NoSQL features. Moreover, the added ORM layer can introduce performance inefficiencies, complicate debugging, and increase maintenance concerns. Given the unique capabilities of each NoSQL system, crafting custom data access solutions tailored to specific needs often provides better results than a generalized ORM approach.</p>
- **It is not about GrapQL** <p>RDB, already supports remote data operations via HTTP, eliminating the primary need for integrating GraphQL. RDB's built-in safety mechanisms and tailored optimization layers ensure secure and efficient data operations, which might be compromised by adding GraphQL. Furthermore, RDB's inherent expressivity and powerful querying capabilities could be overshadowed by the introduction of GraphQL. Integrating GraphQL could introduce unnecessary complexity, potential performance overhead, and maintenance challenges, especially as both systems continue to evolve. Therefore, considering RDB's robust features and design, supporting GraphQL might not offer sufficient advantages to warrant the associated complications. </p>
</details>

### [Changelog](https://github.com/alfateam/rdb/blob/master/docs/changelog.md)
### [Code of Conduct](https://github.com/alfateam/rdb/blob/master/docs/CODE_OF_CONDUCT.md)
<!-- 
How to setup code coverage
https://github.com/nystudio107/rollup-plugin-critical/blob/master/package.json
https://dev.to/thejaredwilcurt/coverage-badge-with-github-actions-finally-59fa -->
