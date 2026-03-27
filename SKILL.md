# Orange ORM — Skills & Reference

> Authoritative reference for [context7.com](https://context7.com/alfateam/orange-orm) MCP consumption.
> Orange ORM is the ultimate Object Relational Mapper for Node.js, Bun, and Deno.
> It uses the **Active Record Pattern** with full TypeScript IntelliSense — no code generation required.
> Supports: PostgreSQL, SQLite, MySQL, MS SQL, Oracle, SAP ASE, PGlite, Cloudflare D1.
> Works in the browser via Express/Hono adapters.

## Repository maintenance note

- Treat `dist/index.mjs` and `dist/index.browser.mjs` as generated build output from the build command, not as source files to review or edit directly unless the task explicitly targets build artifacts.

---

## Table of Contents

1. [Defining a Model (Table Mapping)](#defining-a-model-table-mapping)
2. [Connecting to a Database](#connecting-to-a-database)
3. [Inserting Rows](#inserting-rows)
4. [Fetching Rows](#fetching-rows)
5. [Filtering (where)](#filtering-where)
6. [Ordering, Limit, Offset](#ordering-limit-offset)
7. [Updating Rows (saveChanges)](#updating-rows-savechanges)
8. [Deleting Rows](#deleting-rows)
9. [Relationships (hasMany, hasOne, references)](#relationships-hasmany-hasone-references)
10. [Transactions](#transactions)
11. [acceptChanges and clearChanges](#acceptchanges-and-clearchanges)
12. [Concurrency / Conflict Resolution](#concurrency--conflict-resolution)
13. [Fetching Strategies (Column Selection)](#fetching-strategies-column-selection)
14. [Aggregate Functions](#aggregate-functions)
15. [Data Types](#data-types)
16. [Enums](#enums)
17. [TypeScript Type Safety](#typescript-type-safety)
18. [Browser Usage (Express / Hono Adapters)](#browser-usage-express--hono-adapters)
19. [Raw SQL Queries](#raw-sql-queries)
20. [Logging](#logging)
21. [Bulk Operations (update, replace, updateChanges)](#bulk-operations)
22. [Batch Delete](#batch-delete)
23. [Composite Keys](#composite-keys)
24. [Discriminators](#discriminators)

---

## Defining a Model (Table Mapping)

Use `orange.map()` to define tables and columns. Each column specifies its database column name, data type, and constraints.

**IMPORTANT**: The `.map()` method maps JavaScript property names to database column names. Always call `.primary()` on primary key columns. Use `.notNullExceptInsert()` for autoincrement keys. Use `.notNull()` for required columns.

```ts
import orange from 'orange-orm';

const map = orange.map(x => ({
  product: x.table('product').map(({ column }) => ({
    id: column('id').numeric().primary().notNullExceptInsert(),
    name: column('name').string().notNull(),
    price: column('price').numeric(),
  }))
}));

export default map;
```

### Column types available

- `column('col').string()` — text/varchar
- `column('col').numeric()` — integer/decimal/float
- `column('col').bigint()` — bigint
- `column('col').boolean()` — boolean/bit
- `column('col').uuid()` — UUID as string
- `column('col').date()` — date/datetime as ISO 8601 string
- `column('col').dateWithTimeZone()` — timestamp with timezone
- `column('col').binary()` — binary/blob as base64 string
- `column('col').json()` — JSON object
- `column('col').jsonOf<T>()` — typed JSON (TypeScript generic)

### Column modifiers

- `.primary()` — marks as primary key
- `.notNull()` — required, never null
- `.notNullExceptInsert()` — required on read, optional on insert (for autoincrement keys)
- `.default(value)` — default value or factory function
- `.validate(fn)` — custom validation function
- `.JSONSchema(schema)` — AJV JSON schema validation
- `.serializable(false)` — exclude from JSON serialization
- `.enum(values)` — restrict to enum values (array, object, or TypeScript enum)

### Multiple tables example

```ts
import orange from 'orange-orm';

const map = orange.map(x => ({
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
    amount: column('amount').numeric(),
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
}));

export default map;
```

---

## Connecting to a Database

After defining your map, call a connector method to get a `db` client.

### SQLite

```ts
import map from './map';
const db = map.sqlite('demo.db');
```

With connection pool:
```ts
const db = map.sqlite('demo.db', { size: 10 });
```

### PostgreSQL

```ts
import map from './map';
const db = map.postgres('postgres://user:pass@host/dbname');
```

### MySQL

```ts
import map from './map';
const db = map.mysql('mysql://user:pass@host/dbname');
```

### MS SQL

```ts
import map from './map';
const db = map.mssql({
  server: 'mssql',
  options: { encrypt: false, database: 'test' },
  authentication: {
    type: 'default',
    options: { userName: 'sa', password: 'password' }
  }
});
```

### Oracle

```ts
import map from './map';
const db = map.oracle({ user: 'sys', password: 'pass', connectString: 'oracle/XE', privilege: 2 });
```

### PGlite (in-memory Postgres)

```ts
import map from './map';
const db = map.pglite();
```

### Cloudflare D1

```ts
import map from './map';
const db = map.d1(env.DB);
```

### HTTP (browser client)

```ts
import map from './map';
const db = map.http('http://localhost:3000/orange');
```

### Closing connections (important for serverless)

```ts
await db.close();
```

---

## Inserting Rows

Use `db.<table>.insert()` to insert one or more rows. Returns the inserted row(s) with active record methods.

### Insert a single row

```ts
import map from './map';
const db = map.sqlite('demo.db');

const product = await db.product.insert({
  name: 'Bicycle',
  price: 250
});
// product = { id: 1, name: 'Bicycle', price: 250 }
// product has .saveChanges(), .delete(), etc.
```

### Insert multiple rows

```ts
const products = await db.product.insert([
  { name: 'Bicycle', price: 250 },
  { name: 'Guitar', price: 150 }
]);
```

### Insert with a fetching strategy

The second argument controls which relations to eager-load after insert:

```ts
const order = await db.order.insert({
  orderDate: new Date(),
  customer: george,
  deliveryAddress: {
    name: 'George',
    street: 'Node street 1',
    postalCode: '7059',
    postalPlace: 'Jakobsli',
    countryCode: 'NO'
  },
  lines: [
    { product: 'Bicycle', amount: 250 },
    { product: 'Guitar', amount: 150 }
  ]
}, { customer: true, deliveryAddress: true, lines: true });
```

### Insert and forget (no return value)

```ts
await db.product.insertAndForget({ name: 'Bicycle', price: 250 });
```

---

## Fetching Rows

### Get all rows

```ts
const products = await db.product.getMany();
```

### Get a single row by primary key (getById)

```ts
const product = await db.product.getById(1);
// Returns the row or undefined if not found
```

With a fetching strategy:
```ts
const order = await db.order.getById(1, {
  customer: true,
  deliveryAddress: true,
  lines: true
});
```

### Composite primary key getById

```ts
const line = await db.orderLine.getById('typeA', 100, 1);
// Arguments match the order of primary key columns
```

### Get one row (first match)

```ts
const product = await db.product.getOne({
  where: x => x.name.eq('Bicycle')
});
```

### Get many rows with a fetching strategy

```ts
const orders = await db.order.getMany({
  customer: true,
  deliveryAddress: true,
  lines: {
    packages: true
  }
});
```

---

## Filtering (where)

Use the `where` option in `getMany` or `getOne`. The callback receives a row reference with column filter methods.

### Comparison operators

All column types support:
- `.equal(value)` / `.eq(value)` — equal
- `.notEqual(value)` / `.ne(value)` — not equal
- `.lessThan(value)` / `.lt(value)` — less than
- `.lessThanOrEqual(value)` / `.le(value)` — less than or equal
- `.greaterThan(value)` / `.gt(value)` — greater than
- `.greaterThanOrEqual(value)` / `.ge(value)` — greater than or equal
- `.between(from, to)` — between two values (inclusive)
- `.in(values)` — in a list of values

String columns also support:
- `.startsWith(value)` — starts with
- `.endsWith(value)` — ends with
- `.contains(value)` — contains substring
- `.iStartsWith(value)`, `.iEndsWith(value)`, `.iContains(value)`, `.iEqual(value)` — case-insensitive (Postgres only)

### Filter by column value

```ts
const products = await db.product.getMany({
  where: x => x.price.greaterThan(50),
  orderBy: 'name'
});
```

### Combining filters with and/or/not

```ts
const products = await db.product.getMany({
  where: x => x.price.greaterThan(50)
    .and(x.name.startsWith('B'))
});

const products = await db.product.getMany({
  where: x => x.name.eq('Bicycle')
    .or(x.name.eq('Guitar'))
});

const products = await db.product.getMany({
  where: x => x.name.eq('Bicycle').not()
});
```

### Filter across relations

```ts
const orders = await db.order.getMany({
  where: x => x.customer.name.startsWith('Harry')
    .and(x.lines.any(line => line.product.contains('broomstick'))),
  customer: true,
  lines: true
});
```

### Relation sub-filters: any, all, none, count

```ts
// Orders that have at least one line containing 'guitar'
const rows = await db.order.getMany({
  where: x => x.lines.any(line => line.product.contains('guitar'))
});

// Orders where ALL lines contain 'a'
const rows = await db.order.getMany({
  where: x => x.lines.all(line => line.product.contains('a'))
});

// Orders with NO lines equal to 'Magic wand'
const rows = await db.order.getMany({
  where: x => x.lines.none(line => line.product.eq('Magic wand'))
});

// Orders with at most 1 line
const rows = await db.order.getMany({
  where: x => x.lines.count().le(1)
});
```

### exists filter

```ts
const rows = await db.order.getMany({
  where: x => x.deliveryAddress.exists()
});
```

### Building filters separately (reusable)

```ts
const filter = db.order.customer.name.startsWith('Harry');
const orders = await db.order.getMany({
  where: filter,
  customer: true
});
```

### Column-to-column comparison

```ts
const orders = await db.order.getMany({
  where: x => x.deliveryAddress.name.eq(x.customer.name)
});
```

### Raw SQL filter

```ts
const rows = await db.customer.getMany({
  where: () => ({
    sql: 'name like ?',
    parameters: ['%arry']
  })
});
```

---

## Ordering, Limit, Offset

```ts
const products = await db.product.getMany({
  orderBy: 'name',
  limit: 10,
  offset: 5
});
```

### Multiple order-by columns

```ts
const products = await db.product.getMany({
  orderBy: ['price desc', 'name']
});
```

### Ordering within relations

```ts
const orders = await db.order.getMany({
  orderBy: ['orderDate desc', 'id'],
  lines: {
    orderBy: 'product'
  }
});
```

### Complete example: filter + order + limit

```ts
const products = await db.product.getMany({
  where: x => x.price.greaterThan(50),
  orderBy: 'name',
  limit: 10,
  offset: 0
});
```

---

## Updating Rows (saveChanges)

Orange uses the **Active Record Pattern**. Fetch a row, modify its properties, then call `saveChanges()`. Only changed columns are sent to the database.

### Update a single row

```ts
const product = await db.product.getById(1);
product.price = 299;
await product.saveChanges();
```

### Update related rows (hasMany / hasOne)

```ts
const order = await db.order.getById(1, {
  deliveryAddress: true,
  lines: true
});

order.orderDate = new Date();
order.deliveryAddress = null;                             // deletes the hasOne child
order.lines.push({ product: 'Cloak of invisibility', amount: 600 }); // adds a new line

await order.saveChanges();
```

### Update multiple rows at once

```ts
let orders = await db.order.getMany({
  orderBy: 'id',
  lines: true,
  deliveryAddress: true,
  customer: true
});

orders[0].orderDate = new Date();
orders[0].deliveryAddress.street = 'Node street 2';
orders[0].lines[1].product = 'Big guitar';

orders[1].deliveryAddress = null;
orders[1].lines.push({ product: 'Cloak of invisibility', amount: 600 });

await orders.saveChanges();
```

### Selective update (bulk) with where

```ts
await db.order.update(
  { orderDate: new Date() },
  { where: x => x.id.eq(1) }
);
```

### Replace a row from JSON (complete overwrite)

```ts
const order = await db.order.replace({
  id: 1,
  orderDate: '2023-07-14T12:00:00',
  customer: { id: 2 },
  deliveryAddress: { name: 'Roger', street: 'Node street 1', postalCode: '7059', postalPlace: 'Jakobsli', countryCode: 'NO' },
  lines: [
    { id: 1, product: 'Bicycle', amount: 250 },
    { product: 'Piano', amount: 800 }
  ]
}, { customer: true, deliveryAddress: true, lines: true });
```

### Partial update from JSON diff (updateChanges)

```ts
const original = { id: 1, orderDate: '2023-07-14T12:00:00', lines: [{ id: 1, product: 'Bicycle', amount: 250 }] };
const modified = JSON.parse(JSON.stringify(original));
modified.lines.push({ product: 'Piano', amount: 800 });

const order = await db.order.updateChanges(modified, original, { lines: true });
```

---

## Deleting Rows

### Delete a single row

```ts
const product = await db.product.getById(1);
await product.delete();
```

### Delete an element from an array then save

```ts
const orders = await db.order.getMany({ lines: true });
orders.splice(1, 1);            // remove second order
await orders.saveChanges();      // persists the deletion
```

### Delete many rows (filtered)

```ts
const orders = await db.order.getMany({
  where: x => x.customer.name.eq('George')
});
await orders.delete();
```

### Batch delete by filter

```ts
const filter = db.order.deliveryAddress.name.eq('George');
await db.order.delete(filter);
```

### Batch delete cascade

Cascade deletes also remove child rows (hasOne/hasMany):

```ts
const filter = db.order.deliveryAddress.name.eq('George');
await db.order.deleteCascade(filter);
```

### Batch delete by primary key

```ts
await db.customer.delete([{ id: 1 }, { id: 2 }]);
```

---

## Relationships (hasMany, hasOne, references)

Relationships are defined in a second `.map()` call chained after the table definitions.

- **`hasMany(targetTable).by('foreignKeyColumn')`** — one-to-many. The target table has a foreign key pointing to the parent's primary key. The parent *owns* the children (cascade delete). Returns an **array**.
- **`hasOne(targetTable).by('foreignKeyColumn')`** — one-to-one. This is a special case of `hasMany` — the database models them identically (the target table has a foreign key pointing to the parent's primary key). The only difference is that `hasOne` returns a **single object** (or null) instead of an array. The parent *owns* the child (cascade delete).
- **`references(targetTable).by('foreignKeyColumn')`** — many-to-one. This is the **opposite direction** from `hasMany`/`hasOne`: the *current* table has a foreign key pointing to the target's primary key. The target is independent (no cascade delete). Returns a **single object** (or null).

### Example: Author and Book (one-to-many)

```ts
import orange from 'orange-orm';

const map = orange.map(x => ({
  author: x.table('author').map(({ column }) => ({
    id: column('id').numeric().primary().notNullExceptInsert(),
    name: column('name').string().notNull(),
  })),

  book: x.table('book').map(({ column }) => ({
    id: column('id').numeric().primary().notNullExceptInsert(),
    authorId: column('authorId').numeric().notNull(),
    title: column('title').string().notNull(),
    year: column('year').numeric(),
  }))
})).map(x => ({
  author: x.author.map(({ hasMany }) => ({
    books: hasMany(x.book).by('authorId')
  })),
  book: x.book.map(({ references }) => ({
    author: references(x.author).by('authorId')
  }))
}));

export default map;
```

### Query author with all their books

```ts
import map from './map';
const db = map.sqlite('demo.db');

const author = await db.author.getById(1, {
  books: true
});
// author.books is an array of { id, authorId, title, year }
console.log(author.name);
author.books.forEach(book => console.log(book.title));
```

### Query with nested relations

```ts
const orders = await db.order.getMany({
  customer: true,
  deliveryAddress: true,
  lines: {
    packages: true
  }
});
```

### Insert with nested relations

```ts
const order = await db.order.insert({
  orderDate: new Date(),
  customer: george,
  deliveryAddress: { name: 'George', street: 'Main St', postalCode: '12345', postalPlace: 'City', countryCode: 'US' },
  lines: [
    { product: 'Widget', amount: 100 }
  ]
}, { customer: true, deliveryAddress: true, lines: true });
```

### Relationship ownership rules

- `hasMany` / `hasOne` = parent **owns** children. Deleting the parent cascades to children. Updating the parent can insert/update/delete children.
- `references` = independent reference. Deleting the referencing row does NOT delete the referenced row. You can set the reference to null to detach it.

---

## Transactions

Wrap operations in `db.transaction()`. Use the `tx` parameter for all operations inside the transaction. If the callback throws, the transaction is rolled back.

```ts
import map from './map';
const db = map.sqlite('demo.db');

await db.transaction(async (tx) => {
  const customer = await tx.customer.insert({
    name: 'Alice',
    balance: 100,
    isActive: true
  });

  const order = await tx.order.insert({
    orderDate: new Date(),
    customer: customer,
    lines: [
      { product: 'Widget', amount: 50 }
    ]
  }, { customer: true, lines: true });

  // If anything throws here, both inserts are rolled back
});
```

### Transaction with saveChanges

```ts
await db.transaction(async (tx) => {
  const customer = await tx.customer.getById(1);
  customer.balance = customer.balance + 50;
  await customer.saveChanges();

  // This throw will rollback the balance update
  throw new Error('This will rollback');
});
```

### Active record methods work inside transactions

The `saveChanges()` method on rows fetched via the `tx` object runs within that transaction:

```ts
await db.transaction(async (tx) => {
  const order = await tx.order.getById(1, { lines: true });
  order.lines.push({ product: 'New item', amount: 100 });
  await order.saveChanges();
  // Committed when the callback completes without error
});
```

**NOTE**: Transactions are not supported for Cloudflare D1.

---

## acceptChanges and clearChanges

These are **synchronous** Active Record methods available on both individual rows and arrays returned by `getMany`, `getById`, `insert`, etc.

### acceptChanges()

Marks the current in-memory values as the new "original" baseline for change tracking. After calling `acceptChanges()`, the ORM treats the current property values as the unchanged state. This means a subsequent `saveChanges()` will only send properties modified *after* the `acceptChanges()` call.

**Use case**: You have modified a row in memory but want to skip persisting those changes. Or you want to reset the change-tracking baseline after performing your own custom persistence logic.

```ts
const product = await db.product.getById(1);
product.name = 'New name';
product.price = 999;

// Instead of saving, accept the changes as the new baseline
product.acceptChanges();

// Now modifying only price:
product.price = 500;
await product.saveChanges(); // Only sends price=500 to the DB (name='New name' is already accepted)
```

On arrays:
```ts
const orders = await db.order.getMany({ lines: true });
orders[0].lines.push({ product: 'Temporary', amount: 0 });
orders.acceptChanges(); // Accepts the current array state as the baseline
```

### clearChanges()

Reverts the row (or array) back to the last accepted/original state. It **undoes all in-memory mutations** since the last `acceptChanges()` (or since the row was fetched).

**Use case**: The user cancels an edit form and you want to revert to the original database state without re-fetching.

```ts
const product = await db.product.getById(1);
// product.name = 'Bicycle'

product.name = 'Changed name';
product.price = 999;

product.clearChanges();
// product.name is back to 'Bicycle'
// product.price is back to the original value
```

On arrays:
```ts
const orders = await db.order.getMany({ lines: true });
orders[0].lines.push({ product: 'Temporary', amount: 0 });
orders.clearChanges(); // Reverts the array to its original state
```

### How they relate to saveChanges and refresh

- `saveChanges()` internally calls `acceptChanges()` after successfully persisting to the database.
- `refresh()` reloads from the database and then calls `acceptChanges()`.
- `clearChanges()` reverts to the last accepted state without hitting the database.

---

## Concurrency / Conflict Resolution

Orange uses **optimistic concurrency** by default. If a property was changed by another user between fetch and save, an exception is thrown.

### Three strategies

- **`optimistic`** (default) — throws if the row was changed by another user.
- **`overwrite`** — overwrites regardless of interim changes.
- **`skipOnConflict`** — silently skips the update if the row was modified.

### Set concurrency per-column on saveChanges

```ts
const order = await db.order.getById(1);
order.orderDate = new Date();
await order.saveChanges({
  orderDate: { concurrency: 'overwrite' }
});
```

### Set concurrency at the table level

```ts
const db2 = db({
  vendor: {
    balance: { concurrency: 'skipOnConflict' },
    concurrency: 'overwrite'
  }
});
```

### Upsert using overwrite strategy

```ts
const db2 = db({ vendor: { concurrency: 'overwrite' } });
await db2.vendor.insert({ id: 1, name: 'John', balance: 100, isActive: true });
// Insert again with same id — overwrites instead of throwing
await db2.vendor.insert({ id: 1, name: 'George', balance: 200, isActive: false });
```

---

## Fetching Strategies (Column Selection)

Control which columns and relations to include in query results.

### Include a relation

```ts
const orders = await db.order.getMany({ deliveryAddress: true });
```

### Exclude a column

```ts
const orders = await db.order.getMany({ orderDate: false });
// Returns all columns except orderDate
```

### Include only specific columns of a relation

```ts
const orders = await db.order.getMany({
  deliveryAddress: {
    countryCode: true,
    name: true
  }
});
```

### Filter within a relation

```ts
const orders = await db.order.getMany({
  lines: {
    where: x => x.product.contains('broomstick')
  },
  customer: true
});
```

---

## Aggregate Functions

Supported: `count`, `sum`, `min`, `max`, `avg`.

### Aggregates on each row

```ts
const orders = await db.order.getMany({
  numberOfLines: x => x.count(x => x.lines.id),
  totalAmount: x => x.sum(x => x.lines.amount),
  balance: x => x.customer.balance         // elevate related data
});
```

### Aggregates across all rows (group by)

```ts
const results = await db.order.aggregate({
  where: x => x.orderDate.greaterThan(new Date(2022, 0, 1)),
  customerId: x => x.customerId,
  customerName: x => x.customer.name,
  numberOfLines: x => x.count(x => x.lines.id),
  totals: x => x.sum(x => x.lines.amount)
});
```

### Count rows

```ts
const count = await db.order.count();

// With a filter:
const filter = db.order.lines.any(line => line.product.contains('broomstick'));
const count = await db.order.count(filter);
```

---

## Data Types

| Orange Type         | JS Type          | SQL Types                                    |
|---------------------|------------------|----------------------------------------------|
| `string()`          | `string`         | VARCHAR, TEXT                                 |
| `numeric()`         | `number`         | INTEGER, DECIMAL, FLOAT, REAL, DOUBLE        |
| `bigint()`          | `bigint`         | BIGINT, INTEGER                              |
| `boolean()`         | `boolean`        | BIT, TINYINT(1), INTEGER                     |
| `uuid()`            | `string`         | UUID, GUID, VARCHAR                          |
| `date()`            | `string \| Date` | DATE, DATETIME, TIMESTAMP                    |
| `dateWithTimeZone()`| `string \| Date` | TIMESTAMP WITH TIME ZONE, DATETIMEOFFSET     |
| `binary()`          | `string` (base64)| BLOB, BYTEA, VARBINARY                       |
| `json()`            | `object`         | JSON, JSONB, NVARCHAR, TEXT                  |
| `jsonOf<T>()`       | `T`              | JSON, JSONB, NVARCHAR, TEXT (typed)          |

```ts
import orange from 'orange-orm';

const map = orange.map(x => ({
  demo: x.table('demo').map(x => ({
    id: x.column('id').uuid().primary().notNull(),
    name: x.column('name').string(),
    balance: x.column('balance').numeric(),
    regularDate: x.column('regularDate').date(),
    tzDate: x.column('tzDate').dateWithTimeZone(),
    picture: x.column('picture').binary(),
    isActive: x.column('isActive').boolean(),
    pet: x.column('pet').jsonOf<{ name: string; kind: string }>(),
    data: x.column('data').json(),
  }))
}));
```

---

## Enums

Enums can be defined using arrays, objects, `as const`, or TypeScript enums.

```ts
// Array
countryCode: column('countryCode').string().enum(['NO', 'SE', 'DK', 'FI'])

// TypeScript enum
enum CountryCode { NORWAY = 'NO', SWEDEN = 'SE' }
countryCode: column('countryCode').string().enum(CountryCode)

// as const object
const Countries = { NORWAY: 'NO', SWEDEN: 'SE' } as const;
countryCode: column('countryCode').string().enum(Countries)
```

---

## TypeScript Type Safety

Orange provides full IntelliSense without code generation. The `map()` function returns a fully typed `db` object.

### Type-safe property access

```ts
const product = await db.product.getById(1);
// product.name is typed as string | null | undefined
// product.price is typed as number | null | undefined
// product.id is typed as number (notNull)
```

### Type-safe inserts

```ts
// TypeScript error: 'name' is required (notNull)
await db.product.insert({ price: 100 });

// OK: 'id' is optional because of notNullExceptInsert
await db.product.insert({ name: 'Widget', price: 100 });
```

### Type-safe filters

```ts
// TypeScript error: greaterThan expects number, not string
db.product.getMany({ where: x => x.price.greaterThan('fifty') });

// OK
db.product.getMany({ where: x => x.price.greaterThan(50) });
```

### Extract TypeScript types from your map

```ts
type Product = ReturnType<typeof db.product.tsType>;
// { id: number; name?: string | null; price?: number | null }

type ProductWithRelations = ReturnType<typeof db.order.tsType<{ lines: true; customer: true }>>;
```

---

## Browser Usage (Express / Hono Adapters)

Orange can run in the browser. The Express/Hono adapter replays client-side method calls on the server, never exposing raw SQL.

### Server (Express)

```ts
import map from './map';
import { json } from 'body-parser';
import express from 'express';
import cors from 'cors';

const db = map.sqlite('demo.db');

express().disable('x-powered-by')
  .use(json({ limit: '100mb' }))
  .use(cors())
  .use('/orange', db.express())
  .listen(3000);
```

### Server (Hono)

```ts
import map from './map';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';

const db = map.sqlite('demo.db');
const app = new Hono();

app.use('/orange', cors());
app.use('/orange/*', cors());
app.all('/orange', db.hono());
app.all('/orange/*', db.hono());

serve({ fetch: app.fetch, port: 3000 });
```

### Browser client

```ts
import map from './map';

const db = map.http('http://localhost:3000/orange');

const orders = await db.order.getMany({
  where: x => x.customer.name.startsWith('Harry'),
  lines: true
});
```

### Interceptors (authentication)

```ts
db.interceptors.request.use((config) => {
  config.headers.Authorization = 'Bearer <token>';
  return config;
});
```

### Base filter (row-level security)

```ts
.use('/orange', db.express({
  order: {
    baseFilter: (db, req, _res) => {
      const customerId = Number(req.headers.authorization.split(' ')[1]);
      return db.order.customerId.eq(customerId);
    }
  }
}))
```

### Transaction hooks (e.g., Postgres RLS)

```ts
.use('/orange', db.express({
  hooks: {
    transaction: {
      afterBegin: async (db, req) => {
        await db.query('set local role rls_app_user');
        await db.query({ sql: "select set_config('app.tenant_id', ?, true)", parameters: [tenantId] });
      }
    }
  }
}))
```

---

## Raw SQL Queries

```ts
const rows = await db.query({
  sql: 'SELECT * FROM customer WHERE name LIKE ?',
  parameters: ['%arry']
});
```

Raw SQL queries are **blocked via HTTP/browser clients** (returns 403) to prevent SQL injection.

---

## Logging

```ts
import orange from 'orange-orm';

orange.on('query', (e) => {
  console.log(e.sql);
  if (e.parameters.length > 0) console.log(e.parameters);
});
```

---

## Bulk Operations

### update (selective bulk update)

```ts
await db.order.update(
  { orderDate: new Date(), customerId: 2 },
  { where: x => x.id.eq(1) }
);

// With fetching strategy to return updated rows:
const orders = await db.order.update(
  { orderDate: new Date() },
  { where: x => x.id.eq(1) },
  { customer: true, lines: true }
);
```

### replace (complete overwrite from JSON)

```ts
await db.order.replace({
  id: 1,
  orderDate: '2023-07-14',
  lines: [{ id: 1, product: 'Bicycle', amount: 250 }]
}, { lines: true });
```

### updateChanges (partial diff update)

```ts
const original = { id: 1, name: 'George' };
const modified = { id: 1, name: 'Harry' };
await db.customer.updateChanges(modified, original);
```

---

## Batch Delete

```ts
// By filter
await db.order.delete(db.order.customer.name.eq('George'));

// Cascade (also deletes children)
await db.order.deleteCascade(db.order.customer.name.eq('George'));

// By primary keys
await db.customer.delete([{ id: 1 }, { id: 2 }]);
```

---

## Composite Keys

Mark multiple columns as `.primary()`:

```ts
const map = orange.map(x => ({
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
```

---

## Discriminators

### Column discriminators

Automatically set a discriminator column value on insert and filter by it on read/delete:

```ts
const map = orange.map(x => ({
  customer: x.table('client').map(({ column }) => ({
    id: column('id').numeric().primary(),
    name: column('name').string()
  })).columnDiscriminators(`client_type='customer'`),

  vendor: x.table('client').map(({ column }) => ({
    id: column('id').numeric().primary(),
    name: column('name').string()
  })).columnDiscriminators(`client_type='vendor'`),
}));
```

### Formula discriminators

Use a logical expression instead of a static column value:

```ts
const map = orange.map(x => ({
  customerBooking: x.table('booking').map(({ column }) => ({
    id: column('id').uuid().primary(),
    bookingNo: column('booking_no').numeric()
  })).formulaDiscriminators('@this.booking_no between 10000 and 99999'),

  internalBooking: x.table('booking').map(({ column }) => ({
    id: column('id').uuid().primary(),
    bookingNo: column('booking_no').numeric()
  })).formulaDiscriminators('@this.booking_no between 1000 and 9999'),
}));
```

---

## SQLite User-Defined Functions

```ts
const db = map.sqlite('demo.db');

await db.function('add_prefix', (text, prefix) => `${prefix}${text}`);

const rows = await db.query(
  "select id, name, add_prefix(name, '[VIP] ') as prefixedName from customer"
);
```

---

## Default Values

```ts
import orange from 'orange-orm';
import crypto from 'crypto';

const map = orange.map(x => ({
  myTable: x.table('myTable').map(({ column }) => ({
    id: column('id').uuid().primary().default(() => crypto.randomUUID()),
    name: column('name').string(),
    isActive: column('isActive').boolean().default(true),
  }))
}));
```

---

## Validation

```ts
function validateName(value?: string) {
  if (value && value.length > 10)
    throw new Error('Length cannot exceed 10 characters');
}

const map = orange.map(x => ({
  demo: x.table('demo').map(x => ({
    id: x.column('id').uuid().primary().notNullExceptInsert(),
    name: x.column('name').string().validate(validateName),
    pet: x.column('pet').jsonOf<Pet>().JSONSchema(petSchema),
  }))
}));
```

---

## Excluding Sensitive Data

```ts
const map = orange.map(x => ({
  customer: x.table('customer').map(({ column }) => ({
    id: column('id').numeric().primary().notNullExceptInsert(),
    name: column('name').string(),
    balance: column('balance').numeric().serializable(false),
  }))
}));

// When serialized: balance is excluded
const george = await db.customer.insert({ name: 'George', balance: 177 });
JSON.stringify(george); // '{"id":1,"name":"George"}'
```

---

## Quick Reference: Active Record Methods

Methods available on rows returned by `getMany`, `getById`, `getOne`, `insert`:

| Method | On row | On array | Description |
|--------|--------|----------|-------------|
| `saveChanges()` | ✅ | ✅ | Persist modified properties to the database |
| `saveChanges(concurrency)` | ✅ | ✅ | Persist with concurrency strategy |
| `acceptChanges()` | ✅ | ✅ | Accept current values as the new baseline (sync) |
| `clearChanges()` | ✅ | ✅ | Revert to last accepted/original state (sync) |
| `refresh()` | ✅ | ✅ | Reload from database |
| `refresh(strategy)` | ✅ | ✅ | Reload with fetching strategy |
| `delete()` | ✅ | ✅ | Delete the row(s) from the database |

---

## Quick Reference: Table Client Methods

Methods available on `db.<tableName>`:

| Method | Description |
|--------|-------------|
| `getMany(strategy?)` | Fetch multiple rows with optional filter/strategy |
| `getOne(strategy?)` | Fetch first matching row |
| `getById(...keys, strategy?)` | Fetch by primary key |
| `insert(row, strategy?)` | Insert one row |
| `insert(rows, strategy?)` | Insert multiple rows |
| `insertAndForget(row)` | Insert without returning |
| `update(props, {where}, strategy?)` | Bulk update matching rows |
| `replace(row, strategy?)` | Complete overwrite from JSON |
| `updateChanges(modified, original, strategy?)` | Partial diff update |
| `delete(filter?)` | Batch delete |
| `deleteCascade(filter?)` | Batch delete with cascade |
| `count(filter?)` | Count matching rows |
| `aggregate(strategy)` | Aggregate query (group by) |
| `proxify(row, strategy?)` | Wrap plain object with active record methods |
