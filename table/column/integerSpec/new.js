var requireMock = require('a_mock').requireMock;
var negotiateDefault = requireMock('./integer/negotiateDefault');
var negotiateDbNull = requireMock('./integer/negotiateDbNull');
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
	negotiateDbNull.expect(column);
	newEncode.expect(column).return(encode);
	newDecode.expect(column).return(decode);
	c.negotiateDefault = negotiateDefault;
	c.negotiateDbNull = negotiateDbNull;
	c.column = column;
	c.encode = encode;
	c.decode = decode;
	c.purify = purify;
	c.sut = sut(column);
}

module.exports = act;