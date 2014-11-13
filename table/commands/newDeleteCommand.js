var newSingleCommand = require('./delete/newSingleCommand');

var nextCommand = function() {
	nextCommand = require('./newDeleteCommand');
	nextCommand.apply(null, arguments);
};

function newCommand(queries,table,filter,strategy,relations) {	
	var singleCommand = newSingleCommand(table,filter,relations);
	for(var name in strategy) {
		var childStrategy = strategy[name];
		var childRelation = table._relations[name];
		var joinRelation = childRelation.joinRelation;
		var	childRelations = [joinRelation].concat(relations);
		nextCommand(queries,childRelation.childTable,filter,childStrategy,childRelations);
	}
	queries.push(singleCommand);
	return queries;
}

module.exports = newCommand;