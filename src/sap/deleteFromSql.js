var format = 'delete from %s from %s as %s %s';
const formatString = require('../format');
const quote = require('./quote');

function deleteFromSql(table, alias, whereSql) {
	var name = quote(table._dbName);
	alias = quote(alias)	;
	return formatString(format, name, name, alias, whereSql);
}
module.exports = deleteFromSql;