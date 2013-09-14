var requireMock = require('a').requireMock;
var negotiateDefault = requireMock('./integer/negotiateDefault');
var purify = requireMock('./integer/purify');
var newEncode = requireMock('./integer/newEncode');
var newDecode = requireMock('./integer/newDecode');
var sut = require('../integer');
var column = {};
var dbNull = {};
var encode = {};
var decode = {};

function act(c) {
	negotiateDefault.expect(column);
	newEncode.expect(column).return(encode);
	newDecode.expect(column).return(decode);
	c.negotiateDefault = negotiateDefault;
	c.column = column;
	c.encode = encode;
	c.decode = decode;
	c.purify = purify;
	c.sut = sut(column);
}

module.exports = act;