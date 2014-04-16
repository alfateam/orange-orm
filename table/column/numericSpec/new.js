var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.column = {};

	c.purify = requireMock('./numeric/purify');
	
	c.encode = {};
	c.newEncode = requireMock('./numeric/newEncode');
	c.newEncode.expect(c.column).return(c.encode);

	c.decode = {};
	c.newDecode = requireMock('./newDecodeCore');
	c.newDecode.expect(c.column).return(c.decode);

	require('../numeric')(c.column);
}

module.exports = act;