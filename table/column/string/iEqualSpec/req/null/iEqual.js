var operator = 'is';
var encoded = {};
var arg = 'foo';
var alias = '_2';

function act(c) {	
	var mock = c.mock;
	c.expected = {};
	c.encodeCore.expect(arg).return(encoded);

	encoded.sql = c.mock();
	encoded.sql.expect().return('null');	

	c.equal.expect(c.column, arg, alias).return(c.expected);
	c.returned = c.sut(c.column,arg,alias);
}

module.exports = act;