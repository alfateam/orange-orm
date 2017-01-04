var encoded = {};
var arg = 5;
var sql = 'null';
var firstPart = '_2.columnName is not ';
var filter = {};

function act(c) {	
	var mock = c.mock;
	c.expected = {};
	encoded.sql = mock();
	encoded.sql.expect().return(sql);
	encoded.prepend = mock();
	encoded.prepend.expect(firstPart).return(filter);

	c.encodeFilterArg.expect(c.column, arg).return(encoded);

	c.newBoolean.expect(filter).return(c.expected);

	c.returned = c.sut(c.column,arg,c.alias);
}

act.base = '../../req';
module.exports = act;