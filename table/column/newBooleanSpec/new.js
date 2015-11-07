var a = require('a');

function act(c){	
	c.requireMock = a.requireMock;
	c.mock = a.mock;	
	c.filter = {};
	c.sql = {};
	c.filter.sql = c.mock();
	c.filter.sql.expect().return(c.sql);
	c.filter.parameters = {};
	c.negotiateRawSqlFilter = c.requireMock('./negotiateRawSqlFilter');

	c.sut = require('../newBoolean')(c.filter);
}

module.exports = act;