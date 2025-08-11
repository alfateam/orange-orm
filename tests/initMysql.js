const sql = `DROP TABLE IF EXISTS deliveryAddress; DROP TABLE IF EXISTS package; DROP TABLE IF EXISTS orderLine; DROP TABLE IF EXISTS \`order\`; DROP TABLE IF EXISTS customer;DROP TABLE IF EXISTS vendor;DROP TABLE IF EXISTS datetest;DROP TABLE IF EXISTS compositeOrderLine;DROP TABLE IF EXISTS compositeOrder;DROP TABLE IF EXISTS bigintChild;DROP TABLE IF EXISTS bigintParent;

CREATE TABLE datetest (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    \`date\` DATE,
    tdatetime DATETIME,
    tdatetime_tz TIMESTAMP
);

INSERT INTO datetest (\`date\`, tdatetime, tdatetime_tz)
VALUES ('2023-07-14T12:00:00+09:00', '2023-07-14T12:00:00+09:00', '2023-07-14 12:00:00-08:00');

CREATE TABLE customer (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    name TEXT,
    balance DECIMAL(10,2),
    isActive BOOLEAN,
    data JSON,
    picture BLOB
);

CREATE TABLE vendor (
    id INTEGER PRIMARY KEY,
    name TEXT,
    balance DECIMAL(10,2),
    isActive BOOLEAN    
);

CREATE TABLE \`order\` (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    orderDate TEXT,
    customerId INTEGER REFERENCES customer
);

CREATE TABLE orderLine (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    orderId INTEGER REFERENCES \`order\`,
    product TEXT,
    amount DECIMAL(10,2) NULL
);

CREATE TABLE compositeOrder (
    companyId VARCHAR(10), 
    orderNo INT,     
    PRIMARY KEY (companyId, orderNo)
);

CREATE TABLE compositeOrderLine (
    companyId VARCHAR(10),
    orderNo INT,
    lineNo INT,
    product TEXT,
    PRIMARY KEY (companyId, orderNo, lineNo),
    FOREIGN KEY (companyId, orderNo) REFERENCES compositeOrder(companyId, orderNo)
);


CREATE TABLE package (
    packageId INTEGER AUTO_INCREMENT PRIMARY KEY,
    lineId INTEGER REFERENCES orderLine,
    sscc TEXT
);

CREATE TABLE deliveryAddress (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    orderId INTEGER REFERENCES \`order\`,
    name TEXT, 
    street TEXT,
    postalCode TEXT,
    postalPlace TEXT,
    countryCode TEXT
);

CREATE TABLE bigintParent (
    id BIGINT PRIMARY KEY,
    foo INT
);

CREATE TABLE bigintChild (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    bar INT,
    parentId BIGINT,
    FOREIGN KEY (parentId) REFERENCES bigintParent(id)
)

`;

module.exports = async function(db) {
	const statements = sql.split(';');
	for (let i = 0; i < statements.length; i++) {
		await db.query(statements[i]);
	}
};