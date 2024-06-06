const statements = [
	`BEGIN
      EXECUTE IMMEDIATE 'DROP TABLE "package"';
  EXCEPTION
      WHEN OTHERS THEN NULL;
  END;
  `,
	`
BEGIN
      EXECUTE IMMEDIATE 'DROP TABLE "orderLine"';
  EXCEPTION
      WHEN OTHERS THEN NULL;
  END;
  `,
	`
BEGIN
      EXECUTE IMMEDIATE 'DROP TABLE "deliveryAddress"';
  EXCEPTION
      WHEN OTHERS THEN NULL;
  END;
`,
	`
BEGIN
      EXECUTE IMMEDIATE 'DROP TABLE "order"';
  EXCEPTION
      WHEN OTHERS THEN NULL;
  END;
`,
	`BEGIN
      EXECUTE IMMEDIATE 'DROP TABLE "vendor"';
  EXCEPTION
      WHEN OTHERS THEN NULL;
  END;
`,
	`BEGIN
      EXECUTE IMMEDIATE 'DROP TABLE "customer"';
  EXCEPTION
      WHEN OTHERS THEN NULL;
  END;
`,
	`BEGIN
      EXECUTE IMMEDIATE 'DROP TABLE "datetest"';
  EXCEPTION
      WHEN OTHERS THEN NULL;
  END;
  
`,

	`CREATE TABLE "datetest"(
    id NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    tdate TIMESTAMP,
    tdatetime TIMESTAMP,
    tdatetime_tz TIMESTAMP
)
    `,
	`CREATE TABLE "customer"(
        id NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
        name VARCHAR2(100),
        balance NUMERIC,
        isActive NUMBER(1),
        data  NVARCHAR2(1500),
        picture BLOB-- VARBINARY(MAX) equivalent
    )
    `,
	`CREATE TABLE "vendor"(
        id NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
        name VARCHAR2(100),
        balance NUMERIC,
        isActive NUMBER(1)
    )
    `,
	`CREATE TABLE "order"(
        id NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
        orderDate TIMESTAMP,
        customerId INTEGER,
        FOREIGN KEY(customerId) REFERENCES "customer"(id)
    )
    `,
	`CREATE TABLE "orderLine"(
        id NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
        orderId INTEGER,
        product VARCHAR2(100),
        amount NUMBER(10, 2) NULL,
        FOREIGN KEY(orderId) REFERENCES "order"(id)
    )
    `,
	`CREATE TABLE "package"(
        packageId int GENERATED BY DEFAULT ON NULL AS IDENTITY PRIMARY KEY,
        lineId INTEGER,
        sscc VARCHAR2(100),
        FOREIGN KEY(lineId) REFERENCES "orderLine"(id)
    )
    `,
	`CREATE TABLE "deliveryAddress"(
        id NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
        orderId INTEGER,
        name VARCHAR2(100) null,
        street VARCHAR2(100) null,
        postalCode VARCHAR2(100) null,
        postalPlace VARCHAR2(100) null,
        countryCode VARCHAR2(100) null,
        FOREIGN KEY(orderId) REFERENCES "order"(id)
    )
    `,
	`INSERT INTO "datetest"(tdate, tdatetime, tdatetime_tz)
VALUES(TO_TIMESTAMP('2023-07-14T12:00:00.000', 'YYYY-MM-DD"T"HH24:MI:SS.FF6'), TO_TIMESTAMP('2023-07-14T12:00:00.000', 'YYYY-MM-DD"T"HH24:MI:SS.FF6'), TO_TIMESTAMP('2023-07-14T12:00:00.000', 'YYYY-MM-DD"T"HH24:MI:SS.FF6')
        )
        `, 'COMMIT'];

module.exports = async function(db) {
	await db.transaction(async (db) => {
		for (let i = 0; i < statements.length; i++) {
			await db.query(statements[i]);
		}
	});
};