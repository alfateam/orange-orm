var a = require('a');
var requireMock = a.requireMock;

function act(c) {	
	c.mock = a.mock;

	c.parameters = {};
	c.filter = {};
	c.filter.parameters = c.parameters;
	c.filter.sql = c.mock();

	c.alias = 'alias';
	c.table = {};
	c.tableName = 'theTable';
	c.table._dbName = c.tableName;

	
	c.sut = require('../newSingleCommandCore')(c.table, c.filter, c.alias);

}

module.exports = act;
