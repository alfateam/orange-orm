
function act(c) {	
	c.expected = {};
	c.nextEncode = c.mock();
	c.nextEncode.expect(null).return(c.expected);
	c.newEncode = c.requireMock('./newEncode');
	c.newEncode.expect(c.column).return(c.nextEncode);
	c.returned = c.sut(undefined);	
}

module.exports = act;