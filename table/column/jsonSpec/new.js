var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.column = {};

	c.purify = requireMock('./json/purify');
	
	c.encode = {};
	c.newEncode = requireMock('./json/newEncode');
	c.newEncode.expect(c.column).return(c.encode);

	c.decode = {};
	c.newDecode = requireMock('./json/newDecode');
	c.newDecode.expect(c.column).return(c.decode);

	require('../json')(c.column);
}

module.exports = act;