var encoded = {};
var arg = 'foo';
var argPercent = '%foo';
var firstPart = '_0.columnName LIKE ';

function act(c) {	
	var mock = c.mock;
	c.expected = {};
	encoded.prepend = mock();	
	encoded.prepend.expect(firstPart).return(c.expected);
	c.column.encode = mock();
	c.column.encode.expect(argPercent).return(encoded);	
	c.returned = c.sut.endsWith(c.column,arg);
}

act.base = '../req';
module.exports = act;