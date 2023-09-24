const sql = `DROP TABLE IF EXISTS deliveryAddress; DROP TABLE IF EXISTS package; DROP TABLE IF EXISTS orderLine; DROP TABLE IF EXISTS _order; DROP TABLE IF EXISTS customer;DROP TABLE IF EXISTS vendor; DROP TABLE IF EXISTS datetest;
CREATE TABLE customer (
    id INTEGER PRIMARY KEY,
    name TEXT,
    balance NUMERIC,
    isActive INTEGER,
    data JSONB,
    picture BLOB
);

CREATE TABLE vendor (
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

CREATE TABLE package (
    packageId INTEGER PRIMARY KEY,
    lineId INTEGER REFERENCES orderLine,
    sscc TEXT
);

CREATE TABLE deliveryAddress (
    id INTEGER PRIMARY KEY,
    orderId INTEGER REFERENCES _order,
    name TEXT, 
    street TEXT,
    postalCode TEXT,
    postalPlace TEXT,
    countryCode TEXT
);

CREATE TABLE datetest (
    id INTEGER PRIMARY KEY,
    _date TEXT,
    _datetime TEXT,
    _datetime_tz TEXT
);
    

INSERT INTO datetest (id, _date, _datetime, _datetime_tz) VALUES (1, '2023-07-14T12:00:00', '2023-07-14T12:00:00', '2023-07-14T12:00:00-08:00')


`;

module.exports = async function(db) {
	const statements = sql.split(';');
	for (let i = 0; i < statements.length; i++) {
		await db.query(statements[i]);
	}
};