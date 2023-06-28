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
    name VARCHAR(100),
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
    product VARCHAR(100)
)

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