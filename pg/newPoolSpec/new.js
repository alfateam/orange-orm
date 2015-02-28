var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;
	
	c.pools = [];
	c.expectRequire('../pools').return(c.pools);
	c.pg = c.requireMock('pg');
	c.negotiateConnectionString = c.requireMock('./negotiateConnectionString');
	c.promise = c.requireMock('../table/promise');	
	c.endPool = c.requireMock('./pool/end');	
	
	c.uniqueConnectionString = {};
	c.connectionString = {};
	c.negotiateConnectionString.expect(c.connectionString).return(c.uniqueConnectionString);

	c.pg.pools = {};

	c.pg.pools.getOrCreate = c.mock();
	c.pgPool ={};
	c.pg.pools.getOrCreate.expect(c.uniqueConnectionString).return(c.pgPool);		

	c.boundEndPool = {};
	c.endPool.bind = c.mock();
	c.endPool.bind.expect(null,c.uniqueConnectionString, c.pgPool, c.pg).return(c.boundEndPool);

	c.promise.denodeify = c.mock();
	c.denodeifiedEndPool = {};
	c.promise.denodeify.expect(c.boundEndPool).return(c.denodeifiedEndPool);	

	c.sut = require('../newPool')(c.connectionString);
}

module.exports = act;