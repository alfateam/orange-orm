var encoded = {};
var firstEncoded = {};
var arg = 5;
var sql = '5';
var optionalAlias = {};
var alias = '_2';

function act(c) {		
	var mock = c.mock;
	c.filter = {};
	c.expected = {};
	c.extractAlias.expect(optionalAlias).return(alias);
	c.firstPart = '_2.columnName ' + c.operator + ' ';
	encoded.sql = mock();
	encoded.sql.expect().return(sql);
	encoded.prepend = mock();	
	encoded.prepend.expect(c.firstPart).return(c.filter);

	c.column.encode = mock();
	c.column.encode.expect(arg).return(firstEncoded);
	firstEncoded.sql = c.mock();
	firstEncoded.sql.expect().return('not null');
	
	c.column.encode.expect('%' + arg + '%').return(encoded);	

	c.newBoolean.expect(c.filter).return(c.expected);
	c.returned = c.sut(c.operator, c.column,arg,optionalAlias);
}

module.exports = act;