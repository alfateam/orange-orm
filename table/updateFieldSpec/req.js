var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;	
	c.newUpdateCommand = requireMock('./commands/newUpdateCommand');
	c.pushCommand = requireMock('./commands/pushCommand');
	c.lastCommandMatches = requireMock('./commands/lastCommandMatches');
	c.table = {};
	c.column = {};
	c.row = {}

	c.sut = require('../updateField');
}

module.exports = act;