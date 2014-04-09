var a = require('a');
var requireMock = a.requireMock;

function act(c){
	c.mock = a.mock;
	c.newRow = requireMock('./commands/newRow');
	c.newInsertCommand = requireMock('./commands/newInsertCommand');
	c.pushCommand = requireMock('./commands/pushCommand');

	c.table = {};
	c.cache = {};
	c.id = 1;
	c.id2 = 'bar';
	c.row = {};
	c.table._cache = c.cache;

	c.sut = require('../insert')
}

module.exports = act;