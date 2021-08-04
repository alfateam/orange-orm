var a = require('a');

function act(c) {	
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.parameters = {};
	c.filter = {};
	c.filter.parameters = c.parameters;
	c.filter.sql = c.mock();

	c.alias = 'alias';
	c.table = {};
	c.tableName = 'theTable';
	c.table._dbName = c.tableName;

	c.getSessionSingleton = c.requireMock('../../../getSessionSingleton');

	c.deleteFromSqlFunc = c.mock();
	c.deleteSql = '<deleteSql>';
	c.getSessionSingleton.expect('deleteFromSql').return(c.deleteFromSqlFunc);
	
	
	c.sut = require('../newSingleCommandCore')(c.table, c.filter, c.alias);

}

module.exports = act;
