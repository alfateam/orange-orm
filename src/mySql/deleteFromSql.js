var format = 'delete %s from %s as %s%s';
var util = require('util');
const quote = require('../table/quote');

function deleteFromSql(table, alias, whereSql) {
	var name = quote(table._dbName);
	alias = quote(alias);
	return util.format(format, alias, name, alias, whereSql);
}
module.exports = deleteFromSql;
