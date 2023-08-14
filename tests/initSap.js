const sql = `
IF
EXISTS (SELECT 1 FROM
sysobjects WHERE type = 'U' and name = 'datetest')

BEGIN
	DROP TABLE datetest
END

GO

IF EXISTS (SELECT 1 FROM
sysobjects WHERE type = 'U' and name = 'package')

BEGIN
    DROP TABLE package
END

GO

IF
EXISTS (SELECT 1 FROM
    sysobjects WHERE type = 'U' and name = 'orderLine')

BEGIN
	DROP TABLE orderLine
END

GO

IF
EXISTS (SELECT 1 FROM
sysobjects WHERE type = 'U' and name = 'deliveryAddress')

BEGIN
	DROP TABLE deliveryAddress
END


GO

IF
EXISTS (SELECT 1 FROM
sysobjects WHERE type = 'U' and name = '_order')

BEGIN
	DROP TABLE _order
END

GO

IF
EXISTS (SELECT 1 FROM
sysobjects WHERE type = 'U' and name = 'customer')

BEGIN
	DROP TABLE customer
END

GO

CREATE TABLE datetest (
    id int IDENTITY PRIMARY KEY,
    _date DATE,
    _datetime DATETIME,
    _datetime_tz DATETIME
    );
    
GO

INSERT INTO datetest (_date, _datetime, _datetime_tz)
VALUES ('2023-07-14 12:00:00', '2023-07-14T12:00:00', '2023-07-14 12:00:00');

GO

CREATE TABLE customer (
    id int IDENTITY PRIMARY KEY,   
    name VARCHAR(100),
    balance NUMERIC,
    isActive BIT
)

GO

CREATE TABLE _order (
    id int IDENTITY PRIMARY KEY,
    orderDate DATETIME,
    customerId INTEGER NULL REFERENCES customer
)

GO

CREATE TABLE orderLine (
    id int IDENTITY PRIMARY KEY,
    orderId INTEGER REFERENCES _order,
    product VARCHAR(100)
)

GO

CREATE TABLE package (
    packageId int IDENTITY PRIMARY KEY,
    lineId INTEGER REFERENCES orderLine,
    sscc VARCHAR(100)
);

GO

CREATE TABLE deliveryAddress (
    id int IDENTITY PRIMARY KEY,
    orderId INTEGER REFERENCES _order,
    name VARCHAR(100), 
    street VARCHAR(100),
    postalCode VARCHAR(100),
    postalPlace VARCHAR(100),
    countryCode VARCHAR(100)
)

`;

module.exports = async function(db) {
	const statements = sql.split('GO');
	for (let i = 0; i < statements.length; i++) {
		await db.query(statements[i]);
	}
};