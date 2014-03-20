var encoded = {};
var arg = 'foo';
var encodedArg = 'encodedArg';
var firstPart = '_2.columnName LIKE \'';
var optionalAlias = {};
var alias = '_2';
var filter = {};
var tempFilter = {};

function act(c) {	
	var mock = c.mock;
	c.expected = {};
	c.encodeCore.expect(arg).return(encoded);
	encoded.prepend = mock();	
	c.extractAlias.expect(optionalAlias).return(alias);
	encoded.prepend.expect(firstPart).return(tempFilter);
	tempFilter.append = c.mock();
	tempFilter.append.expect('%\'').return(filter);

	c.newBoolean.expect(filter).return(c.expected);

	c.returned = c.sut(c.column,arg,optionalAlias);
}

act.base = '../req';
module.exports = act;