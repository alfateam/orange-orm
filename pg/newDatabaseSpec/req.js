var a = require('a');

function act(c){
	c.mock = a.mock;	
	c.requireMock = a.requireMock;
	c.Domain = require('domain');
	c.newTransaction = c.requireMock('./newTransaction');
	c.newPromise = c.requireMock('../table/promise');
	c.begin = c.requireMock('../table/begin');
	c.rollback = c.requireMock('../table/rollback');
	c.commit = c.requireMock('../table/commit');
	c.negotiateConnectionString = c.requireMock('./negotiateConnectionString');
	c.newPool = c.requireMock('./newPool');
		
	c.Domain.create = c.mock();	

	c.newSut = require('../newDatabase');
}

module.exports = act;