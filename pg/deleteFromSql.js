var format = 'delete from %s %s';
var util = require('util');

function deleteFromSql(name, alias) {
	return util.format(format, name, alias);
}
module.exports = deleteFromSql;