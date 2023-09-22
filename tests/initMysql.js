const sql = `DROP TABLE IF EXISTS deliveryAddress; DROP TABLE IF EXISTS package; DROP TABLE IF EXISTS orderLine; DROP TABLE IF EXISTS _order; DROP TABLE IF EXISTS customer;DROP TABLE IF EXISTS vendor;DROP TABLE IF EXISTS datetest;

CREATE TABLE datetest (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    _date DATE,
    _datetime DATETIME,
    _datetime_tz TIMESTAMP
);

INSERT INTO datetest (_date, _datetime, _datetime_tz)
VALUES ('2023-07-14T12:00:00+09:00', '2023-07-14T12:00:00+09:00', '2023-07-14 12:00:00-08:00');

CREATE TABLE customer (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    name TEXT,
    balance DECIMAL(10,2),
    isActive BOOLEAN,
    data JSON,
    picture BLOB
);

CREATE TABLE vendor (
    id INTEGER PRIMARY KEY,
    name TEXT,
    balance DECIMAL(10,2),
    isActive BOOLEAN    
);

CREATE TABLE _order (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    orderDate TEXT,
    customerId INTEGER REFERENCES customer
);

CREATE TABLE orderLine (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    orderId INTEGER REFERENCES _order,
    product TEXT
);

CREATE TABLE package (
    packageId INTEGER AUTO_INCREMENT PRIMARY KEY,
    lineId INTEGER REFERENCES orderLine,
    sscc TEXT
);

CREATE TABLE deliveryAddress (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
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