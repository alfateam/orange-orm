var requireMock = require('a').requireMock;
var mock = require('a').mock;
var newSingleCommand = requireMock('./delete/newSingleCommand');
var addSubCommands = requireMock('./delete/addSubCommands');

var table = {};
var filter = {};
var singleCommand = {};
var subCommand = {};
var span = {};
var alias = '_2;'
var expected = {};
var innerJoin = {};

function act(c) {
	c.queries = {};
	c.queries.push = mock();
	c.queries.push.expect(singleCommand);
	
	c.addSubCommands = addSubCommands;

	addSubCommands.expect(c.queries,table,filter,span,alias,innerJoin).return(expected);
	newSingleCommand.expect(table,filter,span,alias,innerJoin).return(singleCommand);
	c.returned = require('../newDeleteCommand')(c.queries,table,filter,span,alias,innerJoin);
}

module.exports = act;
