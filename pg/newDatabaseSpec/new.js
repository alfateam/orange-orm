var a = require('a');

function act(c){
	c.mock = a.mock;	
	c.requireMock = a.requireMock;
	c.connectionString = {};
	c.Domain = require('domain');
	c.Domain.create = c.mock();
	c.newTransaction = c.requireMock('./newTransaction');
	c.newPromise = c.requireMock('../table/promise');
	c.begin = c.requireMock('../table/begin');
	c.rollback = c.requireMock('../table/rollback');
	c.commit = c.requireMock('../table/commit');
	c.pg = c.requireMock('pg');
	c.negotiateConnectionString = c.requireMock('./negotiateConnectionString');

	c.uniqueConnectionString = {};
	c.negotiateConnectionString.expect(c.connectionString).return(c.uniqueConnectionString);

	c.pg.pools = {};
	c.pool = {};

	c.pg.pools.getOrCreate = c.mock();
	c.pg.pools.getOrCreate.expect(c.uniqueConnectionString).return(c.pool);

	c.newPromise.denodeify = c.mock();
	c.drain = {};
	c.newPromise.denodeify.expect(c.pool.drain).return(c.drain);

	c.sut = require('../newDatabase')(c.connectionString);
}

module.exports = act;