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
	DROP TABLE [orderLine]
END

GO

IF
EXISTS (SELECT 1 FROM
    sysobjects WHERE type = 'U' and name = 'compositeOrderLine')

BEGIN
	DROP TABLE [compositeOrderLine]
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
sysobjects WHERE type = 'U' and name = 'order')

BEGIN
	DROP TABLE [order]
END

GO

IF
EXISTS (SELECT 1 FROM
sysobjects WHERE type = 'U' and name = 'compositeOrder')

BEGIN
	DROP TABLE [compositeOrder]
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

IF
EXISTS (SELECT 1 FROM
sysobjects WHERE type = 'U' and name = 'bigIntChild')

BEGIN
	DROP TABLE bigIntChild
END

GO

IF
EXISTS (SELECT 1 FROM
sysobjects WHERE type = 'U' and name = 'bigIntParent')

BEGIN
	DROP TABLE bigIntParent
END

GO

CREATE TABLE datetest (
    id int IDENTITY PRIMARY KEY,
    [date] DATE NULL,
    tdatetime DATETIME NULL,
    tdatetime_tz DATETIME NULL
    );
    
GO

INSERT INTO datetest ([date], tdatetime, tdatetime_tz)
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

CREATE TABLE [order] (
    id int IDENTITY PRIMARY KEY,
    orderDate DATETIME,
    customerId INTEGER NULL REFERENCES customer
)

GO

CREATE TABLE orderLine (
    id int IDENTITY PRIMARY KEY,
    orderId INTEGER REFERENCES [order],
    product VARCHAR(100),
    amount NUMERIC(10,2) NULL
)

GO

CREATE TABLE compositeOrder (
    companyId VARCHAR(10), 
    orderNo INT,     
    PRIMARY KEY (companyId, orderNo)
);

GO

CREATE TABLE compositeOrderLine (
    companyId VARCHAR(10),
    orderNo INTEGER,
    [lineNo] INTEGER,
    product VARCHAR(40),
    PRIMARY KEY (companyId, orderNo, [lineNo]),
    FOREIGN KEY (companyId, orderNo) REFERENCES compositeOrder(companyId, orderNo)
);
GO

CREATE TABLE package (
    packageId int IDENTITY PRIMARY KEY,
    lineId INTEGER REFERENCES orderLine,
    sscc VARCHAR(100)
);

GO

CREATE TABLE deliveryAddress (
    id int IDENTITY PRIMARY KEY,
    orderId INTEGER REFERENCES [order],

    name VARCHAR(100) NULL, 
    street VARCHAR(100) NULL,
    postalCode VARCHAR(100) NULL,
    postalPlace VARCHAR(100) NULL,
    countryCode VARCHAR(100) NULL
);

GO

CREATE TABLE bigintParent (
    id BIGINT NOT NULL PRIMARY KEY,
    foo INT NULL,
);

GO

CREATE TABLE bigintChild (
    id BIGINT IDENTITY PRIMARY KEY,
    bar INT NULL,
    parentId BIGINT NULL,
    FOREIGN KEY (parentId) REFERENCES bigintParent(id)    
)

`;

module.exports = async function(db) {
	const statements = sql.split('GO');
	for (let i = 0; i < statements.length; i++) {
		await db.query(statements[i]);
	}
};