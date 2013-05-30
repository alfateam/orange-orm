var encoded = {};
var arg = 5;
var sql = 'null';
var firstPart = '_0.columnName is ';


function act(c) {	
	var mock = c.mock;
	c.expected = {};
	encoded.sql = mock();
	encoded.sql.expect().return(sql);
	encoded.prepend = mock();
	encoded.prepend.expect(firstPart).return(c.expected);
	c.column.encode = mock();
	c.column.encode.expect(arg).return(encoded);	
	c.returned = c.sut.equal(c.column,arg);
}

act.base = '../../req';
module.exports = act;