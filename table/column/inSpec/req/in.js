var parameterized = {};
var encoded = {};
var encoded2 = {};
var arg = 'foo';
var arg2 = 'baz';
var args = [arg,arg2];
var firstPart = '_2.columnName in ';
var lastPart = ')';
var prepended = {};
var appended = {},
	appended2 = {},
	appended3 = {},
	appended4 = {},
	alias = '_2';
var filter = {};

function act(c) {	
	var mock = c.mock;
	c.expected = {};
	c.newParameterized.expect(firstPart).return(parameterized);	
	parameterized.append = mock();
	parameterized.append.expect('(').return(appended);
	appended.append = mock();
	appended.append.expect(encoded).return(appended2);	
	appended2.append = mock();
	appended2.append.expect(',').return(appended3);
	appended3.append = mock();
	appended3.append.expect(encoded2).return(appended4);
	appended4.append = mock();
	appended4.append.expect(')').return(filter);
	c.column.encode = mock();
	c.column.encode.expect(arg).return(encoded);	
	c.column.encode.expect(arg2).return(encoded2);

	c.newBoolean.expect(filter).return(c.expected);

	c.returned = c.sut(c.column,args,alias);
}

module.exports = act;