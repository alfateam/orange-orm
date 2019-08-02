var format = 'delete from %s where %s.rowId in (SELECT %s.rowId FROM %s %s%s)';
var util = require('util');

function deleteFromSql(table, alias, whereSql) {
	var name = table._dbName;
	return util.format(format, name, name, alias, name, alias, whereSql);
}
module.exports = deleteFromSql;
