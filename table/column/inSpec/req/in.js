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
	optionalAlias = {},
	alias = '_2';

function act(c) {	
	var mock = c.mock;
	c.expected = {};
	c.extractAlias.expect(optionalAlias).return(alias);
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
	appended4.append.expect(')').return(c.expected);
	c.column.purifyThenEncode = mock();
	c.column.purifyThenEncode.expect(arg).return(encoded);	
	c.column.purifyThenEncode.expect(arg2).return(encoded2);
	c.returned = c.sut(c.column,args,optionalAlias);
}

act.base = '../req';
module.exports = act;