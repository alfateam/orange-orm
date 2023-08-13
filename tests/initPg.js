const sql = `
drop schema if exists public cascade;
create schema public;

CREATE TABLE datetest (
    id SERIAL	 PRIMARY KEY,
    _date DATE,
    _datetime TIMESTAMP,
    _datetime_tz TIMESTAMP WITH TIME ZONE
);

INSERT INTO datetest (_date, _datetime, _datetime_tz)
VALUES ('2023-07-14 12:00:00+09:00', '2023-07-14 12:00:00+09:00', '2023-07-14 12:00:00-08:00');

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

CREATE TABLE package (
    packageId SERIAL PRIMARY KEY,
    lineId INTEGER REFERENCES orderLine,
    sscc TEXT
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