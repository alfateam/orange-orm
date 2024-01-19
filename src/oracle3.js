const oracledb = require('oracledb');

console.dir('sysdba');
console.dir(oracledb.SYSDBA);

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
		await connection.execute(
			'INSERT INTO torder (orderDate,customerId)  VALUES (TO_TIMESTAMP(\'2022-01-11T09:24:47.000\', \'YYYY-MM-DD"T"HH24:MI:SS.FF3\') ,1)',
			out
		);
		 const result = await connection.execute(
			'select * from torder'
		);
		// 'INSERT INTO torder (orderDate,customerId)  VALUES (TO_TIMESTAMP(\'2022-01-11T09:24:47.000\', \'YYYY-MM-DD"T"HH24:MI:SS.FF3\') ,1)',
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
