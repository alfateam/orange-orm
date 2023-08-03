![RDB](./docs/logo-sm.jpg)  
RDB is the ultimate Object Relational Mapper for Node.js, offering seamless integration with popular databases like Postgres, MS SQL, MySQL, Sybase SAP, and SQLite. Whether you're building applications in TypeScript or JavaScript  (including both CommonJS and ECMAScript), RDB has got you covered.

## Key Features

- **Rich Querying Model**: RDB provides a powerful and intuitive querying model, making it easy to retrieve, filter, and manipulate data from your databases.
- **Concise API**: With a concise and developer-friendly API, RDB enables you to interact with your database using simple and expressive syntax.
- **No Code Generation Required**: Enjoy full IntelliSense, even in table mappings, without the need for cumbersome code generation.
- **TypeScript and JavaScript Support**: RDB fully supports both TypeScript and JavaScript, allowing you to leverage the benefits of static typing and modern ECMAScript features.
- **Works in the Browser**: RDB even works in the browser through hosting in Express, giving you the flexibility to build web applications with ease     .

## Installation
`npm install rdb`  

## Basics    
<details open><summary><strong>Mapping tables</strong></summary><blockquote style="background: transparent">
To define a mapping, you employ the <strong><i>map()</i></strong> method, linking your tables and columns to corresponding object properties. You provide a callback function that engages with a parameter representing a database table.

Each column within your database table is designated by using the <strong><i>column()</i></strong> method, in which you specify its name. This action generates a reference to a column object that enables you to articulate further column properties like its data type or if it serves as a primary key.

Relationships between tables can also be outlined. By using methods like <strong><i>hasOne</i></strong>, <strong><i>hasMany</i></strong>, and <strong><i>references</i></strong>, you can establish connections that reflect the relationships in your data schema. In this example, an 'order' is linked to a 'customer' reference, a 'deliveryAddress', and multiple 'lines'. The hasMany and hasOne relations represents ownership - the tables 'deliveryAddress' and 'orderLine' are owned by the 'order' table, and therefore, they contain the 'orderId' column referring to their parent table, which is 'order'. Conversely, the customer table is independent and can exist without any knowledge of the 'order' table. Therefore we say that the order table <i>references</i> the customer table - necessitating the existence of a 'customerId' column in the 'order' table.

```javascript
//db.js
import rdb from 'rdb';

const map = rdb.map(x => ({
	customer: x.table('customer').map(({ column }) => ({
		id: column('id').numeric().primary(),
		name: column('name').string(),
		balance: column('balance').numeric(),
		isActive: column('isActive').boolean(),
	})),

	order: x.table('_order').map(({ column }) => ({
		id: column('id').numeric().primary(),
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

export default map.sqlite('demo.db');
```
The initSql.js script resets our SQLite database. It's worth noting that SQLite databases are represented as single files, which makes them wonderfully straightforward to manage.

At the start of the script, we import our database mapping from the db.js file. This gives us access to the db object, which we'll use to interact with our SQLite database.

Then, we define a SQL string. This string outlines the structure of our SQLite database. It first specifies to drop existing tables named 'deliveryAddress', 'orderLine', '_order', and 'customer' if they exist. This ensures we have a clean slate. Then, it dictates how to create these tables anew with the necessary columns and constraints.

Because of a peculiarity in SQLite, which only allows one statement execution at a time, we split this SQL string into separate statements. We do this using the split() method, which breaks up the string at every semicolon.
```javascript
//initSql.js
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

const statements = sql.split(';');
for (let i = 0; i < statements.length; i++) {
	await db.query(statements[i]);
}
```
</details>