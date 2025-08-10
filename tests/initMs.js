const sql = `
DROP TABLE if exists package;
DROP TABLE if exists orderLine;
DROP TABLE if exists compositeOrderLine;
DROP TABLE if exists compositeOrder;
DROP TABLE if exists deliveryAddress;
DROP TABLE if exists torder;
DROP TABLE if exists [order];
DROP TABLE if exists vendor;
DROP TABLE if exists customer;
DROP TABLE if exists datetest;
DROP TABLE if exists bigintChild;
DROP TABLE if exists bigintParent;

CREATE TABLE datetest (
    id int IDENTITY(1,1) PRIMARY KEY,
    [date] DATE,
    tdatetime DATETIME,
    tdatetime_tz DATETIMEOFFSET
);

INSERT INTO datetest ([date], tdatetime, tdatetime_tz)
VALUES ('2023-07-14 12:00:00', '2023-07-14 12:00:00', '2023-07-14T12:00:00-08:00');

CREATE TABLE customer (
    id int IDENTITY(1,1) PRIMARY KEY,   
    name VARCHAR(100),
    balance NUMERIC(9,2),
    isActive BIT,
    data  NVARCHAR(MAX),
    picture VARBINARY(MAX)
);

CREATE TABLE vendor  (
    id int PRIMARY KEY,
    name VARCHAR(100),
    balance NUMERIC,
    isActive BIT
);

CREATE TABLE [order] (
    id int IDENTITY(1,1) PRIMARY KEY,
    orderDate DATETIME,
    customerId INTEGER REFERENCES customer
);

CREATE TABLE orderLine (
    id int IDENTITY(1,1) PRIMARY KEY,
    orderId INTEGER REFERENCES [order],
    product VARCHAR(100),
    amount DECIMAL(10,2) NULL
);

CREATE TABLE compositeOrder (
    companyId VARCHAR(10), 
    orderNo INTEGER,     
    PRIMARY KEY (companyId, orderNo)
);

CREATE TABLE compositeOrderLine (
    companyId VARCHAR(10),
    orderNo INTEGER,
    [lineNo] INTEGER,
    product VARCHAR(40),
    PRIMARY KEY (companyId, orderNo, [lineNo]),
    FOREIGN KEY (companyId, orderNo) REFERENCES compositeOrder(companyId, orderNo)
);

CREATE TABLE package (
    packageId int IDENTITY(1,1) PRIMARY KEY,
    lineId INTEGER REFERENCES orderLine,
    sscc VARCHAR(100)
);

CREATE TABLE deliveryAddress (
    id int IDENTITY(1,1) PRIMARY KEY,
    orderId INTEGER REFERENCES [order],
    name VARCHAR(100) NULL, 
    street VARCHAR(100) NULL,
    postalCode VARCHAR(100) NULL,
    postalPlace VARCHAR(100) NULL,
    countryCode VARCHAR(100) NULL
)

CREATE TABLE bigintParent (
    id BIGINT PRIMARY KEY,
    foo INT
);

CREATE TABLE bigintChild (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    bar INT,
    parentId BIGINT,
    FOREIGN KEY (parentId) REFERENCES  bigintParent(id)    
)

`;

module.exports = async function(db) {
	const statements = sql.split(';');
	for (let i = 0; i < statements.length; i++) {
		await db.query(statements[i]);
	}
};