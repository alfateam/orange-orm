var newSingleCommand = require('./delete/newSingleCommand');
var addSubCommands = require('./delete/addSubCommands');

function newCommand(queries,table,filter,span,alias,innerJoin) {	
	addSubCommands(queries,table,filter,span,alias,innerJoin);
	var singleCommand = newSingleCommand(table,filter,span,alias,innerJoin);
	queries.push(singleCommand);
	return queries;
}

module.exports = newCommand;