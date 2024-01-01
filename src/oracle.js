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

		// Replace with your query
		const result = await connection.execute(
			'SELECT \'Hello, World!\' FROM DUAL'
		);
		console.log(result.rows);

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
