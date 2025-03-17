const sql = `
drop schema if exists custom cascade;
drop schema if exists public cascade;
create schema public;
create schema custom;


CREATE TABLE datetest (
    id SERIAL	 PRIMARY KEY,
    "date" DATE,
    tdatetime TIMESTAMP,
    tdatetime_tz TIMESTAMP WITH TIME ZONE
);

INSERT INTO datetest ("date", tdatetime, tdatetime_tz)
VALUES ('2023-07-14 12:00:00+09:00', '2023-07-14 12:00:00+09:00', '2023-07-14 12:00:00-08:00');

CREATE TABLE customer (
    id SERIAL	 PRIMARY KEY,
    name TEXT,
    balance NUMERIC(9,2),
    "isActive" BOOLEAN,
    data JSONB,
    picture BYTEA
);

CREATE TABLE vendor (
    id NUMERIC PRIMARY KEY,
    name TEXT,
    balance NUMERIC,
    "isActive" BOOLEAN    
);

CREATE TABLE "order" (
    id SERIAL PRIMARY KEY,
    "orderDate" TIMESTAMP,
    "customerId" INTEGER REFERENCES customer
);

CREATE TABLE "orderLine" (
    id SERIAL PRIMARY KEY,
    "orderId" INTEGER REFERENCES "order",
    product TEXT,
    amount NUMERIC(10,2) NULL
);

CREATE TABLE "compositeOrder" (
    "companyId" VARCHAR(10), 
    "orderNo" numeric,     
    PRIMARY KEY ("companyId","orderNo")
);

CREATE TABLE "compositeOrderLine" (
    "companyId" VARCHAR(10),
    "orderNo" numeric,
    "lineNo" numeric,
    "product" varchar(40),
    PRIMARY KEY ("companyId","orderNo", "lineNo"));

CREATE TABLE package (
    "packageId" SERIAL PRIMARY KEY,
    "lineId" INTEGER REFERENCES "orderLine",
    sscc TEXT
);

CREATE TABLE "deliveryAddress" (
    id SERIAL PRIMARY KEY,
    "orderId" INTEGER REFERENCES "order",
    name TEXT, 
    street TEXT,
    "postalCode" TEXT,
    "postalPlace" TEXT,
    "countryCode" TEXT
);

CREATE TABLE custom."withSchema" (
    id SERIAL	 PRIMARY KEY,
    name TEXT
)
`;

module.exports = async function(db) {
	const statements = sql.split(';');
	for (let i = 0; i < statements.length; i++) {
		await db.query(statements[i]);
	}
};