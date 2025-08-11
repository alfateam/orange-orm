const sql = `DROP TABLE IF EXISTS deliveryAddress; DROP TABLE IF EXISTS package; DROP TABLE IF EXISTS orderLine; DROP TABLE IF EXISTS "order";DROP TABLE IF EXISTS "order"; DROP TABLE IF EXISTS customer;DROP TABLE IF EXISTS vendor; DROP TABLE IF EXISTS datetest;DROP TABLE IF EXISTS compositeOrderLine;DROP TABLE IF EXISTS compositeOrder;DROP TABLE IF EXISTS bigintChild;DROP TABLE IF EXISTS bigintParent;
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

CREATE TABLE "order" (
    id INTEGER PRIMARY KEY,
    orderDate TEXT,
    customerId INTEGER REFERENCES customer
);

CREATE TABLE orderLine (
    id INTEGER PRIMARY KEY,
    orderId INTEGER REFERENCES "order",
    product TEXT,
    amount NUMERIC(10,2)
);

CREATE TABLE compositeOrder (
    companyId TEXT, 
    orderNo INTEGER,     
    PRIMARY KEY (companyId, orderNo)
);

CREATE TABLE compositeOrderLine (
    companyId TEXT,
    orderNo INTEGER,
    lineNo INTEGER,
    product TEXT,
    PRIMARY KEY (companyId, orderNo, lineNo),
    FOREIGN KEY (companyId, orderNo) REFERENCES compositeOrder(companyId, orderNo)
);


CREATE TABLE package (
    packageId INTEGER PRIMARY KEY,
    lineId INTEGER REFERENCES orderLine,
    sscc TEXT
);

CREATE TABLE deliveryAddress (
    id INTEGER PRIMARY KEY,
    orderId INTEGER REFERENCES "order",
    name TEXT, 
    street TEXT,
    postalCode TEXT,
    postalPlace TEXT,
    countryCode TEXT
);

CREATE TABLE datetest (
    id INTEGER PRIMARY KEY,
    "date" TEXT,
    tdatetime TEXT,
    tdatetime_tz TEXT
);

CREATE TABLE bigintParent (
    id INTEGER PRIMARY KEY,
    foo INTEGER
);

CREATE TABLE bigintChild (
    id INTEGER PRIMARY KEY,
    bar INTEGER,
    parentId INTEGER REFERENCES bigintParent
);    

INSERT INTO datetest (id, "date", tdatetime, tdatetime_tz) VALUES (1, '2023-07-14T12:00:00', '2023-07-14T12:00:00', '2023-07-14T12:00:00-08:00')


`;

module.exports = async function(db) {
	const statements = sql.split(';');
	for (let i = 0; i < statements.length; i++) {
		await db.query(statements[i]);
	}
};