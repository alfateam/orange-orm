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

module.exports = async function(db) {
	const statements = sql.split(';');
	for (let i = 0; i < statements.length; i++) {
		await db.query(statements[i]);
	}
};