var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;	
	c.connectionString = {};
	c.Domain = require('domain');
	c.Domain.create = mock();
	c.newTransaction = requireMock('./newTransaction');
	c.newPromise = requireMock('../table/promise');
	c.begin = requireMock('../table/begin');

	c.sut = require('../newDatabase')(c.connectionString);
}

module.exports = act;