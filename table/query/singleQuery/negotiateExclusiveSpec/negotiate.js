var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;
	
	c.table = {};
	c.tableWithExclusive = {
		_exclusive: true
	};

	c.getSessionSingleton = c.requireMock('../../getSessionSingleton');
	c.selectForUpdateSql = c.mock();
	c.expected = '<selectForUpdateSql>';
	c.selectForUpdateSql.expect('alias').return(c.expected).repeatAny();
	c.getSessionSingleton.expect('selectForUpdateSql').return(c.selectForUpdateSql).repeatAny();

	c.sut = require('../negotiateExclusive');
}

module.exports = act;