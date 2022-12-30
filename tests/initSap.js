const sql = `
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

CREATE TABLE customer (
    id int IDENTITY PRIMARY KEY,   
    name TEXT,
    balance NUMERIC,
    isActive BIT
)

GO

CREATE TABLE _order (
    id int IDENTITY PRIMARY KEY,
    orderDate DATETIME,
    customerId INTEGER REFERENCES customer
)

GO

CREATE TABLE orderLine (
    id int IDENTITY PRIMARY KEY,
    orderId INTEGER REFERENCES _order,
    product TEXT
)

GO

CREATE TABLE deliveryAddress (
    id int IDENTITY PRIMARY KEY,
    orderId INTEGER REFERENCES _order,
    name TEXT, 
    street TEXT,
    postalCode TEXT,
    postalPlace TEXT,
    countryCode TEXT
)

`;

module.exports = async function(db) {
	const statements = sql.split('GO');
	for (let i = 0; i < statements.length; i++) {
		await db.query(statements[i]);
	}
};