var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;		
	c.then = a.then;
	c.requireMock = requireMock;
	c.expectRequire = a.expectRequire;
	
	// c.newArray = c.requireMock('../newArray');	
	c.resultToPromise = c.requireMock('./resultToPromise');	
	c.promise = requireMock('./promise');
	c.orderBy = c.requireMock('./rowArray/orderBy');	

	c.table = {};

	c.sut = require('../rowArray')(c.table);
}

module.exports = act;