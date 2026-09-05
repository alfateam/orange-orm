// @ts-nocheck
const rdb = require("/home/lars/orange-orm/src/index.js");
const map = rdb.map(x => ({
	customer: x.table('customer').map(({ column }) => ({
		id: column('id').numeric().primary().notNullExceptInsert(),
		name: column('name').string(),
	}))
}));
const db = map({ db: con => con.postgres("postgres://postgres:postgres@postgres/postgres?search_path=trigger_cli_1787319227461_143933", { size: 1 }) });
module.exports = db;
