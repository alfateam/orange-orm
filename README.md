![RDB](./docs/logo-sm.jpg)  
RDB is the ultimate Object Relational Mapper for Node.js, offering seamless integration with popular databases like Postgres, MS SQL, MySQL, Sybase SAP, and SQLite. Whether you're building applications in TypeScript or JavaScript  (including both CommonJS and ECMAScript), RDB has got you covered.

## Key Features

- **Rich Querying Model**: RDB provides a powerful and intuitive querying model, making it easy to retrieve, filter, and manipulate data from your databases.
- **Concise API**: With a concise and developer-friendly API, RDB enables you to interact with your database using simple and expressive syntax.
- **No Code Generation Required**: Enjoy full IntelliSense, even in table mappings, without the need for cumbersome code generation.
- **TypeScript and JavaScript Support**: RDB fully supports both TypeScript and JavaScript, allowing you to leverage the benefits of static typing and modern ECMAScript features.
- **Works in the Browser**: RDB even works in the browser through hosting in Express, giving you the flexibility to build web applications with ease.  

This is the _Modern Typescript Documentation_. Are you looking for the [_Classic Documentation_](https://github.com/alfateam/rdb/blob/master/docs/docs.md) ?

## Installation
`npm install rdb`  
<details><summary><strong>Installing drivers</strong></summary>

To ensure RDB works properly with your database, you'll also need to install the appropriate driver:
- **SQLite**: `npm install sqlite3`
- **MySQL**: `npm install mysql2`
- **MS SQL**: `npm install tedious`
- **PostgreSQL (pg)**: `npm install pg`
- **SAP**: `npm install msnodesqlv8`

</details>  



## Fundamentals 
<details><summary><strong>Mapping tables</strong></summary>
To define a mapping, you employ the <strong><i>map()</i></strong> method, linking your tables and columns to corresponding object properties. You provide a callback function that engages with a parameter representing a database table.

Each column within your database table is designated by using the <strong><i>column()</i></strong> method, in which you specify its name. This action generates a reference to a column object that enables you to articulate further column properties like its data type or if it serves as a primary key.

Relationships between tables can also be outlined. By using methods like <strong><i>hasOne</i></strong>, <strong><i>hasMany</i></strong>, and <strong><i>references</i></strong>, you can establish connections that reflect the relationships in your data schema. In the example below, an 'order' is linked to a 'customer' reference, a 'deliveryAddress', and multiple 'lines'. The hasMany and hasOne relations represents ownership - the tables 'deliveryAddress' and 'orderLine' are owned by the 'order' table, and therefore, they contain the 'orderId' column referring to their parent table, which is 'order'. Conversely, the customer table is independent and can exist without any knowledge of the 'order' table. Therefore we say that the order table <i>references</i> the customer table - necessitating the existence of a 'customerId' column in the 'order' table.  


```javascript
//db.js
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
```javascript
//init.js
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

Next, we insert and array array of two orders in the order table. Each order contains an orderDate, customer information, deliveryAddress, and lines for the order items. We use the customer constants "george" and "harry" from previous inserts. The second argument to "db.order.insert" specifies a fetching strategy. This fetching strategy plays a critical role in determining the depth of the data retrieved from the database after insertion. The fetching strategy specifies which associated data should be retrieved and included in the resulting orders object. In this case, the fetching strategy instructs the database to retrieve the customer, deliveryAddress, and lines for each order.

Without a fetching strategy, "db.order.insert" would only return the root level of each order. In that case you would only get the id, orderDate, and customerId for each order.
```javascript
//insert.js
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
//allRows.js
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
This script demonstrates how to fetch orders, limiting the results to 10, skipping the first row, and sorting the data based on the orderDate in descending order followed by id. The lines are sorted by product.
```javascript
//limit.js
import db from './db';

getRows();

async function getRows() {
	const orders = await db.order.getAll({
		offset: 1,
		orderBy: ['orderDate desc', 'id'],
		limit: 10
		customer: true, 
		deliveryAddress: true, 
		lines: {
			orderBy: 'product asc'
		},
	});
	console.dir(orders, {depth: Infinity});
}
```

__Many rows filtered__

```javascript
//manyRowsFiltered.js
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
//singleRowFiltered.js
import db from './db';

getRows();

async function getRows() {
	const filter = db.order.customer(customer => customer.isActive.eq(true).and(customer.startsWith('Harr')));
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
//singleRowByPrimary.js
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
//manyRowsByPrimary.js
import db from './db';

getRows();

async function getRows() {
	const order = await db.order.getMany([
			{id: 1},
			{id: 2}
		], 
		{
			customer: true, 
			deliveryAddress: true, 
			lines: true
	});
	console.dir(order, {depth: Infinity});
}
```
</details>

### [Changelog](https://github.com/alfateam/rdb/blob/master/docs/changelog.md)