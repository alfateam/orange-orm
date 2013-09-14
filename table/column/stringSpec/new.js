var requireMock = require('a').requireMock;
var newEncode = requireMock('./string/newEncode');
var newDecode = requireMock('./string/newDecode');

var newSut = require('../string');
var column = {};
var decode = {};
var encode = {};

function act(c) {
	c.column = column;
	c.encode = encode;
	c.decode = decode;
	newDecode.expect(column).return(decode);
	newEncode.expect(column).return(encode);
	c.sut = newSut(column);
}


module.exports = act;