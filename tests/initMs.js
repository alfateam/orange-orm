const sql = `
DROP TABLE if exists orderLine;
DROP TABLE if exists deliveryAddress;
DROP TABLE if exists _order;
DROP TABLE if exists customer;

CREATE TABLE customer (
    id int IDENTITY(1,1) PRIMARY KEY,   
    name VARCHAR(100),
    balance NUMERIC,
    isActive BIT
);

CREATE TABLE _order (
    id int IDENTITY(1,1) PRIMARY KEY,
    orderDate DATETIME,
    customerId INTEGER REFERENCES customer
);

CREATE TABLE orderLine (
    id int IDENTITY(1,1) PRIMARY KEY,
    orderId INTEGER REFERENCES _order,
    product VARCHAR(100)
);

CREATE TABLE deliveryAddress (
    id int IDENTITY(1,1) PRIMARY KEY,
    orderId INTEGER REFERENCES _order,
    name VARCHAR(100), 
    street VARCHAR(100),
    postalCode VARCHAR(100),
    postalPlace VARCHAR(100),
    countryCode VARCHAR(100)
)

`;

module.exports = async function(db) {
	const statements = sql.split(';');
	for (let i = 0; i < statements.length; i++) {
		await db.query(statements[i]);
	}
};