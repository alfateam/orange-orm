var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;
	
	c.pools = {};
	c.expectRequire('../pools').return(c.pools);
	c.newPgPool = c.requireMock('./pool/newPgPool');
	c.promise = c.requireMock('../table/promise');	
	c.endPool = c.requireMock('./pool/end');	
	c.newId = c.requireMock('../newId');	
	
	c.connectionString = {};
	c.poolOptions = {};

	c.id = {};
	c.newId.expect().return(c.id);	

	c.pgPool = {};
	c.pgPool.connect = {};
	c.newPgPool.expect(c.connectionString, c.poolOptions).return(c.pgPool);		

	c.boundEndPool = {};
	c.endPool.bind = c.mock();
	c.endPool.bind.expect(null,c.pgPool, c.id).return(c.boundEndPool);

	c.promise.denodeify = c.mock();
	c.denodeifiedEndPool = {};
	c.promise.denodeify.expect(c.boundEndPool).return(c.denodeifiedEndPool);	


	c.sut = require('../newPool')(c.connectionString, c.poolOptions);
}

module.exports = act;