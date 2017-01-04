var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;
	
	c.promise = c.requireMock('promise');
	c.promise.resolve = c.mock();
	

	c.sut = require('../negotiateNextTick');
	c.returned1 = c.sut(0);

	c.returned2 = c.sut(999);

	c.expected3 = {};
	c.promise.resolve.expect().return(c.expected3);
	c.returned3 = c.sut(1000);

	c.returned4 = c.sut(1500);

	c.expected5 = {};
	c.promise.resolve.expect().return(c.expected5);
	c.returned5 = c.sut(2000);
}

module.exports = act;