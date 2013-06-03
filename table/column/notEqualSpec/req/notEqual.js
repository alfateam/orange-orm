var encoded = {};
var arg = 5;
var sql = '5';
var firstPart = '_2.columnName<>';

function act(c) {	
	var mock = c.mock;
	c.expected = {};	
	encoded.sql = mock();
	encoded.sql.expect().return(sql);
	encoded.prepend = mock();
 	encoded.prepend.expect(firstPart).return(c.expected);
	c.column.purifyThenEncode = mock();
	c.column.purifyThenEncode.expect(arg).return(encoded);	
	c.returned = c.sut(c.column,arg,c.optionalAlias);
}

act.base = '../req';
module.exports = act;