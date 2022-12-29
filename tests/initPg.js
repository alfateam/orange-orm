const sql = `
drop schema public cascade;
create schema public;

CREATE TABLE customer (
    id SERIAL	 PRIMARY KEY,
    name TEXT,
    balance NUMERIC,
    isActive BOOLEAN
);

CREATE TABLE _order (
    id SERIAL PRIMARY KEY,
    orderDate TIMESTAMP,
    customerId INTEGER REFERENCES customer
);

CREATE TABLE orderLine (
    id SERIAL PRIMARY KEY,
    orderId INTEGER REFERENCES _order,
    product TEXT
);

CREATE TABLE deliveryAddress (
    id SERIAL PRIMARY KEY,
    orderId INTEGER REFERENCES _order,
    name TEXT, 
    street TEXT,
    postalCode TEXT,
    postalPlace TEXT,
    countryCode TEXT
)

`;

module.exports = async function(db) {
	const statements = sql.split(';');
	for (let i = 0; i < statements.length; i++) {
		await db.query(statements[i]);
	}
};