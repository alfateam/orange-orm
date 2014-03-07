var encoded = {};
var arg = 5;
var sql = 'null';
var firstPart = '_2.columnName is not ';


function act(c) {	
	var mock = c.mock;
	c.expected = {};
	encoded.sql = mock();
	encoded.sql.expect().return(sql);
	encoded.prepend = mock();
	encoded.prepend.expect(firstPart).return(c.expected);
	c.column.encode = mock();
	c.column.encode.expect(arg).return(encoded);	
	c.returned = c.sut(c.column,arg,c.optionalAlias);
}

act.base = '../../req';
module.exports = act;