const sql = `
DROP TABLE if exists orderLine;
DROP TABLE if exists deliveryAddress;
DROP TABLE if exists _order;
DROP TABLE if exists customer;

CREATE TABLE customer (
    id int IDENTITY(1,1) PRIMARY KEY,   
    name TEXT,
    balance NUMERIC,
    isActive BIT
);

CREATE TABLE _order (
    id int IDENTITY(1,1) PRIMARY KEY,
    orderDate TIMESTAMP,
    customerId INTEGER REFERENCES customer
);

CREATE TABLE orderLine (
    id int IDENTITY(1,1) PRIMARY KEY,
    orderId INTEGER REFERENCES _order,
    product TEXT
);

CREATE TABLE deliveryAddress (
    id int IDENTITY(1,1) PRIMARY KEY,
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