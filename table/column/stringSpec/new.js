var requireMock = require('a').requireMock;
var newEncode = requireMock('./string/newEncode');
var newDecode = requireMock('./newDecodeCore');
var purify = requireMock('./string/purify');


var column = {};
var decode = {};
var encode = {};
var table = {};

function act(c) {
	c.purify = purify;
	c.startsWith = requireMock('./string/startsWith');
	c.endsWith = requireMock('./string/endsWith');
	c.contains = requireMock('./string/contains');
	c.iStartsWith = requireMock('./string/iStartsWith');
	c.iEndsWith = requireMock('./string/iEndsWith');
	c.iContains = requireMock('./string/iContains');
	c.iEqual = requireMock('./string/iEqual');
	c.extractAlias = requireMock('./extractAlias');	

	c.optionalAlias = {};
	c.alias = {};
	c.extractAlias.expect(table, c.optionalAlias).return(c.alias);

	var newSut = require('../string');

	c.column = column;
	c.encode = encode;
	c.decode = decode;
	newDecode.expect(column).return(decode);
	newEncode.expect(column).return(encode);
	newSut(table, column);

}


module.exports = act;