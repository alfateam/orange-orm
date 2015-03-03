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
	c.rollback = requireMock('../table/rollback');
	c.commit = requireMock('../table/commit');
	c.newPool = requireMock('./newPool');

	c.pool = {};
	c.poolOptions = {};

	c.newPool.expect(c.connectionString, c.poolOptions).return(c.pool);

	c.sut = require('../newDatabase')(c.connectionString, c.poolOptions);
}

module.exports = act;