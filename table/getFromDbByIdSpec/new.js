var requireMock = require('a_mock').requireMock;
var tryGetFromDbById = requireMock('./tryGetFromDbById');

var table = {};
var id = {};
var strategy = {};

function act(c) {
	c.tryGetFromDbById = tryGetFromDbById;
	c.sut = require('../getFromDbById');
	c.get = get;
	c.table = table;
	c.id = id;
	c.strategy = strategy;

	function get() {
		try {
			c.returned = c.sut(table,id,strategy);		
		}
		catch(thrownMsg) {
			c.thrownMsg = thrownMsg;
		}
	}
		

}

module.exports = act;