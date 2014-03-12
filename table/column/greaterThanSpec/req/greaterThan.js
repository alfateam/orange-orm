var encoded = {};
var arg = 5;
var firstPart = '_0.columnName>';
var optionalAlias = {};
var alias = '_0';
var filter = {};

function act(c) {	
	var mock = c.mock;
	c.expected = {};
	c.extractAlias.expect(optionalAlias).return(alias);
	encoded.prepend = mock();	
	encoded.prepend.expect(firstPart).return(filter);
	c.column.encode = mock();
	c.column.encode.expect(arg).return(encoded);	

	c.newBoolean.expect(filter).return(c.expected);

	c.returned = c.sut(c.column,arg,optionalAlias);
}

act.base = '../req';
module.exports = act;