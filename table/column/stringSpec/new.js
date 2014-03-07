var requireMock = require('a').requireMock;
var newEncode = requireMock('./newEncodeCore');
var newDecode = requireMock('./newDecodeCore');

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
	newSut(column);
}


module.exports = act;