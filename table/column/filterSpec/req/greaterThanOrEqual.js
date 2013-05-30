var encoded = {};
var arg = 5;
var firstPart = '_0.columnName>=';


function act(c) {	
	var mock = c.mock;
	c.expected = {};
	encoded.prepend = mock();	
	encoded.prepend.expect(firstPart).return(c.expected);
	c.column.encode = mock();
	c.column.encode.expect(arg).return(encoded);	
	c.returned = c.sut.greaterThanOrEqual(c.column,arg);
}

act.base = '../req';
module.exports = act;