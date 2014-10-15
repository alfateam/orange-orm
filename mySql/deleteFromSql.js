var format = 'delete %s from %s as %s';
var util = require('util');

function deleteFromSql(name, alias) {
	return util.format(format, alias, name, alias);
}
module.exports = deleteFromSql;