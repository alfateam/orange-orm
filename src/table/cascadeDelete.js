var _delete = require('./delete');
var newObject = require('../newObject');
var newCascadeDeleteStrategy = require('./newCascadeDeleteStrategy');

function cascadeDelete(context, table, filter) {
	var empty = newObject();
	var strategy = newCascadeDeleteStrategy(empty, table);
	return _delete(context, table, filter, strategy);
}

module.exports = cascadeDelete;