var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.shallowFilter = {};
	c.shallowFilter.prepend = mock();
	c.newShallowJoinSql = requireMock('../query/singleQuery/joinSql/newShallowJoinSqlCore');
	c.mock = mock;		
	c.sut = require('../whereSql');
}

module.exports = act;