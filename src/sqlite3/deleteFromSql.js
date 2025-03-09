const format = 'delete from %s where %s.rowId in (SELECT %s.rowId FROM %s %s%s)';
const formatString = require('../format');
const quote = require('./quote');

function deleteFromSql(table, alias, whereSql) {
	const name = quote(table._dbName);
	alias = quote(alias);
	return formatString(format, name, name, alias, name, alias, whereSql);
}
module.exports = deleteFromSql;
