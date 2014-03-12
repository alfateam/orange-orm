var encoded = {};
var arg = 5;
var sql = '5';
var firstPart = '_2.columnName=';
var optionalAlias = {};
var alias = '_2';

function act(c) {		
	var mock = c.mock;
	c.filter = {};
	c.expected = {};
	c.extractAlias.expect(optionalAlias).return(alias);
	encoded.sql = mock();
	encoded.sql.expect().return(sql);
	encoded.prepend = mock();	
	encoded.prepend.expect(firstPart).return(c.filter);

	c.column.encode = mock();
	c.column.encode.expect(arg).return(encoded);	

	c.newBoolean.expect(c.filter).return(c.expected);
	c.returned = c.sut(c.column,arg,optionalAlias);
}

act.base = '../req';
module.exports = act;