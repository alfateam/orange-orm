var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.column = {};

	c.purify = requireMock('./binary/purify');
	c.encode = {};
	c.newEncode = requireMock('./binary/newEncode');
	c.newEncode.expect(c.column).return(c.encode);

	c.decode = {};
	c.newDecode = requireMock('./newDecodeCore');
	c.newDecode.expect(c.column).return(c.decode);

	require('../binary')(c.column);
}

module.exports = act;