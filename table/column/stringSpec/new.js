var requireMock = require('a').requireMock;
var newEncode = requireMock('./string/newEncode');
var newDecode = requireMock('./newDecodeCore');
var startsWith = requireMock('./string/startsWith');
var endsWith = requireMock('./string/endsWith');
var contains = requireMock('./string/contains');

var newSut = require('../string');
var column = {};
var decode = {};
var encode = {};

function act(c) {
	c.startsWith = startsWith;
	c.contains = contains;
	c.endsWith = endsWith;
	c.column = column;
	c.encode = encode;
	c.decode = decode;
	newDecode.expect(column).return(decode);
	newEncode.expect(column).return(encode);
	newSut(column);
}


module.exports = act;