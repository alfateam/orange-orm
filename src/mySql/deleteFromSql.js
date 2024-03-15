var format = 'delete %s from %s as %s%s';
var util = require('util');

function deleteFromSql(table, alias, whereSql) {
	console.dir('whereSql');
	console.dir(whereSql);
	var name = table._dbName;
	//todo
	return util.format(format, alias, name, alias, whereSql);
}
module.exports = deleteFromSql;
