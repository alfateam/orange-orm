var newSingleCommand = require('./delete/newSingleCommand');
var addSubCommands = require('./delete/addSubCommands');

var nextCommand = function() {
	nextCommand = require('./newDeleteCommand');
	nextCommand.apply(null, arguments);
}

function newCommand(queries,table,filter,strategy,relations) {	
	var singleCommand = newSingleCommand(table,filter,strategy,relations);
	for(var name in strategy) {
		var childStrategy = strategy[name],
			childRelation = table[name],
			childRelations = [childRelation].concat(relations);
		nextCommand(queries,childRelation.childTable,filter,childStrategy,childRelations);
	}
	queries.push(singleCommand);
	return queries;
}

module.exports = newCommand;