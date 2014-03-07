var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.column = {};

	c.encode = {};
	c.newEncode = requireMock('./float/newEncode');
	c.newEncode.expect(c.column).return(c.encode);

	c.decode = {};
	c.newDecode = requireMock('./float/newDecode');
	c.newDecode.expect(c.column).return(c.decode);

	require('../float')(c.column);
}

module.exports = act;