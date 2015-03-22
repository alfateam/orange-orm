var a = require('a');

function act(c){	
	c.requireMock = a.requireMock;
	c.mock = a.mock;	
	c.filter = {};
	c.filter.sql = {};
	c.filter.parameters = {};
	c.negotiateRawSqlFilter = c.requireMock('./negotiateRawSqlFilter');

	c.sut = require('../newBoolean')(c.filter);
}

module.exports = act;