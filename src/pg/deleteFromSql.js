var format = 'delete from %s %s%s';
var util = require('util');
const quote = require('../table/quote');

function deleteFromSql(table, alias, whereSql) {
	var name = quote(table._dbName);
	alias = quote(alias);
	return util.format(format, name, alias, whereSql);
}
module.exports = deleteFromSql;