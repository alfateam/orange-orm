var encoded = {};
var arg = 5;
var firstPart = '_2.columnName>=';
var optionalAlias = {};
var alias = '_2';
var filter = {};

function act(c) {	
	var mock = c.mock;
	c.expected = {};
	encoded.prepend = mock();	
	encoded.prepend.expect(firstPart).return(filter);
	c.column.encode = mock();
	c.column.encode.expect(arg).return(encoded);	

	c.newBoolean.expect(filter).return(c.expected);

	c.returned = c.sut(c.column,arg,alias);
}

act.base = '../req';
module.exports = act;