var a = require('a');
var mock = a.mock;

function act(c){
	c.mock = mock;	
	c.requireMock = a.requireMock;
	c.connectionString = {};
	c.Domain = require('domain');
	c.Domain.create = mock();
	c.newTransaction = c.requireMock('./newTransaction');
	c.newPromise = c.requireMock('../table/promise');
	c.begin = c.requireMock('../table/begin');
	c.rollback = c.requireMock('../table/rollback');
	c.commit = c.requireMock('../table/commit');	

	c.sut = require('../newDatabase')(c.connectionString);
}

module.exports = act;