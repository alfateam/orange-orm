var encoded = {};
var arg = 'foo';
var argPercent = 'foo%';
var firstPart = '_2.columnName LIKE ';
var optionalAlias = {};
var alias = '_2';
var filter = {};

function act(c) {	
	var mock = c.mock;
	c.expected = {};
	encoded.prepend = mock();	
	c.extractAlias.expect(optionalAlias).return(alias);
	encoded.prepend.expect(firstPart).return(filter);
	c.column.encode = mock();
	c.column.encode.expect(argPercent).return(encoded);	

	c.newBoolean.expect(filter).return(c.expected);

	c.returned = c.sut(c.column,arg,optionalAlias);
}

act.base = '../req';
module.exports = act;