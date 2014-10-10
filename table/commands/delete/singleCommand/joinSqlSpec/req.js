var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.newShallowJoinSql = requireMock('../../../query/singleQuery/joinSql/newShallowJoinSql');
	c.mock = mock;		
	c.sut = require('../joinSql');
}

module.exports = act;