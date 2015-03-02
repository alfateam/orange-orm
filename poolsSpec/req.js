var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;


	c.promise = c.requireMock('./table/promise');
	c.newObject = c.requireMock('./newObject');
	
	c.pools = {};
	c.newObject.expect().return(c.pools);

	c.sut = require('../pools');
}

module.exports = act;