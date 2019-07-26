var newRow = require('./commands/newRow');
var newInsertCommand = require('./commands/newInsertCommand');
var pushCommand = require('./commands/pushCommand');

function insert(table, id, id2)  {
	var args = [].slice.call(arguments);
	var row = newRow.apply(null, args);
	row = table._cache.tryAdd(row);
	var cmd = newInsertCommand(table, row);
	pushCommand(cmd);
	expand(table, row);
	return row;
}

function expand(table, row) {
	var relationName;
    var visitor = {};
    visitor.visitJoin = function() {};

    visitor.visitMany = function() {
		row.expand(relationName);
	};

	for (relationName in table._relations) {
		var relation = table._relations[relationName];
		relation.accept(visitor);
    }

}

module.exports = insert;