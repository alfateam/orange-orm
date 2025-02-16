const format = 'delete %s from %s as %s%s';
const formatString = require('../format');
const quote = require('./quote');

function deleteFromSql(table, alias, whereSql) {
	const name = quote(table._dbName);
	alias = quote(alias);
	return formatString(format, alias, name, alias, whereSql);
}
module.exports = deleteFromSql;
