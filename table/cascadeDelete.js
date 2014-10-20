var _delete = require('./delete');
var newObject = require('../newObject');
var newCascadeDeleteStrategy = require('./newCascadeDeleteStrategy');

function cascadeDelete(table, filter) {
	var empty = newObject();
	var strategy = newCascadeDeleteStrategy(empty, table);
	return _delete(table, filter, strategy);	
}

module.exports = cascadeDelete;