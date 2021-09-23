var format = 'delete from %s from %s as %s %s';
var util = require('util');

function deleteFromSql(table, alias, whereSql) {
	var name = table._dbName;
	return util.format(format, name, name, alias, whereSql);
}
module.exports = deleteFromSql;