const oracledb = require('oracledb');

async function run() {
	let connection;

	try {
		connection = await oracledb.getConnection({
			user: 'sys',
			password: 'P@assword123',
			connectString: 'oracle/XE',
			privilege: oracledb.SYSDBA
		});



		// 	`INSERT (id, name, balance, isActive)
		// 	VALUES (10, 'source.name', 177, 0);
		// 	SELECT * FROM
		// RETURNING target.id, target.name INTO :new_id, :new_name`,

		// Replace with your query
		const out = [];
		const result = await connection.execute(
			`BEGIN
			MERGE INTO vendor target
			USING (
				SELECT 777 AS id, 'myName' AS name, 177 AS balance, 0 AS isActive FROM dual
			) source
			ON (target.id = source.id)
			WHEN MATCHED THEN
				UPDATE SET
					target.name = source.name,
					target.isActive = source.isActive
			WHEN NOT MATCHED THEN
				INSERT (id, name, balance, isActive)
				VALUES (source.id, source.name, source.balance, source.isActive);
SELECT * FROM vendor;
END;
			`,
			out
		);
		console.dir(out);
		console.log(result);

		const lastRowId = result.lastRowid;
		console.dir(lastRowId);

		// const result2 = await connection.execute(
		// 	'SELECT * FROM vendor WHERE ROWID=:id',
		// 	[lastRowId]
		// );

		// console.dir(result2);


	} catch (err) {
		console.error(err);
	} finally {
		if (connection) {
			try {
				await connection.close();
			} catch (err) {
				console.error(err);
			}
		}
	}
}

run();
