var requireMock = require('a_mock').requireMock;
var tryGetFirstFromDb = requireMock('./tryGetFirstFromDb');

var table = {};
var filter = {};
var strategy = {};

function act(c) {
	c.tryGetFirstFromDb = tryGetFirstFromDb;
	c.sut = require('../getFirstFromDb');
	c.get = get;
	c.table = table;
	c.filter = filter;
	c.strategy = strategy;

	function get() {
		try {
			c.returned = c.sut(table,filter,strategy);		
		}
		catch(thrownMsg) {
			c.thrownMsg = thrownMsg;
		}
	}
		

}

module.exports = act;