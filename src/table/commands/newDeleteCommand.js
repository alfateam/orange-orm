var newSingleCommand = require('./delete/newSingleCommand');

function newCommand(context, queries, table, filter, strategy, relations) {
	var singleCommand = newSingleCommand(context, table, filter, relations);
	for (var name in strategy) {
		if (!(strategy[name] === null || strategy[name]))
			continue;
		var childStrategy = strategy[name];
		var childRelation = table._relations[name];
		var joinRelation = childRelation.joinRelation;
		var childRelations = [joinRelation].concat(relations);
		newCommand(context, queries, childRelation.childTable, filter, childStrategy, childRelations);
	}
	queries.push(singleCommand);
	return queries;
}

module.exports = newCommand;