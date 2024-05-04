![RDB](./docs/logo-sm.jpg)  
RDB is the ultimate Object Relational Mapper for Node.js and Typescript, offering seamless integration with a variety of popular databases. Whether you're building applications in TypeScript or JavaScript  (including both CommonJS and ECMAScript), RDB has got you covered.  

[![npm version](https://img.shields.io/npm/v/rdb.svg?style=flat-square)](https://www.npmjs.org/package/rdb)
[![Build status](https://github.com/alfateam/rdb/workflows/Node.js%20CI/badge.svg)](https://github.com/alfateam/rdb/actions)
[![Coverage Badge](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/lroal/1a69422f03da7f8155cf94fe66022452/raw/rdb__heads_master.json)](https://github.com/alfateam/rdb/actions)
[![Github](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/lroal/1ccb2b79abbe0258d636e9b5e4630a1a/raw/rdb__heads_master.json)](https://github.com/alfateam/rdb)
![GitHub Discussions](https://img.shields.io/github/discussions/alfateam/rdb)
[![Discord](https://badgen.net/discord/online-members/QjuEgvQXzd?icon=discord&label=Discord)](https://discord.gg/QjuEgvQXzd)
[![YouTube Video Views](https://img.shields.io/youtube/views/1IwwjPr2lMs)](https://youtu.be/1IwwjPr2lMs)



## Key Features 

- **Rich Querying Model**: RDB provides a powerful and intuitive querying model, making it easy to retrieve, filter, and manipulate data from your databases.
- **Active Record**: With a concise and expressive syntax, RDB enables you to interact with your database using the [*Active Record Pattern*](https://en.wikipedia.org/wiki/Active_record_pattern).
- **No Code Generation Required**: Enjoy full IntelliSense, even in table mappings, without the need for cumbersome code generation.
- **TypeScript and JavaScript Support**: RDB fully supports both TypeScript and JavaScript, allowing you to leverage the benefits of static typing and modern ECMAScript features.
- **Works in the Browser**: You can securely use RDB in the browser by utilizing the Express.js plugin, which serves to safeguard sensitive database credentials from exposure at the client level. This method mirrors a traditional REST API, augmented with advanced TypeScript tooling for enhanced functionality.

## Supported Databases

✅ Postgres  
✅ MS SQL  
✅ MySQL  
✅ Oracle  
✅ SAP ASE  
✅ SQLite


This is the _Modern Typescript Documentation_. Are you looking for the [_Classic Documentation_](https://github.com/alfateam/rdb/blob/master/docs/docs.md) ?

## Sponsorship <span style="font-size: larger; color: darkred;">♡</span>
If you value the hard work behind RDB and wish to see it evolve further, consider [sponsoring](https://github.com/sponsors/lroal). Your support fuels the journey of refining and expanding this tool for our developer community.

## Installation

```bash
$ npm install rdb
```  

## Example
Watch the [tutorial video on YouTube](https://youtu.be/1IwwjPr2lMs)

![Relations diagram](./docs/relations.png)  

Here we choose SQLite.  
```bash
$ npm install sqlite3
```
<sub>📄 map.ts</sub>
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
    id: column('id').numeric().primary(),
    orderId: column('orderId').numeric(),
    product: column('product').string(),
  })),

  deliveryAddress: x.table('deliveryAddress').map(({ column }) => ({
    id: column('id').numeric().primary(),
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
    lines: v.hasMany(x.orderLine).by('orderId'),
    deliveryAddress: v.hasOne(x.deliveryAddress).by('orderId'),
  }))
}));

export default map;
```  
<sub>📄 update.ts</sub>

```javascript
import map from './map';
const db = map.sqlite('demo.db');

updateRow();

async function updateRow() {
  const order = await db.order.getById(2, {
    lines: true
  });
  order.lines.push({
    product: 'broomstick'
  });

  await order.saveChanges();
}

```
<sub>📄 filter.ts</sub>

```javascript
import map from './map';
const db = map.sqlite('demo.db');

getRows();

async function getRows() {
  const filter = db.order.lines.any(
    line => line.product.contains('broomstick'))
    .and(db.order.customer.name.startsWith('Harry'));
  
  const orders = await db.order.getMany(filter, {
    lines: true,
    deliveryAddress: true,
    customer: true
  });
  
  console.dir(orders, { depth: Infinity });
}

```

## API 

<details id="table-mapping"><summary><strong>Mapping tables</strong></summary>
<p>To define a mapping, you employ the <strong><i>map()</i></strong> method, linking your tables and columns to corresponding object properties. You provide a callback function that engages with a parameter representing a database table.

Each column within your database table is designated by using the <strong><i>column()</i></strong> method, in which you specify its name. This action generates a reference to a column object that enables you to articulate further column properties like its data type or if it serves as a primary key.

Relationships between tables can also be outlined. By using methods like <strong><i>hasOne</i></strong>, <strong><i>hasMany</i></strong>, and <strong><i>references</i></strong>, you can establish connections that reflect the relationships in your data schema. In the example below, an 'order' is linked to a 'customer' reference, a 'deliveryAddress', and multiple 'lines'. The hasMany and hasOne relations represents ownership - the tables 'deliveryAddress' and 'orderLine' are owned by the 'order' table, and therefore, they contain the 'orderId' column referring to their parent table, which is 'order'. Conversely, the customer table is independent and can exist without any knowledge of the 'order' table. Therefore we say that the order table <i>references</i> the customer table - necessitating the existence of a 'customerId' column in the 'order' table.</p>

<sub>📄 map.ts</sub>
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
    id: column('id').numeric().primary(),
    orderId: column('orderId').numeric(),
    product: column('product').string(),
  })),

  deliveryAddress: x.table('deliveryAddress').map(({ column }) => ({
    id: column('id').numeric().primary(),
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

export default map;
```
The init.ts script resets our SQLite database. It's worth noting that SQLite databases are represented as single files, which makes them wonderfully straightforward to manage.

At the start of the script, we import our database mapping from the map.ts file. This gives us access to the db object, which we'll use to interact with our SQLite database.

Then, we define a SQL string. This string outlines the structure of our SQLite database. It first specifies to drop existing tables named 'deliveryAddress', 'orderLine', '_order', and 'customer' if they exist. This ensures we have a clean slate. Then, it dictates how to create these tables anew with the necessary columns and constraints.

Because of a peculiarity in SQLite, which only allows one statement execution at a time, we split this SQL string into separate statements. We do this using the split() method, which breaks up the string at every semicolon.  

<sub>📄 init.ts</sub>
```javascript
import map from './map';
const db = map.sqlite('demo.db');

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

<details><summary><strong>Connecting</strong></summary>

__SQLite__
```bash
$ npm install sqlite3
```  
```javascript
import map from './map';
const db = map.sqlite('demo.db');
```
__With connection pool__
```bash
$ npm install sqlite3
```  
```javascript
import map from './map';
const db = map.sqlite('demo.db', { size: 10 });
```
__From the browser__  
You can securely use RDB from the browser by utilizing the Express plugin, which serves to safeguard sensitive database credentials from exposure at the client level. This technique bypasses the need to transmit raw SQL queries directly from the client to the server. Instead, it logs method calls initiated by the client, which are later replayed and authenticated on the server. This not only reinforces security by preventing the disclosure of raw SQL queries on the client side but also facilitates a smoother operation. Essentially, this method mirrors a traditional REST API, augmented with advanced TypeScript tooling for enhanced functionality. You can read more about it in the section called [In the browser](#user-content-in-the-browser)  
<sub>📄 server.ts</sub>
```javascript
import map from './map';
import { json } from 'body-parser';
import express from 'express';
import cors from 'cors';

const db = map.sqlite('demo.db');

express().disable('x-powered-by')
  .use(json({ limit: '100mb' }))
  .use(cors())
  //for demonstrational purposes, authentication middleware is not shown here.
  .use('/rdb', db.express())
  .listen(3000, () => console.log('Example app listening on port 3000!'));
```

<sub>📄 browser.ts</sub>
```javascript
import map from './map';

const db = map.http('http://localhost:3000/rdb');
```
__MySQL__
```bash
$ npm install mysql2
```  
```javascript
import map from './map';
const db = map.mysql('mysql://test:test@mysql/test');
```


__MS SQL__
```bash
$ npm install tedious
```  
```javascript
import map from './map';
const db = map.mssql({
          server: 'mssql',
          options: {
            encrypt: false,
            database: 'test'
          },
          authentication: {
            type: 'default',
            options: {
              userName: 'sa',
              password: 'P@assword123',
            }
          }
        });
```

__PostgreSQL__
```bash
$ npm install pg
```  
```javascript
import map from './map';
const db = map.pg('postgres://postgres:postgres@postgres/postgres');
```
__Oracle__
```bash
$ npm install oracledb
```  
```javascript
import map from './map';
const db = map.oracle({
  user: 'sys',
  password: 'P@assword123',
  connectString: 'oracle/XE',
  privilege: 2
});
```
__SAP Adaptive Server__  
Even though msnodesqlv8 was developed for MS SQL, it also works for SAP ASE as it is ODBC compliant.  
```bash
$ npm install msnodesqlv8
```  
```javascript
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import map from './map';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
//download odbc driver from sap web pages
const db = map.sap(`Driver=${__dirname}/libsybdrvodb.so;SERVER=sapase;Port=5000;UID=sa;PWD=sybase;DATABASE=test`);

```

</details>

<details id="inserting-rows"><summary><strong>Inserting rows</strong></summary>

<p>In the code below, we initially import the table-mapping feature "map.ts" and the setup script "init.ts", both of which were defined in the preceding step. The setup script executes a raw query that creates the necessary tables. Subsequently, we insert two customers, named "George" and "Harry", into the customer table, and this is achieved through calling "db.customer.insert".

Next, we insert an array of two orders in the order table. Each order contains an orderDate, customer information, deliveryAddress, and lines for the order items. We use the customer constants "george" and "harry" from previous inserts. Observe that we don't pass in any primary keys. This is because all tables here have autoincremental keys. The second argument to "db.order.insert" specifies a fetching strategy. This fetching strategy plays a critical role in determining the depth of the data retrieved from the database after insertion. The fetching strategy specifies which associated data should be retrieved and included in the resulting orders object. In this case, the fetching strategy instructs the database to retrieve the customer, deliveryAddress, and lines for each order.

Without a fetching strategy, "db.order.insert" would only return the root level of each order. In that case you would only get the id, orderDate, and customerId for each order.</p>

```javascript
import map from './map';
const db = map.sqlite('demo.db');
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
}
```

__Conflict resolution__  
By default, the strategy for inserting rows is set to an optimistic approach. In this case, if a row is being inserted with an already existing primary key, the database raises an exception.

Currently, there are three concurrency strategies:
- <strong>`optimistic`</strong> Raises an exception if another row was already inserted on that primary key.
- <strong>`overwrite`</strong> Overwrites the property, regardless of changes by others.
- <strong>`skipOnConflict`</strong> Silently avoids updating the property if another user has modified it in the interim.

The <strong>concurrency</strong> option can be set either for the whole table or individually for each column. In the example below, we've set the concurrency strategy on <strong>vendor</strong> table to <strong>overwrite</strong> except for the column <strong>balance</strong> which uses the <strong>skipOnConflict</strong> strategy.  In this particular case, a row with <strong>id: 1</strong> already exists, the <strong>name</strong> and <strong>isActive</strong> fields will be overwritten, but the balance will remain the same as in the original record, demonstrating the effectiveness of combining multiple <strong>concurrency</strong> strategies.

```javascript
import map from './map';
const db = map.sqlite('demo.db');

insertRows();

async function insertRows() {

  db2 = db({
    vendor: {
      balance: {
        concurrency: 'skipOnConflict'
      },
      concurrency: 'overwrite'
    }
  });

  await db2.vendor.insert({
    id: 1,
    name: 'John',
    balance: 100,
    isActive: true
  });

  //this will overwrite all fields but balance
  const george = await db2.vendor.insert({
    id: 1,
    name: 'George',
    balance: 177,
        isActive: false
  });
  console.dir(george, {depth: Infinity});
  // {
  //   id: 1,
  //   name: 'George',
  //   balance: 100,
  //   isActive: false
  // }
}
```

</details>

<details><summary><strong>Fetching rows</strong></summary>
<p>RDB has a rich querying model. As you navigate through, you'll learn about the various methods available to retrieve data from your tables, whether you want to fetch all rows, many rows with specific criteria, or a single row based on a primary key.  

The fetching strategy in RDB is optional, and its use is influenced by your specific needs. You can define the fetching strategy either on the table level or the column level. This granularity gives you the freedom to decide how much related data you want to pull along with your primary request.</p>

__All rows__

```javascript
import map from './map';
const db = map.sqlite('demo.db');

getRows();

async function getRows() {
  const orders = await db.order.getAll({
    customer: true, 
    deliveryAddress: true, 
    lines: true
  });
}
```
__Limit, offset and order by__  
This script demonstrates how to fetch orders with customer, lines and deliveryAddress, limiting the results to 10, skipping the first row, and sorting the data based on the orderDate in descending order followed by id. The lines are sorted by product.  

```javascript
import map from './map';
const db = map.sqlite('demo.db');

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
}
```
<a name="aggregate-results">  </a>
__With aggregated results__  
You can count records and aggregate number columns.  
The following operators are supported:
- count
- sum
- min 
- max  
- avg

```javascript
import map from './map';
const db = map.sqlite('demo.db');

getRows();

async function getRows() {
  const orders = await db.order.getAll({
    numberOfLines: x => x.count(x => x.lines.id)
  });
}
```

__Many rows filtered__

```javascript
import map from './map';
const db = map.sqlite('demo.db');

getRows();

async function getRows() {
  const filter = db.order.lines.any(line => line.product.contains('i'))
                 .and(db.order.customer.balance.greaterThan(180));
  const orders = await db.order.getMany(filter, {
    customer: true, 
    deliveryAddress: true, 
    lines: true
  });
}
```

__Single row filtered__

```javascript
import map from './map';
const db = map.sqlite('demo.db');

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
}
```

__Single row by primary key__

```javascript
import map from './map';
const db = map.sqlite('demo.db');

getRows();

async function getRows() {
  const order = await db.order.getById(1, {
    customer: true, 
    deliveryAddress: true, 
    lines: true
  });
}
```

__Many rows by primary key__

```javascript
import map from './map';
const db = map.sqlite('demo.db');

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
}
```
</details>  

<details id="updating-rows"><summary><strong>Updating rows</strong></summary>
<p>To update rows, modify the property values and invoke the method <strong><i>saveChanges()</i></strong>. The function updates only the modified columns, not the entire row. Rows in child relations can also be updated as long as the parent order <i>owns</i> the child tables. In our illustration, the <strong>order</strong> table owns both the <strong>deliveryAddress</strong> and the <strong>lines</strong> tables because they're part of a <i>hasOne/hasMany relationship</i>. Contrastingly, the <strong>customer</strong> is part of a <i>reference relationship</i> and thus can't be updated here. But you can detach the reference to the customer by assigning it to null or undefined. (Setting order.customerId to null or undefined achieves the same result.)</p>

__Updating a single row__

```javascript
import map from './map';
const db = map.sqlite('demo.db');

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
}
```
__Updating many rows__

```javascript
import map from './map';
const db = map.sqlite('demo.db');

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
}
```
__Updating from JSON__  
The update method is suitable when a complete overwrite is required from a JSON object - typically in a REST API. However, it's important to consider that this method replaces the entire row and it's children, which might not always be desirable in a multi-user environment.

```javascript
import map from './map';
const db = map.sqlite('demo.db');

update();

async function update() {

  const modified = {
    orderDate: '2023-07-14T12:00:00',
    customer: {
      id: 2
    },
    deliveryAddress: {
      name: 'Roger', //modified name
      street: 'Node street 1',
      postalCode: '7059',
      postalPlace: 'Jakobsli',
      countryCode: 'NO'
    },
    lines: [
      { id: 1, product: 'Bicycle' },
      { id: 2, product: 'Small guitar' },
      { product: 'Piano' } //the new line to be inserted
    ]
  };

  const order = await db.order.update(modified, {customer: true, deliveryAddress: true, lines: true});
}
```
__Partially updating from JSON__  
 The updateChanges method applies a partial update based on difference between original and modified row. It is often preferable because it minimizes the risk of unintentionally overwriting data that may have been altered by other users in the meantime. To do so, you need to pass in the original row object before modification as well.

```javascript
import map from './map';
const db = map.sqlite('demo.db');

update();

async function update() {

  const original = {
    id: 1,
    orderDate: '2023-07-14T12:00:00',
    customer: {
      id: 2
    },
    deliveryAddress: {
      id: 1,
      name: 'George',
      street: 'Node street 1',
      postalCode: '7059',
      postalPlace: 'Jakobsli',
      countryCode: 'NO'
    },
    lines: [
      { id: 1, product: 'Bicycle' },
      { id: 2, product: 'Small guitar' }
    ]
  };

  const modified = JSON.parse(JSON.stringify(original));
  deliveryAddress.name = 'Roger';
  modified.lines.push({ product: 'Piano' });

  const order = await db.order.updateChanges(modified, original, { customer: true, deliveryAddress: true, lines: true });
}
```
__Conflict resolution__  
Rows get updated using an <i id="conflicts">optimistic</i> concurrency approach by default. This means if a property being edited was meanwhile altered, an exception is raised, indicating the row was modified by a different user. You can change the concurrency strategy either at the table or column level.

Currently, there are three concurrency strategies:
- <strong>`optimistic`</strong> Raises an exception if another user changes the property during an update.
- <strong>`overwrite`</strong> Overwrites the property, regardless of changes by others.
- <strong>`skipOnConflict`</strong> Silently avoids updating the property if another user has modified it in the interim.

In the example below, we've set the concurrency strategy for orderDate to 'overwrite'. This implies that if other users modify orderDate while you're making changes, their updates will be overwritten.

```javascript
import map from './map';
const db = map.sqlite('demo.db');

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
}
```
</details>  

<details><summary><strong>Upserting rows</strong></summary>
The default strategy for inserting rows is set to an optimistic approach. This means that if a row is being inserted with an already existing primary key, the database raises an exception. However, it is possible to perform 'upserts' by taking advantage of the 'overwrite' strategy.

Currently, there are three concurrency strategies:
- <strong>`optimistic`</strong> Raises an exception if another row was already inserted on that primary key.
- <strong>`overwrite`</strong> Overwrites the property, regardless of changes by others.
- <strong>`skipOnConflict`</strong> Silently avoids updating the property if another user has modified it in the interim.

The <strong>concurrency</strong> option can be set either for the whole table or individually for each column. In the example below, we've set the concurrency strategy on <strong>vendor</strong> table to <strong>overwrite</strong> except for the column <strong>balance</strong> which uses the <strong>skipOnConflict</strong> strategy.  In this particular case, a row with <strong>id: 1</strong> already exists, the <strong>name</strong> and <strong>isActive</strong> fields will be overwritten, but the balance will remain the same as in the original record, demonstrating the effectiveness of combining multiple <strong>concurrency</strong> strategies.

```javascript
import map from './map';
const db = map.sqlite('demo.db');

insertRows();

async function insertRows() {

  db2 = db({
    vendor: {
      balance: {
        concurrency: 'skipOnConflict'
      },
      concurrency: 'overwrite'
    }
  });

  await db2.vendor.insert({
    id: 1,
    name: 'John',
    balance: 100,
    isActive: true
  });

  //this will overwrite all fields but balance
  const george = await db2.vendor.insert({
    id: 1,
    name: 'George',
    balance: 177,
        isActive: false
  });
  console.dir(george, {depth: Infinity});
  // {
  //   id: 1,
  //   name: 'George',
  //   balance: 100,
  //   isActive: false
  // }
}
```

</details>


<details><summary><strong>Deleting rows</strong></summary>
<p>Rows in owner tables cascade deletes to their child tables. In essence, if a table has ownership over other tables through <strong><i>hasOne</i></strong> and <strong><i>hasMany</i></strong> relationships, removing a record from the parent table also removes its corresponding records in its child tables. This approach safeguards against leaving orphaned records and upholds data integrity. On the contrary, tables that are merely referenced, through <strong><i>reference relationships </i></strong> , remain unaffected upon deletions. For a deeper dive into these relationships and behaviors, refer to the section on <a href="#user-content-table-mapping">Mapping tables</a>.</p>

__Deleting a single row__
```javascript
import map from './map';
const db = map.sqlite('demo.db');

deleteRow();

async function deleteRow() {    
  const order = await db.order.getById(1);

  await order.delete();
  //will also delete deliveryAddress and lines
  //but not customer
}
```
__Deleting a row in an array__  
A common workflow involves retrieving multiple rows, followed by the need to delete a specific row from an array. This operation is straightforward to do with RDB, which allow for the updating, inserting, and deleting of multiple rows in a single transaction. To modify the array, simply add, update, or remove elements, and then invoke the saveChanges() method on the array to persist the changes.

```javascript
import map from './map';
const db = map.sqlite('demo.db');

updateInsertDelete();

async function updateInsertDelete() {    
  const orders = await db.order.getAll({
    customer: true, 
    deliveryAddress: true, 
    lines: true
  });

  //will add line to the first order
  orders[0].lines.push({
    product: 'secret weapon'
  });
  
  //will delete second row
  orders.splice(1, 1);

  //will insert a new order with lines, deliveryAddress and set customerId
  orders.push({
    orderDate: new Date(2022, 0, 11, 9, 24, 47),
    customer: {
      id: 1
    },
    deliveryAddress: {
      name: 'George',
      street: 'Node street 1',
      postalCode: '7059',
      postalPlace: 'Jakobsli',
      countryCode: 'NO'
    },
    lines: [
      { product: 'Magic tent' }
    ]
  });

  await orders.saveChanges();

}
```

__Deleting many rows__

```javascript
import map from './map';
const db = map.sqlite('demo.db');

deleteRows();

async function deleteRows() {
  const filter = db.order.customer.name.eq('George');
  let orders = await db.order.getMany(filter);

  await orders.delete();
}
```
__Deleting with concurrency__  
Concurrent operations can lead to conflicts. When you still want to proceed with the deletion regardless of potential interim changes, the 'overwrite' concurrency strategy can be used. This example demonstrates deleting rows even if the "delivery address" has been modified in the meantime. You can read more about concurrency strategies in <a href="#user-content-updating-rows">Updating rows</a>.   
```javascript
import map from './map';
const db = map.sqlite('demo.db');

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
import map from './map';
const db = map.sqlite('demo.db');

deleteRows();

async function deleteRows() {
  const filter = db.order.deliveryAddress.name.eq('George');
  await db.order.delete(filter);
}
```
__Batch delete cascade__

When deleting records, sometimes associated data in related tables also needs to be removed. This cascade delete helps maintain database integrity.  

```javascript
import map from './map';
const db = map.sqlite('demo.db');

deleteRows();

async function deleteRows() {
  const filter = db.order.deliveryAddress.name.eq('George');
  await db.order.deleteCascade(filter);
}
```
__Batch delete by primary key__

For efficiency, you can also delete records directly if you know their primary keys.  

```javascript
import map from './map';
const db = map.sqlite('demo.db');

deleteRows();

async function deleteRows() {
  db.customer.delete([{id: 1}, {id: 2}]);
}
```
</details>

<details id="in-the-browser"><summary><strong>In the browser</strong></summary>
<p>You can use <strong><i>RDB</i></strong> in the browser by using the adapter for Express. Instead of sending raw SQL queries from the client to the server, this approach records the method calls in the client. These method calls are then replayed at the server, ensuring a higher level of security by not exposing raw SQL on the client side.  
Raw sql queries, raw sql filters and transactions are disabled at the http client due to security reasons.  If you would like RDB to support other web frameworks, like nestJs, fastify, etc, please let me know.</p>

<sub>📄 server.ts</sub>
```javascript
import map from './map';
import { json } from 'body-parser';
import express from 'express';
import cors from 'cors';

const db = map.sqlite('demo.db');

express().disable('x-powered-by')
  .use(json({ limit: '100mb' }))
  .use(cors())
  //for demonstrational purposes, authentication middleware is not shown here.
  .use('/rdb', db.express())
  .listen(3000, () => console.log('Example app listening on port 3000!'));
```

<sub>📄 browser.ts</sub>
```javascript
import map from './map';

const db = map.http('http://localhost:3000/rdb');

updateRows();

async function updateRows() {
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

In the next setup, axios interceptors are employed on the client side to add an Authorization header of requests. Meanwhile, on the server side, an Express middleware (validateToken) is utilized to ensure the presence of the Authorization header, while a base filter is applied on the order table to filter incoming requests based on the customerId extracted from this header. This combined approach enhances security by ensuring that users can only access data relevant to their authorization level and that every request is accompanied by a token. In real-world applications, it's advisable to use a more comprehensive token system and expand error handling to manage a wider range of potential issues.  
One notable side effect compared to the previous example, is that only the order table is exposed for interaction, while all other potential tables in the database remain shielded from direct client access (except for related tables). If you want to expose a table without a baseFilter, just set the tableName to an empty object.    

<sub>📄 server.ts</sub>

```javascript
import map from './map';
import { json } from 'body-parser';
import express from 'express';
import cors from 'cors';

const db = map.sqlite('demo.db');

express().disable('x-powered-by')
  .use(json({ limit: '100mb' }))
  .use(cors())
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

<sub>📄 browser.ts</sub>

```javascript
import map from './map';

const db = map.http('http://localhost:3000/rdb');

updateRows();

async function updateRows() {
  
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

<details id="fetching-strategies"><summary><strong>Fetching strategies</strong></summary>
<p>Efficient data retrieval is crucial for the performance and scalability of applications. The fetching strategy gives you the freedom to decide how much related data you want to pull along with your primary request. Below are examples of common fetching strategies, including fetching entire relations and subsets of columns. When no fetching strategy is present, it will fetch all columns without its relations.<p>


__Including a relation__  
This example fetches orders and their corresponding delivery addresses, including all columns from both entities.

```javascript
import map from './map';
const db = map.sqlite('demo.db');

getRows();

async function getRows() {
  const rows = await db.order.getAll({
    deliveryAddress: true 
  });  
}
```

__Including a subset of columns__  
In scenarios where only specific fields are required, you can specify a subset of columns to include. In the example below, orderDate is explicitly excluded, so all other columns in the order table are included by default. For the deliveryAddress relation, only countryCode and name are included, excluding all other columns. If you have a mix of explicitly included and excluded columns, all other columns will be excluded from that table.

```javascript
import map from './map';
const db = map.sqlite('demo.db');

getRows();

async function getRows() {
  const rows = await db.order.getAll({
    orderDate: false,
    deliveryAddress: {
      countryCode: true,
      name: true
    } 
  });  
}
```

</details>

<details id="basic-filters"><summary><strong>Basic filters</strong></summary>
<p>Filters are a versatile tool for both data retrieval and bulk deletions. They allow for precise targeting of records based on specific criteria and can be combined with operators like <i>any</i> and <i>exists</i> and even raw sql for more nuanced control. Filters can also be nested to any depth, enabling complex queries that can efficiently manage and manipulate large datasets. This dual functionality enhances database management by ensuring data relevance and optimizing performance.</p>


__Equal__  
```javascript
import map from './map';
const db = map.sqlite('demo.db');

getRows();

async function getRows() {
  const filter = db.customer.name.equal('Harry');

  const rows = await db.customer.getMany(filter);
}
```
__Not equal__  
```javascript
import map from './map';
const db = map.sqlite('demo.db');

getRows();

async function getRows() {
  const filter = db.customer.name.notEqual('Harry');

  const rows = await db.customer.getMany(filter);
}
```
__Contains__  
```javascript
import map from './map';
const db = map.sqlite('demo.db');

getRows();

async function getRows() {
  const filter = db.customer.name.contains('arr');

  const rows = await db.customer.getMany(filter);
}
```
__Starts with__  
```javascript
import map from './map';
const db = map.sqlite('demo.db');

getRows();

async function getRows() {
  const filter = db.customer.name.startsWith('Harr');

  const rows = await db.customer.getMany(filter);
}
```
__Ends with__  
```javascript
import map from './map';
const db = map.sqlite('demo.db');

getRows();

async function getRows() {
  const filter = db.customer.name.endsWith('arry');

  const rows = await db.customer.getMany(filter);
}
```
__Greater than__  
```javascript
import map from './map';
const db = map.sqlite('demo.db');

getRows();

async function getRows() {
  const filter = db.order.orderDate.greaterThan('2023-07-14T12:00:00');

  const rows = await db.order.getMany(filter);
}
```
__Greater than or equal__  
```javascript
import map from './map';
const db = map.sqlite('demo.db');

getRows();

async function getRows() {
  const filter = db.order.orderDate.greaterThanOrEqual('2023-07-14T12:00:00');

  const rows = await db.order.getMany(filter);
}
```
__Less than__  
```javascript
import map from './map';
const db = map.sqlite('demo.db');

getRows();

async function getRows() {
  const filter = db.order.orderDate.lessThan('2024-07-14T12:00:00');

  const rows = await db.order.getMany(filter);
}
```
__Less than or equal__  
```javascript
import map from './map';
const db = map.sqlite('demo.db');

getRows();

async function getRows() {
  const filter = db.order.orderDate.lessThanOrEqual('2024-07-14T12:00:00');

  const rows = await db.order.getMany(filter);
}
```
__Between__  
```javascript
import map from './map';
const db = map.sqlite('demo.db');

getRows();

async function getRows() {
  const filter = db.order.orderDate.between('2023-07-14T12:00:00', '2024-07-14T12:00:00');

  const rows = await db.order.getMany(filter);
}
```
__In__  
```javascript
import map from './map';
const db = map.sqlite('demo.db');

getRows();

async function getRows() {
  const filter = db.customer.name.in('George', 'Harry');

  const rows = await db.customer.getMany(filter);
}
```
__Raw sql filter__  
You can use the raw SQL filter alone or in combination with a regular filter. 
Here the raw filter queries for customer with name ending with "arry". The composite filter combines the raw SQL filter and a regular filter that checks for a customer balance greater than 100. It is important to note that due to security precautions aimed at preventing SQL injection attacks, using raw SQL filters directly via browser inputs is not allowed. Attempting to do so will result in an HTTP status 403 (Forbidden) being returned.
 
```javascript
import map from './map';
const db = map.sqlite('demo.db');

getRows();

async function getRows() {
  const rawFilter = {
    sql: 'name like ?',
    parameters: ['%arry']
  };                 
  const combinedFilter = db.customer.balance.greaterThan(100).and(rawFilter);
  
  const rowsWithRaw = await db.customer.getMany(rawFilter);
  const rowsWithCombined = await db.customer.getMany(combinedFilter);  
}
```

</details>

<details id="filtering-relations"><summary><strong>Relation filters</strong></summary>
<p>Relation filters offer a dynamic approach to selectively include or exclude related data based on specific criteria. In the provided example, all orders are retrieved, yet it filters the order lines to only include those that feature products with "broomstick" in their description.  By setting deliveryAddress and customer to true, we also ensure the inclusion of these related entities in our result set.</p>

```javascript
import map from './map';
const db = map.sqlite('demo.db');

getRows();

async function getRows() {
  const orders = await db.order.getAll({
    lines: {
      where: x => x.product.contains('broomstick')
    },
    deliveryAddress: true,
    customer: true
  });
}
```
</details>

<details id="logical-filters"><summary><strong>And, or, not, exists</strong></summary>
<p>These operators serve as the backbone for constructing complex queries that allow for more granular control over the data fetched from the database. The examples provided below are self-explanatory for anyone familiar with basic programming concepts and database operations. The design philosophy underscores the importance of clear, readable code that doesn't sacrifice power for simplicity.</p>

__And__  
```javascript
import map from './map';
const db = map.sqlite('demo.db');

getRows();

async function getRows() {
  const nameFilter = db.order.customer.name.equal('Harry');
  const dateFilter = db.order.orderDate.greaterThan('2023-07-14T12:00:00');
  const filter = nameFilter.and(dateFilter);

  const rows = await db.order.getMany(filter);  
}
```
__Or__  
```javascript
import map from './map';
const db = map.sqlite('demo.db');

getRows();

async function getRows() {
  const filter = db.order.customer(x => x.name.equal('George').or(x.name.equal('Harry')));

  const rows = await db.order.getMany(filter);  
}
```
__Not__  
```javascript
import map from './map';
const db = map.sqlite('demo.db');

getRows();

async function getRows() {
  const filter = db.order.customer(x => x.name.equal('George').or(x.name.equal('Harry'))).not();
  //Neither George nor Harry

  const rows = await db.order.getMany(filter);  
}
```
__Exists__  
```javascript
import map from './map';
const db = map.sqlite('demo.db');

getRows();

async function getRows() {
  const filter = db.order.deliveryAddress.exists();

  const rows = await db.order.getMany(filter);  
}
```

</details>

<details id="any-filters"><summary><strong>Any, all, none</strong></summary>
<p>These operators are used in scenarios involving relationships within database records.</p>


__Any__  
The <i>any</i> operator is employed when the objective is to find records where at least one item in a collection meets the specified criteria.
```javascript
import map from './map';
const db = map.sqlite('demo.db');

getRows();

async function getRows() {
  const filter = db.order.lines.any(x => x.product.contains('guitar'));
  //equivalent syntax:
  // const filter = db.order.lines.product.contains('guitar');

  const rows = await db.order.getMany(filter);  
}
```
__All__  
Conversely, the <i>all</i> operator ensures that every item in a collection adheres to the defined condition.
```javascript
import map from './map';
const db = map.sqlite('demo.db');

getRows();

async function getRows() {
  const filter = db.order.lines.all(x => x.product.contains('a'));

  const rows = await db.order.getMany(filter);  
}
```
__None__  
The <i>none</i> operator, as the name suggests, is used to select records where not a single item in a collection meets the condition. 
```javascript
import map from './map';
const db = map.sqlite('demo.db');

getRows();

async function getRows() {
  const filter = db.order.lines.none(x => x.product.equal('Magic wand'));

  const rows = await db.order.getMany(filter);  
}
```

</details>

<details><summary><strong>Transactions</strong></summary>
<p>We initiate a database transaction using db.transaction.
Within the transaction, a customer is retrieved and its balance updated using the tx object to ensure operations are transactional.
An error is deliberately thrown to demonstrate a rollback, ensuring all previous changes within the transaction are reverted.
Always use the provided tx object for operations within the transaction to maintain data integrity.</p>

```javascript
import map from './map';
const db = map.sqlite('demo.db');

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

<details><summary><strong>Data types</strong></summary>
<p>RDB is database agnostic - meaning it can work with multiple database systems without being specifically tied to any one of them. When the ORM behaves consistently across various databases, developers don't need to remember specific quirks or differences when switching between databases. They can rely on the ORM to provide the same mapping behavior, which reduces the cognitive load and potential for errors. There are currently 8 column types in RDB:</p>

- **`string`** maps to VARCHAR or TEXT in sql
- **`numeric`** maps to INTEGER, DECIMAL, NUMERIC, TINYINT FLOAT/REAL or DOUBLE in sql.
- **`boolean`** maps to BIT, TINYINT(1) or INTEGER in sql.
- **`uuid`** is represented as string in javascript and maps to UUID, GUID or VARCHAR in sql.
- **`date`** is represented as ISO 8601 string  in javascript and maps to DATE, DATETIME, TIMESTAMP or DAY in sql. Representing datetime values as ISO 8601 strings, rather than relying on JavaScript's native Date object, has multiple advantages, especially when dealing with databases and servers in different time zones. The datetime values are inherently accompanied by their respective time zones. This ensures that the datetime value remains consistent regardless of where it's being viewed or interpreted. On the other hand, JavaScript's Date object is typically tied to the time zone of the environment in which it's executed, which could lead to inconsistencies between the client and the database server.
- **`dateWithTimeZone`** is represented as ISO 8601 string  in javascript and maps to TIMESTAMP WITH TIME ZONE in postgres and DATETIMEOFFSET in ms sql.<br> Contrary to what its name might imply, timestamptz (TIMESTAMP WITH TIME ZONE) in postgres doesn't store the time zone data. Instead, it adjusts the provided time value to UTC (Coordinated Universal Time) before storing it. When a timestamptz value is retrieved, PostgreSQL will automatically adjust the date-time to the time zone setting of the PostgreSQL session (often the server's timezone, unless changed by the user). The primary benefit of DATETIMEOFFSET in ms sql is its ability to keep track of the time zone context. If you're dealing with global applications where understanding the original time zone context is critical (like for coordinating meetings across time zones or logging events), DATETIMEOFFSET is incredibly valuable.
- **`binary`** is represented as a base64 string in javascript and maps to BLOB, BYTEA or VARBINARY(max) in sql.
- **`json`** and **`jsonOf<T>`** are represented as an object or array in javascript and maps to JSON, JSONB, NVARCHAR(max) or TEXT (sqlite) in sql.

<sub>📄 map.ts</sub>
```javascript
import rdb from 'rdb';

interface Pet {
    name: string;
    kind: string;
}

const map = rdb.map(x => ({
    demo: x.table('demo').map(x => ({
      id: x.column('id').uuid().primary().notNull(),
      name: x.column('name').string(),
      balance: x.column('balance').numeric(),
      regularDate: x.column('regularDate').date(),
      tzDate: x.column('tzDate').dateWithTimeZone(),
      picture: x.column('picture').binary(),
      pet: x.column('pet').jsonOf<Pet>(), //generic
      pet2: x.column('pet2').json(), //non-generic
  }))
}));
```
<sub>📄 map.js</sub>
```javascript
import rdb from 'rdb';

/**
 * @typedef {Object} Pet
 * @property {string} name - The name of the pet.
 * @property {string} kind - The kind of pet
 */

/** @type {Pet} */
let pet;

const map = rdb.map(x => ({
    demo: x.table('demo').map(x => ({
      id: x.column('id').uuid().primary().notNull(),
      name: x.column('name').string(),
      balance: x.column('balance').numeric(),
      regularDate: x.column('regularDate').date(),
      tzDate: x.column('tzDate').dateWithTimeZone(),
      picture: x.column('picture').binary(),
      pet: x.column('pet').jsonOf(pet), //generic
      pet2: x.column('pet2').json(), //non-generic
  }))
}));
```
</details>

<details id="default-values"><summary><strong>Default values</strong></summary>
<p>Utilizing default values can be especially useful for automatically populating these fields when the underlying database doesn't offer native support for default value generation.  

In the provided code, the id column's default value is set to a UUID generated by crypto.randomUUID(), and the isActive column's default is set to true.</p>

```javascript
import rdb from 'rdb';
import crypto 'crypto';

const map = rdb.map(x => ({
  myTable: x.table('myTable').map(({ column }) => ({
    id: column('id').uuid().primary().default(() => crypto.randomUUID()),
    name: column('name').string(),
    balance: column('balance').numeric(),
    isActive: column('isActive').boolean().default(true),
  }))
}));

export default map;
```  
</details>

<details><summary><strong>Validation</strong></summary>
<p>In the previous sections you have already seen the <strong><i>notNull()</i></strong> validator being used on some columns. This will not only generate correct typescript mapping, but also throw an error if value is set to null or undefined. However, sometimes we do not want the notNull-validator to be run on inserts. Typically, when we have an autoincremental key or server generated uuid, it does not make sense to check for null on insert. This is where <strong><i>notNullExceptInsert()</strong></i> comes to rescue. You can also create your own custom validator as shown below. The last kind of validator, is the <a href="https://ajv.js.org/json-schema.html">ajv JSON schema validator</a>. This can be used on json columns as well as any other column type.</p>

<sub>📄 map.ts</sub>
```javascript
import rdb from 'rdb';

interface Pet {
    name: string;
    kind: string;
}

let petSchema = {
    "properties": {
        "name": { "type": "string" },
        "kind": { "type": "string" }
    }
};

function validateName(value?: string) {
  if (value && value.length > 10)
    throw new Error('Length cannot exceed 10 characters');
}

const map = rdb.map(x => ({
    demo: x.table('demo').map(x => ({
      id: x.column('id').uuid().primary().notNullExceptInsert(),
      name: x.column('name').string().validate(validateName),
      pet: x.column('pet').jsonOf<Pet>().JSONSchema(petSchema)
  }))
}));

export default map;
```
<sub>📄 map.js</sub>
```javascript
import rdb from 'rdb';

/**
 * @typedef {Object} Pet
 * @property {string} name - The name of the pet.
 * @property {string} kind - The kind of pet
 */

/** @type {Pet} */
let pet;

let petSchema = {
    "properties": {
        "name": { "type": "string" },
        "kind": { "type": "string" }
    }
};

function validateName(value) {
  if (value && value.length > 10)
    throw new Error('Length cannot exceed 10 characters');
}

const map = rdb.map(x => ({
    demo: x.table('demo').map(x => ({
      id: x.column('id').uuid().primary().notNullExceptInsert(),
      name: x.column('name').string().validate(validateName),
      pet: x.column('pet').jsonOf(pet).JSONSchema(petSchema)
  }))
}));

export default map;
```
</details>

<details id="composite-keys"><summary><strong>Composite keys</strong></summary>
<p>A composite key is defined by marking multiple columns as primary keys. This is done using the ".primary()"" method on each column that is part of the composite key.

Consider a scenario where we have orders and order lines, and each order line is uniquely identified by combining the order type, order number, and line number.</p>

```javascript
import rdb from 'rdb';

const map = rdb.map(x => ({
  order: x.table('_order').map(({ column }) => ({
    orderType: column('orderType').string().primary().notNull(),
    orderNo: column('orderNo').numeric().primary().notNull(),
    orderDate: column('orderDate').date().notNull(),
  })),

  orderLine: x.table('orderLine').map(({ column }) => ({
    orderType: column('orderType').string().primary().notNull(),
    orderNo: column('orderNo').numeric().primary().notNull(),
    lineNo: column('lineNo').numeric().primary().notNull(),
    product: column('product').string(),
  }))
})).map(x => ({
  order: x.order.map(v => ({
    lines: v.hasMany(x.orderLine).by('orderType', 'orderNo'),
  }))
}));

export default map;
```  
</details>


<details id="column-discriminators"><summary><strong>Column discriminators</strong></summary>
<p>Column discriminators are used to distinguish between different types of data in the same table. Think of them as labels that identify whether a record is one category or another.
In the example, the <strong>client_type</strong> column serves as the discriminator that labels records as <strong>customer</strong> or <strong>vendor</strong> in the 'client' table. On inserts, the column will automatically be given the correct discriminator value. Similarly, when fetching and deleting, the discrimiminator will be added to the WHERE clause.</p>

```javascript
import rdb from 'rdb';

const map = rdb.map(x => ({
  customer: x.table('client').map(({ column }) => ({
    id: column('id').numeric().primary(),
    name: column('name').string()
  })).columnDiscriminators(`client_type='customer'`),

  vendor: x.table('client').map(({ column }) => ({
    id: column('id').numeric().primary(),
    name: column('name').string()
  })).columnDiscriminators(`client_type='vendor'`),
}));

export default map;
```  
</details>

<details id="formula-discriminators"><summary><strong>Formula discriminators</strong></summary>
<p>Formula discriminators are used to distinguish between different types of data in the same table. They differ from column discriminators by using a logical expression rather than a static value in a column.

In the example below, the formula discriminator categorize bookings into <strong>customerBooking</strong> and <strong>internalBooking</strong> within the same <strong>booking</strong> table. The categorization is based on the value of the <strong>booking_no</strong> column. For <strong>customerBooking</strong>, records are identified where the booking number falls within the range of 10000 to 99999. For <strong>internalBooking</strong>, the range is between 1000 to 9999. These conditions are utilized during fetch and delete operations to ensure that the program interacts with the appropriate subset of records according to their booking number. Unlike column discriminators, formula discriminators are not used during insert operations since they rely on existing data to evaluate the condition.

The <strong><i>'@this'</strong></i> acts as a placeholder within the formula. When RDB constructs a query, it replaces <strong>'@this'</strong> with the appropriate alias for the table being queried. This replacement is crucial to avoid ambiguity, especially when dealing with joins with ambigious column names.</p>

```javascript
import rdb from 'rdb';


const map = rdb.map(x => ({
  customerBooking: x.table('booking').map(({ column }) => ({
    id: column('id').uuid().primary(),
    bookingNo: column('booking_no').numeric()
  })).formulaDiscriminators('@this.booking_no between 10000 and 99999'),

  internalBooking: x.table('booking').map(({ column }) => ({
    id: column('id').uuid().primary(),
    bookingNo: column('booking_no').numeric()
  })).formulaDiscriminators('@this.booking_no between 1000 and 9999'),
}));

export default map;
```  
</details>

<details><summary><strong>Raw sql queries</strong></summary>
<p>You can employ raw SQL queries directly to fetch rows from the database, bypassing the ORM (Object-Relational Mapper). It is important to note that due to security precautions aimed at preventing SQL injection attacks, using raw SQL filters directly via browser inputs is not allowed. Attempting to do so will result in an HTTP status 403 (Forbidden) being returned.</p>

```javascript
import map from './map';
const db = map.sqlite('demo.db');

getRows();

async function getRows() {
  const query = {
    sql: 'select * from customer where name like ?',
    parameters: ['%arry']
  };
                 
  const rows = await db.query(query)   
}
```
</details>

<details><summary><strong>Aggregate functions</strong></summary>
<p>Currently there is only the <strong><i>count</i></strong> aggregate available.</p>

```javascript
import map from './map';
const db = map.sqlite('demo.db');

getCount();

async function getCount() {
  const filter = db.order.lines.any(
    line => line.product.contains('broomstick')
  );
  const count = await db.order.count(filter);
  console.log(count); //2
}
```
</details>

<details><summary><strong>Excluding sensitive data</strong></summary>
<p>To secure your application by preventing sensitive data from being serialized and possibly leaked, you can use the <strong>serializable(false)</strong> attribute on certain fields within your database schema. Here, the serializable(false) attribute has been applied to the balance column, indicating that this field will not be serialized when a record is converted to a JSON string.</p>

<sub>📄 map.ts</sub>

```javascript
import rdb from 'rdb';

const map = rdb.map(x => ({
  customer: x.table('customer').map(({ column }) => ({
    id: column('id').numeric().primary().notNullExceptInsert(),
    name: column('name').string(),
    balance: column('balance').numeric().serializable(false),
    isActive: column('isActive').boolean(),
  }))
}));

export default map;
```
<sub>📄 sensitive.ts</sub>

```javascript
import map from './map';
const db = map.sqlite('demo.db');

getRows();

async function getRows() {

  const george = await db.customer.insert({
    name: 'George',
    balance: 177,
    isActive: true
  });
  
  console.dir(JSON.stringify(george), {depth: Infinity});
  //note that balance is excluded:
  //'{"id":1,"name":"George","isActive":true}'
}
```
</details>

<details><summary><strong>Logging</strong></summary>
<p>You enable logging by listening to the query event on the rdb object. During this event, both the SQL statement and any associated parameters are logged. The logged output reveals the sequence of SQL commands executed, offering developers a transparent view into database operations, which aids in debugging and ensures data integrity.</p>

```javascript
import rdb from 'rdb';
import map from './map';
const db = map.sqlite('demo.db');

rdb.on('query', (e) => {
  console.log(e.sql);
  if (e.parameters.length > 0)
    console.log(e.parameters);
});

updateRow();

async function updateRow() {
  const order = await db.order.getById(2, {
    lines: true
  });
  order.lines.push({
    product: 'broomstick'
  });

  await order.saveChanges();
}
```

output:
```bash
BEGIN
select  _order.id as s_order0,_order.orderDate as s_order1,_order.customerId as s_order2 from _order _order where _order.id=2 order by _order.id limit 1
select  orderLine.id as sorderLine0,orderLine.orderId as sorderLine1,orderLine.product as sorderLine2 from orderLine orderLine where orderLine.orderId in (2) order by orderLine.id
COMMIT
BEGIN
select  _order.id as s_order0,_order.orderDate as s_order1,_order.customerId as s_order2 from _order _order where _order.id=2 order by _order.id limit 1
INSERT INTO orderLine (orderId,product) VALUES (2,?)
[ 'broomstick' ]
SELECT id,orderId,product FROM orderLine WHERE rowid IN (select last_insert_rowid())
select  orderLine.id as sorderLine0,orderLine.orderId as sorderLine1,orderLine.product as sorderLine2 from orderLine orderLine where orderLine.orderId in (2) order by orderLine.id
COMMIT
```

</details>

<details><summary><strong>What it is not</strong></summary>
<p>
<ul>
  <li><strong>It is not about migrations</strong> <p>The allure of ORMs handling SQL migrations is undeniably attractive and sweet. However, this sweetness can become painful. Auto-generated migration scripts might not capture all nuances. Using dedicated migration tools separate from the ORM or manually managing migrations might be the less painful route in the long run.  RDB aim for database agnosticism. And when you're dealing with migrations, you might want to use features specific to a database platform. However, I might consider adding support for (non-auto-generated) migrations at a later point. But for now, it is not on the roadmap.</p></li>
  <li><strong>It is not about NoSql databases</strong> <p>Applying ORMs to NoSQL, which inherently diverges from the relational model, can lead to data representation mismatches and a loss of specialized NoSQL features. Moreover, the added ORM layer can introduce performance inefficiencies, complicate debugging, and increase maintenance concerns. Given the unique capabilities of each NoSQL system, crafting custom data access solutions tailored to specific needs often provides better results than a generalized ORM approach.</p></li>
  <li><strong>It is not about GrapQL</strong> <p>RDB, already supports remote data operations via HTTP, eliminating the primary need for integrating GraphQL. RDB's built-in safety mechanisms and tailored optimization layers ensure secure and efficient data operations, which might be compromised by adding GraphQL. Furthermore, RDB's inherent expressivity and powerful querying capabilities could be overshadowed by the introduction of GraphQL. Integrating GraphQL could introduce unnecessary complexity, potential performance overhead, and maintenance challenges, especially as both systems continue to evolve. Therefore, considering RDB's robust features and design, supporting GraphQL might not offer sufficient advantages to warrant the associated complications. </p></li>
</ul>

</p>
</details>

### [Changelog](https://github.com/alfateam/rdb/blob/master/docs/changelog.md)
### [Code of Conduct](https://github.com/alfateam/rdb/blob/master/docs/CODE_OF_CONDUCT.md)
<!-- 
How to setup code coverage
https://github.com/nystudio107/rollup-plugin-critical/blob/master/package.json
https://dev.to/thejaredwilcurt/coverage-badge-with-github-actions-finally-59fa -->
