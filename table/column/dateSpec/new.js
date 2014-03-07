var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.column = {};

	c.encode = {};
	c.newEncode = requireMock('./string/newEncode');
	c.newEncode.expect(c.column).return(c.encode);

	c.decode = {};
	c.newDecode = requireMock('./newDecodeCore');
	c.newDecode.expect(c.column).return(c.decode);

	require('../date')(c.column);
}

module.exports = act;