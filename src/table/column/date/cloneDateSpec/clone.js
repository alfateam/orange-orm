var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;
	
	c.date = new Date();
	c.toISOString = c.requireMock('./toISOString');

	c.sut = require('../cloneDate')(c.date);

	c.iso = {};
	c.toISOString.expect(c.sut).return(c.iso);
}

module.exports = act;