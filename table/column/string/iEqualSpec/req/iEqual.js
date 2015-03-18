var operator = 'ILIKE';
var encoded = {};
var arg = 'foo';
var firstPart = '_2.columnName ' + operator + ' \'';
var optionalAlias = {};
var alias = '_2';
var filter = {};
var tempFilter = {};

function act(c) {	
	var mock = c.mock;
	c.expected = {};
	c.encodeCore.expect(arg).return(encoded);
	encoded.prepend = mock();	

	encoded.sql = c.mock();
	encoded.sql.expect().return('foo bar');	

	c.extractAlias.expect(optionalAlias).return(alias);
	encoded.prepend.expect(firstPart).return(tempFilter);
	tempFilter.append = c.mock();
	tempFilter.append.expect('\'').return(filter);

	c.newBoolean.expect(filter).return(c.expected);

	c.returned = c.sut(c.column,arg,optionalAlias);
}

module.exports = act;