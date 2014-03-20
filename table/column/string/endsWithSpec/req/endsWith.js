var encoded = {};
var arg = 'foo';
var argPercent = '%foo';
var firstPart = '_2.columnName LIKE \'%';
var optionalAlias = 'alias';
var alias = '_2';
var filter = {};
var tempFilter = {};

function act(c) {	
	var mock = c.mock;
	c.expected = {};
	c.encodeCore.expect(arg).return(encoded);
	c.extractAlias.expect(optionalAlias).return(alias);
	encoded.prepend = mock();	
	encoded.prepend.expect(firstPart).return(tempFilter);
	tempFilter.append = c.mock();
	tempFilter.append.expect('\'').return(filter);

	c.newBoolean.expect(filter).return(c.expected);

	c.returned = c.sut(c.column,arg,optionalAlias);
}

act.base = '../req';
module.exports = act;