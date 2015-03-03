var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;
	
	c.pools = {};
	c.expectRequire('../pools').return(c.pools);
	c.mysql = c.requireMock('mysql');
	c.promise = c.requireMock('../table/promise');	
	c.endPool = c.requireMock('./pool/end');	
	c.newId = c.requireMock('../newId');	
	
	c.connectionString = {};
	c.poolOptions = {};

	c.id = {};
	c.newId.expect().return(c.id);	

	c.mysqlPool = {};
	c.mysqlPool.getConnection = {};
	c.mysql.createPool = c.mock();
	c.mysql.createPool.expect(c.connectionString).return(c.mysqlPool);		

	c.boundEndPool = {};
	c.endPool.bind = c.mock();
	c.endPool.bind.expect(null,c.mysqlPool, c.id).return(c.boundEndPool);

	c.promise.denodeify = c.mock();
	c.denodeifiedEndPool = {};
	c.promise.denodeify.expect(c.boundEndPool).return(c.denodeifiedEndPool);	

	c.sut = require('../newPool')(c.connectionString, c.poolOptions);
}

module.exports = act;