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

		// Replace with your query
		const out = ['foo'];
		const result = await connection.execute(
			`
			declare
  l_id     t.id%type;
begin
  INSERT INTO customer (name,balance) VALUES (:p1,177) RETURNING id INTO l_id;
  SELECT l_id as id;
end;`,
			out
		);
		console.dir(out);
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
