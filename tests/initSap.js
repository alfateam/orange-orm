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
sysobjects WHERE type = 'U' and name = 'torder')

BEGIN
	DROP TABLE torder
END

GO

IF
EXISTS (SELECT 1 FROM
sysobjects WHERE type = 'U' and name = 'customer')

BEGIN
	DROP TABLE customer
END

GO

IF
EXISTS (SELECT 1 FROM
sysobjects WHERE type = 'U' and name = 'vendor')

BEGIN
	DROP TABLE vendor
END

GO

CREATE TABLE datetest (
    id int IDENTITY PRIMARY KEY,
    tdate DATE NULL,
    tdatetime DATETIME NULL,
    tdatetime_tz DATETIME NULL
    );
    
GO

INSERT INTO datetest (tdate, tdatetime, tdatetime_tz)
VALUES ('2023-07-14 12:00:00', '2023-07-14T12:00:00', '2023-07-14 12:00:00');

GO

CREATE TABLE customer (
    id int IDENTITY PRIMARY KEY,   
    name VARCHAR(100),
    balance NUMERIC NULL,
    isActive NUMERIC NULL,
    data TEXT NULL,
    picture VARBINARY(4000) NULL

)

GO

CREATE TABLE vendor (
    id int PRIMARY KEY,   
    name VARCHAR(100),
    balance NUMERIC,
    isActive NUMERIC NULL
)

GO

CREATE TABLE torder (
    id int IDENTITY PRIMARY KEY,
    orderDate DATETIME,
    customerId INTEGER NULL REFERENCES customer
)

GO

CREATE TABLE orderLine (
    id int IDENTITY PRIMARY KEY,
    orderId INTEGER REFERENCES torder,
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
    orderId INTEGER REFERENCES torder,
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