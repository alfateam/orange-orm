var a = require('a');

function act(c) {
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.newDecodeCore = c.requireMock('../newDecodeCore');
	c.cloneDate = c.requireMock('./cloneDate');
	
	c.input = {};
	c.decodeCore = c.mock();
	c.column = c.column;
	c.newDecodeCore.expect(c.column).return(c.decodeCore);
	c.sut = require('../newDecode')(c.column);
}

module.exports = act;