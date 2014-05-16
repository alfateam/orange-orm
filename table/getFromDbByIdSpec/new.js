var a = require('a');
var requireMock = a.requireMock;
var tryGetFromDbById = requireMock('./tryGetFromDbById');

var table = {};
var id = {};
var strategy = {};

function act(c) {
	c.mock = a.mock;
	c.tryGetFromDbById = tryGetFromDbById;
	c.sut = require('../getFromDbById');
	c.get = get;
	c.table = table;
	c.id = id;
	c.strategy = strategy;
	c.resultPromise = {};
	c.resultPromise.then = c.mock();
	c.tryGetFromDbById.expect(c.table,c.id,c.strategy).return(c.resultPromise);

	function get() {
		c.returnedPromise = c.sut(table,id,strategy);		
	}
		

}

module.exports = act;