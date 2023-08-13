const sql = `
DROP TABLE if exists package;
DROP TABLE if exists orderLine;
DROP TABLE if exists deliveryAddress;
DROP TABLE if exists _order;
DROP TABLE if exists customer;
DROP TABLE if exists datetest;

CREATE TABLE datetest (
    id int IDENTITY(1,1) PRIMARY KEY,
    _date DATE,
    _datetime DATETIME,
    _datetime_tz DATETIMEOFFSET
);

INSERT INTO datetest (_date, _datetime, _datetime_tz)
VALUES ('2023-07-14 12:00:00', '2023-07-14 12:00:00', '2023-07-14T12:00:00-08:00');

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
CREATE TABLE package (
    packageId int IDENTITY(1,1) PRIMARY KEY,
    lineId INTEGER REFERENCES orderLine,
    sscc VARCHAR(100)
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