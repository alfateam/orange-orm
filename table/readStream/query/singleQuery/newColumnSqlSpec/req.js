var a = require('a');

function act(c){
	c.requireMock = a.requireMock;
	c.expected = c.requireMock('../../query/singleQuery/columnSql/newShallowColumnSql');
	c.returned = require('../newColumnSql');
}

module.exports = act;