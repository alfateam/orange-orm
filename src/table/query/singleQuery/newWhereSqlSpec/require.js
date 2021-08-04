var a = require('a');
var requireMock = a.requireMock;
var mock = a.mock;

function act(c) {
	c.newDiscriminatorSql = requireMock('./newDiscriminatorSql');
	
	c.sut = require('../newWhereSql');
}

module.exports = act;
