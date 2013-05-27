var parameterized = {};
var parameterizedArg = {};
var arg = 5;
var encodedSql = '5';
var sql = '_0.columnName=5';
var firstPart = '_0.columnName=';


function act(c) {	
	var mock = c.mock;
	c.expected = {};
	parameterizedArg.prepend = mock();
	parameterizedArg.prepend.expect(firstPart).return(c.expected);
	c.column.encode = mock();
	c.column.encode.expect(arg).return(parameterizedArg);	
	c.returned = c.sut.equal_number(c.column,arg);
}

act.base = '../req';
module.exports = act;